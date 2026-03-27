import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: DefaultSession["user"] & {
      id: string;
      credits: number;
      isPro: boolean;
      streak: number;
    };
  }

  interface User {
    id: string;
    credits: number;
    isPro: boolean;
    streak: number;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    credits: number;
    isPro: boolean;
    streak: number;
  }
}
