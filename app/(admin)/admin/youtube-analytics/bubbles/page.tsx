import ClientBubblesPage from "./ClientBubblesPage";

export const dynamic = "force-dynamic";

export default function BubblesPage({
  searchParams,
}: {
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  const raw = searchParams?.categoryId;
  const categoryId = Array.isArray(raw) ? raw[0] : raw;
  return <ClientBubblesPage categoryId={categoryId} />;
}

