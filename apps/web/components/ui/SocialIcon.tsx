/** Ikon media sosial bergaya garis (selaras dengan Icon.tsx). Warna mengikuti `currentColor`. */
const PATHS = {
  facebook: (
    <path d="M15 3h-2.5A4.5 4.5 0 0 0 8 7.5V10H5.5v4H8v7h4v-7h2.8l.7-4H12V7.8c0-.5.3-.8.8-.8H15z" />
  ),
  instagram: (
    <>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="0.7" fill="currentColor" stroke="none" />
    </>
  ),
  youtube: (
    <>
      <rect x="2.5" y="5.5" width="19" height="13" rx="4" />
      <path d="M10 9.5v5l4.5-2.5z" />
    </>
  ),
  tiktok: (
    <>
      <path d="M14 4v10.5a3.5 3.5 0 1 1-3.5-3.5" />
      <path d="M14 4c.4 2.6 2.1 4.2 4.5 4.4" />
    </>
  ),
  whatsapp: (
    <>
      <path d="M12 3.5a8.5 8.5 0 0 0-7.3 12.9L3.5 20.5l4.2-1.1A8.5 8.5 0 1 0 12 3.5z" />
      <path d="M9.2 8.6c.3 3.2 3 5.9 6.2 6.2l1-1.6-2.1-1-.8.8c-1.2-.4-2.1-1.3-2.5-2.5l.8-.8-1-2.1z" />
    </>
  ),
} as const;

export type SocialIconName = keyof typeof PATHS;

export function SocialIcon({
  name,
  size = 24,
  className,
}: {
  name: SocialIconName;
  size?: number;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      {PATHS[name]}
    </svg>
  );
}
