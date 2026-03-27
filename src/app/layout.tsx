import type { Metadata } from "next";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { AppSessionProvider } from "@/components/providers/session-provider";
import { SignOutButton } from "@/components/forms/sign-out-button";
import { authOptions } from "@/lib/auth";
import "./globals.css";

export const metadata: Metadata = {
  title: "Ding Dong Speak",
  description: "Luyện IELTS Speaking với AI chấm điểm nghiêm khắc, mock test AI, question bank và thanh toán Premium.",
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const session = await getServerSession(authOptions);

  return (
    <html lang="vi">
      <body className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(236,72,153,0.10),transparent_22%),radial-gradient(circle_at_top_right,rgba(59,130,246,0.10),transparent_24%),linear-gradient(180deg,#fffaf7_0%,#fcfdff_55%,#f8fbff_100%)] text-zinc-900 antialiased">
        <AppSessionProvider>
          <div className="mx-auto min-h-screen max-w-7xl px-4 sm:px-6 lg:px-8">
            <header className="sticky top-0 z-30 mt-4 rounded-[28px] border border-white/70 bg-white/85 px-5 py-4 shadow-lg shadow-zinc-100/40 backdrop-blur">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <Link href={session?.user ? "/dashboard" : "/login"} className="text-xl font-semibold tracking-tight text-zinc-900">
                  Ding Dong Speak
                </Link>
                <nav className="flex flex-wrap items-center gap-2 text-sm text-zinc-600">
                  {session?.user ? (
                    <>
                      <Link href="/dashboard" className="rounded-full px-3 py-2 hover:bg-zinc-100">Dashboard</Link>
                      <Link href="/practice" className="rounded-full px-3 py-2 hover:bg-zinc-100">Luyện theo câu</Link>
                      <Link href="/mock-test" className="rounded-full px-3 py-2 hover:bg-zinc-100">Thi thử</Link>
                      <Link href="/history" className="rounded-full px-3 py-2 hover:bg-zinc-100">Lịch sử</Link>
                      <Link href="/review" className="rounded-full px-3 py-2 hover:bg-zinc-100">Ôn tập</Link>
                      <Link href="/billing" className="rounded-full bg-zinc-900 px-4 py-2 text-white">Premium</Link>
                      <SignOutButton />
                    </>
                  ) : (
                    <Link href="/login" className="rounded-full bg-zinc-900 px-4 py-2 text-white">Đăng nhập Google</Link>
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
