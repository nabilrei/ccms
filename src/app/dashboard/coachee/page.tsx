import { auth } from "@/auth";
import { db } from "@/db";
import { users, bookings } from "@/db/schema";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import CoacheeView from "./client-view";

export default async function CoacheePage() {
    const session = await auth();
    if (!session?.user) redirect("/login");

    // Fetch all users (potential coaches)
    const coaches = await db.query.users.findMany({
        with: {
            position: true,
            userCompetencies: {
                with: {
                    competency: true
                }
            }
        },
    });


    // Fetch my bookings
    const myBookings = await db.query.bookings.findMany({
        where: eq(bookings.coacheeId, session.user.id),
        with: {
            coach: true,
        },
        orderBy: (bookings, { desc }) => [desc(bookings.date)],
    });

    return (
        <div className="space-y-8">
            <div className="flex flex-col gap-2">
                <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">Find your Coach</h2>
                <p className="text-muted-foreground">Select a coach and book a session to accelerate your growth.</p>
            </div>
            <CoacheeView coaches={coaches} myBookings={myBookings} />
        </div>
    );
}
