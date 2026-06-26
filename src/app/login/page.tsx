"use client";

import { useState, useEffect } from "react";
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  sendPasswordResetEmail,
  updateProfile 
} from "firebase/auth";
import { auth } from "@/lib/firebase";
import { isAdminEmail } from "@/lib/adminEmails";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/lib/language";
import { notifyTelegramRegistration } from "@/lib/telegramNotifyClient";

export default function LoginPage() {
  const router = useRouter();
  const { t } = useLanguage();
  
  // Estados de datos
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState(""); // Nuevo: para guardar el nombre al registrarse

  // Estados de interfaz
  const [error, setError] = useState("");
  const [msg, setMsg] = useState(""); // Nuevo: para mensajes de éxito (correo enviado)
  const [loading, setLoading] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [showPassword, setShowPassword] = useState(false); // Nuevo: para el ojito

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("register") === "1") {
      setIsRegistering(true);
    }
  }, []);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMsg("");
    setLoading(true);

    try {
      let userCredential;
      
      if (isRegistering) {
        // REGISTRO DE NUEVO HERMANO
        if (!name.trim()) throw new Error(t.auth.enterName);
        
        userCredential = await createUserWithEmailAndPassword(auth, email, password);
        
        // Guardamos el nombre en el perfil de Firebase
        await updateProfile(userCredential.user, { displayName: name });
        notifyTelegramRegistration();
      } else {
        // LOGIN NORMAL
        userCredential = await signInWithEmailAndPassword(auth, email, password);
      }

      const user = userCredential.user;

      // REDIRECCIÓN INTELIGENTE
      if (isAdminEmail(user.email)) {
        router.push("/admin");
      } else {
        router.push("/biblioteca");
      }
    } catch (err: any) {
      console.error(err);
      if (err.code === "auth/email-already-in-use") {
        setError(t.auth.emailInUse);
      } else if (err.code === "auth/weak-password") {
        setError(t.auth.weakPassword);
      } else if (err.code === "auth/invalid-credential" || err.code === "auth/user-not-found" || err.code === "auth/wrong-password") {
        setError(t.auth.invalidCredentials);
      } else if (err.message === t.auth.enterName) {
        setError(err.message);
      } else {
        setError(t.auth.genericError);
      }
    } finally {
      setLoading(false);
    }
  };

  // FUNCIÓN PARA RECUPERAR CONTRASEÑA
  const handleResetPassword = async () => {
    if (!email.trim()) {
      setError(t.auth.resetNeedEmail);
      return;
    }
    setLoading(true);
    setError("");
    setMsg("");

    try {
      await sendPasswordResetEmail(auth, email);
      setMsg(t.auth.resetSent);
    } catch (err: any) {
      if (err.code === "auth/user-not-found") {
        setError(t.auth.userNotFound);
      } else {
        setError(t.auth.resetFailed);
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
          <img src="/icon-512.png" className="w-12 h-12 mx-auto mb-6 grayscale opacity-20" alt="" />
          <h1 className="text-2xl font-bold text-gray-900 uppercase tracking-[0.2em]">
            {isRegistering ? t.auth.createAccount : t.auth.welcome}
          </h1>
          <p className="text-amber-700/50 text-[10px] mt-2 uppercase tracking-widest font-bold italic">
            {isRegistering ? t.auth.joinLibrary : t.auth.accessWork}
          </p>
        </div>

        <div className="space-y-6">
          {/* CAMPO NOMBRE (SOLO EN REGISTRO) */}
          {isRegistering && (
            <div className="group">
              <label className="block text-[10px] uppercase tracking-[0.2em] text-gray-400 font-black mb-1 ml-1 group-focus-within:text-amber-600 transition-colors">
                {t.auth.fullName}
              </label>
              <input
                type="text"
                placeholder={t.auth.namePlaceholder}
                className="w-full border-b border-gray-100 focus:border-amber-400 outline-none px-1 py-3 transition-all text-sm bg-transparent"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
          )}

          {/* CAMPO CORREO */}
          <div className="group">
            <label className="block text-[10px] uppercase tracking-[0.2em] text-gray-400 font-black mb-1 ml-1 group-focus-within:text-amber-600 transition-colors">
              {t.auth.email}
            </label>
            <input
              type="email"
              placeholder={t.auth.emailPlaceholder}
              className="w-full border-b border-gray-100 focus:border-amber-400 outline-none px-1 py-3 transition-all text-sm bg-transparent"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          {/* CAMPO CONTRASEÑA CON OJITO */}
          <div className="group relative">
            <label className="block text-[10px] uppercase tracking-[0.2em] text-gray-400 font-black mb-1 ml-1 group-focus-within:text-amber-600 transition-colors">
              {t.auth.password}
            </label>
            <input
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              className="w-full border-b border-gray-100 focus:border-amber-400 outline-none px-1 py-3 transition-all text-sm bg-transparent pr-10"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-2 bottom-3 text-gray-400 hover:text-amber-600 transition-colors"
            >
              {showPassword ? (
                // Icono Ojo Abierto
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              ) : (
                // Icono Ojo Cerrado
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* MENSAJES DE ERROR O ÉXITO */}
        {error && (
          <p className="text-red-500 text-[10px] mt-6 bg-red-50 py-3 px-4 rounded-xl text-center font-bold uppercase tracking-wider animate-pulse">
            {error}
          </p>
        )}
        {msg && (
          <p className="text-green-600 text-[10px] mt-6 bg-green-50 py-3 px-4 rounded-xl text-center font-bold uppercase tracking-wider">
            {msg}
          </p>
        )}

        {/* BOTÓN PRINCIPAL */}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-black text-white py-5 rounded-full mt-8 text-[11px] font-black uppercase tracking-[0.3em] hover:bg-amber-700 transition-all shadow-xl active:scale-95 disabled:bg-gray-200"
        >
          {loading ? t.auth.processing : isRegistering ? t.auth.registerNow : t.auth.enterLibrary}
        </button>
        
        {/* BOTÓN RECUPERAR CONTRASEÑA (SOLO EN LOGIN) */}
        {!isRegistering && (
           <div className="mt-4 text-center">
             <button
               type="button"
               onClick={handleResetPassword}
               disabled={loading}
               className="text-[9px] text-gray-400 hover:text-amber-600 font-bold uppercase tracking-wider transition-colors"
             >
               {t.auth.forgotPassword}
             </button>
           </div>
        )}

        <div className="mt-8 space-y-4 text-center border-t border-gray-100 pt-6">
          <button
            type="button"
            onClick={() => {
              setIsRegistering(!isRegistering);
              setError("");
              setMsg("");
            }}
            className="text-[10px] text-amber-800/60 font-bold uppercase tracking-widest hover:text-black transition-colors"
          >
            {isRegistering ? t.auth.hasAccount : t.auth.noAccount}
          </button>
          
          <br />
          
          <button
            type="button"
            onClick={() => router.push("/")}
            className="text-[9px] text-gray-300 uppercase tracking-[0.4em] hover:text-gray-900 transition-colors"
          >
            {t.auth.backHome}
          </button>
        </div>
      </form>
    </main>
  );
}