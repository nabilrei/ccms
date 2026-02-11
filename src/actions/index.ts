"use server";

import { auth } from "@/auth";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";

export async function setUserRole(role: "coach" | "coachee") {
    const session = await auth();

    if (!session?.user?.id) {
        redirect("/login");
    }

    try {
        await db.update(users)
            .set({ role })
            .where(eq(users.id, session.user.id));
    } catch (error) {
        console.error("Failed to update role:", error);
        throw new Error("Failed to set role");
    }

    // Revalidate path is not strictly needed if we redirect
    // But we might need to refresh session? NextAuth session strategy='database' checks DB, so it should be fine on next request.

    redirect("/dashboard");
}
