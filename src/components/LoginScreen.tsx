"use client";
import { useState } from "react";
import { auth } from "@/lib/firebase";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";

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
    } catch (err: any) {
      setError("Correo o contraseña incorrectos. Verifica tus datos.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#fcfaf7] p-4 font-serif">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl overflow-hidden border border-amber-100">
        
        {/* Parte Superior: Tarjeta de Presentación */}
        <div className="bg-black p-8 text-center text-white">
          <img src="/icon.png" alt="Logo" className="w-20 h-20 mx-auto mb-4 rounded-full border-2 border-amber-400" />
          <h1 className="text-2xl font-bold tracking-tight">Consejero del Obrero</h1>
          <p className="text-amber-200 text-xs mt-2 uppercase tracking-[0.2em]">Biblioteca Digital</p>
          <div className="h-px w-12 bg-amber-400 mx-auto mt-4" />
        </div>

        {/* Formulario */}
        <div className="p-8">
          <h2 className="text-center text-gray-800 text-lg mb-6 italic">
            {isRegister ? "Crea tu cuenta de lector" : "Bienvenido a la Sala de Lectura"}
          </h2>
          
          <form onSubmit={handleAuth} className="space-y-4">
            <input 
              type="email" placeholder="Correo electrónico" 
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-black outline-none transition-all text-sm"
              value={email} onChange={(e) => setEmail(e.target.value)} required
            />
            <input 
              type="password" placeholder="Contraseña" 
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-black outline-none transition-all text-sm"
              value={password} onChange={(e) => setPassword(e.target.value)} required
            />
            
            {error && <p className="text-red-500 text-xs text-center italic">{error}</p>}

            <button className="w-full bg-black text-white py-3 rounded-xl font-bold hover:bg-gray-800 transition-colors shadow-lg shadow-gray-200">
              {isRegister ? "Registrarse" : "Entrar a Leer"}
            </button>
          </form>

          <button 
            onClick={() => setIsRegister(!isRegister)}
            className="w-full mt-6 text-sm text-gray-500 hover:text-black transition-colors underline decoration-dotted"
          >
            {isRegister ? "¿Ya tienes cuenta? Inicia sesión" : "¿No tienes cuenta? Regístrate aquí"}
          </button>
        </div>

        <div className="p-4 bg-gray-50 text-center">
          <p className="text-[10px] text-gray-400 uppercase tracking-widest">Obra de Jose Enrique Perez Leon</p>
        </div>
      </div>
    </div>
  );
}