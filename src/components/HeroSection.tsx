"use client";

import { useRef } from "react";
import Link from "next/link";
import { gsap, useGSAP } from "@/lib/gsap/client";
import SharePlatformButton from "@/components/SharePlatformButton";
import { useLanguage } from "@/lib/language";


export default function HeroSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);
  const glowInnerRef = useRef<HTMLDivElement>(null);
  const badgeRef = useRef<HTMLDivElement>(null);
  const titleLine1Ref = useRef<HTMLSpanElement>(null);
  const titleLine2Ref = useRef<HTMLSpanElement>(null);
  const quoteRef = useRef<HTMLParagraphElement>(null);
  const ornamentRef = useRef<HTMLDivElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);
  const { t, locale } = useLanguage();

  useGSAP(
    () => {
      const intro = [
        badgeRef.current,
        titleLine1Ref.current,
        titleLine2Ref.current,
        quoteRef.current,
        ornamentRef.current,
      ].filter(Boolean) as HTMLElement[];

      const ctas = ctaRef.current
        ? (Array.from(ctaRef.current.children) as HTMLElement[])
        : [];

      const revealStatic = () => {
        gsap.set([...intro, ...ctas], { autoAlpha: 1, y: 0, scale: 1, rotation: 0 });
        if (glowRef.current) gsap.set(glowRef.current, { autoAlpha: 0.55, scale: 1 });
        if (glowInnerRef.current) gsap.set(glowInnerRef.current, { autoAlpha: 0.35, scale: 1 });
      };

      if (!intro.length) return;

      const mm = gsap.matchMedia();

      // Solo corre cuando el usuario SÍ quiere animación
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.set(intro, { autoAlpha: 0, y: 56 });
        gsap.set(titleLine2Ref.current, { scale: 0.86, rotation: -2 });
        gsap.set(ctas, { autoAlpha: 0, y: 36, scale: 0.96 });
        if (glowRef.current) gsap.set(glowRef.current, { autoAlpha: 0, scale: 0.75 });
        if (glowInnerRef.current) {
          gsap.set(glowInnerRef.current, { autoAlpha: 0, scale: 0.6 });
        }

        const tl = gsap.timeline({
          defaults: { ease: "power3.out" },
          onComplete: () => {
            sectionRef.current?.classList.add("hero-intro-done");
          },
        });

        if (glowRef.current) {
          tl.to(
            glowRef.current,
            { autoAlpha: 0.55, scale: 1, duration: 1.6, ease: "power2.out" },
            0
          );
        }
        if (glowInnerRef.current) {
          tl.to(
            glowInnerRef.current,
            { autoAlpha: 0.35, scale: 1, duration: 1.8, ease: "power2.out" },
            0.05
          );
        }

        tl.to(badgeRef.current, { autoAlpha: 1, y: 0, duration: 0.7 }, 0.2)
          .to(titleLine1Ref.current, { autoAlpha: 1, y: 0, duration: 0.9 }, "-=0.35")
          .to(
            titleLine2Ref.current,
            {
              autoAlpha: 1,
              y: 0,
              scale: 1,
              rotation: 0,
              duration: 1,
              ease: "back.out(1.35)",
            },
            "-=0.55"
          )
          .to(quoteRef.current, { autoAlpha: 1, y: 0, duration: 0.8 }, "-=0.45")
          .to(ornamentRef.current, { autoAlpha: 1, y: 0, scale: 1, duration: 0.55 }, "-=0.35")
          .to(
            ctas,
            {
              autoAlpha: 1,
              y: 0,
              scale: 1,
              duration: 0.65,
              stagger: 0.14,
              ease: "back.out(1.2)",
            },
            "-=0.25"
          );

        // Resplandor vivo después de la entrada (solo transform/opacity)
        let floatTween: gsap.core.Tween | null = null;
        if (glowInnerRef.current) {
          floatTween = gsap.to(glowInnerRef.current, {
            y: 18,
            duration: 4.5,
            ease: "sine.inOut",
            yoyo: true,
            repeat: -1,
          });
        }

        return () => {
          tl.kill();
          floatTween?.kill();
        };
      });

      mm.add("(prefers-reduced-motion: reduce)", () => {
        revealStatic();
        sectionRef.current?.classList.add("hero-intro-done");
      });

      return () => {
        mm.revert();
      };
    },
    { scope: sectionRef, dependencies: [locale], revertOnUpdate: true }
  );

  return (
    <section
      ref={sectionRef}
      className="hero-section relative flex min-h-[min(88vh,920px)] flex-col justify-center overflow-hidden px-6 pb-28 pt-16 text-center sm:pb-32 sm:pt-20"
      aria-label="Hero"
    >
      <div
        ref={glowRef}
        className="hero-glow pointer-events-none absolute top-[-8%] left-1/2 -z-10 h-[min(90vw,680px)] w-[min(90vw,680px)] -translate-x-1/2 rounded-full bg-amber-200/30 blur-3xl"
        aria-hidden
      />
      <div
        ref={glowInnerRef}
        className="hero-glow pointer-events-none absolute top-[6%] left-1/2 -z-10 h-[min(70vw,520px)] w-[min(70vw,520px)] -translate-x-1/2 rounded-full bg-amber-400/20 blur-2xl"
        aria-hidden
      />

      <div className="relative mx-auto w-full max-w-4xl space-y-6">
        <div
          ref={badgeRef}
          className="hero-animate-target hero-intro-hidden mb-2 inline-flex items-center gap-2 rounded-full border border-amber-200/70 bg-white/70 px-5 py-2 shadow-md shadow-amber-900/5 backdrop-blur-md ring-1 ring-amber-100/80"
        >
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-500" aria-hidden />
          <span className="text-[9px] font-bold uppercase tracking-[0.35em] text-amber-800">
            {t.home.spiritualLegacy}
          </span>
        </div>

        <h1 className="text-5xl font-black leading-[0.92] tracking-tighter text-gray-900 sm:text-7xl md:text-8xl">
          <span ref={titleLine1Ref} className="hero-animate-target hero-intro-hidden block">
            {t.home.heroTitle1}
          </span>
          <span
            ref={titleLine2Ref}
            className="hero-animate-target hero-intro-hidden mt-1 block bg-gradient-to-b from-amber-500 via-amber-600 to-amber-900 bg-clip-text text-transparent drop-shadow-sm"
          >
            {t.home.heroTitle2}
          </span>
        </h1>

        <p
          ref={quoteRef}
          className="hero-animate-target hero-intro-hidden mx-auto max-w-2xl px-2 pt-3 text-lg font-medium italic leading-relaxed text-gray-500 md:text-xl"
        >
          {t.home.heroQuote}
        </p>

        <div
          ref={ornamentRef}
          className="hero-animate-target hero-intro-hidden flex items-center justify-center gap-4 pt-2"
          aria-hidden
        >
          <span className="h-px w-16 bg-gradient-to-r from-transparent to-amber-300/80 sm:w-24" />
          <img
            src="/icon-512.png"
            alt=""
            className="h-7 w-7 rounded-full opacity-40 grayscale"
            width={28}
            height={28}
          />
          <span className="h-px w-16 bg-gradient-to-l from-transparent to-amber-300/80 sm:w-24" />
        </div>

        <div
          ref={ctaRef}
          className="flex flex-col items-center justify-center gap-4 pt-6 sm:flex-row sm:pt-8"
        >
          <Link
            href="/biblioteca"
            className="hero-animate-target hero-intro-hidden btn-premium w-full rounded-full bg-black px-10 py-4 text-[10px] font-bold uppercase tracking-[0.25em] text-white shadow-xl shadow-black/10 hover:bg-amber-600 hover:shadow-2xl active:scale-[0.98] sm:w-auto"
          >
            {t.home.exploreWork}
          </Link>
          <Link
            href="/galeria"
            className="hero-animate-target hero-intro-hidden btn-premium w-full rounded-full border border-gray-200 bg-white/90 px-10 py-4 text-[10px] font-bold uppercase tracking-[0.25em] text-gray-900 shadow-sm backdrop-blur-sm hover:border-gray-400 hover:bg-white active:scale-[0.98] sm:w-auto"
          >
            {t.home.viewGallery}
          </Link>
          <SharePlatformButton
            variant="inline"
            className="hero-animate-target hero-intro-hidden w-full sm:w-auto"
          />
        </div>
      </div>
    </section>
  );
}
