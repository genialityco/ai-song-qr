/* app/screens/PhoneScreen.tsx */
"use client";

import { useState, useEffect } from "react";

function normalizePhone(raw: string) {
  // Quita todo lo que no sea número
  return String(raw || "").replace(/\D+/g, "");
}

export default function PhoneScreen({
  defaultPhone,
  onBack,
  onNext,
}: {
  defaultPhone?: string;
  onBack: () => void;
  onNext: (phone: string) => void;
}) {
  const [phone, setPhone] = useState(defaultPhone || "");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => setError(null), [phone]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const n = normalizePhone(phone);

    // ✅ Ahora solo exigimos que tenga al menos 6–7 dígitos (flexible, según quieras)
    if (!n || n.length < 7) {
      setError("Ingresa un número válido (mínimo 7 dígitos)");
      return;
    }

    onNext(n);
  };

  return (
    <div className="w-full min-h-screen grid place-items-center text-white">
      <form
        onSubmit={submit}
        className="w-full max-w-md bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 shadow-lg space-y-4"
      >
        <h2 className="text-xl font-semibold">Tu número de teléfono</h2>
        <p className="text-sm opacity-80">
          Lo usamos para <b>conectar tus experiencias</b> (GOAT Heart, GOAT Music
          y GOAT Body) y guardar tus medios bajo el mismo ID.
        </p>

        <label className="block text-sm">
          Número (solo dígitos)
          <input
            type="tel"
            inputMode="numeric"
            autoFocus
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Ej: 3101234567"
            className="mt-1 w-full bg-white/15 border border-white/20 rounded-lg px-3 py-2 outline-none"
          />
        </label>

        {error && <div className="text-red-300 text-sm">{error}</div>}

        <div className="flex items-center justify-between gap-3 pt-2">
          <button
            type="button"
            onClick={onBack}
            className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20"
          >
            Volver
          </button>
          <button
            type="submit"
            className="px-5 py-2 rounded-lg bg-blue-500 hover:bg-blue-600 text-white font-semibold"
          >
            Continuar
          </button>
        </div>
      </form>
    </div>
  );
}
