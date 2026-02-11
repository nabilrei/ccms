import { DefaultSession } from "next-auth";

declare module "next-auth" {
    interface Session {
        user: {
            id: string;
            role: "admin" | "coach" | "coachee" | null;
            department?: string | null;
            bio?: string | null;
        } & DefaultSession["user"];
    }

    interface User {
        role?: "admin" | "coach" | "coachee" | null;
        department?: string | null;
        bio?: string | null;
    }
}
