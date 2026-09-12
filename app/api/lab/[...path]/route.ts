import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function proxy(req: NextRequest, context: {params: Promise<{path: string[]}>}) {
  const {path} = await context.params;
  if (!path.length || !["session", "login", "campaigns"].includes(path[0]) || path.some(p => !/^[a-zA-Z0-9_-]+$/.test(p))) {
    return NextResponse.json({detail:"Ruta no permitida"}, {status:404});
  }
  const origin = req.headers.get("origin");
  if (!process.env.DEMO_PASSWORD && !["localhost", "127.0.0.1", "[::1]"].includes(req.nextUrl.hostname)) {
    return NextResponse.json({detail:"Configura DEMO_PASSWORD en ambos servidores para acceso remoto."}, {status:403});
  }
  if (req.method !== "GET" && origin && new URL(origin).host !== req.headers.get("host")) {
    return NextResponse.json({detail:"Origen no autorizado"}, {status:403});
  }
  const base = process.env.LAB_API_URL || "http://127.0.0.1:8000";
  try {
    const body = req.method === "GET" ? undefined : await req.text();
    if (body && Buffer.byteLength(body) > 200000) return NextResponse.json({detail:"Solicitud demasiado grande"}, {status:413});
    const response = await fetch(`${base.replace(/\/$/, "")}/api/${path.map(encodeURIComponent).join("/")}`, {
      method:req.method, headers:{"Content-Type":"application/json", cookie:req.headers.get("cookie") || ""},
      body, cache:"no-store", redirect:"manual", signal:AbortSignal.timeout(120000),
    });
    const result = new NextResponse(await response.text(), {status:response.status, headers:{"Content-Type":"application/json", "Cache-Control":"no-store"}});
    const cookie = response.headers.get("set-cookie");
    if (cookie) result.headers.set("set-cookie", cookie);
    return result;
  } catch {
    return NextResponse.json({detail:"La API del laboratorio no está disponible. Inicia FastAPI en el puerto configurado en LAB_API_URL."}, {status:503});
  }
}

export const GET = proxy;
export const POST = proxy;
export const PATCH = proxy;
