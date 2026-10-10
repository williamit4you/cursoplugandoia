import type { Metadata } from "next";
import { RabbitMqCourseLandingV2 } from "@/components/course-sales/RabbitMqCourseLandingV2";
import { resolveSalesPageMetaPixelId } from "@/lib/salesPagePixel";

const pageKey = "curso-rabbitmq";
const checkoutUrl =
  process.env.NEXT_PUBLIC_RABBITMQ_CHECKOUT_URL ??
  "https://pay.hotmart.com/V107737859J?checkoutMode=10";

// O ID padrão abaixo corresponde a https://youtu.be/Y_JYPX30DVM.
// A variável de ambiente permite substituir o vídeo futuramente sem alterar o código.
const youtubeVideoId =
  process.env.NEXT_PUBLIC_RABBITMQ_YOUTUBE_VIDEO_ID?.trim() ?? "Y_JYPX30DVM";
const safeYoutubeVideoId =
  youtubeVideoId && /^[a-zA-Z0-9_-]{6,20}$/.test(youtubeVideoId)
    ? youtubeVideoId
    : undefined;

export const metadata: Metadata = {
  title: "Curso de RabbitMQ com .NET — Do Zero ao Projeto Prático | Plugando IA",
  description:
    "Aprenda RabbitMQ com C# e .NET na prática: Exchanges, ACK/NACK, Retry, Dead Letter Queue, idempotência, Docker, Prometheus e Grafana em um projeto de e-commerce.",
  keywords: [
    "RabbitMQ com .NET",
    "curso RabbitMQ",
    "mensageria com .NET",
    "RabbitMQ C#",
    "RabbitMQ Docker",
    "Retry RabbitMQ",
    "Dead Letter Queue RabbitMQ",
    "Prometheus RabbitMQ",
    "Grafana RabbitMQ",
  ],
  alternates: { canonical: "/curso-rabbitmq" },
  openGraph: {
    title: "RabbitMQ com .NET — Do Zero ao Projeto Prático",
    description:
      "Aprenda mensageria construindo, quebrando e recuperando um e-commerce completo.",
    type: "website",
    locale: "pt_BR",
    url: "/curso-rabbitmq",
  },
};

export default async function CursoRabbitmqPage() {
  const metaPixelId = await resolveSalesPageMetaPixelId(pageKey, {
    preferEnvFallback: true,
  });

  return (
    <RabbitMqCourseLandingV2
      checkoutUrl={checkoutUrl}
      metaPixelId={metaPixelId || undefined}
      youtubeVideoId={safeYoutubeVideoId}
    />
  );
}
