import { NextResponse } from "next/server";

// IMPORTANTE: El nombre de la función debe ser "POST" (en mayúsculas)
export async function POST(request: Request) {
  try {
    // Solo simulamos que recibimos los datos para que no marque error
    const body = await request.json(); 
    
    return NextResponse.json({ 
      success: true, 
      message: "Notificación simulada enviada correctamente",
      received: body
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Error en el servidor" }, { status: 500 });
  }
}