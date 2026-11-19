import type { Metadata } from "next";
import Link from "next/link";
import { PageHead } from "@/components/ui/form";

export const metadata: Metadata = { title: "Konten" };

const MODULES = [
  { href: "/konten/halaman", title: "Halaman statis", text: "Tentang, visi-misi, sambutan, sejarah, nilai" },
  { href: "/konten/hero", title: "Hero Beranda", text: "Slide utama di beranda" },
  { href: "/konten/jenjang", title: "Jenjang", text: "KB–TK, SD, SMP, SMA" },
  { href: "/konten/fasilitas", title: "Fasilitas", text: "Ruang dan sarana sekolah" },
  { href: "/konten/berita", title: "Berita", text: "Berita, kegiatan, dan kategori" },
  { href: "/konten/galeri", title: "Galeri", text: "Album foto kegiatan" },
];

export default function ContentHubPage() {
  return (
    <>
      <PageHead title="Konten" subtitle="Pilih bagian yang ingin dikelola." />
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {MODULES.map((m) => (
          <li key={m.href} className="rounded-2xl border border-line bg-white p-5">
            <h2 className="font-serif text-xl font-semibold text-deep">{m.title}</h2>
            <p className="mb-4 mt-1 text-sm text-muted">{m.text}</p>
            <Link href={m.href} className="rounded-full bg-soft px-3 py-1.5 text-xs font-semibold text-primary">
              Kelola →
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}
