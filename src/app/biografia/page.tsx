"use client";

import Header from "@/components/Header";
import Link from "next/link";

export default function BiografiaPage() {
  return (
    <main className="min-h-screen bg-[#fcfaf7] font-serif selection:bg-amber-200 pb-20">
      <Header />

      {/* --- HERO SECTION: ENCABEZADO CINEMATOGRÁFICO --- */}
      <section className="relative h-[65vh] flex items-end justify-center overflow-hidden bg-gray-900">
        {/* Imagen de fondo (Predicando) con efecto Parallax suave */}
        <div className="absolute inset-0 w-full h-full">
            <img 
            src="/papa-predicando.png" 
            alt="Ministro Enrique Pérez predicando" 
            className="w-full h-full object-cover opacity-60 scale-105"
            />
            {/* Degradado para que el texto se lea perfecto */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#fcfaf7] via-transparent to-black/40" />
        </div>
        
        <div className="relative z-10 text-center px-6 pb-20 animate-in fade-in slide-in-from-bottom-8 duration-1000">
          <p className="text-amber-600 font-bold uppercase tracking-[0.4em] text-xs mb-4 bg-white/90 backdrop-blur-md inline-block px-4 py-1 rounded-full shadow-lg">
            El Autor
          </p>
          <h1 className="text-6xl md:text-8xl font-black text-gray-900 tracking-tighter mb-2 leading-none drop-shadow-sm">
            J. Enrique <br className="md:hidden"/> Pérez L.
          </h1>
          <div className="h-1 w-24 bg-amber-600 mx-auto mt-6 rounded-full"></div>
        </div>
      </section>

      {/* --- CONTENIDO PRINCIPAL --- */}
      <section className="max-w-6xl mx-auto px-6 -mt-10 relative z-20">
        <div className="bg-white rounded-[3rem] shadow-[0_20px_50px_rgba(0,0,0,0.1)] p-8 md:p-16 border border-amber-50">
          
          <div className="grid lg:grid-cols-12 gap-12 items-start">
            
            {/* COLUMNA IZQUIERDA (4 espacios): FOTO Y TIMELINE */}
            <div className="lg:col-span-4 lg:sticky lg:top-24 space-y-10">
              {/* Foto de Perfil con Marco Premium */}
              <div className="relative group mx-auto max-w-xs lg:max-w-none">
                <div className="absolute -inset-3 bg-amber-100/50 rounded-[2.5rem] -rotate-2 group-hover:rotate-0 transition-transform duration-700 ease-out" />
                <img 
                  src="/perfil-papa.png" 
                  alt="Perfil J. Enrique Pérez" 
                  className="relative w-full aspect-[3/4] object-cover rounded-[2rem] shadow-2xl border-[6px] border-white"
                />
              </div>

              {/* TIMELINE (Línea de tiempo visual) */}
              <div className="pl-4 border-l-2 border-amber-100 space-y-8 relative">
                {/* Punto 1 */}
                <div className="relative">
                  <div className="absolute -left-[21px] top-1.5 w-3 h-3 bg-amber-500 rounded-full ring-4 ring-white"></div>
                  <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">1982</p>
                  <p className="text-sm font-bold text-gray-900">Inicio del Ministerio</p>
                  <p className="text-xs text-gray-500 mt-1">Cuesta Colorada, Hidalgo</p>
                </div>
                {/* Punto 2 */}
                <div className="relative">
                  <div className="absolute -left-[21px] top-1.5 w-3 h-3 bg-amber-500 rounded-full ring-4 ring-white"></div>
                  <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">1987</p>
                  <p className="text-sm font-bold text-gray-900">Consagración como Ministro</p>
                  <p className="text-xs text-gray-500 mt-1">6 de Octubre</p>
                </div>
                {/* Punto 3 */}
                <div className="relative">
                   <div className="absolute -left-[21px] top-1.5 w-3 h-3 bg-gray-900 rounded-full ring-4 ring-white"></div>
                  <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Actualidad</p>
                  <p className="text-sm font-bold text-gray-900">Legado Escrito</p>
                  <p className="text-xs text-gray-500 mt-1">Doctrina y Enseñanza</p>
                </div>
              </div>
            </div>

            {/* COLUMNA DERECHA (8 espacios): HISTORIA */}
            <div className="lg:col-span-8 space-y-12">
              
              {/* Introducción */}
              <div className="space-y-6">
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900 leading-tight">
                  Una vida dedicada a la <span className="text-amber-600 underline decoration-amber-200 decoration-4 underline-offset-4">edificación del obrero.</span>
                </h2>
                <p className="text-gray-600 leading-loose text-lg text-justify font-light">
                  <span className="font-bold text-gray-900 text-xl">L</span>a trayectoria de <strong>J. Enrique Pérez L.</strong> es un testimonio vivo de fidelidad y perseverancia en la obra de Dios. Su llamado comenzó a gestarse en 1982, un periodo de formación fundamental bajo la guía de los Ministros Santiago Montiel y Zeferino Jiménez. Con la humildad que caracteriza su servicio, inició su labor oficiando en diversas localidades sin más nombramiento que su compromiso y unas cartas credenciales, destacando sus primeros años de servicio constante en Cuesta Colorada, Hidalgo.
                </p>
                <p className="text-gray-600 leading-loose text-lg text-justify font-light">
                  Su ascenso en la jerarquía eclesiástica fue el reflejo natural de una entrega absoluta, culminando con su consagración como <strong>Ministro el 6 de octubre de 1987</strong>. Lo que inició como una preparación en reuniones de estudio se convirtió en la misión de su vida: preservar la sana doctrina.
                </p>
              </div>

              {/* Cita Destacada (Blockquote) */}
              <div className="relative py-8">
                 <div className="absolute left-0 top-0 text-8xl text-amber-100 font-serif -translate-y-4">“</div>
                 <blockquote className="relative z-10 pl-8 border-l-4 border-amber-500 italic text-xl md:text-2xl text-gray-800 leading-relaxed font-serif">
                   Siempre he creído que escribir es la manera de dejar un legado. Mi deseo es que la doctrina de la Iglesia de Dios (Israelita) no se pierda, sino que se mantenga viva y sea perfeccionada por las futuras generaciones.
                 </blockquote>
              </div>

              {/* La Pluma como Instrumento */}
              <div className="space-y-6">
                <h3 className="text-xl font-black uppercase tracking-widest text-gray-900 flex items-center gap-3">
                  <span className="w-8 h-px bg-gray-300"></span>
                  La Pluma como Instrumento
                </h3>
                <p className="text-gray-600 leading-loose text-lg text-justify font-light">
                  Para el Ministro Pérez, la escritura no fue un plan estratégico, sino una necesidad del espíritu. Desde sus primeros estudios sobre el bautismo hasta tratados complejos como <em>"La Trinidad"</em>, su obra busca cristalizar la verdad para que el tiempo no la erosione. Inspirado por la profundidad de antiguos expositores y revistas como "Abogados de la Biblia", Enrique Pérez dedica las horas más quietas de la madrugada a plasmar ideas que hoy sirven de base para nuevos predicadores.
                </p>
                <p className="text-gray-600 leading-loose text-lg text-justify font-light">
                  Más allá de las letras, su visión se centra en la transformación del creyente. Para él, la doctrina es el mapa, pero la obediencia es el camino.
                </p>
              </div>

              {/* Conclusión / Cierre */}
              <div className="bg-gray-50 rounded-3xl p-8 md:p-10 flex flex-col md:flex-row items-center gap-6 border border-gray-100">
                <div className="bg-white p-4 rounded-full shadow-sm">
                   <img src="/icon-192.png" className="w-12 h-12 grayscale opacity-50" alt="Logo" />
                </div>
                <div className="text-center md:text-left">
                  <p className="text-gray-900 font-bold text-lg mb-1">"La acción es la culminación de la verdad."</p>
                  <p className="text-gray-500 text-sm italic">— Mensaje del autor a la congregación.</p>
                </div>
              </div>

            </div>
          </div>
        </div>
        
        {/* Botón de regreso discreto */}
        <div className="py-12 text-center">
            <Link href="/biblioteca" className="text-xs font-bold uppercase tracking-[0.2em] text-gray-400 hover:text-amber-600 transition-colors">
                ← Volver a la Biblioteca
            </Link>
        </div>
      </section>
    </main>
  );
}