import sanitizeHtml from "sanitize-html";

export type EmailSchool = {
  name: string;
  address: string | null;
  phone: string | null;
  email: string | null;
  hours: string | null;
  logoUrl: string | null;
  websiteUrl: string | null;
  socials: { label: string; url: string }[];
};

const C = {
  deep: "#14295A",
  primary: "#2F55A4",
  accent: "#E0AE2E",
  soft: "#EEF3FB",
  ink: "#1A2540",
  muted: "#4A5672",
  line: "#DCE5F5",
};
const SANS = "Arial, Helvetica, sans-serif";
const SERIF = "Georgia, 'Times New Roman', serif";

const esc = (s: string) =>
  s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

// Gaya inline per tag (klien email tidak mendukung CSS eksternal)
const STYLE: Record<string, string> = {
  p: `margin:0 0 16px;font:400 16px/1.65 ${SANS};color:${C.ink};`,
  h2: `margin:28px 0 12px;font:700 24px/1.3 ${SERIF};color:${C.deep};`,
  h3: `margin:24px 0 10px;font:700 20px/1.35 ${SERIF};color:${C.deep};`,
  h4: `margin:20px 0 8px;font:700 17px/1.4 ${SANS};color:${C.deep};`,
  ul: `margin:0 0 16px;padding-left:22px;font:400 16px/1.65 ${SANS};color:${C.ink};`,
  ol: `margin:0 0 16px;padding-left:22px;font:400 16px/1.65 ${SANS};color:${C.ink};`,
  li: `margin:0 0 6px;`,
  blockquote: `margin:20px 0;padding:4px 0 4px 18px;border-left:4px solid ${C.accent};font:italic 400 18px/1.55 ${SERIF};color:${C.deep};`,
  hr: `border:0;border-top:1px solid ${C.line};margin:24px 0;`,
  img: `display:block;max-width:100%;height:auto;border:0;border-radius:12px;margin:18px 0;`,
  a: `color:${C.primary};text-decoration:underline;`,
};

const BODY_OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: [
    "p",
    "br",
    "strong",
    "b",
    "em",
    "i",
    "u",
    "s",
    "a",
    "ul",
    "ol",
    "li",
    "h2",
    "h3",
    "h4",
    "blockquote",
    "hr",
    "img",
  ],
  allowedAttributes: {
    ...Object.fromEntries(Object.keys(STYLE).map((t) => [t, ["style"]])),
    a: ["href", "title", "target", "rel", "style"],
    img: ["src", "alt", "width", "height", "style"],
  },
  allowedSchemes: ["https", "http", "mailto", "tel"],
  allowedSchemesByTag: { img: ["https", "http"] },
  allowProtocolRelative: false,
  parseStyleAttributes: false,
  transformTags: Object.fromEntries(
    Object.entries(STYLE).map(([tag, style]) => [
      tag,
      (t: string, attribs: sanitizeHtml.Attributes) => ({
        tagName: t,
        attribs: {
          ...attribs,
          style,
          ...(tag === "a"
            ? { target: "_blank", rel: "noopener noreferrer" }
            : {}),
        },
      }),
    ]),
  ),
};

/** Menyaring HTML dari editor lalu memberi gaya inline agar tampil benar di klien email. */
export function cleanBody(html: string): string {
  return sanitizeHtml(html, BODY_OPTIONS);
}

/**
 * Menyusun email lengkap: header (logo, nama, alamat, telepon), isi, dan footer dengan tombol berhenti berlangganan.
 * unsubscribeHref: "{{ unsubscribe }}" saat dikirim lewat Brevo; "#" untuk pratinjau/uji.
 */
export function renderNewsletter(p: {
  subject: string;
  preheader?: string | null;
  bodyHtml: string;
  school: EmailSchool;
  unsubscribeHref: string;
}): string {
  const s = p.school;
  const body = cleanBody(p.bodyHtml);

  const logo = s.logoUrl
    ? `<td width="72" valign="middle" style="padding-right:16px;"><table role="presentation" cellpadding="0" cellspacing="0"><tr><td style="background:#ffffff;border-radius:12px;padding:6px;"><img src="${esc(s.logoUrl)}" width="48" alt="" style="display:block;border:0;height:auto;"></td></tr></table></td>`
    : "";

  const headerLines = [
    s.address
      ? `<div style="font:400 13px/1.5 ${SANS};color:#C9D7F2;margin-top:6px;">${esc(s.address)}</div>`
      : "",
    s.phone
      ? `<div style="font:400 13px/1.5 ${SANS};color:#C9D7F2;">Telp. ${esc(s.phone)}</div>`
      : "",
  ].join("");

  const links = [
    s.websiteUrl
      ? `<a href="${esc(s.websiteUrl)}" style="color:${C.primary};text-decoration:underline;">Website</a>`
      : "",
    ...s.socials.map(
      (x) =>
        `<a href="${esc(x.url)}" style="color:${C.primary};text-decoration:underline;">${esc(x.label)}</a>`,
    ),
  ]
    .filter(Boolean)
    .join(" &nbsp;·&nbsp; ");

  const footerInfo = [
    s.address ? esc(s.address) : "",
    [s.phone ? `Telp. ${esc(s.phone)}` : "", s.email ? esc(s.email) : ""]
      .filter(Boolean)
      .join(" · "),
    s.hours ? esc(s.hours) : "",
  ]
    .filter(Boolean)
    .join("<br>");

  return `<!doctype html>
<html lang="id"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="x-apple-disable-message-reformatting"><title>${esc(p.subject)}</title>
<style>@media (max-width:620px){.px{padding-left:20px!important;padding-right:20px!important}}</style></head>
<body style="margin:0;padding:0;background:${C.soft};">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${esc(p.preheader ?? "")}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.soft};"><tr><td align="center" style="padding:24px 12px;">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:100%;max-width:600px;background:#ffffff;border-radius:16px;overflow:hidden;">
<tr><td class="px" style="background:${C.deep};padding:22px 28px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>${logo}<td valign="middle"><div style="font:700 22px/1.25 ${SERIF};color:#ffffff;">${esc(s.name)}</div>${headerLines}</td></tr></table>
</td></tr>
<tr><td style="height:4px;line-height:4px;font-size:0;background:${C.accent};">&nbsp;</td></tr>
<tr><td class="px" style="padding:32px 28px 12px;">${body}</td></tr>
<tr><td class="px" style="background:${C.soft};padding:28px;text-align:center;">
<p style="margin:0 0 14px;font:400 13px/1.6 ${SANS};color:${C.muted};">Anda menerima email ini karena mendaftar buletin ${esc(s.name)}.</p>
<a href="${p.unsubscribeHref}" style="display:inline-block;padding:12px 24px;border:1px solid ${C.deep};border-radius:999px;font:700 13px/1 ${SANS};color:${C.deep};text-decoration:none;">Berhenti berlangganan</a>
${links ? `<p style="margin:20px 0 0;font:400 13px/1.6 ${SANS};">${links}</p>` : ""}
${footerInfo ? `<p style="margin:16px 0 0;font:400 12px/1.6 ${SANS};color:${C.muted};">${footerInfo}</p>` : ""}
<p style="margin:12px 0 0;font:400 12px/1.6 ${SANS};color:${C.muted};">&copy; ${new Date().getFullYear()} ${esc(s.name)}</p>
</td></tr>
</table></td></tr></table></body></html>`;
}
