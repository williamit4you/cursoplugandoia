"use client";

import { useState } from "react";
import {
  Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, Paper, Button, Chip,
} from "@mui/material";
import Link from "next/link";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function PostsTable({ initialData }: { initialData: any[] }) {
  const [posts, setPosts] = useState<any[]>(initialData);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  // ── Publicar no site (mudar status para PUBLISHED) ─────────────────────────
  const handlePublish = async (id: string) => {
    setLoadingId(id + "-site");
    try {
      const res = await fetch(`/api/posts/${id}/publish`, { method: "POST" });
      if (res.ok) {
        setPosts((prev) =>
          prev.map((p) => (p.id === id ? { ...p, status: "PUBLISHED" } : p))
        );
        toast.success("✅ Post publicado no site!");
      } else {
        const data = await res.json();
        toast.error(data.error || "Erro ao publicar");
      }
    } catch {
      toast.error("Erro de conexão");
    } finally {
      setLoadingId(null);
    }
  };

  // ── Publicar no LinkedIn ───────────────────────────────────────────────────
  const handleLinkedIn = async (id: string) => {
    setLoadingId(id + "-linkedin");
    try {
      // 1. Buscar o socialPostId associado ao post
      const sp = await fetch(`/api/posts/${id}/social-post`);
      if (!sp.ok) {
        toast.error("Este post ainda não tem vídeo gerado para publicar no LinkedIn.");
        return;
      }
      const { socialPostId } = await sp.json();

      // 2. Publicar no LinkedIn
      const res = await fetch("/api/social/publish-linkedin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ socialPostId }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("✅ Publicado no LinkedIn com sucesso!");
      } else {
        toast.error(data.error || "Erro ao publicar no LinkedIn");
      }
    } catch {
      toast.error("Erro de conexão ao publicar no LinkedIn");
    } finally {
      setLoadingId(null);
    }
  };

  // ── Buscar imagem de capa no Pexels ───────────────────────────────────────
  const handleFetchCover = async (id: string) => {
    setLoadingId(id + "-cover");
    try {
      const res = await fetch(`/api/posts/${id}/fetch-cover`, { method: "POST" });
      const data = await res.json();
      if (data.coverImage) {
        setPosts((prev) =>
          prev.map((p) => (p.id === id ? { ...p, coverImage: data.coverImage } : p))
        );
        toast.success("🖼️ Imagem de capa buscada no Pexels!");
      } else {
        toast.error(data.error || "Erro ao buscar imagem");
      }
    } catch {
      toast.error("Erro de conexão ao buscar imagem");
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <>
      <ToastContainer position="top-right" />
      <Button
        component={Link}
        href="/admin/posts/new"
        variant="contained"
        color="primary"
        sx={{ mb: 2 }}
      >
        Nova Notícia
      </Button>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 700 }}>Título</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Capa</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Visualizações</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Data</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Ações</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {posts.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  Nenhuma notícia encontrada.
                </TableCell>
              </TableRow>
            )}
            {posts.map((item) => (
              <TableRow key={item.id} hover>
                {/* Título */}
                <TableCell sx={{ maxWidth: 280, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {item.title}
                </TableCell>

                {/* Capa */}
                <TableCell sx={{ minWidth: 90 }}>
                  {item.coverImage ? (
                    <img
                      src={item.coverImage}
                      alt="capa"
                      style={{ width: 64, height: 40, objectFit: "cover", borderRadius: 4, display: "block" }}
                    />
                  ) : (
                    <Button
                      size="small"
                      variant="outlined"
                      disabled={loadingId === item.id + "-cover"}
                      onClick={() => handleFetchCover(item.id)}
                      sx={{ fontSize: 10, textTransform: "none", minWidth: 0, px: 1 }}
                    >
                      {loadingId === item.id + "-cover" ? "⏳" : "🖼️ Pexels"}
                    </Button>
                  )}
                </TableCell>

                {/* Status */}
                <TableCell>
                  <Chip
                    label={item.status}
                    color={item.status === "PUBLISHED" ? "success" : "default"}
                    size="small"
                  />
                </TableCell>

                {/* Views */}
                <TableCell>{item.views ?? 0}</TableCell>

                {/* Data */}
                <TableCell>{new Date(item.createdAt).toLocaleDateString("pt-BR")}</TableCell>

                {/* Ações */}
                <TableCell>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
                    <Button
                      component={Link}
                      href={`/admin/posts/${item.id}`}
                      size="small"
                      variant="outlined"
                      sx={{ textTransform: "none" }}
                    >
                      ✏️ Editar
                    </Button>

                    {item.status !== "PUBLISHED" && (
                      <Button
                        size="small"
                        variant="contained"
                        color="success"
                        disabled={loadingId === item.id + "-site"}
                        onClick={() => handlePublish(item.id)}
                        sx={{ textTransform: "none" }}
                      >
                        {loadingId === item.id + "-site" ? "⏳" : "🌐 Site"}
                      </Button>
                    )}

                    <Button
                      size="small"
                      variant="outlined"
                      disabled={loadingId === item.id + "-linkedin"}
                      onClick={() => handleLinkedIn(item.id)}
                      sx={{
                        textTransform: "none",
                        borderColor: "#0A66C2",
                        color: "#0A66C2",
                        "&:hover": { borderColor: "#0A66C2", background: "#e8f0fe" },
                      }}
                    >
                      {loadingId === item.id + "-linkedin" ? "⏳" : "💼 LinkedIn"}
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </>
  );
}
