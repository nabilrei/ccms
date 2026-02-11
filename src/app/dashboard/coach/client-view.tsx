"use strict";
"use client";

import { createCoachBooking, updateBookingStatus, submitSessionReport } from "@/actions/schedule";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useTransition, useState } from "react";
import { toast } from "sonner";
import { Calendar, Clock, User, CheckCircle, XCircle, AlertCircle, Loader2, Star } from "lucide-react";

type Booking = {
    id: string;
    date: Date;
    startTime: string | null;
    endTime: string | null;
    method: string | null;
    batch: string | null;
    status: "pending" | "accepted" | "rejected" | "completed" | "cancelled" | null;
    topic: string | null;
    notes: string | null;
    feedback: string | null;
    nextAction: string | null;
    coacheeRating: number | null;
    coacheeFeedback: string | null;
    coachee: {
        id: string;
        name: string | null;
        image: string | null;
        email: string | null;
        role: "coachee" | "coach" | "admin" | null;
    };
};

type Coachee = {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
    position?: { name: string } | null;
};

function ReportDialog({ booking, children, onReportSubmit, isPending }: {
    booking: Booking;
    children: React.ReactNode;
    onReportSubmit: (formData: FormData) => void;
    isPending: boolean;
}) {
    return (
        <Dialog>
            <DialogTrigger asChild>
                {children}
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Session Report</DialogTitle>
                    <DialogDescription>
                        Provide feedback and next steps for {booking.coachee.name}.
                    </DialogDescription>
                </DialogHeader>
                <form action={onReportSubmit} className="space-y-4 py-4">
                    <input type="hidden" name="bookingId" value={booking.id} />

                    <div className="space-y-2">
                        <Label htmlFor={`feedback-${booking.id}`}>Feedback / Session Summary</Label>
                        <Input id={`feedback-${booking.id}`} name="feedback" required placeholder="What was discussed?" />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor={`nextAction-${booking.id}`}>Next Action / Steps</Label>
                        <Input id={`nextAction-${booking.id}`} name="nextAction" required placeholder="What needs to be done next?" />
                    </div>

                    <DialogFooter>
                        <Button type="submit" disabled={isPending}>
                            {isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : "Submit Report"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

export default function CoachBookingsView({ bookings, coachees }: { bookings: any[]; coachees: any[] }) {
    const allBookings = bookings as unknown as Booking[];
    const [isPending, startTransition] = useTransition();

    // Filter bookings based on status and date
    // Upcoming: Pending (needs action) or Accepted future sessions
    const now = new Date();
    const upcoming = allBookings.filter(
        (b) => (b.status === "accepted" || b.status === "pending") && new Date(b.date) >= now
    );
    const pendingRequests = allBookings.filter((b) => b.status === "pending");
    const confirmedUpcoming = allBookings.filter((b) => b.status === "accepted" && new Date(b.date) >= now);

    const feedback = allBookings.filter(
        (b) => b.status === "accepted" && new Date(b.date) < now
    );
    const closed = allBookings.filter(
        (b) => b.status === "completed" || b.status === "cancelled" || b.status === "rejected"
    );

    async function handleApprove(bookingId: string) {
        startTransition(async () => {
            try {
                await updateBookingStatus(bookingId, "accepted");
                toast.success("Session approved");
            } catch (error) {
                toast.error("Failed to approve session");
            }
        });
    }

    async function handleReject(bookingId: string) {
        startTransition(async () => {
            try {
                await updateBookingStatus(bookingId, "rejected");
                toast.error("Session rejected");
            } catch (error) {
                toast.error("Failed to reject session");
            }
        });
    }

    async function handleCreateBooking(formData: FormData) {
        startTransition(async () => {
            try {
                const coacheeId = formData.get("coacheeId") as string;
                const dateStr = formData.get("date") as string;
                const startTime = formData.get("startTime") as string;
                const endTime = formData.get("endTime") as string;
                const topic = formData.get("topic") as string;
                const method = formData.get("method") as string;
                const batch = formData.get("batch") as string;

                if (!coacheeId || !dateStr || !startTime || !endTime || !topic || !method) {
                    toast.error("Please fill all required fields");
                    return;
                }

                await createCoachBooking({
                    coacheeId,
                    date: new Date(dateStr),
                    startTime,
                    endTime,
                    topic,
                    method,
                    batch: batch || undefined,
                });
                toast.success("Scheduled successfully");
            } catch (error) {
                console.error(error);
                toast.error("Failed to schedule session");
            }
        });
    }

    async function handleSessionReport(formData: FormData) {
        startTransition(async () => {
            try {
                const bookingId = formData.get("bookingId") as string;
                const feedbackText = formData.get("feedback") as string;
                const nextAction = formData.get("nextAction") as string;

                if (!feedbackText || !nextAction) {
                    toast.error("Please fill all fields");
                    return;
                }

                await submitSessionReport({
                    bookingId,
                    feedback: feedbackText,
                    nextAction,
                    status: "completed"
                });
                toast.success("Report submitted successfully");
            } catch (error) {
                console.error(error);
                toast.error("Failed to submit report");
            }
        });
    }

    const taskCount = upcoming.length;

    return (
        <Tabs defaultValue="upcoming" className="w-full">
            <TabsList className="grid w-full grid-cols-3 max-w-[500px] mb-4">
                <TabsTrigger value="create">Create</TabsTrigger>
                <TabsTrigger value="upcoming" className="gap-2">
                    Tasks
                    {taskCount > 0 && (
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-600 text-[10px] font-bold text-white shadow-sm ring-2 ring-white transition-all">
                            {taskCount}
                        </span>
                    )}
                </TabsTrigger>
                <TabsTrigger value="closed">History</TabsTrigger>
            </TabsList>

            {/* Create Tab */}
            <TabsContent value="create">
                <Card>
                    <CardHeader>
                        <CardTitle>Schedule a Session</CardTitle>
                        <CardDescription>Create a new coaching session for a participant.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <form action={handleCreateBooking} className="grid gap-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="date">Date</Label>
                                    <Input id="date" name="date" type="date" required />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="startTime">Start Time</Label>
                                    <Input id="startTime" name="startTime" type="time" required />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="endTime">End Time</Label>
                                    <Input id="endTime" name="endTime" type="time" required />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="type">Type</Label>
                                    <Input id="type" name="type" placeholder="e.g. 1-on-1, Assessment" />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="topic">Competencies Topic</Label>
                                <Input id="topic" name="topic" placeholder="e.g. Leadership, Technical Skills" required />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="method">Method</Label>
                                    <select
                                        id="method"
                                        name="method"
                                        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                                        required
                                    >
                                        <option value="offline">Offline</option>
                                        <option value="online">Online</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="batch">Choose Batch (Optional)</Label>
                                    <Input id="batch" name="batch" placeholder="e.g. Batch 2024" />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="participant">Choose Participant</Label>
                                <select
                                    id="participant"
                                    name="coacheeId"
                                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                                    required
                                >
                                    <option value="" disabled selected>Select a coachee</option>
                                    {coachees.map((c: Coachee) => (
                                        <option key={c.id} value={c.id}>
                                            {c.name} — {c.position?.name || "No Position"} ({c.email})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <Button type="submit" className="w-full bg-yellow-400 text-black hover:bg-yellow-500 font-semibold" disabled={isPending}>
                                {isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : "Add Session"}
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </TabsContent>

            {/* Upcoming Tab merged with Feedback tasks */}
            <TabsContent value="upcoming">
                <Card>
                    <CardHeader>
                        <CardTitle>Tasks & Schedule</CardTitle>
                        <CardDescription>Manage requests, submit reports, and view upcoming sessions.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-8">

                        {/* 1. Needs Report Section (High Priority) */}
                        {feedback.length > 0 && (
                            <div className="space-y-3">
                                <h3 className="text-sm font-semibold text-red-600 uppercase tracking-wider flex items-center gap-2">
                                    <AlertCircle className="w-4 h-4" /> Action Required: Submit Reports
                                </h3>
                                <div className="space-y-3">
                                    {feedback.map((booking) => (
                                        <ReportDialog key={booking.id} booking={booking} onReportSubmit={handleSessionReport} isPending={isPending}>
                                            <div className="cursor-pointer flex items-center justify-between p-4 border border-red-200 bg-red-50 rounded-lg hover:bg-red-100 transition-colors">
                                                <div className="space-y-1">
                                                    <p className="font-semibold">{booking.topic}</p>
                                                    <div className="flex items-center gap-4 text-sm text-gray-600">
                                                        <span>with {booking.coachee.name}</span>
                                                        <span>• {new Date(booking.date).toLocaleDateString()}</span>
                                                    </div>
                                                </div>
                                                <Button size="sm" className="bg-red-600 hover:bg-red-700 text-white pointer-events-none">
                                                    Write Report
                                                </Button>
                                            </div>
                                        </ReportDialog>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* 2. Pending Requests Section */}
                        {pendingRequests.length > 0 && (
                            <div className="space-y-3">
                                <h3 className="text-sm font-semibold text-yellow-600 uppercase tracking-wider flex items-center gap-2">
                                    <AlertCircle className="w-4 h-4" /> Coaching Requests
                                </h3>
                                <div className="space-y-3">
                                    {pendingRequests.map((booking) => (
                                        <div key={booking.id} className="flex flex-col md:flex-row md:items-center justify-between p-4 border border-yellow-200 bg-yellow-50/50 rounded-lg gap-4">
                                            <div className="space-y-1">
                                                <p className="font-semibold text-lg">{booking.topic || "Coaching Request"}</p>
                                                <div className="grid grid-cols-2 gap-x-8 gap-y-1 text-sm text-gray-600">
                                                    <span className="flex items-center gap-2"><User className="w-4 h-4" /> {booking.coachee.name}</span>
                                                    <span className="flex items-center gap-2"><Calendar className="w-4 h-4" /> {new Date(booking.date).toLocaleDateString()}</span>
                                                    <span className="flex items-center gap-2"><Clock className="w-4 h-4" /> {booking.startTime} - {booking.endTime}</span>
                                                    <span className="capitalize">{booking.method}</span>
                                                </div>
                                                {booking.notes && <p className="text-sm text-gray-500 italic mt-2">"{booking.notes}"</p>}
                                            </div>
                                            <div className="flex gap-2">
                                                <Button size="sm" onClick={() => handleApprove(booking.id)} disabled={isPending} className="bg-green-600 hover:bg-green-700 text-white">
                                                    Accept
                                                </Button>
                                                <Button size="sm" variant="outline" onClick={() => handleReject(booking.id)} disabled={isPending} className="text-red-600 border-red-200 hover:bg-red-50">
                                                    Reject
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* 3. Confirmed Upcoming Section */}
                        <div className="space-y-3">
                            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Upcoming Schedule</h3>
                            {confirmedUpcoming.length === 0 ? (
                                <p className="text-sm text-muted-foreground italic">No upcoming confirmed sessions.</p>
                            ) : (
                                confirmedUpcoming.map((booking) => (
                                    <ReportDialog key={booking.id} booking={booking} onReportSubmit={handleSessionReport} isPending={isPending}>
                                        <div className="cursor-pointer group relative overflow-hidden flex items-center justify-between p-4 border rounded-lg hover:bg-card hover:shadow-md hover:border-indigo-300 transition-all">
                                            <div className="space-y-1">
                                                <p className="font-medium leading-none group-hover:text-indigo-600 transition-colors">{booking.topic || "General Session"}</p>
                                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                    <User className="h-3 w-3" />
                                                    <span>{booking.coachee.name}</span>
                                                </div>
                                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                    <Calendar className="h-3 w-3" />
                                                    <span>{new Date(booking.date).toLocaleDateString()}</span>
                                                    <Clock className="h-3 w-3 ml-2" />
                                                    <span>{booking.startTime || "?"} - {booking.endTime || "?"}</span>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <span className="px-2.5 py-0.5 rounded-full text-xs font-medium border bg-green-100 text-green-800 border-green-200 group-hover:hidden">
                                                    Confirmed
                                                </span>
                                                <span className="hidden group-hover:inline-flex px-3 py-1 rounded bg-indigo-600 text-white text-xs font-medium">
                                                    Report
                                                </span>
                                            </div>
                                        </div>
                                    </ReportDialog>
                                ))
                            )}
                        </div>
                    </CardContent>
                </Card>
            </TabsContent>

            {/* Closed Tab */}
            <TabsContent value="closed">
                <Card>
                    <CardHeader>
                        <CardTitle>History</CardTitle>
                        <CardDescription>All completed and past sessions.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {closed.length === 0 ? (
                            <p className="text-center text-muted-foreground py-8">No closed sessions.</p>
                        ) : (
                            <div className="space-y-4">
                                {closed.map((booking) => (
                                    <div key={booking.id} className="flex items-center justify-between p-4 border rounded-lg bg-card opacity-75">
                                        <div className="space-y-1">
                                            <p className="font-medium leading-none line-through">{booking.topic}</p>
                                            <p className="text-sm text-muted-foreground">with {booking.coachee.name}</p>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className={cn(
                                                    "px-2.5 py-0.5 rounded-full text-xs font-medium border capitalize",
                                                    booking.status === "completed" ? "bg-blue-100 text-blue-800" : "bg-red-100 text-red-800"
                                                )}>
                                                    {booking.status}
                                                </span>
                                            </div>
                                            {(booking.feedback || booking.nextAction) && (
                                                <div className="text-xs text-gray-500 mt-2 bg-gray-50 p-2 rounded">
                                                    <p><strong>Coach Report:</strong> {booking.feedback}</p>
                                                    <p><strong>Next Action:</strong> {booking.nextAction}</p>
                                                </div>
                                            )}
                                            {booking.coacheeRating && (
                                                <div className="text-xs text-indigo-600 mt-2 bg-indigo-50 p-2 rounded border border-indigo-100">
                                                    <div className="flex items-center gap-1 mb-1">
                                                        <span className="font-bold">Coachee Rating:</span>
                                                        <div className="flex">
                                                            {[1, 2, 3, 4, 5].map((s) => (
                                                                <Star key={s} className={cn("w-3 h-3", s <= (booking.coacheeRating || 0) ? "fill-current text-yellow-500" : "text-gray-300")} />
                                                            ))}
                                                        </div>
                                                    </div>
                                                    <p><strong>Coachee Feedback:</strong> "{booking.coacheeFeedback || "No comments"}"</p>
                                                </div>
                                            )}
                                        </div>
                                        <Dialog>
                                            <DialogTrigger asChild>
                                                <Button size="sm" variant="ghost">Detail</Button>
                                            </DialogTrigger>
                                            <DialogContent>
                                                <DialogHeader>
                                                    <DialogTitle>Session Detail</DialogTitle>
                                                </DialogHeader>
                                                <div className="space-y-4">
                                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                                        <div>
                                                            <p className="text-muted-foreground">Topic</p>
                                                            <p className="font-medium">{booking.topic}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-muted-foreground">Date</p>
                                                            <p className="font-medium">{new Date(booking.date).toLocaleDateString()}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-muted-foreground">Participant</p>
                                                            <p className="font-medium">{booking.coachee.name}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-muted-foreground">Status</p>
                                                            <p className="font-medium capitalize">{booking.status}</p>
                                                        </div>
                                                    </div>

                                                    <div className="space-y-2 border-t pt-4">
                                                        <p className="text-sm font-semibold">Coach Report</p>
                                                        <p className="text-sm text-gray-600">{booking.feedback || "-"}</p>
                                                        <p className="text-xs font-medium text-gray-500">Next Action: {booking.nextAction || "-"}</p>
                                                    </div>

                                                    {booking.coacheeRating && (
                                                        <div className="space-y-2 border-t pt-4">
                                                            <p className="text-sm font-semibold">Coachee Feedback</p>
                                                            <div className="flex gap-1 mb-1">
                                                                {[1, 2, 3, 4, 5].map((s) => (
                                                                    <Star key={s} className={cn("w-4 h-4", s <= (booking.coacheeRating || 0) ? "fill-current text-yellow-500" : "text-gray-300")} />
                                                                ))}
                                                            </div>
                                                            <p className="text-sm text-gray-600 italic">"{booking.coacheeFeedback || "-"}"</p>
                                                        </div>
                                                    )}
                                                </div>
                                            </DialogContent>
                                        </Dialog>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </TabsContent>
        </Tabs>
    );
}
