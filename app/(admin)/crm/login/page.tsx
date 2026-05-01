"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Alert, Box, Button, Container, Paper, TextField, Typography } from "@mui/material";

export default function CrmLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const result = await signIn("credentials", {
      redirect: false,
      email,
      password,
    });

    setLoading(false);

    if (result?.error) {
      setError(result.error);
      return;
    }

    router.push("/crm/dashboard");
  }

  return (
    <Container maxWidth="xs">
      <Box sx={{ mt: 10 }}>
        <Paper sx={{ p: 4, borderRadius: 3 }}>
          <Typography variant="h5" sx={{ fontWeight: 800, textAlign: "center", mb: 1 }}>
            CRM Login
          </Typography>
          <Typography color="text.secondary" sx={{ textAlign: "center", mb: 3 }}>
            Use as mesmas credenciais da área administrativa.
          </Typography>

          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

          <Box component="form" onSubmit={handleSubmit}>
            <TextField fullWidth label="E-mail" value={email} onChange={(e) => setEmail(e.target.value)} sx={{ mb: 2 }} />
            <TextField fullWidth type="password" label="Senha" value={password} onChange={(e) => setPassword(e.target.value)} sx={{ mb: 3 }} />
            <Button fullWidth variant="contained" type="submit" disabled={loading}>
              {loading ? "Entrando..." : "Entrar no CRM"}
            </Button>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
}
