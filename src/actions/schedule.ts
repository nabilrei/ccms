"use server";

import { auth } from "@/auth";
import { db } from "@/db";
import { bookings, users, userCompetencies, competencies } from "@/db/schema";
import { eq, and, inArray, ilike } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function addCustomCompetency(name: string) {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Unauthorized");

    const trimmedName = name.trim();
    if (!trimmedName) throw new Error("Name is required");

    // Check if exists
    const existing = await db.query.competencies.findFirst({
        where: ilike(competencies.name, trimmedName),
    });

    if (existing) return existing.id;

    const [newCompetency] = await db.insert(competencies).values({
        name: trimmedName,
    }).returning({ id: competencies.id });

    revalidatePath("/dashboard");
    return newCompetency.id;
}

export async function updateUserCompetencies(competencyIds: string[]) {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Unauthorized");

    // Clear existing
    await db.delete(userCompetencies).where(eq(userCompetencies.userId, session.user.id));

    // Add new ones
    if (competencyIds.length > 0) {
        await db.insert(userCompetencies).values(
            competencyIds.map(id => ({
                userId: session.user.id,
                competencyId: id
            }))
        );
    }

    revalidatePath("/dashboard");
    revalidatePath("/");
}

export async function updateUserPosition(positionId: string) {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Unauthorized");

    await db.update(users)
        .set({ positionId })
        .where(eq(users.id, session.user.id));

    revalidatePath("/dashboard");
    revalidatePath("/");
}

export async function bookSession(formData: FormData) {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Unauthorized");

    const coachId = formData.get("coachId") as string;
    const dateStr = formData.get("date") as string;
    const startTime = formData.get("startTime") as string;
    const endTime = formData.get("endTime") as string;
    const topic = formData.get("topic") as string;
    const method = formData.get("method") as string;
    const notes = formData.get("notes") as string || ""; // Safe fallback

    if (!coachId || !dateStr || !startTime || !endTime || !topic || !method) {
        throw new Error("Missing required fields for booking");
    }

    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
        throw new Error("Invalid date format");
    }

    await db.insert(bookings).values({
        coacheeId: session.user.id,
        coachId: coachId,
        date: date,
        startTime: startTime,
        endTime: endTime,
        topic: topic,
        method: method,
        notes: notes,
        status: "pending",
    });

    revalidatePath("/dashboard/coachee");
    revalidatePath("/dashboard/coach");
}

export async function updateBookingStatus(bookingId: string, status: "accepted" | "rejected" | "completed") {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Unauthorized");

    // Verify user is the coach for this booking
    const booking = await db.query.bookings.findFirst({
        where: and(eq(bookings.id, bookingId), eq(bookings.coachId, session.user.id)),
    });

    if (!booking) {
        throw new Error("Booking not found or not authorized");
    }

    await db.update(bookings)
        .set({ status })
        .where(eq(bookings.id, bookingId));

    revalidatePath("/dashboard/coach");
}

export async function submitSessionReport(data: {
    bookingId: string;
    feedback: string;
    nextAction: string;
    status: "completed" | "accepted"; // Usually keep as accepted or move to completed? Let's say moves to completed.
}) {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Unauthorized");

    // Verify user is the coach for this booking
    const booking = await db.query.bookings.findFirst({
        where: and(eq(bookings.id, data.bookingId), eq(bookings.coachId, session.user.id)),
    });

    if (!booking) {
        throw new Error("Booking not found or not authorized");
    }

    await db.update(bookings)
        .set({
            feedback: data.feedback,
            nextAction: data.nextAction,
            status: data.status,
            updatedAt: new Date(),
        })
        .where(eq(bookings.id, data.bookingId));

    revalidatePath("/dashboard/coach");
}

export async function createCoachBooking(data: {
    coacheeId: string;
    date: Date;
    startTime: string;
    endTime: string;
    topic: string;
    method: string;
    batch?: string;
    notes?: string;
}) {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Unauthorized");

    await db.insert(bookings).values({
        coachId: session.user.id,
        coacheeId: data.coacheeId,
        date: data.date,
        startTime: data.startTime,
        endTime: data.endTime,
        topic: data.topic,
        method: data.method,
        batch: data.batch,
        notes: data.notes,
        status: "accepted", // Coach created -> auto accepted
    });

    revalidatePath("/dashboard/coach");
}

export async function submitCoacheeFeedback(data: {
    bookingId: string;
    rating: number;
    feedback: string;
}) {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Unauthorized");

    // Verify user is the coachee for this booking
    const booking = await db.query.bookings.findFirst({
        where: and(eq(bookings.id, data.bookingId), eq(bookings.coacheeId, session.user.id)),
    });

    if (!booking) {
        throw new Error("Booking not found or not authorized");
    }

    await db.update(bookings)
        .set({
            coacheeRating: data.rating,
            coacheeFeedback: data.feedback,
            updatedAt: new Date(),
        })
        .where(eq(bookings.id, data.bookingId));

    revalidatePath("/dashboard/coachee");
    revalidatePath("/dashboard/coach");
}
