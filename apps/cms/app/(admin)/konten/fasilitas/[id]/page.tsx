import type { Metadata } from "next";
import { RecordEditorPage } from "@/components/content/RecordEditorPage";

export const metadata: Metadata = { title: "Ubah fasilitas" };

type Props = { params: Promise<{ id: string }>; searchParams: Promise<{ tersimpan?: string }> };

export default async function EditPage({ params, searchParams }: Props) {
  const { id } = await params;
  const { tersimpan } = await searchParams;
  return <RecordEditorPage entity="facility" id={id} saved={tersimpan === "1"} />;
}
