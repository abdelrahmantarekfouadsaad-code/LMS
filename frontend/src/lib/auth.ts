import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";

const DJANGO_API = "http://127.0.0.1:8000/api";

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "placeholder_google_id",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "placeholder_google_secret",
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        try {
          // Step 1: Get JWT tokens from Django
          const res = await fetch(`${DJANGO_API}/auth/token/`, {
            method: "POST",
            body: JSON.stringify(credentials),
            headers: { "Content-Type": "application/json" }
          });
          
          const data = await res.json();

          if (!res.ok || !data.access) return null;

          // Step 2: Fetch full user profile to get role & onboarding state
          const meRes = await fetch(`${DJANGO_API}/accounts/me/`, {
            headers: { Authorization: `Bearer ${data.access}` }
          });
          const meData = await meRes.json();

          return {
            id: String(meData.id || "0"),
            email: credentials.email,
            name: meData.full_name || credentials.email,
            accessToken: data.access,
            refreshToken: data.refresh,
            role: meData.role || "STUDENT",
            isOnboarded: meData.is_onboarded ?? false,
          };
        } catch (error) {
          console.error("Auth error:", error);
          return null;
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user, account, trigger, session }) {
      // Initial sign in
      if (account && user) {
        if (account.provider === 'google') {
          // If Google OAuth, sync with Django to get a native JWT
          try {
            const res = await fetch(`${DJANGO_API}/auth/google/`, {
              method: "POST",
              body: JSON.stringify({ token: account.id_token }),
              headers: { "Content-Type": "application/json" }
            });
            const data = await res.json();
            if (res.ok) {
              token.accessToken = data.access;
              token.refreshToken = data.refresh;
              token.role = data.role;
              token.isOnboarded = data.is_onboarded ?? false;
            }
          } catch (error) {
            console.error("Google Sync Error:", error);
          }
        } else {
          // Standard Credentials login
          token.accessToken = user.accessToken;
          token.refreshToken = user.refreshToken;
          token.role = user.role;
          token.isOnboarded = user.isOnboarded;
        }
      }

      // Allow session updates (e.g., after onboarding completes)
      if (trigger === "update" && session) {
        if (session.isOnboarded !== undefined) token.isOnboarded = session.isOnboarded;
        if (session.role) token.role = session.role;
        if (session.name) token.name = session.name;
        if (session.email) token.email = session.email;
      }

      return token;
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken as string;
      session.error = token.error as string;
      session.user.role = token.role as string;
      session.user.isOnboarded = token.isOnboarded as boolean;
      if (token.name) session.user.name = token.name;
      if (token.email) session.user.email = token.email;
      return session;
    }
  },
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET || "super-secret-master-key",
};
