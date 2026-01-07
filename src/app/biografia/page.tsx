"use client";

import Header from "@/components/Header";
import Link from "next/link";

export default function BiografiaPage() {
  return (
    <main className="min-h-screen bg-[#fcfaf7] font-serif selection:bg-amber-200 pb-20">
      <Header />

      {/* --- HERO SECTION --- */}
      <section className="relative h-[65vh] flex items-end justify-center overflow-hidden bg-gray-900">
        <div className="absolute inset-0 w-full h-full">
            <img 
            src="/papa-predicando.png" 
            alt="Ministro Enrique Pérez predicando" 
            className="w-full h-full object-cover object-top opacity-60 scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#fcfaf7] via-transparent to-black/40" />
        </div>
        
        <div className="relative z-10 text-center px-6 pb-20 animate-in fade-in slide-in-from-bottom-8 duration-1000">
          <p className="text-amber-800 font-bold uppercase tracking-[0.4em] text-xs mb-4 bg-white/90 backdrop-blur-md inline-block px-4 py-1 rounded-full shadow-lg">
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
            
            {/* COLUMNA IZQUIERDA: FOTO Y TIMELINE JERÁRQUICO */}
            <div className="lg:col-span-4 lg:sticky lg:top-24 space-y-10">
              <div className="relative group mx-auto max-w-xs lg:max-w-none">
                <div className="absolute -inset-3 bg-amber-100/50 rounded-[2.5rem] -rotate-2 group-hover:rotate-0 transition-transform duration-700 ease-out" />
                <img 
                  src="/perfil-papa.png" 
                  alt="Perfil J. Enrique Pérez" 
                  className="relative w-full aspect-[3/4] object-cover rounded-[2rem] shadow-2xl border-[6px] border-white"
                />
              </div>

              {/* TIMELINE CORREGIDO CON JERARQUÍAS */}
              <div className="pl-4 border-l-2 border-amber-100 space-y-8 relative">
                
                {/* 1983 - Ayuda */}
                <div className="relative">
                  <div className="absolute -left-[21px] top-1.5 w-3 h-3 bg-amber-200 rounded-full ring-4 ring-white"></div>
                  <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">1983</p>
                  <p className="text-sm font-bold text-gray-900">Jerarquía de Ayuda</p>
                  <p className="text-xs text-gray-500 mt-1">Inicio del servicio</p>
                </div>

                {/* 1985 - Diácono */}
                <div className="relative">
                  <div className="absolute -left-[21px] top-1.5 w-3 h-3 bg-amber-400 rounded-full ring-4 ring-white"></div>
                  <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">1985</p>
                  <p className="text-sm font-bold text-gray-900">Jerarquía de Diácono</p>
                  <p className="text-xs text-gray-500 mt-1">Cuesta Colorada, Hgo.</p>
                </div>

                {/* 1987 - Ministro */}
                <div className="relative">
                  <div className="absolute -left-[21px] top-1.5 w-3 h-3 bg-amber-600 rounded-full ring-4 ring-white"></div>
                  <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">1987</p>
                  <p className="text-sm font-bold text-gray-900">Jerarquía de Ministro</p>
                  <p className="text-xs text-gray-500 mt-1">A la edad de 22 años</p>
                </div>

                {/* Actualidad - Servicio */}
                <div className="relative">
                   <div className="absolute -left-[21px] top-1.5 w-3 h-3 bg-gray-900 rounded-full ring-4 ring-white"></div>
                  <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Actualidad</p>
                  <p className="text-sm font-bold text-gray-900">+40 Años de Servicio</p>
                  <p className="text-xs text-gray-500 mt-1">Iglesia de Dios (Israelita)</p>
                </div>
              </div>
            </div>

            {/* COLUMNA DERECHA: TEXTO */}
            <div className="lg:col-span-8 space-y-12">
              
              <div className="space-y-6">
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900 leading-tight">
                  Una historia de <span className="text-amber-700 decoration-amber-200 decoration-4 underline-offset-4">servicio.</span>
                </h2>
                <p className="text-gray-600 leading-loose text-lg text-justify font-light">
                  <span className="font-bold text-gray-900 text-xl">L</span>a trayectoria de <strong>J. Enrique Pérez L.</strong> comenzó en 1982, asistiendo a las reuniones de preparación bajo la instrucción de los Ministros Santiago Montiel y Zeferino Jiménez. Con el deseo de ser útil en la obra, comenzó a atender diversas localidades contando únicamente con cartas credenciales, destacando su labor constante durante dos años en Cuesta Colorada, Hidalgo.
                </p>
                <p className="text-gray-600 leading-loose text-lg text-justify font-light">
                  El trabajo en el campo y la necesidad de obreros permitieron que escalara en las jerarquías eclesiásticas, recibiendo la <strong>Jerarquía de Ayuda</strong>, posteriormente la <strong>Jerarquía de Diácono</strong> en 1985, y finalmente siendo consagrado en la <strong>Jerarquía de Ministro</strong> el 6 de octubre de 1987, asumiendo esta responsabilidad a la temprana edad de 22 años.
                </p>
              </div>

              {/* Cita */}
              <div className="relative py-8">
                 <div className="absolute left-0 top-0 text-8xl text-amber-100 font-serif -translate-y-4">“</div>
                 <blockquote className="relative z-10 pl-8 border-l-4 border-amber-500 italic text-xl md:text-2xl text-gray-800 leading-relaxed font-serif">
                   Siempre he creído que escribir es la manera de dejar un apoyo para quienes vienen tras de nosotros. Mi deseo es que la doctrina se mantenga firme y sea continuada por las futuras generaciones.
                 </blockquote>
              </div>

              <div className="space-y-6">
                <h3 className="text-xl font-black uppercase tracking-widest text-gray-900 flex items-center gap-3">
                  <span className="w-8 h-px bg-gray-300"></span>
                  La Labor Escrita
                </h3>
                <p className="text-gray-600 leading-loose text-lg text-justify font-light">
                  Para el Ministro Pérez, la escritura surgió como una herramienta necesaria para la enseñanza. Desde sus primeros apuntes hasta la elaboración de folletos y libros, su intención ha sido plasmar los estudios bíblicos para facilitar la comprensión de la doctrina. Inspirado por el trabajo editorial de la iglesia en décadas pasadas, dedica tiempo al estudio y redacción, con la esperanza de que estos materiales sean de utilidad para el cuerpo ministerial y la congregación.
                </p>
                <p className="text-gray-600 leading-loose text-lg text-justify font-light">
                  Su enfoque no está en el reconocimiento, sino en la edificación. Como él mismo expresa: <em>"La doctrina es importante porque es la base, pero la acción es fundamental para cumplir la voluntad de Dios."</em>
                </p>
              </div>

              <div className="bg-gray-50 rounded-3xl p-8 md:p-10 flex flex-col md:flex-row items-center gap-6 border border-gray-100">
                <div className="bg-white p-4 rounded-full shadow-sm">
                   <img src="/icon-192.png" className="w-12 h-12 grayscale opacity-50" alt="Logo" />
                </div>
                <div className="text-center md:text-left">
                  <p className="text-gray-900 font-bold text-lg mb-1">Consejero del Obrero</p>
                  <p className="text-gray-500 text-sm italic">Plataforma de estudio y consulta.</p>
                </div>
              </div>

            </div>
          </div>
        </div>
        
        <div className="py-12 text-center">
            <Link href="/biblioteca" className="text-xs font-bold uppercase tracking-[0.2em] text-gray-400 hover:text-amber-600 transition-colors">
                ← Volver a la Biblioteca
            </Link>
        </div>
      </section>
    </main>
  );
}