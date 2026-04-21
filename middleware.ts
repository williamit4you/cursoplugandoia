import { withAuth } from "next-auth/middleware"

// Protege todas as rotas que começarem por /admin/ (exceto login)
export default withAuth({
  callbacks: {
    authorized({ req, token }) {
      const path = req.nextUrl.pathname;
      if (path.startsWith("/admin") && !path.startsWith("/admin/login")) {
        return !!token;
      }
      return true;
    },
  },
  pages: {
    signIn: "/admin/login",
  }
})

export const config = {
  matcher: ["/admin/:path*"],
}
