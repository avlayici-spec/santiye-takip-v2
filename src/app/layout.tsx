import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/sidebar/Sidebar";
import { getCompanySettings } from "@/app/actions/settings";
import { SessionProvider } from "@/components/auth/SessionProvider";
import { auth } from "@/auth";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "İnşaat Takip Sistemi",
  description: "Müteahhitler için kapsamlı inşaat ve finans takip sistemi",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  const settingsResult = await getCompanySettings();
  const companyName = settingsResult.success
    ? settingsResult.settings?.name
    : "İnşaatTakip";

  // Giriş yapılmamışsa sidebar olmadan göster (login sayfası)
  if (!session) {
    return (
      <html lang="tr">
        <body className={inter.className}>
          <SessionProvider>{children}</SessionProvider>
        </body>
      </html>
    );
  }

  return (
    <html lang="tr">
      <body className={inter.className}>
        <SessionProvider>
          <div className="flex min-h-screen bg-slate-50">
            <Sidebar
              companyName={companyName}
              className="hidden lg:flex"
              sessionUser={session.user as any}
            />
            <main className="flex-1">
              <div className="max-w-7xl mx-auto p-4 md:p-8 lg:p-10">
                {children}
              </div>
            </main>
          </div>
        </SessionProvider>
      </body>
    </html>
  );
}
