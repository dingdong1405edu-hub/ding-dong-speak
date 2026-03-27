import { AuthForm } from "@/components/forms/auth-form";
import { Card } from "@/components/ui/card";

export default function LoginPage() {
  return (
    <div className="mx-auto grid min-h-[76vh] max-w-6xl items-center gap-8 lg:grid-cols-[1.1fr_0.9fr]">
      <div className="space-y-6">
        <p className="text-sm uppercase tracking-[0.35em] text-rose-500">Google-only sign in</p>
        <h1 className="max-w-2xl text-4xl font-semibold leading-tight sm:text-5xl">Ding Dong Speak — luyện IELTS Speaking với AI, không còn form Tên / Email / Password nữa.</h1>
        <p className="max-w-xl text-base leading-8 text-zinc-600">Onboarding được rút gọn: chỉ bấm một nút đăng nhập Google là vào thẳng dashboard, credits, streak, lịch sử luyện tập và thanh toán đều gắn với cùng một tài khoản.</p>
        <div className="grid gap-4 sm:grid-cols-3">
          <Card className="p-5"><p className="text-sm text-zinc-500">Transcript</p><p className="mt-2 font-semibold">Deepgram</p></Card>
          <Card className="p-5"><p className="text-sm text-zinc-500">Band score</p><p className="mt-2 font-semibold">Groq JSON</p></Card>
          <Card className="p-5"><p className="text-sm text-zinc-500">Upgrade</p><p className="mt-2 font-semibold">PayOS</p></Card>
        </div>
      </div>
      <Card className="p-8 sm:p-10">
        <div className="space-y-4">
          <p className="text-sm uppercase tracking-[0.28em] text-zinc-500">Đăng nhập</p>
          <h2 className="text-2xl font-semibold">Chỉ đăng nhập bằng Google</h2>
          <p className="text-sm leading-7 text-zinc-600">Không có register form. Không có password local. Chỉ còn đúng một nút như anh muốn.</p>
        </div>
        <div className="mt-8">
          <AuthForm />
        </div>
      </Card>
    </div>
  );
}
