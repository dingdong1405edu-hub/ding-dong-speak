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
    "/mock-test/:path*",
    "/history/:path*",
    "/review/:path*",
    "/billing/:path*",
    "/api/grade",
    "/api/mock/:path*",
    "/api/transcribe",
    "/api/vocab/:path*",
    "/api/questions/:path*",
    "/api/examiner/:path*",
    "/api/payment/create-link",
  ],
};
