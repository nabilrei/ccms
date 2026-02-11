import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

export const { handlers, auth, signIn, signOut } = NextAuth({
    adapter: DrizzleAdapter(db),
    providers: [
        Google({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        }),
    ],
    session: {
        strategy: "database",
    },
    callbacks: {
        async session({ session, user }) {
            if (session.user) {
                // Fetch fresh user data to get role
                const userData = await db.query.users.findFirst({
                    where: eq(users.id, user.id),
                });

                // Add role to session
                if (userData) {
                    session.user.role = userData.role;
                    session.user.id = userData.id;
                }
            }
            return session;
        },
    },
    pages: {
        signIn: "/login",
    },
});
