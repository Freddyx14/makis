import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Salida standalone: la app se despliega como contenedor con proceso
  // persistente (Railway / Cloud Run), no como funciones serverless.
  // El pipeline de agentes dura minutos y moriría con el límite de 60s
  // de las funciones de Vercel.
  output: "standalone",
};

export default nextConfig;
