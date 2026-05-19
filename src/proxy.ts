/**
 * Next.js 16 reemplazó `middleware` por `proxy`. Esta función corre antes de
 * cada request matcheado y nos sirve para:
 * - Asegurar que el JWT cookie esté presente en rutas protegidas
 * - Redirigir según el estado del usuario (pending/approved/rejected/admin)
 *
 * La lógica fina de roles/permisos vive en los layouts y server actions; este
 * proxy solo redirige al login si no hay sesión.
 */
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

const PUBLIC_PATHS = ["/login", "/pending", "/rejected"];
const PUBLIC_PREFIXES = ["/api/auth", "/_next", "/favicon", "/icon"];

export default auth((req) => {
  const { pathname } = req.nextUrl;

  // Prefixes públicos (callbacks de auth, assets)
  if (PUBLIC_PREFIXES.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  const session = req.auth;

  // Si ya está logueado y aprobado, sacarlo de /login (no tiene sentido verlo)
  if (session?.user?.status === "approved" && pathname === "/login") {
    const url = req.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  // Resto de rutas públicas: dejar pasar
  if (PUBLIC_PATHS.includes(pathname)) {
    return NextResponse.next();
  }

  // Sin sesión → al login
  if (!session?.user) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // Con sesión, según status
  const status = session.user.status;
  const url = req.nextUrl.clone();

  if (status === "pending") {
    if (pathname !== "/pending") {
      url.pathname = "/pending";
      return NextResponse.redirect(url);
    }
  } else if (status === "rejected") {
    if (pathname !== "/rejected") {
      url.pathname = "/rejected";
      return NextResponse.redirect(url);
    }
  }

  // approved → continuar; admin-check fino lo hacen los layouts/actions
  return NextResponse.next();
});

/**
 * Matcher: corremos en todas las rutas excepto assets y API auth callbacks.
 * El proxy se ejecuta en Node.js runtime (no Edge) en Next 16.
 */
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon|icon|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
