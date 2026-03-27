"use client";

import { useState } from "react";
import { LogIn } from "lucide-react";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";

export function AuthForm() {
  const [loading, setLoading] = useState(false);

  return (
    <Button
      className="h-12 w-full rounded-2xl text-base"
      disabled={loading}
      type="button"
      onClick={async () => {
        setLoading(true);
        await signIn("google", { callbackUrl: "/dashboard" });
      }}
    >
      <LogIn className="mr-2 size-5" />
      {loading ? "Đang chuyển sang Google..." : "Tiếp tục với Google"}
    </Button>
  );
}
