-- CreateEnum
CREATE TYPE "CrmLeadStage" AS ENUM ('LEAD', 'CONTACTED', 'PROPOSAL_SENT', 'NEGOTIATION', 'WON', 'LOST');

-- CreateEnum
CREATE TYPE "CrmActivityType" AS ENUM ('CALL', 'WHATSAPP', 'EMAIL', 'MEETING', 'TASK', 'NOTE', 'SYSTEM');

-- CreateEnum
CREATE TYPE "CrmActivityDirection" AS ENUM ('INBOUND', 'OUTBOUND', 'INTERNAL');

-- CreateEnum
CREATE TYPE "CrmTaskStatus" AS ENUM ('OPEN', 'DONE', 'CANCELED');

-- CreateTable
CREATE TABLE "CrmSettings" (
    "id" TEXT NOT NULL,
    "whatsappEnabled" BOOLEAN NOT NULL DEFAULT false,
    "whatsappDisplayLabel" TEXT NOT NULL DEFAULT 'Falar no WhatsApp',
    "whatsappNumber" TEXT,
    "whatsappDefaultMessage" TEXT NOT NULL DEFAULT 'Olá! Quero falar sobre automação, agentes de IA e WhatsApp.',
    "evolutionEnabled" BOOLEAN NOT NULL DEFAULT false,
    "evolutionBaseUrl" TEXT,
    "evolutionApiKey" TEXT,
    "evolutionInstanceName" TEXT,
    "evolutionWebhookSecret" TEXT,
    "openAiModel" TEXT NOT NULL DEFAULT 'gpt-4o-mini',
    "assistantEnabled" BOOLEAN NOT NULL DEFAULT true,
    "assistantScope" TEXT NOT NULL DEFAULT 'Automação com n8n, agentes de IA, RAG, WhatsApp, Evolution API, integrações e implantação comercial.',
    "assistantSystemPrompt" TEXT NOT NULL DEFAULT 'Você é um atendente comercial da Plugando IA. Tire dúvidas apenas sobre automação, n8n, agentes de IA, RAG, WhatsApp, Evolution API, integrações, implantação e consultoria. Se o assunto sair desse escopo, recuse com educação, explique o escopo atendido e convide o lead a voltar ao tema comercial.',
    "defaultAssigneeUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CrmSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CrmContact" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "company" TEXT,
    "source" TEXT,
    "interestService" TEXT,
    "notes" TEXT,
    "stage" "CrmLeadStage" NOT NULL DEFAULT 'LEAD',
    "lastContactAt" TIMESTAMP(3),
    "ownerUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CrmContact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CrmActivity" (
    "id" TEXT NOT NULL,
    "contactId" TEXT NOT NULL,
    "type" "CrmActivityType" NOT NULL,
    "direction" "CrmActivityDirection" NOT NULL DEFAULT 'INTERNAL',
    "subject" TEXT,
    "content" TEXT NOT NULL,
    "happenedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "authorUserId" TEXT,
    "metadataJson" TEXT NOT NULL DEFAULT '{}',

    CONSTRAINT "CrmActivity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CrmTask" (
    "id" TEXT NOT NULL,
    "contactId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" "CrmTaskStatus" NOT NULL DEFAULT 'OPEN',
    "dueAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "assignedToUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CrmTask_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CrmConversation" (
    "id" TEXT NOT NULL,
    "contactId" TEXT NOT NULL,
    "channel" TEXT NOT NULL DEFAULT 'WHATSAPP',
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "externalThreadId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CrmConversation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CrmMessage" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "direction" "CrmActivityDirection" NOT NULL DEFAULT 'INTERNAL',
    "content" TEXT NOT NULL,
    "model" TEXT,
    "externalMessageId" TEXT,
    "guardrailTriggered" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CrmMessage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CrmContact_phone_key" ON "CrmContact"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "CrmContact_email_key" ON "CrmContact"("email");

-- CreateIndex
CREATE INDEX "CrmContact_stage_idx" ON "CrmContact"("stage");

-- CreateIndex
CREATE INDEX "CrmContact_ownerUserId_idx" ON "CrmContact"("ownerUserId");

-- CreateIndex
CREATE INDEX "CrmContact_createdAt_idx" ON "CrmContact"("createdAt");

-- CreateIndex
CREATE INDEX "CrmActivity_contactId_happenedAt_idx" ON "CrmActivity"("contactId", "happenedAt");

-- CreateIndex
CREATE INDEX "CrmActivity_type_idx" ON "CrmActivity"("type");

-- CreateIndex
CREATE INDEX "CrmTask_contactId_status_idx" ON "CrmTask"("contactId", "status");

-- CreateIndex
CREATE INDEX "CrmTask_assignedToUserId_idx" ON "CrmTask"("assignedToUserId");

-- CreateIndex
CREATE INDEX "CrmConversation_contactId_updatedAt_idx" ON "CrmConversation"("contactId", "updatedAt");

-- CreateIndex
CREATE INDEX "CrmMessage_conversationId_createdAt_idx" ON "CrmMessage"("conversationId", "createdAt");

-- AddForeignKey
ALTER TABLE "CrmSettings" ADD CONSTRAINT "CrmSettings_defaultAssigneeUserId_fkey" FOREIGN KEY ("defaultAssigneeUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CrmContact" ADD CONSTRAINT "CrmContact_ownerUserId_fkey" FOREIGN KEY ("ownerUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CrmActivity" ADD CONSTRAINT "CrmActivity_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "CrmContact"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CrmActivity" ADD CONSTRAINT "CrmActivity_authorUserId_fkey" FOREIGN KEY ("authorUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CrmTask" ADD CONSTRAINT "CrmTask_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "CrmContact"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CrmTask" ADD CONSTRAINT "CrmTask_assignedToUserId_fkey" FOREIGN KEY ("assignedToUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CrmConversation" ADD CONSTRAINT "CrmConversation_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "CrmContact"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CrmMessage" ADD CONSTRAINT "CrmMessage_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "CrmConversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
