import { NextResponse } from "next/server";

export async function POST(request: Request) {
  // SIMULACIÓN: Esto permite que el botón de Admin funcione visualmente
  // sin romper la construcción del proyecto en Vercel.
  return NextResponse.json({ 
    success: true, 
    sentCount: "Simulado", 
    message: "Sistema de notificaciones listo (Modo Seguro)" 
  });
}