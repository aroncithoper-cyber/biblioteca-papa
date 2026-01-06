"use client";
import { useState } from "react";
import { auth } from "@/lib/firebase";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} from "firebase/auth";

export default function LoginScreen() {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      if (isRegister) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch {
      setError("Correo o contraseña incorrectos. Verifica tus datos.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#fcfaf7] px-4 font-serif">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl overflow-hidden border border-amber-100">
        {/* Encabezado */}
        <div className="bg-black px-6 py-8 sm:p-8 text-center text-white">
          <img
            src="/icon-512.png"
            alt="Logo"
            className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 rounded-full border-2 border-amber-400"
          />
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
            Consejero del Obrero
          </h1>
          <p className="text-[10px] sm:text-xs mt-2 uppercase tracking-[0.2em] text-amber-200">
            Biblioteca Digital
          </p>
          <div className="h-px w-12 bg-amber-400 mx-auto mt-4" />
        </div>

        {/* Formulario */}
        <div className="p-6 sm:p-8">
          <h2 className="text-center text-gray-800 text-base sm:text-lg mb-6 italic">
            {isRegister
              ? "Crea tu cuenta de lector"
              : "Bienvenido a la Sala de Lectura"}
          </h2>

          <form onSubmit={handleAuth} className="space-y-4">
            <input
              type="email"
              placeholder="Correo electrónico"
              className="w-full px-4 py-3 rounded-xl border border-gray-200
                         focus:ring-2 focus:ring-black outline-none transition-all
                         text-sm"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <input
              type="password"
              placeholder="Contraseña"
              className="w-full px-4 py-3 rounded-xl border border-gray-200
                         focus:ring-2 focus:ring-black outline-none transition-all
                         text-sm"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            {error && (
              <p className="text-red-500 text-[11px] text-center italic">
                {error}
              </p>
            )}

            <button
              type="submit"
              className="w-full bg-black text-white py-3.5 rounded-xl
                         text-sm font-bold hover:bg-gray-800 transition-colors
                         shadow-lg shadow-gray-200"
            >
              {isRegister ? "Registrarse" : "Entrar a Leer"}
            </button>
          </form>

          <button
            onClick={() => setIsRegister(!isRegister)}
            className="w-full mt-6 text-[11px] sm:text-sm text-gray-500
                       hover:text-black transition-colors underline decoration-dotted"
          >
            {isRegister
              ? "¿Ya tienes cuenta? Inicia sesión"
              : "¿No tienes cuenta? Regístrate aquí"}
          </button>
        </div>

        <div className="p-4 bg-gray-50 text-center">
          <p className="text-[9px] sm:text-[10px] text-gray-400 uppercase tracking-widest">
            Obra de Jose Enrique Perez Leon
          </p>
        </div>
      </div>
    </div>
  );
}
