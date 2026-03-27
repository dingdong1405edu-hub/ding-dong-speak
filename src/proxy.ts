import { withAuth } from "next-auth/middleware";

export default withAuth({
  pages: {
    signIn: "/login",
  },
});

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/practice/:path*",
    "/billing/:path*",
    "/api/grade",
    "/api/transcribe",
    "/api/payment/create-link",
  ],
};
