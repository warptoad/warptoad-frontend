import { useEffect, useState } from "react";

function formatRemaining(deadline: number) {
  const diff = deadline * 1000 - Date.now();
  if (diff <= 0) return "expired";

  const totalSeconds = Math.floor(diff / 1000);
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;

  return `${h}h ${m}m ${s}s`;
}

export function Countdown({ deadline }: { deadline: number }) {
  const [remaining, setRemaining] = useState(formatRemaining(deadline));

  useEffect(() => {
    const id = setInterval(() => {
      const text = formatRemaining(deadline);
      setRemaining(text);
      if (text === "expired") clearInterval(id);
    }, 1000);
    return () => clearInterval(id);
  }, [deadline]);

  return <>{remaining}</>;
}
