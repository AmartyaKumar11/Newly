import { MongoDBAdapter } from "@auth/mongodb-adapter";
import { type NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { connectToDatabase } from "@/lib/db";
import clientPromise from "@/lib/mongodb";
import User from "@/models/User";

const googleClientId = process.env.GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;

if (!googleClientId || !googleClientSecret) {
  console.warn("Google OAuth environment variables are missing");
}

export const authOptions: NextAuthOptions = {
  adapter: MongoDBAdapter(clientPromise),
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
    async signIn({ user }) {
      await connectToDatabase();

      if (!user.email) {
        return false;
      }

      const existingUser = await User.findOne({ email: user.email });
      if (!existingUser) {
        await User.create({
          email: user.email,
          name: user.name,
          image: user.image,
        });
      }

      return true;
    },
    async jwt({ token }) {
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
      }
      return session;
    },
  },
  events: {
    async linkAccount({ user }) {
      if (!user?.email) return;
      await connectToDatabase();
      await User.updateOne({ email: user.email }, { $set: { email: user.email } });
    },
  },
};

