import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // pdfkit lit ses fichiers de métriques de polices (.afm) via un chemin relatif à son
  // propre module au runtime — le bundler casse cette résolution. On l'exclut du bundling
  // pour qu'il reste chargé directement depuis node_modules (résolution Node standard).
  serverExternalPackages: ["pdfkit"],
};

export default nextConfig;
