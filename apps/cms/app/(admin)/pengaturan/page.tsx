import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import type { PickedMedia } from "@/components/media/MediaPicker";
import { SettingsForm } from "@/components/settings/SettingsForm";
import { PageHead } from "@/components/ui/form";
import { getCurrentStaff } from "@/lib/auth";
import { SECTIONS } from "@/lib/settings-fields";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Pengaturan" };

type Props = { searchParams: Promise<{ bagian?: string }> };

export default async function SettingsPage({ searchParams }: Props) {
  const staff = await getCurrentStaff();
  if (!staff) redirect("/login?error=akses");
  if (staff.role !== "super_admin") redirect("/");

  const { bagian } = await searchParams;
  const section = SECTIONS.find((s) => s.id === bagian) ?? SECTIONS[0]!;

  const supabase = await createClient();
  const { data: row, error } = await supabase.from("site_settings").select("*").eq("id", 1).maybeSingle();

  if (error || !row) {
    return (
      <>
        <PageHead title="Pengaturan" />
        <p className="text-sm text-red-700">
          {error ? `Gagal memuat pengaturan: ${error.message}` : "Baris pengaturan belum ada. Jalankan supabase/seed.sql di SQL Editor."}
        </p>
      </>
    );
  }

  const mediaIds = section.fields
    .filter((f) => f.kind === "media")
    .map((f) => row[f.name])
    .filter((v): v is string => typeof v === "string");
  const media: Record<string, PickedMedia> = {};
  if (mediaIds.length > 0) {
    const { data } = await supabase.from("media").select("id, path, alt_text").in("id", mediaIds);
    (data ?? []).forEach((m) => {
      media[String(m.id)] = m as PickedMedia;
    });
  }

  return (
    <>
      <PageHead title="Pengaturan" subtitle="Identitas, kontak, pendaftaran, SEO, dan statistik website." />
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
        <nav aria-label="Bagian pengaturan" className="rounded-2xl border border-line bg-white p-2 lg:w-60 lg:shrink-0">
          <ul>
            {SECTIONS.map((s) => (
              <li key={s.id}>
                <Link
                  href={`/pengaturan?bagian=${s.id}`}
                  aria-current={s.id === section.id ? "page" : undefined}
                  className={`block rounded-lg px-3 py-2.5 text-sm font-semibold ${s.id === section.id ? "bg-soft text-primary" : "text-muted hover:bg-soft"}`}
                >
                  {s.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <SettingsForm key={section.id} section={section} values={row} media={media} />
      </div>
    </>
  );
}
