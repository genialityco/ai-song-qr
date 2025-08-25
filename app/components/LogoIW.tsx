import { useState } from "react";

export default function LogoIW({ height, width }: { height?: number; width?: number }) {
  const LOGO_SOURCES = [
    "/assets/TABLET/SVG/LOGOS-WIN%2BINTEL.png",
    "/assets/TABLET/SVG/LOGOS-WIN+INTEL.png",
    "/assets/TABLET/SVG/LOGOS_INTEL_WINDOWS.svg",
  ];
  const [idx, setIdx] = useState(0);

  return (
    <img
      key={LOGO_SOURCES[idx]}
      src={LOGO_SOURCES[idx]}
      alt="Windows 11 + Intel"
      className="block"
      style={{
        height: height ?? "auto",
        width: width ?? "auto",
        maxWidth: "90vw",
        objectFit: "contain",
      }}
      onError={() => setIdx((i) => Math.min(i + 1, LOGO_SOURCES.length - 1))}
    />
  );
}
