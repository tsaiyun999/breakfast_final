import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import GitHubProvider from "next-auth/providers/github";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "../../../lib/prisma";

const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const { email, password } = credentials ?? {};
        if (!email || !password) throw new Error("請填寫帳號與密碼");

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user || user.password !== password) throw new Error("帳號或密碼錯誤");
        if (user.isBanned) throw new Error("AccessDenied");

        return user;
      },
    }),
  ],

  callbacks: {
    async signIn({ user }) {
      try {
        if (!user?.email) return false;

        const existingUser = await prisma.user.findUnique({
          where: { email: user.email },
        });

        if (!existingUser) {
          await prisma.user.create({
            data: {
              email: user.email,
              name: user.name || "未命名",
              password: "",
              role: "CUSTOMER",
              isBanned: false,
            },
          });
          return true;
        }

        if (existingUser.isBanned) throw new Error("AccessDenied");

        return true;
      } catch (error) {
        console.error("signIn error:", error);
        return false;
      }
    },

    async jwt({ token, user }) {
      if (user?.email) {
        const dbUser = await prisma.user.findUnique({
          where: { email: user.email },
        });

        if (dbUser) {
          token.role = dbUser.role;
          token.id = dbUser.id;
          token.isBanned = dbUser.isBanned;
        }
      }
      return token;
    },

    async session({ session, token }) {
      if (token) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.isBanned = token.isBanned;
      }
      return session;
    },

    async redirect({ url, baseUrl }) {
      if (url?.includes("/api/auth/error")) {
        return `${baseUrl}/login?error=AccessDenied`;
      }

      return `${baseUrl}/auth/redirect`; // 統一導向這個頁面做前端跳轉
    },
  },

  pages: {
    signIn: "/login",
    error: "/login",
  },

  secret: process.env.AUTH_SECRET,
};

export default NextAuth(authOptions);
