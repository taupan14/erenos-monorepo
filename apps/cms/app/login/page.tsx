import type { Metadata } from "next";
import Image from "next/image";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/auth/LoginForm";
import { getCurrentStaff, safeNext } from "@/lib/auth";

export const metadata: Metadata = { title: "Masuk" };

type Props = { searchParams: Promise<{ next?: string; error?: string }> };

export default async function LoginPage({ searchParams }: Props) {
  const { next, error } = await searchParams;
  const target = safeNext(next);

  // Sudah login sebagai staf aktif: tidak perlu melihat halaman masuk
  if (await getCurrentStaff()) redirect(target);

  return (
    <main className="grid min-h-screen place-items-center px-4 py-10">
      <div className="w-full max-w-md rounded-2xl border border-line bg-white p-8 shadow-[0_12px_32px_rgba(20,41,90,0.08)]">
        <div className="flex flex-col items-center text-center">
          <Image
            src="/logo-erenos.png"
            alt=""
            width={191}
            height={240}
            priority
            className="h-20 w-auto"
          />
          <h1 className="mt-4 font-serif text-2xl font-semibold text-deep">Erenos CMS</h1>
          <p className="mt-1 text-sm text-muted">Masuk untuk mengelola konten website sekolah.</p>
        </div>
        {error === "akses" && (
          <p role="alert" className="mt-4 rounded-lg bg-soft p-3 text-sm text-ink">
            Akun ini tidak memiliki akses CMS atau sedang dinonaktifkan.
          </p>
        )}
        <LoginForm next={target} />
      </div>
    </main>
  );
}
