"use client";

import { useState } from "react";
import { Box, Typography, TextField, Button, Alert, Paper } from "@mui/material";

export default function LeadCapture({ source }: { source: string }) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");

    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name, source }),
      });

      if (!res.ok) throw new Error("Erro de servidor");
      setStatus("success");
    } catch (err) {
      setStatus("error");
    }
  };

  if (status === "success") {
    return (
      <Paper elevation={0} sx={{ p: 4, my: 6, textAlign: "center", bgcolor: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 2 }}>
        <Typography variant="h6" color="success.main" sx={{ fontWeight: "bold" }}>Parabéns! Cadastro Realizado.</Typography>
        <Typography variant="body2" sx={{ mt: 1, color: "text.secondary" }}>Em breve enviaremos os materiais e novidades de IA diretamente para o seu e-mail.</Typography>
      </Paper>
    );
  }

  return (
    <Paper elevation={3} sx={{ p: { xs: 3, sm: 5 }, my: 6, borderRadius: 2, borderTop: "6px solid #1976d2", bgcolor: "white" }}>
      <Typography variant="h5" sx={{ fontWeight: "bold" }} gutterBottom>Quer dominar IA e Criação de Sistemas?</Typography>
      <Typography variant="body1" color="textSecondary" sx={{ mb: 4 }}>
        Deixe seu e-mail abaixo para garantir acesso a tutoriais exclusivos, novos conteúdos do projeto e nossos lançamentos em primeira mão.
      </Typography>
      {status === "error" && <Alert severity="error" sx={{ mb: 3 }}>Houve um erro ao processar. Tente novamente mais tarde.</Alert>}
      <Box component="form" onSubmit={handleSubmit} sx={{ display: "flex", gap: 2, flexDirection: { xs: "column", sm: "row" } }}>
        <TextField
          required
          label="Seu Nome"
          value={name}
          onChange={(e) => setName(e.target.value)}
          sx={{ flexGrow: 1 }}
        />
        <TextField
          required
          type="email"
          label="Seu Melhor E-mail"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          sx={{ flexGrow: 2 }}
        />
        <Button 
          type="submit" 
          variant="contained" 
          size="large"
          disabled={status === "loading"}
          sx={{ minWidth: 150, fontWeight: "bold" }}
        >
          {status === "loading" ? "Enviando..." : "Quero Participar!"}
        </Button>
      </Box>
    </Paper>
  );
}
