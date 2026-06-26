"use client";

import RevealOnScroll from "@/components/RevealOnScroll";
import { useLanguage } from "@/lib/language";

export default function HomeAuthorSection() {
  const { t, locale } = useLanguage();

  return (
    <section className="border-t border-amber-50 bg-white py-24">
      <div className="mx-auto max-w-6xl px-6">
        <RevealOnScroll
          className="grid items-center gap-12 md:grid-cols-2 md:gap-20"
          stagger={0.14}
          start="top 82%"
          dependencies={[locale]}
        >
          <div className="group relative mx-auto w-full max-w-md">
            <div className="absolute inset-0 rotate-3 rounded-[2.5rem] bg-amber-100 transition-transform duration-700 group-hover:rotate-6" />
            <div className="relative aspect-[3/4] overflow-hidden rounded-[2.5rem] border-4 border-white bg-gray-100 shadow-2xl">
              <img
                src="/autor.png"
                className="h-full w-full object-cover grayscale transition-all duration-1000 group-hover:grayscale-0"
                alt="J. Enrique Pérez L."
                onError={(e) => {
                  e.currentTarget.src = "/icon-512.png";
                  e.currentTarget.classList.add("opacity-20", "p-20");
                }}
              />
            </div>
          </div>

          <div className="space-y-8 text-center md:text-left">
            <h2 className="text-3xl font-bold leading-tight tracking-tight text-gray-900 md:text-5xl">
              {t.home.serviceHeart}{" "}
              <span className="text-amber-600 underline decoration-amber-200 decoration-4 underline-offset-4">
                {t.home.service}
              </span>
            </h2>
            <div className="mx-auto h-1 w-20 rounded-full bg-amber-500 md:mx-0" />

            <p className="text-base leading-loose text-gray-600 md:text-lg">
              La obra de <strong>J. Enrique Pérez León</strong> no pretende ser un
              tratado académico, sino una ofrenda de gratitud. Es el fruto de años de
              caminar en la fe, de estudio silencioso y de oración constante por la
              iglesia.
            </p>

            <p className="text-base leading-loose text-gray-600 md:text-lg">
              Esta plataforma nace con el deseo sencillo de compartir lo que de gracia
              se ha recibido, esperando que estas líneas sirvan de aliento para los
              hermanos que trabajan en la viña del Señor.
            </p>

            <div className="mt-8 grid grid-cols-2 gap-8 border-t border-gray-100 pt-6">
              <div>
                <h3 className="text-4xl font-black text-amber-600">40+</h3>
                <p className="mt-2 text-[9px] font-bold uppercase tracking-widest text-gray-400">
                  {t.home.yearsServing}
                </p>
              </div>
              <div>
                <h3 className="text-4xl font-black text-amber-600">∞</h3>
                <p className="mt-2 text-[9px] font-bold uppercase tracking-widest text-gray-400">
                  {t.home.eternalGratitude}
                </p>
              </div>
            </div>
          </div>
        </RevealOnScroll>
      </div>
    </section>
  );
}
