import type { Metadata } from "next";
import { RecordEditorPage } from "@/components/content/RecordEditorPage";

export const metadata: Metadata = { title: "Tambah album" };

export default function NewPage() {
  return <RecordEditorPage entity="gallery" />;
}
