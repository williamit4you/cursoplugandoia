"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { CRM_STAGE_LABELS } from "@/lib/crm";

type DashboardPayload = {
  totals: {
    totalLeads: number;
    wonLeads: number;
    lostLeads: number;
    openTasks: number;
    conversionRate: number;
  };
  stageCounts: Array<{ stage: string; _count: { stage: number } }>;
  recentActivities: Array<{
    id: string;
    type: string;
    subject?: string | null;
    content: string;
    happenedAt: string;
    contact: { id: string; name?: string | null; phone: string; stage: string };
  }>;
};

type Contact = {
  id: string;
  name?: string | null;
  phone: string;
  email?: string | null;
  company?: string | null;
  source?: string | null;
  interestService?: string | null;
  notes?: string | null;
  stage: string;
  lastContactAt?: string | null;
  activities: Array<{ id: string; type: string; content: string; happenedAt: string }>;
  tasks: Array<{ id: string; title: string; status: string; dueAt?: string | null }>;
};

type Conversation = {
  id: string;
  messages: Array<{
    id: string;
    role: string;
    content: string;
    guardrailTriggered: boolean;
    createdAt: string;
  }>;
};

const STAGES = ["LEAD", "CONTACTED", "PROPOSAL_SENT", "NEGOTIATION", "WON", "LOST"];

const EMPTY_CONTACT = {
  name: "",
  phone: "",
  email: "",
  company: "",
  source: "site",
  interestService: "",
  notes: "",
  stage: "LEAD",
};

export default function CrmDashboard() {
  const [dashboard, setDashboard] = useState<DashboardPayload | null>(null);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [selectedContactId, setSelectedContactId] = useState("");
  const [assistantMessage, setAssistantMessage] = useState("");
  const [contactForm, setContactForm] = useState(EMPTY_CONTACT);
  const [activityNote, setActivityNote] = useState("");
  const [taskTitle, setTaskTitle] = useState("");
  const [saving, setSaving] = useState(false);
  const [assistantLoading, setAssistantLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const selectedContact = useMemo(
    () => contacts.find((contact) => contact.id === selectedContactId) || null,
    [contacts, selectedContactId]
  );

  const loadAll = useCallback(async () => {
    const [dashboardRes, contactsRes] = await Promise.all([
      fetch("/api/crm/dashboard"),
      fetch("/api/crm/contacts"),
    ]);

    if (dashboardRes.ok) {
      setDashboard(await dashboardRes.json());
    }

    if (contactsRes.ok) {
      const data = await contactsRes.json();
      setContacts(data);
      if (!selectedContactId && data[0]?.id) {
        setSelectedContactId(data[0].id);
      }
    }
  }, [selectedContactId]);

  const loadConversation = useCallback(async (contactId: string) => {
    const res = await fetch(`/api/crm/conversations/${contactId}`);
    if (res.ok) {
      setConversation(await res.json());
    } else {
      setConversation(null);
    }
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  useEffect(() => {
    if (selectedContactId) {
      loadConversation(selectedContactId);
    }
  }, [loadConversation, selectedContactId]);

  const stageMap = useMemo(() => {
    const base = Object.fromEntries(STAGES.map((stage) => [stage, 0]));
    for (const entry of dashboard?.stageCounts || []) {
      base[entry.stage] = entry._count.stage;
    }
    return base as Record<string, number>;
  }, [dashboard]);

  async function handleCreateContact() {
    setSaving(true);
    setFeedback(null);
    const res = await fetch("/api/crm/contacts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(contactForm),
    });
    setSaving(false);

    if (!res.ok) {
      setFeedback({ type: "error", text: "Não consegui salvar o contato." });
      return;
    }

    setFeedback({ type: "success", text: "Contato salvo no CRM." });
    setContactForm(EMPTY_CONTACT);
    await loadAll();
  }

  async function updateStage(contactId: string, stage: string) {
    await fetch(`/api/crm/contacts/${contactId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stage }),
    });
    await loadAll();
    if (selectedContactId === contactId) {
      await loadConversation(contactId);
    }
  }

  async function registerActivity(type: string) {
    if (!selectedContactId || !activityNote.trim()) {
      return;
    }

    const res = await fetch("/api/crm/activities", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contactId: selectedContactId,
        type,
        direction: type === "WHATSAPP" || type === "EMAIL" || type === "CALL" ? "OUTBOUND" : "INTERNAL",
        subject: "Registro manual",
        content: activityNote,
      }),
    });

    if (res.ok) {
      setActivityNote("");
      await loadAll();
    }
  }

  async function askAssistant() {
    if (!selectedContactId || !assistantMessage.trim()) {
      return;
    }

    setAssistantLoading(true);
    setFeedback(null);
    const res = await fetch("/api/crm/assistant/reply", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contactId: selectedContactId,
        message: assistantMessage,
      }),
    });
    setAssistantLoading(false);

    if (!res.ok) {
      setFeedback({ type: "error", text: "Não consegui gerar a resposta do atendente IA." });
      return;
    }

    const data = await res.json();
    setAssistantMessage("");
    setFeedback({
      type: data.guarded ? "error" : "success",
      text: data.guarded ? "Guardrail aplicado: assunto fora do escopo comercial." : "Resposta do atendente IA gerada.",
    });
    await loadConversation(selectedContactId);
    await loadAll();
  }

  async function createTask() {
    if (!selectedContactId || !taskTitle.trim()) {
      return;
    }

    const res = await fetch("/api/crm/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contactId: selectedContactId,
        title: taskTitle,
      }),
    });

    if (res.ok) {
      setTaskTitle("");
      await loadAll();
    }
  }

  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="h4" sx={{ fontWeight: 800 }}>CRM Comercial</Typography>
        <Typography color="text.secondary">
          Funil, histórico e atendimento assistido para automação, agentes de IA e WhatsApp.
        </Typography>
      </Box>

      {feedback && <Alert severity={feedback.type}>{feedback.text}</Alert>}

      <Box
        sx={{
          display: "grid",
          gap: 2,
          gridTemplateColumns: { xs: "1fr", sm: "repeat(2, minmax(0, 1fr))", xl: "repeat(5, minmax(0, 1fr))" },
        }}
      >
        {[
          { label: "Leads no CRM", value: dashboard?.totals.totalLeads ?? 0 },
          { label: "Fechados (ganho)", value: dashboard?.totals.wonLeads ?? 0 },
          { label: "Fechados (perdido)", value: dashboard?.totals.lostLeads ?? 0 },
          { label: "Tarefas abertas", value: dashboard?.totals.openTasks ?? 0 },
          { label: "Conversão", value: `${dashboard?.totals.conversionRate ?? 0}%` },
        ].map((item) => (
          <Box key={item.label}>
            <Card sx={{ borderRadius: 3 }}>
              <CardContent>
                <Typography sx={{ fontSize: 13 }} color="text.secondary">{item.label}</Typography>
                <Typography variant="h4" sx={{ fontWeight: 800 }}>{item.value}</Typography>
              </CardContent>
            </Card>
          </Box>
        ))}
      </Box>

      <Paper sx={{ p: 2.5, borderRadius: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 800, mb: 2 }}>Funil de vendas</Typography>
        <Box
          sx={{
            display: "grid",
            gap: 2,
            gridTemplateColumns: { xs: "1fr", md: "repeat(3, minmax(0, 1fr))", xl: "repeat(6, minmax(0, 1fr))" },
          }}
        >
          {STAGES.map((stage) => (
            <Box key={stage}>
              <Box sx={{ p: 2, bgcolor: "#f8fafc", borderRadius: 3, border: "1px solid #e2e8f0", minHeight: 110 }}>
                <Typography sx={{ fontWeight: 700 }}>{CRM_STAGE_LABELS[stage]}</Typography>
                <Typography variant="h4" sx={{ fontWeight: 900, mt: 1 }}>{stageMap[stage] || 0}</Typography>
              </Box>
            </Box>
          ))}
        </Box>
      </Paper>

      <Box
        sx={{
          display: "grid",
          gap: 3,
          gridTemplateColumns: { xs: "1fr", lg: "minmax(320px, 0.95fr) minmax(0, 1.45fr)" },
        }}
      >
        <Box>
          <Paper sx={{ p: 2.5, borderRadius: 3, height: "100%" }}>
            <Typography variant="h6" sx={{ fontWeight: 800, mb: 2 }}>Novo contato</Typography>
            <Stack spacing={1.5}>
              <TextField label="Nome" value={contactForm.name} onChange={(e) => setContactForm((prev) => ({ ...prev, name: e.target.value }))} />
              <TextField label="Celular" value={contactForm.phone} onChange={(e) => setContactForm((prev) => ({ ...prev, phone: e.target.value }))} />
              <TextField label="E-mail" value={contactForm.email} onChange={(e) => setContactForm((prev) => ({ ...prev, email: e.target.value }))} />
              <TextField label="Empresa" value={contactForm.company} onChange={(e) => setContactForm((prev) => ({ ...prev, company: e.target.value }))} />
              <TextField label="Interesse no serviço" value={contactForm.interestService} onChange={(e) => setContactForm((prev) => ({ ...prev, interestService: e.target.value }))} />
              <TextField label="Origem" value={contactForm.source} onChange={(e) => setContactForm((prev) => ({ ...prev, source: e.target.value }))} />
              <TextField label="Notas" multiline minRows={3} value={contactForm.notes} onChange={(e) => setContactForm((prev) => ({ ...prev, notes: e.target.value }))} />
              <Button variant="contained" onClick={handleCreateContact} disabled={saving}>
                {saving ? "Salvando..." : "Salvar contato"}
              </Button>
            </Stack>
          </Paper>
        </Box>

        <Box>
          <Paper sx={{ p: 2.5, borderRadius: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 800, mb: 2 }}>Contatos e pipeline</Typography>
            <Stack spacing={1.5}>
              {contacts.map((contact) => (
                <Box key={contact.id} sx={{ p: 2, border: "1px solid #e2e8f0", borderRadius: 3 }}>
                  <Stack direction={{ xs: "column", md: "row" }} spacing={1.5} sx={{ justifyContent: "space-between" }}>
                    <Box>
                      <Typography sx={{ fontWeight: 800 }}>{contact.name || "Sem nome"}</Typography>
                      <Typography sx={{ fontSize: 13 }} color="text.secondary">
                        {contact.phone} {contact.email ? `• ${contact.email}` : ""} {contact.interestService ? `• ${contact.interestService}` : ""}
                      </Typography>
                    </Box>
                    <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                      <Chip label={CRM_STAGE_LABELS[contact.stage] || contact.stage} color={contact.stage === "WON" ? "success" : contact.stage === "LOST" ? "error" : "default"} />
                      <Select
                        size="small"
                        value={contact.stage}
                        onChange={(e) => updateStage(contact.id, e.target.value)}
                      >
                        {STAGES.map((stage) => (
                          <MenuItem key={stage} value={stage}>{CRM_STAGE_LABELS[stage]}</MenuItem>
                        ))}
                      </Select>
                      <Button variant={selectedContactId === contact.id ? "contained" : "outlined"} onClick={() => setSelectedContactId(contact.id)}>
                        Atender
                      </Button>
                    </Stack>
                  </Stack>
                  <Typography sx={{ mt: 1, fontSize: 13 }} color="text.secondary">
                    Último contato: {contact.lastContactAt ? new Date(contact.lastContactAt).toLocaleString("pt-BR") : "Ainda não registrado"}
                  </Typography>
                </Box>
              ))}
            </Stack>
          </Paper>
        </Box>
      </Box>

      <Box
        sx={{
          display: "grid",
          gap: 3,
          gridTemplateColumns: { xs: "1fr", lg: "repeat(2, minmax(0, 1fr))" },
        }}
      >
        <Box>
          <Paper sx={{ p: 2.5, borderRadius: 3, height: "100%" }}>
            <Typography variant="h6" sx={{ fontWeight: 800, mb: 2 }}>Histórico do contato</Typography>
            {!selectedContact ? (
              <Typography color="text.secondary">Selecione um contato para ver o histórico.</Typography>
            ) : (
              <Stack spacing={1.5}>
                <Typography sx={{ fontWeight: 700 }}>
                  {selectedContact.name || "Sem nome"} • {selectedContact.phone}
                </Typography>
                <TextField
                  label="Registrar interação"
                  multiline
                  minRows={3}
                  value={activityNote}
                  onChange={(e) => setActivityNote(e.target.value)}
                />
                <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap" }}>
                  <Button variant="outlined" onClick={() => registerActivity("CALL")}>Registrar ligação</Button>
                  <Button variant="outlined" onClick={() => registerActivity("WHATSAPP")}>Registrar WhatsApp</Button>
                  <Button variant="outlined" onClick={() => registerActivity("MEETING")}>Registrar reunião</Button>
                </Stack>
                <TextField
                  label="Nova tarefa"
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                />
                <Button variant="contained" onClick={createTask}>Criar tarefa</Button>
                <Divider />
                <Stack spacing={1}>
                  {(selectedContact.activities || []).map((activity) => (
                    <Box key={activity.id} sx={{ p: 1.5, bgcolor: "#f8fafc", borderRadius: 2 }}>
                      <Typography sx={{ fontWeight: 700, fontSize: 13 }}>{activity.type}</Typography>
                      <Typography sx={{ fontSize: 14 }}>{activity.content}</Typography>
                      <Typography sx={{ fontSize: 12 }} color="text.secondary">
                        {new Date(activity.happenedAt).toLocaleString("pt-BR")}
                      </Typography>
                    </Box>
                  ))}
                </Stack>
                <Divider />
                <Stack spacing={1}>
                  {(selectedContact.tasks || []).map((task) => (
                    <Box key={task.id} sx={{ p: 1.5, bgcolor: "#fff7ed", borderRadius: 2 }}>
                      <Typography sx={{ fontWeight: 700, fontSize: 13 }}>Tarefa</Typography>
                      <Typography sx={{ fontSize: 14 }}>{task.title}</Typography>
                      <Typography sx={{ fontSize: 12 }} color="text.secondary">
                        {task.status} {task.dueAt ? `• ${new Date(task.dueAt).toLocaleString("pt-BR")}` : ""}
                      </Typography>
                    </Box>
                  ))}
                </Stack>
              </Stack>
            )}
          </Paper>
        </Box>

        <Box>
          <Paper sx={{ p: 2.5, borderRadius: 3, height: "100%" }}>
            <Typography variant="h6" sx={{ fontWeight: 800, mb: 2 }}>Atendente IA</Typography>
            <Typography sx={{ fontSize: 13, mb: 2 }} color="text.secondary">
              Responde apenas sobre automação, agentes de IA, RAG, WhatsApp, Evolution API e integrações.
            </Typography>
            {!selectedContact ? (
              <Typography color="text.secondary">Selecione um contato para testar o atendimento.</Typography>
            ) : (
              <Stack spacing={1.5}>
                <TextField
                  label="Pergunta do lead"
                  multiline
                  minRows={4}
                  value={assistantMessage}
                  onChange={(e) => setAssistantMessage(e.target.value)}
                />
                <Button variant="contained" onClick={askAssistant} disabled={assistantLoading}>
                  {assistantLoading ? "Gerando resposta..." : "Gerar resposta com IA"}
                </Button>
                <Divider />
                <Stack spacing={1}>
                  {(conversation?.messages || []).map((message) => (
                    <Box
                      key={message.id}
                      sx={{
                        p: 1.5,
                        borderRadius: 2,
                        bgcolor: message.role === "assistant" ? "#ecfeff" : "#f8fafc",
                        border: `1px solid ${message.guardrailTriggered ? "#fca5a5" : "#dbeafe"}`,
                      }}
                    >
                      <Typography sx={{ fontWeight: 700, fontSize: 13 }}>
                        {message.role === "assistant" ? "IA/Atendente" : "Lead"}
                      </Typography>
                      <Typography sx={{ fontSize: 14 }}>{message.content}</Typography>
                    </Box>
                  ))}
                </Stack>
              </Stack>
            )}
          </Paper>
        </Box>
      </Box>

      <Paper sx={{ p: 2.5, borderRadius: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 800, mb: 2 }}>Atividades recentes</Typography>
        <Stack spacing={1.25}>
          {(dashboard?.recentActivities || []).map((activity) => (
            <Box key={activity.id} sx={{ p: 1.5, border: "1px solid #e2e8f0", borderRadius: 2 }}>
              <Typography sx={{ fontWeight: 700, fontSize: 13 }}>
                {activity.contact.name || activity.contact.phone} • {activity.type}
              </Typography>
              <Typography>{activity.subject || activity.content}</Typography>
              <Typography sx={{ fontSize: 12 }} color="text.secondary">
                {new Date(activity.happenedAt).toLocaleString("pt-BR")}
              </Typography>
            </Box>
          ))}
        </Stack>
      </Paper>
    </Stack>
  );
}
