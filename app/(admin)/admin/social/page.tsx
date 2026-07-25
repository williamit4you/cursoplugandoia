import { Suspense } from "react";
import PublicationsDashboard from "@/components/PublicationsDashboard";

function SocialPublicationsFallback() {
  return (
    <main className="min-h-screen bg-[#f6f8fc] px-3 py-4 text-slate-900 sm:px-5 lg:px-6">
      <section className="mx-auto max-w-[1720px]">
        <div className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="h-7 w-56 animate-pulse rounded-xl bg-slate-100" />
          <div className="mt-3 h-4 w-80 animate-pulse rounded-lg bg-slate-100" />
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="h-24 animate-pulse rounded-2xl border border-slate-100 bg-slate-50" />
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}

export default function SocialPage() {
  return (
    <Suspense fallback={<SocialPublicationsFallback />}>
      <PublicationsDashboard />
    </Suspense>
  );
}
