import { notFound } from "next/navigation";

// Halaman yang belum ada → 404 bermerek (dengan header/footer sesuai bahasa)
export default function CatchAll() {
  notFound();
}
