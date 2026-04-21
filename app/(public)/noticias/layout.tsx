import PublicNavbar from "@/components/PublicNavbar";

export default function NoticiasLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-white text-gray-900 min-h-screen">
      <PublicNavbar>
        {children}
      </PublicNavbar>
    </div>
  );
}
