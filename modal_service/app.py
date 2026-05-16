from __future__ import annotations

import base64
import json
import os
import shutil
import subprocess
import sys
import time
import uuid
from contextlib import contextmanager
from pathlib import Path
from typing import Any

import modal
import requests


APP_NAME = "shopee-media-worker"
MODEL_VOLUME_NAME = "shopee-comfy-models"
MODEL_MOUNT_PATH = "/models"
COMFY_ROOT = "/root/ComfyUI"
COMFY_INPUT = "/tmp/comfy-input"
COMFY_OUTPUT = "/tmp/comfy-output"

COMFYUI_REPO = "https://github.com/comfyanonymous/ComfyUI.git"

CUSTOM_NODES = {
    "ComfyUI-KJNodes": {
        "repo": "https://github.com/kijai/ComfyUI-KJNodes.git",
    },
    "ComfyUI-Qwen-TTS": {
        "repo": "https://github.com/flybirdxx/ComfyUI-Qwen-TTS.git",
        "commit": "8aecca98e13945a7e1de8c928bf39756757039ef",
    },
    "ComfyUI-WanVideoWrapper": {
        "repo": "https://github.com/kijai/ComfyUI-WanVideoWrapper.git",
        "version": "1.4.7",
    },
    "audio-separation-nodes-comfyui": {
        "repo": "https://github.com/christian-byrne/audio-separation-nodes-comfyui.git",
    },
    "comfy-mtb": {
        "repo": "https://github.com/melMass/comfy_mtb.git",
    },
    "comfyui-custom-scripts": {
        "repo": "https://github.com/pythongosssss/ComfyUI-Custom-Scripts.git",
    },
    "comfyui-videohelpersuite": {
        "repo": "https://github.com/Kosinkadink/ComfyUI-VideoHelperSuite.git",
    },
}

GPU_REQUIREMENTS = [
    "torch==2.8.0",
    "torchvision==0.23.0",
    "torchaudio==2.8.0",
    "transformers>=4.57.0,<5.0.0",
    "accelerate>=1.2.1",
    "diffusers>=0.33.0",
    "peft>=0.17.0",
    "ftfy",
    "einops",
    "sentencepiece>=0.2.0",
    "protobuf",
    "pyloudnorm",
    "gguf>=0.17.1",
    "opencv-python",
    "scipy>=1.11.0",
    "librosa>=0.10.2,<1",
    "moviepy",
    "qrcode[pil]",
    "onnxruntime",
    "onnxruntime-gpu",
    "requirements-parser",
    "rembg",
    "imageio-ffmpeg",
    "rich",
    "rich-argparse",
    "matplotlib",
    "pillow",
    "cachetools",
    "soundfile",
    "tiktoken",
    "sox",
    "color-matcher",
    "huggingface_hub",
    "safetensors",
    "fastapi[standard]",
    "requests",
    "boto3",
]

image = (
    modal.Image.from_registry("nvidia/cuda:12.8.1-cudnn-devel-ubuntu22.04", add_python="3.11")
    .apt_install(
        "git",
        "ffmpeg",
        "libgl1",
        "libglib2.0-0",
        "libsndfile1",
        "sox",
    )
    .pip_install(*GPU_REQUIREMENTS, extra_index_url="https://download.pytorch.org/whl/cu128")
    .run_commands(
        f"git clone {COMFYUI_REPO} {COMFY_ROOT}",
        f"cd {COMFY_ROOT} && pip install -r requirements.txt",
        f"cd {COMFY_ROOT}/custom_nodes && git clone {CUSTOM_NODES['ComfyUI-KJNodes']['repo']} ComfyUI-KJNodes",
        f"cd {COMFY_ROOT}/custom_nodes && git clone {CUSTOM_NODES['ComfyUI-Qwen-TTS']['repo']} ComfyUI-Qwen-TTS",
        f"cd {COMFY_ROOT}/custom_nodes/ComfyUI-Qwen-TTS && git checkout {CUSTOM_NODES['ComfyUI-Qwen-TTS']['commit']}",
        f"cd {COMFY_ROOT}/custom_nodes/ComfyUI-Qwen-TTS && pip install -r requirements.txt",
    )
    .add_local_file("model_manifest.json", remote_path="/root/model_manifest.json")
    .add_local_file("infinite_talk_workflow.json", remote_path="/root/infinite_talk_workflow.json")
)

app = modal.App(APP_NAME, image=image)
model_volume = modal.Volume.from_name(MODEL_VOLUME_NAME, create_if_missing=True)


def _load_manifest() -> dict[str, Any]:
    manifest_path = Path("/root/model_manifest.json")
    return json.loads(manifest_path.read_text(encoding="utf-8"))


def _ensure_snapshot_custom_nodes() -> None:
    marker = Path(COMFY_ROOT) / "custom_nodes" / ".snapshot_ready"
    if marker.exists():
        return

    snapshot_path = Path(MODEL_MOUNT_PATH) / "custom_nodes_snapshot.tar.gz"
    if not snapshot_path.exists():
        raise FileNotFoundError(f"Missing custom node snapshot: {snapshot_path}")

    subprocess.run(
        ["tar", "-xzf", str(snapshot_path), "-C", COMFY_ROOT],
        check=True,
    )
    for relative_dir in [
        "custom_nodes/ComfyUI-WanVideoWrapper",
        "custom_nodes/audio-separation-nodes-comfyui",
        "custom_nodes/comfy-mtb",
        "custom_nodes/comfyui-videohelpersuite",
    ]:
        req = Path(COMFY_ROOT) / relative_dir / "requirements.txt"
        if req.exists():
            subprocess.run(["pip", "install", "-r", str(req)], check=True)
    marker.write_text("ok", encoding="utf-8")


def _ensure_model_links() -> None:
    comfy_models_root = Path(COMFY_ROOT) / "models"
    comfy_models_root.mkdir(parents=True, exist_ok=True)

    targets = {
        "unet": Path(MODEL_MOUNT_PATH) / "unet",
        # The current WanVideo loaders look here, while the original RunPod tree
        # stored both GGUF files under `unet`.
        "diffusion_models": Path(MODEL_MOUNT_PATH) / "unet",
        "vae": Path(MODEL_MOUNT_PATH) / "vae",
        "text_encoders": Path(MODEL_MOUNT_PATH) / "text_encoders",
        "loras": Path(MODEL_MOUNT_PATH) / "loras",
        "clip_vision": Path(MODEL_MOUNT_PATH) / "clip_vision",
        "qwen-tts": Path(MODEL_MOUNT_PATH) / "qwen-tts",
    }
    for name, target in targets.items():
        link = comfy_models_root / name
        if link.is_symlink():
            continue
        if link.exists() and link.is_dir():
            children = list(link.iterdir())
            placeholder_only = children and all(child.name.startswith("put_") for child in children)
            if placeholder_only or not children:
                shutil.rmtree(link)
        if not link.exists() and target.exists():
            link.symlink_to(target, target_is_directory=True)


def _audio_prompt(params: dict[str, Any]) -> dict[str, Any]:
    return {
        "24": {
            "inputs": {"audio": params["voice_ref_filename"]},
            "class_type": "LoadAudio",
        },
        "40": {
            "inputs": {
                "target_text": params["target_text"],
                "model_choice": "1.7B",
                "device": "auto",
                "precision": "bf16",
                "language": "Portuguese",
                "ref_text": "",
                "seed": params["seed"],
                "max_new_tokens": 2048,
                "top_p": 0.8,
                "top_k": 20,
                "temperature": 1,
                "repetition_penalty": 1.05,
                "x_vector_only": True,
                "attention": "auto",
                "unload_model_after_generate": False,
                "custom_model_path": "",
                "ref_audio": ["24", 0],
            },
            "class_type": "FB_Qwen3TTSVoiceClone",
        },
        "44": {
            "inputs": {
                "filename_prefix": params["output_prefix"],
                "quality": "V0",
                "audio": ["40", 0],
            },
            "class_type": "SaveAudioMP3",
        },
    }


def _video_prompt(params: dict[str, Any]) -> dict[str, Any]:
    template = json.loads(Path("/root/infinite_talk_workflow.json").read_text(encoding="utf-8"))
    template["207"]["inputs"]["image"] = params["image_filename"]
    template["217"]["inputs"]["audio"] = params["audio_filename"]
    template["217"]["inputs"].pop("audioUI", None)
    template["131"]["inputs"]["filename_prefix"] = params["output_prefix"]
    template["213"]["inputs"]["seed"] = params["seed"]
    # The exported workflow exposes PreviewImage and MathExpression as terminal
    # nodes, which causes the API scheduler to stop before the video branch. For
    # the API execution path, keep only the video-producing branch and inject the
    # frame count computed from the uploaded audio.
    template.pop("208", None)
    template.pop("246", None)
    template.pop("247", None)
    template["194"]["inputs"]["num_frames"] = params["num_frames"]
    return template


def _upload_bytes_to_minio(*, data: bytes, key: str, content_type: str) -> str:
    import boto3

    client = boto3.client(
        "s3",
        endpoint_url=os.environ["MINIO_ENDPOINT"],
        aws_access_key_id=os.environ["MINIO_ACCESS_KEY"],
        aws_secret_access_key=os.environ["MINIO_SECRET_KEY"],
        region_name="us-east-1",
    )
    bucket = os.environ.get("MINIO_BUCKET_NAME", "uploads")
    client.put_object(Bucket=bucket, Key=key, Body=data, ContentType=content_type)
    return f"{os.environ['MINIO_PUBLIC_URL'].rstrip('/')}/{key}"


@contextmanager
def _comfy_server():
    _ensure_snapshot_custom_nodes()
    _ensure_model_links()
    proc = subprocess.Popen(
        [
            "python",
            "main.py",
            "--listen",
            "127.0.0.1",
            "--port",
            "8188",
            "--input-directory",
            COMFY_INPUT,
            "--output-directory",
            COMFY_OUTPUT,
        ],
        cwd=COMFY_ROOT,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )
    try:
        deadline = time.time() + 180
        last_error = None
        while time.time() < deadline:
            try:
                res = requests.get("http://127.0.0.1:8188/system_stats", timeout=2)
                if res.ok:
                    break
                last_error = f"HTTP {res.status_code}"
            except Exception as exc:  # noqa: BLE001
                last_error = str(exc)
            time.sleep(2)
        else:
            raise RuntimeError(f"ComfyUI did not become ready: {last_error}")
        yield proc
    finally:
        proc.terminate()
        try:
            proc.wait(timeout=20)
        except subprocess.TimeoutExpired:
            proc.kill()


@app.function(cpu=1, timeout=60 * 10, volumes={MODEL_MOUNT_PATH: model_volume})
def inspect_models() -> dict[str, Any]:
    manifest = _load_manifest()
    expected = []
    for group in manifest["groups"].values():
        expected.extend(group["files"])

    present = []
    missing = []
    for item in expected:
        path = Path(MODEL_MOUNT_PATH) / item["relative_path"]
        record = {"relative_path": item["relative_path"], "exists": path.exists()}
        if path.exists():
            record["bytes"] = path.stat().st_size
            present.append(record)
        else:
            missing.append(record)

    return {"present": present, "missing": missing}


@app.function(cpu=2, timeout=60 * 10, volumes={MODEL_MOUNT_PATH: model_volume})
def inspect_runtime() -> dict[str, Any]:
    _ensure_snapshot_custom_nodes()
    _ensure_model_links()
    custom_nodes_path = Path(COMFY_ROOT) / "custom_nodes"
    comfy_models_path = Path(COMFY_ROOT) / "models"
    return {
        "comfy_root_exists": Path(COMFY_ROOT).exists(),
        "models_mount_exists": Path(MODEL_MOUNT_PATH).exists(),
        "custom_nodes": sorted(p.name for p in custom_nodes_path.iterdir() if p.is_dir()),
        "comfy_model_dirs": {
            name: {
                "exists": (comfy_models_path / name).exists(),
                "is_symlink": (comfy_models_path / name).is_symlink(),
                "files": sorted(p.name for p in (comfy_models_path / name).iterdir())[:20]
                if (comfy_models_path / name).exists()
                else [],
            }
            for name in ["unet", "diffusion_models", "vae", "text_encoders", "loras", "clip_vision", "qwen-tts"]
        },
    }


@app.function(gpu="A100-80GB", timeout=60 * 15, volumes={MODEL_MOUNT_PATH: model_volume})
def smoke_test_comfy() -> dict[str, Any]:
    with _comfy_server():
        stats = requests.get("http://127.0.0.1:8188/system_stats", timeout=10).json()
        object_info = requests.get("http://127.0.0.1:8188/object_info", timeout=30).json()
        required_nodes = [
            "FB_Qwen3TTSVoiceClone",
            "MultiTalkModelLoader",
            "WanVideoModelLoader",
            "WanVideoSampler",
            "VHS_VideoCombine",
        ]
        return {
            "system_stats": stats,
            "required_nodes": {node: node in object_info for node in required_nodes},
            "video_combine_info": object_info.get("VHS_VideoCombine"),
        }


@app.function(
    gpu="A100-80GB",
    timeout=60 * 30,
    volumes={MODEL_MOUNT_PATH: model_volume},
    secrets=[modal.Secret.from_name("Minio")],
)
def test_generate_audio_from_url(payload: dict[str, Any]) -> dict[str, Any]:
    voice_ref_url = str(payload["voice_ref_url"])
    target_text = str(payload["target_text"])
    seed = int(payload.get("seed", 123456789))
    output_prefix = str(payload.get("output_prefix", f"audio/test_{uuid.uuid4().hex[:8]}"))

    shutil.rmtree(COMFY_INPUT, ignore_errors=True)
    shutil.rmtree(COMFY_OUTPUT, ignore_errors=True)
    Path(COMFY_INPUT).mkdir(parents=True, exist_ok=True)
    Path(COMFY_OUTPUT).mkdir(parents=True, exist_ok=True)

    voice_ref_filename = f"voice_ref_{uuid.uuid4().hex[:8]}.mp3"
    voice_ref_path = Path(COMFY_INPUT) / voice_ref_filename
    res = requests.get(voice_ref_url, timeout=120)
    res.raise_for_status()
    voice_ref_path.write_bytes(res.content)

    with _comfy_server():
        prompt = _audio_prompt(
            {
                "voice_ref_filename": voice_ref_filename,
                "target_text": target_text,
                "seed": seed,
                "output_prefix": output_prefix,
            }
        )
        submit = requests.post(
            "http://127.0.0.1:8188/prompt",
            json={"prompt": prompt, "client_id": "modal-audio-test"},
            timeout=30,
        )
        submit.raise_for_status()
        prompt_id = submit.json()["prompt_id"]

        deadline = time.time() + 20 * 60
        history_payload: dict[str, Any] | None = None
        while time.time() < deadline:
            history_res = requests.get(f"http://127.0.0.1:8188/history/{prompt_id}", timeout=30)
            if history_res.ok and history_res.json():
                history_payload = history_res.json()
                break
            time.sleep(5)
        if not history_payload:
            raise TimeoutError("Audio prompt did not finish within 20 minutes")

        mp3_files = sorted(str(path) for path in Path(COMFY_OUTPUT).rglob("*.mp3"))
        first_mp3 = Path(mp3_files[0]) if mp3_files else None
        public_url = None
        if first_mp3:
            public_url = _upload_bytes_to_minio(
                data=first_mp3.read_bytes(),
                key=f"shopee/audio-modal/test_{uuid.uuid4().hex[:12]}.mp3",
                content_type="audio/mpeg",
            )
        return {
            "prompt_id": prompt_id,
            "output_files": mp3_files,
            "first_output_base64": base64.b64encode(first_mp3.read_bytes()).decode("ascii") if first_mp3 else None,
            "public_url": public_url,
            "history_keys": list(history_payload.keys()),
        }


@app.function(
    gpu="A100-80GB",
    timeout=60 * 70,
    volumes={MODEL_MOUNT_PATH: model_volume},
    secrets=[modal.Secret.from_name("Minio")],
)
def test_generate_video_from_urls(payload: dict[str, Any]) -> dict[str, Any]:
    image_url = str(payload["image_url"])
    audio_url = str(payload["audio_url"])
    seed = int(payload.get("seed", 123456789))
    output_prefix = str(payload.get("output_prefix", f"video/test_{uuid.uuid4().hex[:8]}"))

    shutil.rmtree(COMFY_INPUT, ignore_errors=True)
    shutil.rmtree(COMFY_OUTPUT, ignore_errors=True)
    Path(COMFY_INPUT).mkdir(parents=True, exist_ok=True)
    Path(COMFY_OUTPUT).mkdir(parents=True, exist_ok=True)

    image_filename = f"image_{uuid.uuid4().hex[:8]}.jpg"
    audio_filename = f"audio_{uuid.uuid4().hex[:8]}.mp3"
    image_res = requests.get(image_url, timeout=120)
    image_res.raise_for_status()
    audio_res = requests.get(audio_url, timeout=120)
    audio_res.raise_for_status()
    (Path(COMFY_INPUT) / image_filename).write_bytes(image_res.content)
    audio_path = Path(COMFY_INPUT) / audio_filename
    audio_path.write_bytes(audio_res.content)

    import librosa

    audio_duration_sec = float(librosa.get_duration(path=str(audio_path)))
    num_frames = max(1, round(audio_duration_sec * 25))

    with _comfy_server() as proc:
        prompt = _video_prompt(
            {
                "image_filename": image_filename,
                "audio_filename": audio_filename,
                "output_prefix": output_prefix,
                "seed": seed,
                "num_frames": num_frames,
            }
        )
        submit = requests.post(
            "http://127.0.0.1:8188/prompt",
            json={"prompt": prompt, "client_id": "modal-video-test"},
            timeout=30,
        )
        if not submit.ok:
            raise RuntimeError(f"ComfyUI video submit failed ({submit.status_code}): {submit.text}")
        submit.raise_for_status()
        prompt_id = submit.json()["prompt_id"]

        deadline = time.time() + 60 * 60
        history_payload: dict[str, Any] | None = None
        while time.time() < deadline:
            history_res = requests.get(f"http://127.0.0.1:8188/history/{prompt_id}", timeout=30)
            if history_res.ok and history_res.json():
                history_payload = history_res.json()
                break
            time.sleep(10)
        if not history_payload:
            raise TimeoutError("Video prompt did not finish within 60 minutes")

        mp4_files = sorted(str(path) for path in Path(COMFY_OUTPUT).rglob("*.mp4"))
        preferred_mp4 = next((path for path in mp4_files if path.endswith("-audio.mp4")), None)
        first_mp4 = Path(preferred_mp4 or mp4_files[0]) if mp4_files else None
        public_url = None
        if first_mp4:
            public_url = _upload_bytes_to_minio(
                data=first_mp4.read_bytes(),
                key=f"shopee/video-modal/test_{uuid.uuid4().hex[:12]}.mp4",
                content_type="video/mp4",
            )
        return {
            "prompt_id": prompt_id,
            "output_files": mp4_files,
            "public_url": public_url,
            "audio_duration_sec": audio_duration_sec,
            "num_frames": num_frames,
            "history_keys": list(history_payload.keys()),
            "history": history_payload,
        }


@app.function(
    gpu="A100-80GB",
    timeout=60 * 30,
    volumes={MODEL_MOUNT_PATH: model_volume},
    secrets=[modal.Secret.from_name("Minio")],
)
@modal.fastapi_endpoint(method="POST")
def generate_audio(payload: dict[str, Any]) -> dict[str, Any]:
    result = test_generate_audio_from_url.local(payload)
    return {
        "status": "completed",
        "kind": "audio",
        "prompt_id": result["prompt_id"],
        "audio_url": result["public_url"],
    }


@app.function(
    gpu="A100-80GB",
    timeout=60 * 60,
    volumes={MODEL_MOUNT_PATH: model_volume},
    secrets=[modal.Secret.from_name("Minio")],
)
@modal.fastapi_endpoint(method="POST")
def generate_video(payload: dict[str, Any]) -> dict[str, Any]:
    result = test_generate_video_from_urls.local(payload)
    return {
        "status": "completed",
        "kind": "video",
        "prompt_id": result["prompt_id"],
        "video_url": result["public_url"],
    }


@app.local_entrypoint()
def main(
    run_audio_test: bool = False,
    run_video_test: bool = False,
    voice_ref_url: str = "",
    image_url: str = "",
    audio_url: str = "",
    target_text: str = "Ola, este e um teste de geracao de audio na Modal.",
) -> None:
    payload: dict[str, Any] = {
        "models": inspect_models.remote(),
        "runtime": inspect_runtime.remote(),
    }
    if run_audio_test:
        if not voice_ref_url:
            raise ValueError("voice_ref_url is required when run_audio_test=true")
        payload["audio_test"] = test_generate_audio_from_url.remote(
            {
                "voice_ref_url": voice_ref_url,
                "target_text": target_text,
            }
        )
    elif run_video_test:
        if not image_url or not audio_url:
            raise ValueError("image_url and audio_url are required when run_video_test=true")
        payload["video_test"] = test_generate_video_from_urls.remote(
            {
                "image_url": image_url,
                "audio_url": audio_url,
            }
        )
    else:
        payload["comfy_smoke_test"] = smoke_test_comfy.remote()
    print(
        json.dumps(payload, indent=2)
    )
