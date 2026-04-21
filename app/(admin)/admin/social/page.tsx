"use client";
import { useEffect, useState } from "react";
import { toast, ToastContainer } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';

export default function SocialPostsDashboard() {
  const [posts, setPosts] = useState<any[]>([]);

  const fetchPosts = async () => {
    // Para simplificar, vou supor que criei um GET api/social/posts/route.ts
    const res = await fetch("/api/social/posts", { cache: "no-store" });
    if (res.ok) {
      const data = await res.json();
      setPosts(data);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const handlePostNow = async (id: string, bypass: boolean = false) => {
    try {
      const res = await fetch("/api/social/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ socialPostId: id, bypassTimeCheck: bypass }),
      });
      const data = await res.json();

      if (!res.ok) {
        if (data.timeLimit && !bypass) {
          const confirmPost = confirm("Limite de 1 hora não atingido! Tem certeza que deseja postar AGORA e assumir o risco de Shadowban na rede Meta?");
          if (confirmPost) {
            handlePostNow(id, true);
          }
          return;
        }
        toast.error(data.error || "Failed to post");
        fetchPosts();
        return;
      }

      toast.success("Postado com sucesso no IG e FB!");
      fetchPosts();
    } catch (e) {
      toast.error("Erro desconhecido");
    }
  };

  return (
    <div className="p-6">
      <ToastContainer />
      <h1 className="text-2xl font-bold mb-4">Fila de Postagem - Stories (Instagram e Facebook)</h1>
      <table className="w-full bg-white shadow rounded">
        <thead className="bg-gray-100 uppercase text-sm border-b">
          <tr>
            <th className="p-4 text-left">Miniatura / URL</th>
            <th className="p-4 text-left">Resumo do Roteiro (30s)</th>
            <th className="p-4 text-left">Status</th>
            <th className="p-4 text-left">Log / Agendamento</th>
            <th className="p-4 text-left">Ação</th>
          </tr>
        </thead>
        <tbody>
          {posts.map((p) => (
            <tr key={p.id} className="border-b">
              <td className="p-4">
                 <a href={p.videoUrl} target="_blank" className="text-blue-500 underline text-sm break-all max-w-[200px]">View Video</a>
              </td>
              <td className="p-4 text-sm max-w-[300px] truncate">{p.summary}</td>
              <td className="p-4 font-semibold">{p.status}</td>
              <td className="p-4 text-xs text-gray-500">
                {p.log || "-"} <br/>
                {p.scheduledTo ? `Agendado para: ${new Date(p.scheduledTo).toLocaleString()}` : ''}
              </td>
              <td className="p-4">
                {p.status !== "POSTED" && (
                  <button 
                    onClick={() => handlePostNow(p.id)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm font-bold"
                  >
                    Postar Manualmente
                  </button>
                )}
              </td>
            </tr>
          ))}
          {posts.length === 0 && (
             <tr><td colSpan={5} className="p-4 text-center">Nenhum post na fila.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
