"use client";

import { useState } from "react";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false); // Switch entre Login y Registro

  // LISTA DE ADMINISTRADORES PARA REDIRECCIÓN
  const ADMIN_EMAILS = ["aroncithoper@gmail.com", "e_perezleon@hotmail.com"];

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      let userCredential;
      
      if (isRegistering) {
        // REGISTRO DE NUEVO HERMANO
        userCredential = await createUserWithEmailAndPassword(auth, email, password);
      } else {
        // LOGIN NORMAL
        userCredential = await signInWithEmailAndPassword(auth, email, password);
      }

      const user = userCredential.user;
      const userEmail = user.email?.toLowerCase() || "";

      // REDIRECCIÓN INTELIGENTE
      if (ADMIN_EMAILS.includes(userEmail)) {
        router.push("/admin");
      } else {
        router.push("/biblioteca");
      }
    } catch (err: any) {
      if (err.code === "auth/email-already-in-use") {
        setError("Este correo ya tiene cuenta. Intenta iniciar sesión.");
      } else if (err.code === "auth/weak-password") {
        setError("La contraseña debe tener al menos 6 caracteres.");
      } else {
        setError("Error en los datos. Revisa tu correo y contraseña.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-[#fcfaf7] font-serif px-4">
      <form
        onSubmit={handleAuth}
        className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl border border-amber-50 p-8 sm:p-12 animate-in fade-in zoom-in duration-500"
      >
        <div className="text-center mb-10">
          <img src="/icon-192.png" className="w-12 h-12 mx-auto mb-6 grayscale opacity-20" alt="" />
          <h1 className="text-2xl font-bold text-gray-900 uppercase tracking-[0.2em]">
            {isRegistering ? "Crear Cuenta" : "Bienvenido"}
          </h1>
          <p className="text-amber-700/50 text-[10px] mt-2 uppercase tracking-widest font-bold italic">
            {isRegistering ? "Únete a la Biblioteca Digital" : "Acceso a la Obra del Obrero"}
          </p>
        </div>

        <div className="space-y-6">
          <div className="group">
            <label className="block text-[10px] uppercase tracking-[0.2em] text-gray-400 font-black mb-1 ml-1 group-focus-within:text-amber-600 transition-colors">
              Correo Electrónico
            </label>
            <input
              type="email"
              placeholder="tu@correo.com"
              className="w-full border-b border-gray-100 focus:border-amber-400 outline-none px-1 py-3 transition-all text-sm bg-transparent"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="group">
            <label className="block text-[10px] uppercase tracking-[0.2em] text-gray-400 font-black mb-1 ml-1 group-focus-within:text-amber-600 transition-colors">
              Contraseña
            </label>
            <input
              type="password"
              placeholder="••••••••"
              className="w-full border-b border-gray-100 focus:border-amber-400 outline-none px-1 py-3 transition-all text-sm bg-transparent"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
        </div>

        {error && (
          <p className="text-red-500 text-[10px] mt-6 bg-red-50 py-3 px-4 rounded-xl text-center font-bold uppercase tracking-wider">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-black text-white py-5 rounded-full mt-10 text-[11px] font-black uppercase tracking-[0.3em] hover:bg-amber-700 transition-all shadow-xl active:scale-95 disabled:bg-gray-200"
        >
          {loading ? "Procesando..." : isRegistering ? "Registrarme Ahora" : "Entrar a la Biblioteca"}
        </button>

        <div className="mt-8 space-y-4 text-center">
          <button
            type="button"
            onClick={() => setIsRegistering(!isRegistering)}
            className="text-[10px] text-amber-800/60 font-bold uppercase tracking-widest hover:text-black transition-colors"
          >
            {isRegistering ? "¿Ya tienes cuenta? Inicia Sesión" : "¿No tienes cuenta? Regístrate aquí"}
          </button>
          
          <br />
          
          <button
            type="button"
            onClick={() => router.push("/")}
            className="text-[9px] text-gray-300 uppercase tracking-[0.4em] hover:text-gray-900 transition-colors"
          >
            Regresar al Inicio
          </button>
        </div>
      </form>
    </main>
  );
}