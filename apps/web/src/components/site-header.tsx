import Link from "next/link";
import { FocusxLockup } from "@/components/focusx-mark";

export function SiteHeader({ right }: { right?: React.ReactNode }) {
  return (
    <header className="border-b border-divider">
      <div className="mx-auto flex max-w-4xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
        <Link href="/" className="rounded-lg" aria-label="FocusX home">
          <FocusxLockup />
        </Link>
        {right ? (
          <div className="flex items-center gap-3 text-sm">{right}</div>
        ) : null}
      </div>
    </header>
  );
}
