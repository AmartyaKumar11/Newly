import { withAuth } from "next-auth/middleware";

export default withAuth({
  pages: {
    signIn: "/login"
  }
});

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/editor/:path*"
  ],
  // Explicitly exclude API routes from middleware
  // This ensures NextAuth API routes work correctly
};

