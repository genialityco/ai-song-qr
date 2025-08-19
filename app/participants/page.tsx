"use client";

import SurveyTable from "../survey/SurveyTable";

export default function SurveyTablePage() {
  return (
    <div className="w-full min-h-screen relative flex flex-col items-center justify-start text-white overflow-hidden py-6">
      {/* Fondo en video */}
      <video
        className="absolute inset-0 w-full h-full object-cover z-0"
        src="/assets/fondo_animado.mp4"
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
        poster="/assets/FONDO_PANTALLA.png"
      />
      <div className="absolute inset-0 bg-black/40 z-0" />

      {/* Contenido */}
      <div className="relative z-10 w-full max-w-5xl px-4">
        <SurveyTable />
      </div>
    </div>
  );
}
