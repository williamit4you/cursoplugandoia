import Link from "next/link";
import { getOrCreateCrmSettings } from "@/lib/crmSettings";
import { buildWhatsAppHref } from "@/lib/crm";

const services = [
  {
    title: "Automação com n8n",
    description:
      "Criamos fluxos para vendas, atendimento, follow-up, captura de leads e integração entre sistemas sem depender de tarefas manuais repetitivas.",
  },
  {
    title: "Automações com código",
    description:
      "Quando o no-code não basta, construímos integrações sob medida com APIs, bancos, regras de negócio e painéis próprios.",
  },
  {
    title: "Agentes com LLM + RAG",
    description:
      "Montamos agentes que atendem clientes com base nos documentos e instruções da sua empresa, com respostas alinhadas ao seu processo.",
  },
  {
    title: "Evolution API + WhatsApp",
    description:
      "Instalamos a Evolution API, configuramos o WhatsApp e conectamos tudo com CRM, n8n, atendimento e automações comerciais.",
  },
];

const benefits = [
  "Redução de trabalho manual e tempo operacional",
  "Atendimento mais rápido e padronizado",
  "Mais controle sobre processos internos e comerciais",
  "Integrações entre WhatsApp, CRM, planilhas, APIs e banco de dados",
  "Escalabilidade com IA sem depender de gambiarra",
];

export const dynamic = "force-dynamic";

export default async function SolucoesIaPage() {
  const crmSettings = await getOrCreateCrmSettings();
  const whatsappHref = crmSettings.whatsappEnabled
    ? buildWhatsAppHref(crmSettings.whatsappNumber, crmSettings.whatsappDefaultMessage)
    : "https://wa.me/";
  const whatsappLabel = crmSettings.whatsappDisplayLabel || "Falar sobre o projeto";

  return (
    <main style={{ minHeight: "100vh", background: "linear-gradient(180deg, #f8fafc 0%, #ecfeff 100%)", color: "#0f172a" }}>
      <section style={{ maxWidth: 1180, margin: "0 auto", padding: "72px 24px 40px" }}>
        <div
          style={{
            borderRadius: 28,
            padding: "48px 40px",
            background: "linear-gradient(135deg, #0f172a 0%, #115e59 100%)",
            color: "white",
            boxShadow: "0 25px 60px rgba(15, 23, 42, 0.22)",
          }}
        >
          <div style={{ maxWidth: 760 }}>
            <div style={{ display: "inline-flex", padding: "8px 14px", borderRadius: 999, background: "rgba(255,255,255,0.12)", fontSize: 12, fontWeight: 900, letterSpacing: 0.6, textTransform: "uppercase" }}>
              Automação e agentes de IA para negócios
            </div>
            <h1 style={{ margin: "18px 0 14px", fontSize: "clamp(2.3rem, 5vw, 4.2rem)", lineHeight: 1.02, fontWeight: 900 }}>
              Implantamos automações, agentes e atendimento inteligente para sua operação vender mais e travar menos.
            </h1>
            <p style={{ margin: 0, fontSize: 18, lineHeight: 1.7, color: "rgba(255,255,255,0.84)" }}>
              Se o seu negócio depende de tarefas repetitivas, respostas manuais e sistemas desconectados, nós desenhamos a operação com IA para tirar isso do caminho.
            </p>
            <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginTop: 28 }}>
              <Link
                href={whatsappHref}
                style={{
                  textDecoration: "none",
                  background: "#facc15",
                  color: "#111827",
                  fontWeight: 900,
                  padding: "14px 22px",
                  borderRadius: 14,
                }}
              >
                {whatsappLabel}
              </Link>
              <Link
                href="/noticias"
                style={{
                  textDecoration: "none",
                  background: "rgba(255,255,255,0.1)",
                  color: "white",
                  fontWeight: 800,
                  padding: "14px 22px",
                  borderRadius: 14,
                  border: "1px solid rgba(255,255,255,0.16)",
                }}
              >
                Ver notícias e cases
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section style={{ maxWidth: 1180, margin: "0 auto", padding: "0 24px 36px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 18 }}>
          {services.map((service) => (
            <article
              key={service.title}
              style={{
                background: "white",
                borderRadius: 22,
                padding: 24,
                border: "1px solid #dbeafe",
                boxShadow: "0 12px 28px rgba(15, 23, 42, 0.06)",
              }}
            >
              <h2 style={{ margin: "0 0 12px", fontSize: 22, lineHeight: 1.2 }}>{service.title}</h2>
              <p style={{ margin: 0, color: "#475569", lineHeight: 1.7 }}>{service.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section style={{ maxWidth: 1180, margin: "0 auto", padding: "0 24px 60px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 20 }}>
          <div style={{ background: "white", borderRadius: 24, padding: 28, border: "1px solid #dbeafe" }}>
            <h2 style={{ margin: "0 0 14px", fontSize: 30 }}>Como isso entra no negócio do cliente</h2>
            <p style={{ margin: "0 0 16px", color: "#475569", lineHeight: 1.8 }}>
              O objetivo não é “ter IA”. O objetivo é reduzir gargalo, ganhar previsibilidade e criar velocidade operacional.
            </p>
            <div style={{ display: "grid", gap: 12 }}>
              {benefits.map((item) => (
                <div key={item} style={{ display: "flex", gap: 10, alignItems: "flex-start", color: "#0f172a" }}>
                  <span style={{ width: 10, height: 10, marginTop: 8, borderRadius: 999, background: "#0f766e", flexShrink: 0 }} />
                  <span style={{ lineHeight: 1.7 }}>{item}</span>
                </div>
              ))}
            </div>
          </div>

          <div style={{ background: "#0f172a", color: "white", borderRadius: 24, padding: 28, boxShadow: "0 20px 40px rgba(15, 23, 42, 0.18)" }}>
            <h2 style={{ margin: "0 0 14px", fontSize: 30 }}>Exemplo de stack que instalamos</h2>
            <div style={{ display: "grid", gap: 12, color: "rgba(255,255,255,0.82)" }}>
              <div><strong style={{ color: "white" }}>Canal de entrada:</strong> WhatsApp com Evolution API</div>
              <div><strong style={{ color: "white" }}>Orquestração:</strong> n8n com regras de negócio e integrações</div>
              <div><strong style={{ color: "white" }}>IA:</strong> LLM com instruções da empresa e base documental</div>
              <div><strong style={{ color: "white" }}>Memória:</strong> RAG para responder com contexto real</div>
              <div><strong style={{ color: "white" }}>Sistema:</strong> APIs, banco e dashboards personalizados</div>
            </div>
            <div style={{ marginTop: 24, padding: 18, borderRadius: 18, background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)" }}>
              <div style={{ fontWeight: 900, marginBottom: 8 }}>Entrega pensada para operação real</div>
              <div style={{ color: "rgba(255,255,255,0.78)", lineHeight: 1.7 }}>
                Atendimento, pré-venda, follow-up, qualificação, resgate de lead, respostas baseadas em documentos e automações internas no mesmo fluxo.
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
