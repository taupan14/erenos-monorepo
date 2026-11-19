import Link from "next/link";
import { currentMonth, monthLabel, shiftMonth } from "@/lib/month";

const BTN = "inline-flex h-11 items-center rounded-lg border border-line bg-white px-4 text-sm font-medium hover:bg-soft";

export function MonthNav({ month }: { month: string }) {
  const hasNext = month < currentMonth();
  return (
    <div className="flex items-center gap-2">
      <Link href={`/?bulan=${shiftMonth(month, -1)}`} className={BTN} aria-label="Bulan sebelumnya">
        ←
      </Link>
      <span className="min-w-36 text-center text-sm font-semibold capitalize">{monthLabel(month)}</span>
      {hasNext ? (
        <Link href={`/?bulan=${shiftMonth(month, 1)}`} className={BTN} aria-label="Bulan berikutnya">
          →
        </Link>
      ) : (
        <span aria-hidden="true" className={`${BTN} opacity-40`}>
          →
        </span>
      )}
    </div>
  );
}
