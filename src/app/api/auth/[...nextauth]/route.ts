/* eslint-disable @typescript-eslint/no-explicit-any */
import NextAuth, {
  NextAuthOptions,
  DefaultSession,
  DefaultUser,
} from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { initServer, db } from "../../../../lib/initServer";
import type { Pool } from "mysql2/promise";
import { getCurrentDateTime } from "../../../../utils/Variables/getDateTime.util";
import bcrypt from "bcryptjs";
import {
  isEmail,
  sanitizeString,
} from "../../../../utils/Validator/NextAuth.util";
import { CREDENTIALS_SESSION_TTL } from "../../../../utils/TTL";

let pool: Pool | null = null;
async function getPool(): Promise<Pool> {
  if (!pool) {
    await initServer();
    pool = db();
  }
  return pool;
}

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      username: string;
      email: string;
      is_admin?: boolean;
      created_at?: Date;
      updated_at?: Date | null;
    } & DefaultSession["user"];
  }

  interface User extends DefaultUser {
    id: string;
    username: string;
    email: string;
    is_admin?: boolean;
    created_at?: Date;
    updated_at?: Date | null;
  }
}

const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
    maxAge: CREDENTIALS_SESSION_TTL,
  },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        identifier: {
          label: "Email or Username",
          type: "text",
          placeholder: "Enter your email or username",
        },
        password: {
          label: "Password",
          type: "password",
        },
      },
      async authorize(credentials) {
        if (!credentials?.identifier || !credentials?.password) {
          throw new Error("Email/Username and password are required");
        }

        const identifier = sanitizeString(credentials.identifier);
        const password = sanitizeString(credentials.password);

        try {
          const pool = await getPool();
          let user = null;

          if (isEmail(identifier)) {
            const [rowsByEmail] = await pool.execute<any[]>(
              "SELECT id, username, email, password_hash, created_at, updated_at FROM users WHERE email = ?",
              [identifier]
            );

            if (Array.isArray(rowsByEmail) && rowsByEmail.length > 0) {
              user = rowsByEmail[0];
            }
          } else {
            const [rowsByUsername] = await pool.execute<any[]>(
              "SELECT id, username, email, password_hash, is_admin, created_at, updated_at FROM users WHERE username = ?",
              [identifier]
            );

            if (Array.isArray(rowsByUsername) && rowsByUsername.length > 0) {
              user = rowsByUsername[0];
            }
          }

          if (!user) {
            throw new Error("Invalid credentials");
          }

          const isValidPassword = await bcrypt.compare(
            password,
            user.password_hash
          );
          if (!isValidPassword) {
            throw new Error("Invalid credentials");
          }

          const now = getCurrentDateTime();
          await pool.execute("UPDATE users SET updated_at = ? WHERE id = ?", [
            now,
            user.id,
          ]);

          return {
            id: user.id,
            username: user.username,
            email: user.email,
            is_admin: user.is_admin,
            created_at: user.created_at,
            updated_at: user.updated_at,
          };
        } catch (error: any) {
          console.error("Authorization error:", error.message);

          if (error.message.includes("credentials")) {
            throw new Error("Invalid email/username or password");
          }

          throw new Error("Authentication failed. Please try again.");
        }
      },
    }),
  ],
  pages: {
    signIn: "/login",
    error: "/login",
  },

  callbacks: {
    async jwt({ token, user, trigger }) {
      const t = token as any;

      if (user) {
        t.id = user.id;
        t.username = user.username;
        t.email = user.email;
        t.is_admin = user.is_admin;
        t.created_at = user.created_at;
        t.updated_at = user.updated_at;
      }

      if (trigger === "update") {
        try {
          const pool = await getPool();
          const [rows] = await pool.execute<any[]>(
            "SELECT id, username, email, created_at, updated_at FROM users WHERE id = ?",
            [t.id]
          );

          if (Array.isArray(rows) && rows.length > 0) {
            const dbUser = rows[0];
            t.username = dbUser.username ?? t.username;
            t.email = dbUser.email ?? t.email;
            t.updated_at = dbUser.updated_at;
          }
        } catch (error) {
          console.error("Error updating JWT:", error);
        }
      }

      return t;
    },

    async session({ session, token }) {
      const t = token as any;

      if (session.user) {
        session.user.id = t.id;
        session.user.username = t.username;
        session.user.email = t.email;
        session.user.is_admin = t.is_admin;
        session.user.created_at = t.created_at;
        session.user.updated_at = t.updated_at;
      }

      return session;
    },

    async redirect({ url, baseUrl }) {
      if (url.startsWith(baseUrl)) return url;
      return baseUrl + "/dashboard";
    },
  },

  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === "development",
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
export { authOptions };
