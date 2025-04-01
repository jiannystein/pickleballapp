import { DefaultSession, DefaultUser } from "next-auth";
import { JWT } from "next-auth/jwt";

declare module "next-auth" {
  /**
   * Extends the default session type
   */
  interface Session {
    user: {
      id: string;
      isAdmin: boolean;
      avatarUrl?: string | null;
    } & DefaultSession["user"];
  }

  /**
   * Extends the default user type
   */
  interface User extends DefaultUser {
    id: string;
    isAdmin?: boolean;
    avatarUrl?: string | null;
  }
}

declare module "next-auth/jwt" {
  /**
   * Extends the JWT type
   */
  interface JWT {
    id: string;
    isAdmin?: boolean;
    avatarUrl?: string | null;
  }
} 