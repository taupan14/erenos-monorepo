"use client";

import { useState } from "react";
import { EditorContent, useEditor, type Editor } from "@tiptap/react";
import Image from "@tiptap/extension-image";
import StarterKit from "@tiptap/starter-kit";
import { MediaPickDialog } from "@/components/media/MediaPickDialog";
import { mediaPublicUrl } from "@/lib/media";

/**
 * Editor rich-text (Tiptap). Hanya memakai format yang diizinkan sanitizer website:
 * h2–h4, tebal/miring/garis bawah, daftar, kutipan, tautan, gambar. HTML dikirim lewat <input hidden>.
 */
export function RichEditor({
  name,
  initialHtml,
  onChange,
}: {
  name: string;
  initialHtml: string;
  /** Dipanggil setiap isi berubah (mis. untuk pratinjau langsung). */
  onChange?: (html: string) => void;
}) {
  const [html, setHtml] = useState(initialHtml);
  const [pickOpen, setPickOpen] = useState(false);

  const editor = useEditor({
    immediatelyRender: false,
    shouldRerenderOnTransaction: true,
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3, 4] },
        link: { openOnClick: false, autolink: false },
        code: false,
        codeBlock: false,
      }),
      Image,
    ],
    content: initialHtml,
    editorProps: {
      attributes: {
        class:
          "editor-content min-h-[280px] rounded-b-lg border border-line bg-white p-4 outline-none focus:border-primary",
        "aria-label": "Isi",
      },
    },
    onUpdate: ({ editor: e }) => {
      const next = e.isEmpty ? "" : e.getHTML();
      setHtml(next);
      onChange?.(next);
    },
  });

  function setLink(e: Editor) {
    const prev = (e.getAttributes("link").href as string | undefined) ?? "";
    const url = window.prompt(
      "Alamat tautan (kosongkan untuk menghapus)",
      prev,
    );
    if (url === null) return;
    const v = url.trim();
    if (v === "") {
      e.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    if (!/^(https?:\/\/|mailto:|tel:)/i.test(v)) {
      window.alert("Tautan harus diawali https://, http://, mailto: atau tel:");
      return;
    }
    e.chain().focus().extendMarkRange("link").setLink({ href: v }).run();
  }

  const tools = editor
    ? [
        {
          label: "B",
          title: "Tebal",
          active: editor.isActive("bold"),
          run: () => editor.chain().focus().toggleBold().run(),
          cls: "font-bold",
        },
        {
          label: "I",
          title: "Miring",
          active: editor.isActive("italic"),
          run: () => editor.chain().focus().toggleItalic().run(),
          cls: "italic",
        },
        {
          label: "U",
          title: "Garis bawah",
          active: editor.isActive("underline"),
          run: () => editor.chain().focus().toggleUnderline().run(),
          cls: "underline",
        },
        {
          label: "H2",
          title: "Judul bagian",
          active: editor.isActive("heading", { level: 2 }),
          run: () => editor.chain().focus().toggleHeading({ level: 2 }).run(),
          cls: "",
        },
        {
          label: "H3",
          title: "Sub judul",
          active: editor.isActive("heading", { level: 3 }),
          run: () => editor.chain().focus().toggleHeading({ level: 3 }).run(),
          cls: "",
        },
        {
          label: "• Daftar",
          title: "Daftar poin",
          active: editor.isActive("bulletList"),
          run: () => editor.chain().focus().toggleBulletList().run(),
          cls: "",
        },
        {
          label: "1. Daftar",
          title: "Daftar bernomor",
          active: editor.isActive("orderedList"),
          run: () => editor.chain().focus().toggleOrderedList().run(),
          cls: "",
        },
        {
          label: "Kutipan",
          title: "Kutipan",
          active: editor.isActive("blockquote"),
          run: () => editor.chain().focus().toggleBlockquote().run(),
          cls: "",
        },
        {
          label: "Tautan",
          title: "Tautan",
          active: editor.isActive("link"),
          run: () => setLink(editor),
          cls: "",
        },
        {
          label: "Gambar",
          title: "Sisipkan gambar dari Media",
          active: false,
          run: () => setPickOpen(true),
          cls: "",
        },
      ]
    : [];

  return (
    <div>
      <input type="hidden" name={name} value={html} />
      <div
        role="toolbar"
        aria-label="Format teks"
        className="flex flex-wrap gap-1 rounded-t-lg border border-b-0 border-line bg-soft p-1.5"
      >
        {tools.map((t) => (
          <button
            key={t.label}
            type="button"
            title={t.title}
            aria-pressed={t.active}
            onClick={t.run}
            className={`h-9 min-w-9 rounded-md px-2.5 text-sm ${t.cls} ${t.active ? "bg-primary text-white" : "text-ink hover:bg-white"}`}
          >
            {t.label}
          </button>
        ))}
      </div>
      <EditorContent editor={editor} />
      <MediaPickDialog
        open={pickOpen}
        onClose={() => setPickOpen(false)}
        onPick={(m) => {
          editor
            ?.chain()
            .focus()
            .setImage({ src: mediaPublicUrl(m.path), alt: m.alt_text ?? "" })
            .run();
          setPickOpen(false);
        }}
      />
    </div>
  );
}
