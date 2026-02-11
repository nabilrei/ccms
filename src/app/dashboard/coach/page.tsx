import { auth } from "@/auth";
import { db } from "@/db";
import { bookings, users } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { redirect } from "next/navigation";
import CoachBookingsView from "./client-view";

export default async function CoachPage() {
    const session = await auth();
    if (!session?.user) redirect("/login");

    // Fetch bookings requested TO me (as a coach)
    const myBookings = await db.query.bookings.findMany({
        where: eq(bookings.coachId, session.user.id),
        with: {
            coachee: {
                with: {
                    position: true,
                }
            },
        },
        orderBy: [desc(bookings.date)],
    });

    // Fetch all coachees for the dropdown
    const coachees = await db.query.users.findMany({
        with: {
            position: true,
        }
    });

    return (
        <div className="space-y-8">
            <div className="flex flex-col gap-2">
                <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-teal-600 to-emerald-600 bg-clip-text text-transparent">Coach Dashboard</h2>
                <p className="text-muted-foreground">Manage your incoming coaching requests and schedule.</p>
            </div>
            <CoachBookingsView bookings={myBookings} coachees={coachees} />
        </div>
    );
}
