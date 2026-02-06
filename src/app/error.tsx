"use client";

/**
 * Error Boundary global (temporal para ver el error real en producción).
 * Muestra error.message y error.stack en pantalla.
 * Eliminar o reemplazar por una UI amigable cuando ya no se necesite.
 */

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const stack = error?.stack ?? "(no stack)";
  const digest = error?.digest ?? "(no digest)";

  return (
    <main className="min-h-screen bg-red-50 p-6 font-mono text-left">
      <div className="max-w-4xl mx-auto space-y-4">
        <h1 className="text-xl font-bold text-red-800">
          Application error: a client-side exception has occurred
        </h1>
        <p className="text-sm text-red-600 font-semibold">Error boundary (temporal – para depuración)</p>

        <section className="bg-white border border-red-200 rounded p-4">
          <h2 className="text-sm font-bold text-gray-700 mb-2">error.message</h2>
          <pre className="text-red-700 text-sm whitespace-pre-wrap break-words overflow-x-auto">
            {error?.message ?? "(no message)"}
          </pre>
        </section>

        <section className="bg-white border border-red-200 rounded p-4">
          <h2 className="text-sm font-bold text-gray-700 mb-2">error.digest</h2>
          <pre className="text-gray-800 text-sm whitespace-pre-wrap break-words">
            {digest}
          </pre>
        </section>

        <section className="bg-white border border-red-200 rounded p-4">
          <h2 className="text-sm font-bold text-gray-700 mb-2">error.stack</h2>
          <pre className="text-gray-800 text-xs whitespace-pre-wrap break-words overflow-x-auto max-h-[50vh] overflow-y-auto">
            {stack}
          </pre>
        </section>

        <button
          type="button"
          onClick={reset}
          className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
        >
          Intentar de nuevo
        </button>
      </div>
    </main>
  );
}
