"use client";

import { useEffect, useState } from "react";
import Header from "@/components/Header";
import InstallGuideModal from "@/components/InstallGuideModal";
import { getMessaging, getToken } from "firebase/messaging";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { usePlayer } from "@/lib/PlayerContext";
import SharePlatformButton from "@/components/SharePlatformButton";
import { useLanguage } from "@/lib/language";
import HeroSection from "@/components/HeroSection";
import HomeAuthorSection from "@/components/HomeAuthorSection";

export default function LandingPage() {
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [showGuide, setShowGuide] = useState(false);
  const { currentVideo } = usePlayer();
  const { t } = useLanguage();

  useEffect(() => {
    const handleBeforeInstall = (e: any) => {
      e.preventDefault();
      setInstallPrompt(e);
    };
    window.addEventListener("beforeinstallprompt", handleBeforeInstall);
    return () => window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
  }, []);

  const handleInstallClick = async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    await installPrompt.userChoice;
    setInstallPrompt(null);
  };

  const handleEnableNotifications = async () => {
    if (!("Notification" in window)) return;
    
    const permission = await Notification.requestPermission();
    if (permission === "granted") {
      new Notification(t.home.notificationWelcomeTitle, {
        body: t.home.notificationWelcomeBody,
        icon: "/icon-192.png",
        // @ts-ignore
        vibrate: [200, 100, 200]
      });

      try {
        const messaging = getMessaging();
        const token = await getToken(messaging, { 
             vapidKey: "BFlxGRnMNZ9xXK5WT7K0LzAt56PKDZ64kyPfb8OIOCWimsg4zupJdFcs3G2wnyRMOqxREywZBl1Rdzo5G6es03E" 
        }); 
        
        if (token) {
           await addDoc(collection(db, "fcm_tokens"), {
             token: token,
             createdAt: serverTimestamp()
           });
           console.log("Token guardado desde Inicio");
        }
      } catch (error) {
        console.log("Error guardando token:", error);
      }

    } else {
      alert(t.home.notificationPermission);
    }
  };

  return (
    <main className={`ambient-page min-h-screen bg-[#fcfaf7] font-serif selection:bg-amber-200 ${currentVideo ? "pb-80 md:pb-0" : ""}`}>
      <Header />
      
      <InstallGuideModal isOpen={showGuide} onClose={() => setShowGuide(false)} />

      <div
        className={`fixed left-0 right-0 z-[100] flex justify-center items-center gap-3 px-4 animate-in slide-in-from-bottom-4 fade-in duration-1000 pointer-events-none transition-all duration-300 ${
          currentVideo ? "bottom-[17.5rem] md:bottom-6" : "bottom-6"
        }`}
      >
        
        {installPrompt && (
          <button 
            onClick={handleInstallClick} 
            className="btn-premium flex items-center gap-2 px-5 py-3 bg-amber-600 text-white rounded-full font-bold text-[10px] uppercase tracking-[0.2em] shadow-2xl border-2 border-white hover:bg-black pointer-events-auto active:scale-[0.98]"
          >
            <span className="text-base">📲</span>
            <span>{t.home.installApp}</span>
          </button>
        )}

        <button 
            onClick={handleEnableNotifications}
            className="btn-premium flex items-center gap-2 px-4 py-3 bg-white/90 backdrop-blur text-gray-800 rounded-full font-bold text-[10px] uppercase tracking-[0.2em] shadow-xl border border-gray-200 hover:bg-black hover:text-white pointer-events-auto active:scale-[0.98]"
        >
            <span className="text-base">🔔</span>
            <span className="hidden sm:inline">{t.home.notifications}</span>
        </button>

        <button 
          onClick={() => setShowGuide(true)} 
          className="btn-premium flex items-center gap-2 px-5 py-3 bg-white/90 backdrop-blur text-gray-800 rounded-full font-bold text-[10px] uppercase tracking-[0.2em] shadow-xl border border-gray-200 hover:bg-gray-50 pointer-events-auto active:scale-[0.98]"
        >
          <span className="text-base">❓</span>
          <span>{t.home.howToInstall}</span>
        </button>
      </div>

      <HeroSection />

      <HomeAuthorSection />

      <footer className="bg-[#121212] text-white py-20 px-6 text-center border-t border-gray-800">
        <img src="/icon-512.png" className="w-10 h-10 mx-auto mb-8 opacity-30 grayscale invert" alt="Logo" />
        <p className="text-[9px] uppercase tracking-[0.4em] font-bold text-gray-500 mb-4">
          © 2026 Consejero Digital
        </p>
        
        {/* CAMBIO 2: DISCLAIMER PARA EVITAR REGAÑOS */}
        <p className="text-[10px] text-gray-400 font-light max-w-xl mx-auto leading-relaxed mb-6 px-4">
          {t.home.footerDisclaimer}
        </p>

        <SharePlatformButton variant="footer" className="mb-6" />

        <p className="text-[8px] text-gray-600 italic font-serif">
          {t.home.rightsReserved}
        </p>
      </footer>
    </main>
  );
}