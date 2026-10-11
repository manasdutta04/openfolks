'use client';

import { useEffect, useId, useRef } from 'react';

/**
 * The OpenFolks mark as a character: the leaning white shape and two slanted
 * eyes from the app icon (public/openfolk.png), drawn from the same geometry.
 * The eyes follow the pointer, blink now and then, and the body rests with a
 * slow sway. All motion stops under prefers-reduced-motion.
 */
export function Mascot({
  size = 96,
  interactive = true,
  working = false,
  className = '',
  label = 'OpenFolks mascot',
}: {
  size?: number;
  interactive?: boolean;
  working?: boolean;
  className?: string;
  label?: string;
}) {
  const id = useId().replace(/:/g, '');
  const eyes = useRef<SVGGElement>(null);
  const root = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!interactive) return;
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let frame = 0;
    const move = (e: PointerEvent) => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const el = root.current;
        const g = eyes.current;
        if (!el || !g) return;
        const r = el.getBoundingClientRect();
        const dx = e.clientX - (r.left + r.width / 2);
        const dy = e.clientY - (r.top + r.height / 2);
        const dist = Math.hypot(dx, dy) || 1;
        const reach = Math.min(1, dist / 420);
        g.style.transform = `translate(${(dx / dist) * 62 * reach}px, ${(dy / dist) * 46 * reach}px)`;
      });
    };
    addEventListener('pointermove', move, { passive: true });
    return () => {
      removeEventListener('pointermove', move);
      cancelAnimationFrame(frame);
    };
  }, [interactive]);

  return (
    <svg
      ref={root}
      className={`mascot ${working ? 'mascot-working' : ''} ${className}`}
      width={size}
      height={size}
      viewBox="0 0 1024 1024"
      role="img"
      aria-label={label}
    >
      <defs>
        <linearGradient id={`${id}-body`} x1="0" y1="0" x2="0.35" y2="1">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="0.6" stopColor="#f1f1f3" />
          <stop offset="1" stopColor="#b9b9c0" />
        </linearGradient>
      </defs>
      <g className="mascot-body">
        <path
          d="M40 566C150 420 400 276 640 214C790 176 884 252 886 410C888 560 806 790 700 986C690 1004 676 1010 660 1010L150 1010C84 1010 40 960 40 890Z"
          fill={`url(#${id}-body)`}
        />
        <g ref={eyes} className="mascot-eyes">
          <g transform="rotate(-15 475 599)"><rect className="mascot-eye" x="416" y="499" width="118" height="200" rx="59" fill="#111113" /></g>
          <g transform="rotate(-15 682 550)"><rect className="mascot-eye" x="623" y="450" width="118" height="200" rx="59" fill="#111113" /></g>
        </g>
      </g>
    </svg>
  );
}
