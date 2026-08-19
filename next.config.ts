import type { NextConfig } from "next";

// Vide en local ; "/veille-ao" quand servi en sous-chemin derriere nginx.
const nextConfig: NextConfig = {
  basePath: process.env.NEXT_PUBLIC_BASE_PATH || "",
  // pdfkit lit ses fichiers de métriques de polices (.afm) via un chemin relatif à son
  // propre module au runtime — le bundler casse cette résolution. On l'exclut du bundling
  // pour qu'il reste chargé directement depuis node_modules (résolution Node standard).
  serverExternalPackages: ["pdfkit"],
};

export default nextConfig;
