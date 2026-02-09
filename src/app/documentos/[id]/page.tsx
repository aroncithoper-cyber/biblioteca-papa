import { Metadata } from "next";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import EbookViewerClient from "@/components/EbookViewerClient";

// Esto fuerza a que la página sea dinámica para evitar errores de caché en Vercel
export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

// Generar metadatos para que el título de la pestaña sea el del libro
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  
  try {
    const docRef = doc(db, "documents", id);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const data = snap.data();
      return { title: `${data.title} | Sala de Estudio` };
    }
  } catch (e) {
    console.error("Error fetching metadata", e);
  }
  return { title: "Lectura | Sala de Estudio" };
}

export default async function DocumentoPage({ params }: Props) {
  const { id } = await params;
  
  // 1. Obtener datos del libro desde Firebase (lado del servidor)
  let bookData = null;
  try {
    const docRef = doc(db, "documents", id);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      bookData = { id: snap.id, ...snap.data() } as any;
    }
  } catch (error) {
    console.error("Error cargando libro:", error);
  }

  // 2. Si no existe el libro, mostramos error elegante
  if (!bookData) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#fcfaf7] text-center p-6">
        <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mb-4 text-2xl">
          📚
        </div>
        <h1 className="text-xl font-bold text-gray-900 mb-2">Libro no encontrado</h1>
        <p className="text-sm text-gray-500 mb-6">El documento que buscas no está disponible.</p>
        <a href="/biblioteca" className="px-6 py-3 bg-black text-white rounded-full text-xs font-bold uppercase tracking-widest">
          Volver a la Biblioteca
        </a>
      </div>
    );
  }

  // 3. Renderizar el Visor Cliente (El "Súper Pro")
  // Pasamos la URL y el ID para que el cliente maneje la lectura
  return (
    <main className="min-h-screen bg-[#fcfaf7] text-gray-900 overflow-hidden relative">
      {/* Botón flotante para salir (por seguridad si la UI falla) */}
      <a 
        href="/biblioteca" 
        className="fixed top-4 left-4 z-[100] w-10 h-10 bg-white/50 backdrop-blur-md border border-gray-200 rounded-full flex items-center justify-center text-gray-600 hover:bg-white hover:text-black transition-all shadow-sm group"
        title="Salir"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 group-hover:-translate-x-0.5 transition-transform">
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
        </svg>
      </a>

      {/* Aquí cargamos el componente PRO que hicimos hace un momento */}
      <div className="w-full h-screen p-4 sm:p-6 lg:p-8 flex items-center justify-center">
        <EbookViewerClient 
          fileUrl={bookData.url} 
          documentId={bookData.id} 
        />
      </div>
    </main>
  );
}