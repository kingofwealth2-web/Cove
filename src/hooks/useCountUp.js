import { useState, useEffect } from "react";

/**
 * Animates a number from 0 to `target` over `duration` ms,
 * with an optional `delay` before starting.
 * Re-runs whenever `target`, `duration`, `delay`, or anything in `deps` changes.
 */
export function useCountUp(target, duration = 700, delay = 0, deps = []) {
  const [val, setVal] = useState(0);

  useEffect(() => {
    setVal(0);
    const t = setTimeout(() => {
      const start = performance.now();
      const tick = (now) => {
        const p = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - p, 3); // ease-out cubic
        setVal(Math.round(eased * target));
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }, delay);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target, duration, delay, ...deps]);

  return val;
}
