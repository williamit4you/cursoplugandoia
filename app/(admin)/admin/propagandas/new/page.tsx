"use client";

import { useRouter } from "next/navigation";
import { ChangeEvent, useState } from "react";

type AspectRatio = "PORTRAIT_9_16" | "LANDSCAPE_16_9";

type UploadedAsset = {
  url: string;
  kind: "IMAGE" | "VIDEO";
  name: string;
};

const TTS_VOICES = [
  { id: "pt-BR-AntonioNeural", label: "Antônio (Masculino, Vendas)" },
  { id: "pt-BR-FranciscaNeural", label: "Francisca (Feminino, Comercial)" },
  { id: "pt-PT-DuarteNeural", label: "Duarte (Portugal)" },
];

export default function NewPropagandaPage() {
  const router = useRouter();
  const [productName, setProductName] = useState("");
  const [productDescription, setProductDescription] = useState("");
  const [productTechnicalDetails, setProductTechnicalDetails] = useState("");
  const [productUseCases, setProductUseCases] = useState("");
  const [targetAudience, setTargetAudience] = useState("");
  const [productUrl, setProductUrl] = useState("");
  const [ctaText, setCtaText] = useState("O link do produto com desconto especial está na descrição do vídeo.");
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>("PORTRAIT_9_16");
  const [videoDurationSec, setVideoDurationSec] = useState(30);
  const [ttsVoice, setTtsVoice] = useState("pt-BR-AntonioNeural");
  const [ttsSpeed, setTtsSpeed] = useState("+5%");
  const [useExternalMedia, setUseExternalMedia] = useState(true);
  const [primaryBgColor, setPrimaryBgColor] = useState("#1d4ed8");
  const [primaryTextColor, setPrimaryTextColor] = useState("#ffffff");
  const [assets, setAssets] = useState<UploadedAsset[]>([]);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    setUploading(true);
    try {
      const nextAssets: UploadedAsset[] = [];
      for (const file of files) {
        const formData = new FormData();
        formData.append("file", file);
        const res = await fetch("/api/upload", { method: "POST", body: formData });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data?.error || `Falha no upload de ${file.name}`);
        }
        nextAssets.push({
          url: data.url,
          name: file.name,
          kind: file.type.startsWith("video/") ? "VIDEO" : "IMAGE",
        });
      }
      setAssets((current) => [...current, ...nextAssets]);
    } catch (error: any) {
      alert(error?.message || "Falha ao enviar arquivos");
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  };

  const removeAsset = (index: number) => {
    setAssets((current) => current.filter((_, itemIndex) => itemIndex !== index));
  };

  const createProject = async () => {
    setLoading(true);
    try {
      const ideaPrompt = [
        `Crie uma propaganda curta e vendedora para o produto "${productName}".`,
        productTechnicalDetails && `Detalhes técnicos: ${productTechnicalDetails}`,
        productUrl && `Link de comissao do produto: ${productUrl}`,
        `CTA obrigatorio: ${ctaText}`,
        "Crie a descricao comercial, os usos recomendados, o publico-alvo e tags para YouTube separadas por virgula.",
      ]
        .filter(Boolean)
        .join("\n");

      const metadata = {
        productName,
        productDescription: "",
        productTechnicalDetails,
        productUseCases: "",
        targetAudience: "",
        productUrl,
        ctaText,
        youtubeTags: "",
        primaryBgColor,
        primaryTextColor,
        assets,
      };

      const res = await fetch("/api/video-code/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectType: "PRODUCT_AD",
          title: productName,
          description: "",
          ideaPrompt,
          metadataJson: metadata,
          aspectRatio,
          videoDurationSec,
          ttsVoice,
          ttsSpeed,
          useExternalMedia,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data?.error || "Erro ao criar propaganda");
        return;
      }

      const genRes = await fetch("/api/video-code/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId: data.id }),
      });
      const genData = await genRes.json();
      if (!genRes.ok) {
        alert(genData?.error || "Erro ao gerar roteiro");
      }

      router.push(`/admin/propagandas/${data.id}`);
    } catch {
      alert("Erro de conexão");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl animate-in fade-in duration-500">
      <div className="mb-8">
        <button
          onClick={() => router.push("/admin/propagandas")}
          className="mb-4 flex items-center gap-2 text-sm font-bold text-gray-400 transition-colors hover:text-emerald-600"
        >
          Voltar para lista
        </button>
        <h1 className="text-4xl font-black tracking-tight text-gray-900">Criar propaganda</h1>
        <p className="mt-2 text-lg text-gray-500">
          Informe título, descrição técnica e link. A IA monta a venda, SEO e roteiro.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        <div className="space-y-6 lg:col-span-8">
          <div className="rounded-3xl border border-gray-100 bg-white p-8 shadow-xl shadow-emerald-50/50">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-black uppercase tracking-wider text-gray-700">
                  Título / nome do produto
                </label>
                <input
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  className="w-full rounded-2xl border-gray-100 bg-gray-50 px-5 py-4 text-lg font-bold text-gray-900"
                  placeholder="Ex.: Smart TV 50 polegadas 4K"
                />
              </div>
              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-black uppercase tracking-wider text-gray-700">
                  Descrição técnica do produto
                </label>
                <textarea
                  value={productTechnicalDetails}
                  onChange={(e) => setProductTechnicalDetails(e.target.value)}
                  className="min-h-[210px] w-full rounded-2xl border-gray-100 bg-gray-50 px-5 py-4 text-gray-900"
                  placeholder="Cole aqui as especificações: modelo, tamanho, material, recursos, medidas, potência, compatibilidades, garantia, etc."
                />
              </div>
              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-black uppercase tracking-wider text-gray-700">
                  Link de comissão / afiliado
                </label>
                <input
                  value={productUrl}
                  onChange={(e) => setProductUrl(e.target.value)}
                  className="w-full rounded-2xl border-gray-100 bg-gray-50 px-5 py-4 text-gray-900"
                  placeholder="https://..."
                />
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-gray-100 bg-white p-8 shadow-sm">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-black text-gray-900">Mídias do produto</h2>
                <p className="text-sm text-gray-500">Envie várias fotos e vídeos para a IA usar na propaganda.</p>
              </div>
              <label className="cursor-pointer rounded-xl bg-emerald-600 px-4 py-2 text-sm font-black text-white hover:bg-emerald-700">
                {uploading ? "Enviando..." : "Subir arquivos"}
                <input
                  type="file"
                  multiple
                  accept="image/*,video/*"
                  className="hidden"
                  onChange={handleUpload}
                  disabled={uploading}
                />
              </label>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {assets.map((asset, index) => (
                <div key={`${asset.url}-${index}`} className="rounded-2xl border border-gray-200 bg-gray-50 p-3">
                  <div className="mb-3 aspect-square overflow-hidden rounded-xl bg-white">
                    {asset.kind === "VIDEO" ? (
                      <video src={asset.url} className="h-full w-full object-cover" />
                    ) : (
                      <img src={asset.url} alt={asset.name} className="h-full w-full object-cover" />
                    )}
                  </div>
                  <div className="line-clamp-1 text-sm font-bold text-gray-700">{asset.name}</div>
                  <div className="mt-1 text-xs font-semibold uppercase tracking-wider text-gray-400">
                    {asset.kind}
                  </div>
                  <button
                    onClick={() => removeAsset(index)}
                    className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-1 text-xs font-black text-red-700 hover:bg-red-100"
                  >
                    Remover
                  </button>
                </div>
              ))}
              {assets.length === 0 && (
                <div className="col-span-full rounded-2xl border-2 border-dashed border-gray-200 p-8 text-center text-sm font-bold text-gray-400">
                  Nenhum arquivo enviado ainda.
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6 lg:col-span-4">
          <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-black text-gray-900">Configurações do vídeo</h2>
            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-xs font-black uppercase tracking-wider text-gray-500">
                  Formato
                </label>
                <select
                  value={aspectRatio}
                  onChange={(e) => setAspectRatio(e.target.value as AspectRatio)}
                  className="w-full rounded-xl border-gray-200 bg-gray-50 px-4 py-3 font-bold text-gray-900"
                >
                  <option value="PORTRAIT_9_16">Vertical 9:16</option>
                  <option value="LANDSCAPE_16_9">Horizontal 16:9</option>
                </select>
              </div>
              <div>
                <label className="mb-2 block text-xs font-black uppercase tracking-wider text-gray-500">
                  Duração
                </label>
                <input
                  type="number"
                  value={videoDurationSec}
                  onChange={(e) => setVideoDurationSec(Number(e.target.value))}
                  className="w-full rounded-xl border-gray-200 bg-gray-50 px-4 py-3 font-bold text-gray-900"
                />
              </div>
              <div>
                <label className="mb-2 block text-xs font-black uppercase tracking-wider text-gray-500">
                  Voz
                </label>
                <select
                  value={ttsVoice}
                  onChange={(e) => setTtsVoice(e.target.value)}
                  className="w-full rounded-xl border-gray-200 bg-gray-50 px-4 py-3 font-bold text-gray-900"
                >
                  {TTS_VOICES.map((voice) => (
                    <option key={voice.id} value={voice.id}>
                      {voice.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-2 block text-xs font-black uppercase tracking-wider text-gray-500">
                  Velocidade da voz
                </label>
                <input
                  value={ttsSpeed}
                  onChange={(e) => setTtsSpeed(e.target.value)}
                  className="w-full rounded-xl border-gray-200 bg-gray-50 px-4 py-3 font-bold text-gray-900"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-2 block text-xs font-black uppercase tracking-wider text-gray-500">
                    Fundo principal
                  </label>
                  <input
                    type="color"
                    value={primaryBgColor}
                    onChange={(e) => setPrimaryBgColor(e.target.value)}
                    className="h-12 w-full rounded-xl border-gray-200 bg-white p-1"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-xs font-black uppercase tracking-wider text-gray-500">
                    Texto principal
                  </label>
                  <input
                    type="color"
                    value={primaryTextColor}
                    onChange={(e) => setPrimaryTextColor(e.target.value)}
                    className="h-12 w-full rounded-xl border-gray-200 bg-white p-1"
                  />
                </div>
              </div>
              <label className="flex items-center gap-3 rounded-2xl bg-gray-50 p-4">
                <input
                  type="checkbox"
                  checked={useExternalMedia}
                  onChange={(e) => setUseExternalMedia(e.target.checked)}
                />
                <div>
                  <div className="font-black text-gray-900">Complementar com mídia externa</div>
                  <div className="text-xs text-gray-500">A IA pode buscar apoio visual quando faltar mídia própria.</div>
                </div>
              </label>
            </div>
          </div>

          <div className="rounded-3xl bg-gradient-to-br from-emerald-600 to-emerald-800 p-6 text-white shadow-xl shadow-emerald-100">
            <h3 className="text-xl font-black">A IA completa o resto</h3>
            <p className="mt-3 text-sm leading-relaxed text-emerald-50">
              Ao gerar roteiro, ela cria descrição comercial para YouTube, usos, público-alvo, tags SEO, narração e cenas.
            </p>
          </div>

          <button
            onClick={createProject}
            disabled={
              loading ||
              uploading ||
              productName.trim().length === 0 ||
              productTechnicalDetails.trim().length === 0 ||
              productUrl.trim().length === 0
            }
            className="flex w-full items-center justify-center gap-3 rounded-2xl bg-emerald-600 px-8 py-4 text-lg font-black text-white shadow-xl shadow-emerald-100 transition-all hover:-translate-y-1 hover:bg-emerald-700 disabled:opacity-50"
          >
            {loading ? "Criando propaganda..." : "Gerar propaganda"}
          </button>
        </div>
      </div>
    </div>
  );
}
