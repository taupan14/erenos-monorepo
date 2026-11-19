import { redirect } from "next/navigation";
import { AppHeader } from "@/components/layout/AppHeader";
import { getCurrentStaff } from "@/lib/auth";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const staff = await getCurrentStaff();
  // Sudah login tetapi bukan staf aktif (proxy hanya memeriksa sesi)
  if (!staff) redirect("/login?error=akses");

  return (
    <>
      <AppHeader staff={staff} />
      <main className="mx-auto max-w-[1200px] px-4 py-8 sm:px-10 sm:py-10">{children}</main>
    </>
  );
}
