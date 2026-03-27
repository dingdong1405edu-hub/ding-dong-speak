"use client";

import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";

export function SignOutButton() {
  return (
    <Button variant="ghost" size="sm" type="button" onClick={() => signOut({ callbackUrl: "/login" })}>
      Đăng xuất
    </Button>
  );
}
