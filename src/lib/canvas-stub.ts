/**
 * Stub para el módulo 'canvas'.
 * pdfjs-dist intenta cargarlo en NodeCanvasFactory; no es necesario en el cliente.
 * Este mock evita el error "Can't resolve 'canvas'" durante el build.
 */
const createCanvas = (_width: number, _height: number) => ({
  getContext: () => null,
  width: 0,
  height: 0,
});

export default { createCanvas };
