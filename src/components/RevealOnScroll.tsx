"use client";

import { useRef, type ReactNode } from "react";
import { gsap, useGSAP } from "@/lib/gsap/client";

type Props = {
  children: ReactNode;
  className?: string;
  /** Segundos entre hijos directos */
  stagger?: number;
  /** Desplazamiento vertical inicial (px) */
  y?: number;
  /** ScrollTrigger start */
  start?: string;
  /** Re-animar si cambian dependencias (ej. idioma) */
  dependencies?: unknown[];
};

/**
 * Revela hijos directos al entrar en viewport. Una sola vez por visita.
 * Respeta prefers-reduced-motion. Solo transform + autoAlpha.
 */
export default function RevealOnScroll({
  children,
  className = "",
  stagger = 0.12,
  y = 44,
  start = "top 85%",
  dependencies = [],
}: Props) {
  const rootRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const root = rootRef.current;
      if (!root) return;

      const targets = Array.from(root.children) as HTMLElement[];
      if (!targets.length) return;

      const revealStatic = () => {
        gsap.set(targets, { autoAlpha: 1, y: 0 });
        root.classList.add("reveal-done");
      };

      const mm = gsap.matchMedia();

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.set(targets, { autoAlpha: 0, y });

        const tween = gsap.to(targets, {
          autoAlpha: 1,
          y: 0,
          duration: 0.75,
          stagger,
          ease: "power2.out",
          scrollTrigger: {
            trigger: root,
            start,
            once: true,
          },
          onComplete: () => {
            root.classList.add("reveal-done");
          },
        });

        return () => {
          tween.scrollTrigger?.kill();
          tween.kill();
        };
      });

      mm.add("(prefers-reduced-motion: reduce)", revealStatic);

      return () => {
        mm.revert();
      };
    },
    { scope: rootRef, dependencies, revertOnUpdate: dependencies.length > 0 }
  );

  return (
    <div ref={rootRef} className={`reveal-root ${className}`.trim()}>
      {children}
    </div>
  );
}
