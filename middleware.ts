import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  const response = NextResponse.next()

  // Headers de segurança adicionais
  response.headers.set("X-Content-Type-Options", "nosniff")
  response.headers.set("X-Frame-Options", "DENY")
  response.headers.set("X-XSS-Protection", "1; mode=block")
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin")
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()")

  // Prevenir caching de páginas sensíveis
  response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate")
  response.headers.set("Pragma", "no-cache")
  response.headers.set("Expires", "0")

  // Bloquear acesso direto a arquivos de código fonte
  const pathname = request.nextUrl.pathname
  const hasSession = request.cookies.has("hto_session")

  // Proteção de rotas
  if (!hasSession && pathname !== "/" && !pathname.startsWith("/api") && !pathname.startsWith("/_next") && pathname !== "/favicon.ico") {
    return NextResponse.redirect(new URL("/", request.url))
  }

  if (hasSession && pathname === "/") {
    return NextResponse.redirect(new URL("/dashboard", request.url))
  }

  if (
    pathname.endsWith(".tsx") ||
    pathname.endsWith(".ts") ||
    pathname.endsWith(".jsx") ||
    pathname.endsWith(".js") ||
    pathname.endsWith(".json") ||
    pathname.includes("_next/static") ||
    pathname.includes(".map")
  ) {
    // Permitir apenas assets necessários
    if (
      !pathname.includes("_next/static/chunks") &&
      !pathname.includes("_next/static/css") &&
      !pathname.includes("_next/static/media")
    ) {
      return new NextResponse(null, { status: 403 })
    }
  }

  return response
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}
