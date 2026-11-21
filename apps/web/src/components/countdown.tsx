"use client";

import { useEffect, useState } from "react";
import { formatRemaining, phaseFor } from "@/lib/room";

export function Countdown({
  deadline,
  checkinDeadline,
  serverNow,
}: {
  deadline: string;
  checkinDeadline: string;
  serverNow: string;
}) {
  const serverNowMs = Date.parse(serverNow);
  // Elapsed time comes from a monotonic client clock, so a skewed or changed
  // system clock cannot move the shared deadline. The absolute client clock is
  // never used for room state.
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const started = performance.now();
    const tick = () => setElapsed(performance.now() - started);
    const kick = setTimeout(tick, 0);
    const timer = setInterval(tick, 1000);
    return () => {
      clearTimeout(kick);
      clearInterval(timer);
    };
  }, [serverNowMs]);

  const now = serverNowMs + elapsed;
  const phase = phaseFor(deadline, checkinDeadline, now);
  const remaining = Math.max(0, Date.parse(deadline) - now);

  return (
    <div>
      <p className="flex items-center gap-2 text-sm font-semibold text-white/80">
        <span className="size-2.5 rounded-full bg-violet" aria-hidden="true" />
        {phase === "studying"
          ? "Studying together"
          : phase === "checkin"
            ? "Round over · check in"
            : "Round closed"}
      </p>
      <p className="tabular mt-2 text-5xl font-semibold sm:text-6xl">
        {formatRemaining(remaining)}
      </p>
      <p className="mt-2 text-sm text-white/70">
        {phase === "studying"
          ? "Shared server deadline. Reload or reconnect and you stay in this round."
          : phase === "checkin"
            ? `Check-in closes in ${formatRemaining(Date.parse(checkinDeadline) - now)}.`
            : "The check-in window for this round has closed."}
      </p>
    </div>
  );
}
