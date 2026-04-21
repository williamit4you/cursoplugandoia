"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import { Box, Button, ButtonGroup } from "@mui/material";

export default function TipTapEditor({
  content,
  onChange,
}: {
  content: string;
  onChange: (value: string) => void;
}) {
  const editor = useEditor({
    extensions: [StarterKit, Image.configure({ inline: true })],
    content,
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  const handleImageUpload = async () => {
    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.accept = "image/*";
    fileInput.onchange = async (e: any) => {
      const file = e.target.files[0];
      if (file) {
        const formData = new FormData();
        formData.append("file", file);

        try {
          const res = await fetch("/api/upload", {
            method: "POST",
            body: formData,
          });
          const data = await res.json();
          if (data.url) {
            editor?.chain().focus().setImage({ src: data.url }).run();
          }
        } catch (error) {
          console.error("Upload de imagem falhou.", error);
        }
      }
    };
    fileInput.click();
  };

  if (!editor) {
    return null;
  }

  return (
    <Box sx={{ border: "1px solid #ccc", borderRadius: 1, overflow: "hidden", backgroundColor: 'white' }}>
      <Box sx={{ p: 1, borderBottom: "1px solid #ccc", backgroundColor: "#f5f5f5" }}>
        <ButtonGroup variant="outlined" size="small" aria-label="Toolbar">
          <Button onClick={() => editor.chain().focus().toggleBold().run()} disabled={!editor.can().chain().focus().toggleBold().run()}>
            Bold
          </Button>
          <Button onClick={() => editor.chain().focus().toggleItalic().run()} disabled={!editor.can().chain().focus().toggleItalic().run()}>
            Italic
          </Button>
          <Button onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>
            H2
          </Button>
          <Button onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}>
            H3
          </Button>
          <Button onClick={handleImageUpload}>
            Imagem (MinIO)
          </Button>
        </ButtonGroup>
      </Box>
      <Box sx={{ p: 2, minHeight: 400, outline: 'none' }}>
        <EditorContent editor={editor} style={{ minHeight: 400, outline: "none" }} />
      </Box>
    </Box>
  );
}
