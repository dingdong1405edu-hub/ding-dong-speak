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
    "/history/:path*",
    "/review/:path*",
    "/billing/:path*",
    "/api/grade",
    "/api/transcribe",
    "/api/vocab/:path*",
    "/api/payment/create-link",
  ],
};
