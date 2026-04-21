import { useState, useEffect } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import { Box, Button, ButtonGroup, Typography, TextField, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, CircularProgress, Snackbar, Alert, Chip } from "@mui/material";

import FormatBoldIcon from "@mui/icons-material/FormatBold";
import FormatItalicIcon from "@mui/icons-material/FormatItalic";
import FormatListBulletedIcon from "@mui/icons-material/FormatListBulleted";
import FormatQuoteIcon from "@mui/icons-material/FormatQuote";
import CodeIcon from "@mui/icons-material/Code";
import ImageIcon from "@mui/icons-material/Image";
import DeleteIcon from "@mui/icons-material/Delete";

export default function LinkedInEditor({
  initialData,
  onSave
}: {
  initialData?: { title: string, content: string, coverImage?: string, summary: string, status: string },
  onSave: (data: { title: string, content: string, coverImage: string, summary: string, status: string }) => Promise<void>
}) {
  const [title, setTitle] = useState(initialData?.title || "");
  const [coverImage, setCoverImage] = useState(initialData?.coverImage || "");
  const [summary, setSummary] = useState(initialData?.summary || "");
  const [statusName, setStatusName] = useState(initialData?.status || "DRAFT");
  
  const [publishDialogOpen, setPublishDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Handlers Visuais pra Upload
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadingContentImage, setUploadingContentImage] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  const editor = useEditor({
    extensions: [
      StarterKit, 
      Image.configure({ inline: true, HTMLAttributes: { class: "editor-image" } }),
      Placeholder.configure({ placeholder: "Comece a escrever sua excelente notícia aqui..." })
    ],
    content: initialData?.content || "<p></p>",
    immediatelyRender: false,
  });

  const uploadFileAPI = async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch("/api/upload", { method: "POST", body: formData });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    return data.url;
  };

  const handleContentImageUpload = async () => {
    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.accept = "image/*";
    fileInput.onchange = async (e: any) => {
      const file = e.target.files[0];
      if (file) {
        setUploadingContentImage(true);
        setToastMessage("Fazendo upload da imagem no MinIO...");
        try {
          const url = await uploadFileAPI(file);
          if (url) editor?.chain().focus().setImage({ src: url }).run();
          setToastMessage("Imagem inserida no artigo com sucesso!");
        } catch (error: any) {
          setToastMessage(`Erro na imagem: ${error.message}`);
        }
        setUploadingContentImage(false);
      }
    };
    fileInput.click();
  };

  const handleCoverUpload = async () => {
    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.accept = "image/*";
    fileInput.onchange = async (e: any) => {
      const file = e.target.files[0];
      if (file) {
        setUploadingCover(true);
        setToastMessage("Fazendo upload da capa no MinIO...");
        try {
          const url = await uploadFileAPI(file);
          if (url) setCoverImage(url);
          setToastMessage("Capa definida com sucesso!");
        } catch (error: any) {
          setToastMessage(`Erro na capa: ${error.message}`);
        }
        setUploadingCover(false);
      }
    };
    fileInput.click();
  };

  const executePublish = async (status: string) => {
    if (!title.trim()) {
      setToastMessage("Erro: O título é obrigatório para salvar!");
      return;
    }

    setLoading(true);
    setStatusName(status); // Update UI
    await onSave({
      title,
      content: editor?.getHTML() || "",
      coverImage,
      summary,
      status
    });
    setLoading(false);
    setPublishDialogOpen(false);
    setToastMessage("Artigo salvo com sucesso!");
  };

  if (!editor) return null;

  return (
    <Box sx={{ width: "100%", bgcolor: "white", minHeight: "100vh", position: "relative" }}>
      
      <Snackbar open={!!toastMessage} autoHideDuration={4000} onClose={() => setToastMessage("")} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert severity={toastMessage.includes("Erro") ? "error" : "success"} sx={{ width: '100%' }}>
          {toastMessage}
        </Alert>
      </Snackbar>

      <Box sx={{ 
        position: "sticky", 
        top: 64,
        zIndex: 10, 
        bgcolor: "white", 
        borderBottom: "1px solid #e0e0e0", 
        p: 1, 
        display: "flex", 
        alignItems: "center", 
        justifyContent: "space-between" 
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <ButtonGroup variant="text" color="inherit" aria-label="formatting toolbar" sx={{ '& button': { color: '#5e5e5e' } }}>
            <Button onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>H2</Button>
            <IconButton onClick={() => editor.chain().focus().toggleBold().run()}><FormatBoldIcon /></IconButton>
            <IconButton onClick={() => editor.chain().focus().toggleItalic().run()}><FormatItalicIcon /></IconButton>
            <IconButton onClick={() => editor.chain().focus().toggleBulletList().run()}><FormatListBulletedIcon /></IconButton>
            <IconButton onClick={() => editor.chain().focus().toggleBlockquote().run()}><FormatQuoteIcon /></IconButton>
            <IconButton onClick={() => editor.chain().focus().toggleCodeBlock().run()}><CodeIcon /></IconButton>
            <IconButton onClick={handleContentImageUpload} disabled={uploadingContentImage}>
              {uploadingContentImage ? <CircularProgress size={24} /> : <ImageIcon />}
            </IconButton>
          </ButtonGroup>
          
          <Chip label={statusName === "DRAFT" ? "RASCUNHO" : "PUBLICADO"} color={statusName === "DRAFT" ? "default" : "success"} size="small" sx={{ fontWeight: 'bold' }} />
        </Box>

        <Box>
          <Button variant="outlined" sx={{ mr: 2, borderRadius: 8, textTransform: 'none' }} onClick={() => executePublish("DRAFT")} disabled={loading}>
            Salvar Rascunho
          </Button>
          <Button variant="contained" sx={{ borderRadius: 8, textTransform: 'none', bgcolor: '#0a66c2' }} onClick={() => setPublishDialogOpen(true)}>
            Avançar
          </Button>
        </Box>
      </Box>

      <Box sx={{ maxWidth: 800, mx: "auto", pt: 4, pb: 10 }}>
        
        <Box 
          sx={{ 
            width: "100%", 
            height: coverImage ? "auto" : 200, 
            bgcolor: "#f3f2ef", 
            display: "flex", 
            flexDirection: "column",
            alignItems: "center", 
            justifyContent: "center",
            mb: 4,
            borderRadius: 1,
            position: "relative",
            overflow: "hidden"
          }}
        >
          {coverImage ? (
            <Box sx={{ position: 'relative', width: '100%' }}>
              <img src={coverImage} alt="Cover" style={{ width: "100%", height: "auto", display: "block" }} />
              <IconButton 
                size="small" 
                onClick={(e) => { e.stopPropagation(); setCoverImage(''); }} 
                sx={{ position: 'absolute', top: 12, right: 12, bgcolor: 'rgba(255,255,255,0.85)', '&:hover': { bgcolor: 'white' }, boxShadow: 2 }}
              >
                <DeleteIcon color="error" />
              </IconButton>
            </Box>
          ) : (
            <Box onClick={handleCoverUpload} sx={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
              {uploadingCover ? <CircularProgress /> : (
                <Typography color="textSecondary" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <ImageIcon /> Clique para adicionar foto de capa no artigo
                </Typography>
              )}
            </Box>
          )}
        </Box>

        <TextField
          placeholder="Insira o título aqui..."
          variant="standard"
          fullWidth
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          slotProps={{
            input: {
              disableUnderline: true,
              style: { fontSize: "3rem", fontWeight: "bold", color: "#191919", lineHeight: 1.2, paddingBottom: 24 }
            }
          }}
        />

        {/* TipTap Custom Styles Render */}
        <Box sx={{ 
          "& .ProseMirror": { outline: "none", fontSize: "1.2rem", color: "#191919", lineHeight: 1.8, minHeight: '400px' },
          "& .ProseMirror p.is-editor-empty:first-child::before": {
            content: "attr(data-placeholder)", color: "#adb5bd", pointerEvents: "none", float: "left", height: 0,
          },
          "& .ProseMirror pre": {
            background: "#282c34", color: "#abb2bf", padding: "1rem", borderRadius: "8px", fontFamily: "monospace", overflowX: "auto", my: 2
          },
          "& .ProseMirror pre code": { color: "inherit", p: 0, background: "none" },
          "& .ProseMirror code": {
            color: "#d19a66", background: "#f0f0f0", padding: "2px 4px", borderRadius: "4px", fontSize: "1rem"
          },
          "& .ProseMirror img": { maxWidth: "100%", height: "auto", borderRadius: "8px", mt: 2, mb: 2 },
          "& .ProseMirror blockquote": {
            borderLeft: "4px solid #ccc", paddingLeft: "1rem", marginLeft: 0, fontStyle: "italic", color: "#666", bgcolor: '#f9f9f9', py: 1
          }
        }}>
          <EditorContent editor={editor} />
        </Box>
      </Box>

      {/* Modal LinkedIn Summary */}
      <Dialog open={publishDialogOpen} onClose={() => setPublishDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 'bold' }}>Finalizando a Publicação</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
            Este resumo ajudará no SEO do Google e será usado quando você compartilhar sua notícia nas redes sociais.
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={3}
            placeholder="Do que se trata este artigo?"
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, display: 'flex', justifyContent: 'space-between' }}>
          <Button onClick={() => executePublish("DRAFT")} color="inherit" disabled={loading}>
            Manter como Rascunho
          </Button>
          <Box>
            <Button onClick={() => setPublishDialogOpen(false)} sx={{ mr: 1 }}>Voltar</Button>
            <Button variant="contained" onClick={() => executePublish("PUBLISHED")} disabled={loading} sx={{ bgcolor: '#0a66c2' }}>
              {loading ? "Publicando..." : "Publicar Artigo Agora"}
            </Button>
          </Box>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
