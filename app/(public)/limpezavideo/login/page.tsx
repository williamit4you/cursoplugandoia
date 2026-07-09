"use client";

import { FormEvent, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function LimpezaVideoLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("willianbarata@gmail.com");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");

    const callbackUrl = "/limpezavideo";
    const result = await signIn("credentials", {
      redirect: false,
      email,
      password,
      callbackUrl,
    });

    if (result?.error) {
      setError(result.error);
      setLoading(false);
      return;
    }

    router.push(callbackUrl);
    router.refresh();
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,#1d4ed8_0%,#0f172a_45%,#020617_100%)] px-4 py-10 text-white">
      <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[1.1fr,0.9fr] lg:items-center">
        <section className="rounded-[32px] border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur-xl">
          <div className="inline-flex rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-cyan-100">
            Plugando IA Labs
          </div>
          <h1 className="mt-6 max-w-xl text-4xl font-semibold tracking-tight text-white md:text-5xl">LimpezaVideo</h1>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-slate-200/85 md:text-lg">
            Um microsaas independente para subir vídeos, aplicar limpeza técnica, adicionar fechamento de marca e devolver a URL final já pronta no MinIO.
          </p>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {["Upload do vídeo original", "Processamento automático no worker", "URL final pronta para uso"].map((item) => (
              <div key={item} className="rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-4 text-sm text-slate-200/90">
                {item}
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-[32px] border border-white/10 bg-slate-950/70 p-8 shadow-2xl backdrop-blur-xl">
          <div className="text-sm font-semibold uppercase tracking-[0.22em] text-cyan-100/80">Acesso privado</div>
          <h2 className="mt-4 text-2xl font-semibold">Entrar no painel</h2>
          <p className="mt-2 text-sm text-slate-300">Use o login configurado para o MVP.</p>

          <form className="mt-8 grid gap-4" onSubmit={handleSubmit}>
            <label className="grid gap-2 text-sm text-slate-200">
              E-mail
              <input className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition placeholder:text-slate-400 focus:border-cyan-300/50" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </label>
            <label className="grid gap-2 text-sm text-slate-200">
              Senha
              <div className="relative">
                <input
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 pr-24 text-white outline-none transition placeholder:text-slate-400 focus:border-cyan-300/50"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-xl border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-slate-200 transition hover:bg-white/10"
                  onClick={() => setShowPassword((value) => !value)}
                >
                  {showPassword ? "Ocultar" : "Mostrar"}
                </button>
              </div>
            </label>
            {error ? <div className="rounded-2xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-100">{error}</div> : null}
            <button className="mt-2 rounded-2xl bg-cyan-300 px-4 py-3 font-semibold text-slate-950 transition hover:bg-cyan-200 disabled:cursor-not-allowed disabled:opacity-60" type="submit" disabled={loading}>
              {loading ? "Entrando..." : "Acessar LimpezaVideo"}
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}
