import { SocialIcon } from "@/components/ui/SocialIcon";
import { whatsappHref } from "@/lib/whatsapp";

/** Tombol chat WhatsApp melayang di kanan bawah. Tidak tampil bila nomor WhatsApp belum diisi di CMS. */
export function WhatsAppButton({
  phone,
  label,
  text,
}: {
  phone: string | null | undefined;
  label: string;
  text: string;
}) {
  const href = whatsappHref(phone, text);
  if (!href) return null;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className="group fixed bottom-[max(1.25rem,env(safe-area-inset-bottom))] right-[max(1.25rem,env(safe-area-inset-right))] z-40 flex items-center rounded-full bg-[#128c7e] p-4 text-white shadow-[0_10px_24px_rgba(7,94,84,0.4)] transition duration-300 hover:bg-[#075e54] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#075e54] motion-reduce:transition-none print:hidden"
    >
      <SocialIcon name="whatsapp" size={28} />
      <span
        aria-hidden="true"
        className="ml-0 hidden max-w-0 overflow-hidden whitespace-nowrap text-sm font-semibold opacity-0 transition-all duration-300 group-hover:ml-3 group-hover:max-w-[200px] group-hover:opacity-100 group-focus-visible:ml-3 group-focus-visible:max-w-[200px] group-focus-visible:opacity-100 md:inline-block motion-reduce:transition-none"
      >
        {label}
      </span>
    </a>
  );
}
