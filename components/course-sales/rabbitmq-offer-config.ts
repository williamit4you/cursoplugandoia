export const rabbitMqOffer = {
  price: 79.9,
  priceLabel: "R$ 79,90",
  paymentLabel: "à vista — pagamento único",
  badge: "Oferta de lançamento",
  // Só preencha quando houver uma condição real e verificável.
  endsAt: null as string | null,
  promotionalBuyerLimit: null as number | null,
  remainingPromotionalPurchases: null as number | null,
} as const;

export type RabbitMqProjectImage = {
  src: string;
  alt: string;
  title: string;
  description: string;
};

// A galeria só é exibida quando houver capturas reais do projeto.
export const rabbitMqProjectImages: RabbitMqProjectImage[] = [];
