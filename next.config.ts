import type { NextConfig } from "next";

// Vide en local ; "/veille-ao" quand servi en sous-chemin derriere nginx.
const nextConfig: NextConfig = {
  basePath: process.env.NEXT_PUBLIC_BASE_PATH || "",
};

export default nextConfig;
