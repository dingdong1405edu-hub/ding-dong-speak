import type { Metadata } from "next";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { AppSessionProvider } from "@/components/providers/session-provider";
import { SignOutButton } from "@/components/forms/sign-out-button";
import { authOptions } from "@/lib/auth";
import "./globals.css";

export const metadata: Metadata = {
  title: "Ding Dong Speak",
  description: "Luyện IELTS Speaking với AI chấm điểm, sửa transcript và đăng nhập Google-only.",
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const session = await getServerSession(authOptions);

  return (
    <html lang="vi">
      <body className="min-h-screen bg-[linear-gradient(180deg,#fff9f6_0%,#fffdfb_45%,#f8fbff_100%)] text-zinc-900 antialiased">
        <AppSessionProvider>
          <div className="mx-auto min-h-screen max-w-7xl px-4 sm:px-6 lg:px-8">
            <header className="sticky top-0 z-30 mt-4 rounded-full border border-white/70 bg-white/85 px-5 py-3 shadow-sm backdrop-blur">
              <div className="flex items-center justify-between gap-4">
                <Link href={session?.user ? "/dashboard" : "/login"} className="text-lg font-semibold tracking-wide text-zinc-900">
                  Ding Dong Speak
                </Link>
                <nav className="flex items-center gap-3 text-sm text-zinc-600">
                  {session?.user ? (
                    <>
                      <Link href="/dashboard">Dashboard</Link>
                      <Link href="/practice">Luyện tập</Link>
                      <Link href="/history">Lịch sử</Link>
                      <Link href="/review">Ôn tập</Link>
                      <Link href="/billing">Mua Xịn</Link>
                      <SignOutButton />
                    </>
                  ) : (
                    <Link href="/login">Đăng nhập Google</Link>
                  )}
                </nav>
              </div>
            </header>
            <main className="py-8">{children}</main>
          </div>
        </AppSessionProvider>
      </body>
    </html>
  );
}
