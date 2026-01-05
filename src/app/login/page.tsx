"use client";

import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // COLOQUEN AQUÍ EL CORREO DEL ADMINISTRADOR
  const ADMIN_EMAIL = "tu-correo@ejemplo.com"; 

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // VALIDACIÓN DE ROL SIMPLE
      if (user.email === ADMIN_EMAIL) {
        router.push("/admin"); // Si es el admin, va directo al panel
      } else {
        router.push("/"); // Si es un lector, va al inicio
      }
    } catch (err: any) {
      setError("Credenciales no válidas para acceso administrativo");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-[#F8F9FA] font-serif">
      <form onSubmit={handleLogin} className="bg-white p-10 rounded-2xl shadow-2xl w-full max-w-md border border-gray-100">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900 uppercase tracking-widest">Acceso Editorial</h1>
          <p className="text-gray-400 text-xs mt-2 italic">Administración del Consejero del Obrero</p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-[10px] uppercase tracking-widest text-gray-500 font-bold ml-1">Correo Electrónico</label>
            <input
              type="email"
              placeholder="admin@ejemplo.com"
              className="w-full border-b-2 border-gray-100 focus:border-black outline-none px-1 py-3 transition-all text-sm"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="text-[10px] uppercase tracking-widest text-gray-500 font-bold ml-1">Contraseña</label>
            <input
              type="password"
              placeholder="••••••••"
              className="w-full border-b-2 border-gray-100 focus:border-black outline-none px-1 py-3 transition-all text-sm"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
        </div>

        {error && <p className="text-red-500 text-[11px] mt-4 bg-red-50 p-2 rounded text-center">{error}</p>}

        <button 
          type="submit" 
          disabled={loading}
          className="w-full bg-black text-white py-4 rounded-lg mt-8 text-xs font-bold uppercase tracking-[0.2em] hover:bg-gray-800 transition-all disabled:bg-gray-400"
        >
          {loading ? "Verificando..." : "Entrar al Panel"}
        </button>

        <button 
          type="button"
          onClick={() => router.push("/")}
          className="w-full text-gray-400 text-[10px] mt-4 hover:text-black transition-colors uppercase tracking-widest"
        >
          Regresar a la Biblioteca
        </button>
      </form>
    </main>
  );
}