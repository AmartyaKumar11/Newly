import { type NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { connectToDatabase } from "@/lib/db";
import User from "@/models/User";

const googleClientId = process.env.GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;

if (!googleClientId || !googleClientSecret) {
  console.warn("Google OAuth environment variables are missing");
}

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
  providers: [
    GoogleProvider({
      clientId: googleClientId || "",
      clientSecret: googleClientSecret || "",
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (!user.email) {
        return false;
      }

      await connectToDatabase();

      // Find or create user in our database
      const existingUser = await User.findOne({ email: user.email });
      if (!existingUser) {
        await User.create({
          email: user.email,
          name: user.name || undefined,
          image: user.image || undefined,
        });
      } else {
        // Update user info if it changed
        await User.updateOne(
          { email: user.email },
          {
            $set: {
              name: user.name || existingUser.name,
              image: user.image || existingUser.image,
            },
          }
        );
      }

      return true;
    },
    async jwt({ token, user, account }) {
      // Initial sign in
      if (account && user) {
        token.accessToken = account.access_token;
        token.id = user.id || user.email;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = (token.id as string) || (token.sub as string);
      }
      return session;
    },
  },
};

