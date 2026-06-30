import NextAuth from "next-auth";
import { authConfig } from "./auth.config";
import { NextResponse } from "next/server";

// Bu sayfalar oturum açmadan erişilebilir
const PUBLIC_PATHS = ["/login"];

// Bu route hangi permission key'ini gerektiriyor
const ROUTE_PERMISSION_MAP: Record<string, string> = {
  "/projeler": "projeler_goruntule",
  "/giderler": "giderler_goruntule",
  "/taseron": "taseron_goruntule",
  "/satislar": "satislar_goruntule",
  "/analiz": "analiz_goruntule",
  "/raporlar": "raporlar_goruntule",
  "/ofis": "ofis_goruntule",
  "/ayarlar": "ayarlar_goruntule",
};

export default NextAuth(authConfig).auth((req) => {
  const { nextUrl } = req;
  const session = req.auth;
  const isLoggedIn = !!session;
  const path = nextUrl.pathname;

  // Public sayfalar — giriş gerekmez
  if (PUBLIC_PATHS.some((p) => path.startsWith(p))) {
    // Zaten giriş yapmışsa ana sayfaya yönlendir
    if (isLoggedIn) {
      return NextResponse.redirect(new URL("/", nextUrl));
    }
    return NextResponse.next();
  }

  // API rotaları NextAuth için
  if (path.startsWith("/api/auth")) {
    return NextResponse.next();
  }

  // Giriş yapılmamışsa login'e yönlendir
  if (!isLoggedIn) {
    return NextResponse.redirect(new URL("/login", nextUrl));
  }

  const user = session.user as any;

  // Eski veya geçersiz çerez (cookie) varsa tekrar login'e at
  if (!user || user.isAdmin === undefined) {
    // Çerezleri temizlemek veya redirect atmak için NextResponse kullanıyoruz
    const response = NextResponse.redirect(new URL("/login", nextUrl));
    response.cookies.delete("authjs.session-token");
    response.cookies.delete("next-auth.session-token");
    return response;
  }

  // Admin her şeye erişebilir
  if (user.isAdmin) return NextResponse.next();

  // Kullanıcı yönetimi sadece admin
  if (path.startsWith("/kullanicilar")) {
    return NextResponse.redirect(new URL("/", nextUrl));
  }

  // Modül bazlı izin kontrolü
  const matchedRoute = Object.keys(ROUTE_PERMISSION_MAP).find((route) =>
    path.startsWith(route)
  );

  if (matchedRoute) {
    const requiredPermission = ROUTE_PERMISSION_MAP[matchedRoute];
    let permissions: Record<string, boolean> = {};
    try {
      permissions = JSON.parse(user.permissions || "{}");
    } catch {}

    if (!permissions[requiredPermission]) {
      return NextResponse.redirect(new URL("/", nextUrl));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
