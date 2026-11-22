import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { NewsletterEditor } from "@/components/newsletter/NewsletterEditor";
import { PageHead } from "@/components/ui/form";
import { getCurrentStaff } from "@/lib/auth";
import { brevoConfig } from "@/lib/brevo";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Buat buletin" };
// Pengiriman menunggu impor penerima di Brevo; beri waktu lebih panjang
export const maxDuration = 60;

export default async function NewNewsletterPage() {
  const staff = await getCurrentStaff();
  if (!staff) redirect("/login?error=akses");
  if (staff.role !== "super_admin") redirect("/");

  const supabase = await createClient();
  const { count } = await supabase
    .from("subscribers")
    .select("id", { count: "exact", head: true })
    .eq("status", "active");

  return (
    <>
      <PageHead
        title="Buat buletin"
        subtitle="Tulis isi email, lihat pratinjau, lalu kirim atau jadwalkan."
      />
      <NewsletterEditor
        data={{
          id: null,
          subject: "",
          preheader: "",
          body_html: "",
          status: "draft",
          scheduled_local: "",
          scheduled_label: "",
          sent_label: "",
          recipient_count: null,
          last_error: null,
        }}
        activeCount={count ?? 0}
        staffEmail={staff.email}
        brevoReady={Boolean(brevoConfig())}
        stats={null}
      />
    </>
  );
}
