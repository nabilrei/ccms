"use strict";
"use client";

import { bookSession, submitCoacheeFeedback } from "@/actions/schedule";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { useTransition, useState } from "react";
import { toast } from "sonner";
import { Calendar, Clock, MapPin, Video, CheckCircle2, XCircle, Clock3, MoreVertical, MessageSquare, Star, User, Search, Check, Loader2 } from "lucide-react";

type Coach = {
    id: string;
    name: string | null;
    image: string | null;
    department: string | null;
    bio: string | null;
    position?: { name: string } | null;
    userCompetencies?: { competency: { name: string } }[] | null;
};

type Booking = {
    id: string;
    date: Date;
    startTime: string | null;
    endTime: string | null;
    method: string | null;
    status: "pending" | "accepted" | "rejected" | "completed" | "cancelled" | null;
    topic: string | null;
    notes: string | null;
    feedback: string | null;
    nextAction: string | null;
    coacheeRating: number | null;
    coacheeFeedback: string | null;
    coach: Coach;
};

function ViewReportDialog({ booking, children }: { booking: Booking; children: React.ReactNode }) {
    const [rating, setRating] = useState(booking.coacheeRating || 0);
    const [hoverRating, setHoverRating] = useState(0);
    const [feedback, setFeedback] = useState(booking.coacheeFeedback || "");
    const [isPending, startTransition] = useTransition();

    async function handleSubmitRating() {
        if (rating === 0) {
            toast.error("Please select a rating");
            return;
        }
        startTransition(async () => {
            try {
                await submitCoacheeFeedback({
                    bookingId: booking.id,
                    rating,
                    feedback,
                });
                toast.success("Feedback submitted! Thank you.");
            } catch (err) {
                toast.error("Failed to submit feedback");
            }
        });
    }

    const isRated = !!booking.coacheeRating;

    return (
        <Dialog>
            <DialogTrigger asChild>
                {children}
            </DialogTrigger>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Session Report</DialogTitle>
                    <DialogDescription>
                        Feedback and next steps from your coach, {booking.coach.name}.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-6 py-4">
                    <div className="space-y-4">
                        <div className="space-y-1">
                            <Label className="text-muted-foreground text-xs uppercase tracking-wider">Feedback / Summary</Label>
                            <p className="text-sm bg-gray-50 p-3 rounded-md border">{booking.feedback || "No feedback provided."}</p>
                        </div>

                        <div className="space-y-1">
                            <Label className="text-muted-foreground text-xs uppercase tracking-wider">Next Action / Steps</Label>
                            <p className="text-sm bg-gray-50 p-3 rounded-md border">{booking.nextAction || "No next actions specified."}</p>
                        </div>
                    </div>

                    <div className="border-t pt-6 space-y-4">
                        <div className="text-center space-y-2">
                            <h4 className="font-semibold text-sm">Rate your experience</h4>
                            <div className="flex justify-center gap-1">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <button
                                        key={star}
                                        disabled={isRated || isPending}
                                        onMouseEnter={() => !isRated && setHoverRating(star)}
                                        onMouseLeave={() => !isRated && setHoverRating(0)}
                                        onClick={() => setRating(star)}
                                        className={cn(
                                            "p-1 transition-colors",
                                            (hoverRating || rating) >= star ? "text-yellow-400" : "text-gray-300",
                                            isRated ? "cursor-default" : "cursor-pointer hover:scale-110"
                                        )}
                                    >
                                        <Star className={cn("w-8 h-8", (hoverRating || rating) >= star && "fill-current")} />
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="coachee-feedback" className="text-sm">Your feedback (Optional)</Label>
                            {isRated ? (
                                <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-md border italic">
                                    "{booking.coacheeFeedback || "No feedback given"}"
                                </p>
                            ) : (
                                <Textarea
                                    id="coachee-feedback"
                                    placeholder="Tell us about the session..."
                                    value={feedback}
                                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFeedback(e.target.value)}
                                    disabled={isPending}
                                />
                            )}
                        </div>

                        {!isRated && (
                            <Button
                                onClick={handleSubmitRating}
                                disabled={isPending || rating === 0}
                                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
                            >
                                {isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : "Submit Feedback"}
                            </Button>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}

export default function CoacheeView({ coaches, myBookings }: { coaches: Coach[], myBookings: any[] }) {
    const bookingsList = myBookings as unknown as Booking[];
    const [isPending, startTransition] = useTransition();

    // Filter bookings
    const now = new Date();
    const upcoming = bookingsList.filter(
        (b) => (b.status === "accepted" || b.status === "pending") && new Date(b.date) >= now
    );

    // Feedback: Accepted sessions in the past, or completed sessions without feedback text (though in our logic completed means feedback is there)
    const feedbackTasks = bookingsList.filter(
        (b) => (b.status === "accepted" && new Date(b.date) < now)
    );

    const history = bookingsList.filter(
        (b) => b.status === "completed" || b.status === "cancelled" || b.status === "rejected"
    );

    async function handleBookSession(formData: FormData) {
        startTransition(async () => {
            try {
                // Basic client-side validation
                const coachId = formData.get("coachId");
                const date = formData.get("date");
                const startTime = formData.get("startTime");
                const endTime = formData.get("endTime");
                const topic = formData.get("topic");
                const method = formData.get("method");

                if (!coachId || !date || !startTime || !endTime || !topic || !method) {
                    toast.error("Please fill all required fields");
                    return;
                }

                await bookSession(formData);
                toast.success("Booking request sent successfully");
            } catch (error) {
                console.error(error);
                toast.error("Failed to book session");
            }
        });
    }

    const [selectedCoachId, setSelectedCoachId] = useState("");
    const [searchTerm, setSearchTerm] = useState("");

    const filteredCoaches = coaches.filter((c: Coach) => {
        const matchesSearch = c.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            c.userCompetencies?.some(uc => uc.competency.name.toLowerCase().includes(searchTerm.toLowerCase()));
        return matchesSearch;
    });

    const selectedCoach = coaches.find(c => c.id === selectedCoachId);
    const upcomingCount = upcoming.length;

    return (
        <Tabs defaultValue="upcoming" className="w-full">
            <TabsList className="grid w-full grid-cols-3 max-w-[500px] mb-4">
                <TabsTrigger value="create">Create</TabsTrigger>
                <TabsTrigger value="upcoming" className="gap-2">
                    Schedule
                    {upcomingCount > 0 && (
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-600 text-[10px] font-bold text-white shadow-sm ring-2 ring-white transition-all">
                            {upcomingCount}
                        </span>
                    )}
                </TabsTrigger>
                <TabsTrigger value="closed">History</TabsTrigger>
            </TabsList>

            {/* Create Tab */}
            <TabsContent value="create">
                <Card>
                    <CardHeader>
                        <CardTitle>Request a Session</CardTitle>
                        <CardDescription>Book a new coaching session with a coach of your choice.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <form action={handleBookSession} className="grid gap-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="date">Date</Label>
                                    <Input id="date" name="date" type="date" required />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="method">Method</Label>
                                    <select
                                        id="method"
                                        name="method"
                                        className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                                        required
                                    >
                                        <option value="offline">Offline</option>
                                        <option value="online">Online</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="startTime">Start Time</Label>
                                    <Input id="startTime" name="startTime" type="time" required />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="endTime">End Time</Label>
                                    <Input id="endTime" name="endTime" type="time" required />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="topic">Topic / Goal</Label>
                                <Input id="topic" name="topic" placeholder="e.g. Leadership Career Path" required />
                            </div>

                            <div className="space-y-4">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                    <Label className="text-base font-bold">Choose your Coach</Label>
                                    <div className="relative w-full sm:w-64">
                                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            placeholder="Search by name or competency..."
                                            className="pl-9 h-9 text-xs"
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                        />
                                    </div>
                                </div>

                                <input type="hidden" name="coachId" value={selectedCoachId} required />

                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[400px] overflow-y-auto p-1">
                                    {filteredCoaches.map((c: Coach) => (
                                        <div
                                            key={c.id}
                                            onClick={() => setSelectedCoachId(c.id)}
                                            className={`relative flex flex-col p-4 rounded-xl border-2 transition-all cursor-pointer group hover:shadow-md ${selectedCoachId === c.id
                                                ? "border-indigo-600 bg-indigo-50/50"
                                                : "border-gray-100 bg-white hover:border-indigo-200"
                                                }`}
                                        >
                                            {selectedCoachId === c.id && (
                                                <div className="absolute top-2 right-2 bg-indigo-600 rounded-full p-1 shadow-sm">
                                                    <Check className="w-3 h-3 text-white" />
                                                </div>
                                            )}

                                            <div className="flex items-center gap-3 mb-3">
                                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center text-indigo-700 font-bold border border-indigo-200 overflow-hidden shrink-0">
                                                    {c.image ? (
                                                        <img src={c.image} alt={c.name || ""} className="w-full h-full object-cover" />
                                                    ) : (
                                                        c.name?.[0] || <User className="w-6 h-6" />
                                                    )}
                                                </div>
                                                <div className="min-w-0">
                                                    <h4 className="font-bold text-sm text-gray-900 truncate">{c.name}</h4>
                                                    <p className="text-[10px] text-indigo-600 font-bold uppercase tracking-wider truncate">
                                                        {c.position?.name || c.department || "Coach"}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="mt-auto">
                                                <p className="text-[10px] text-muted-foreground font-semibold uppercase mb-1.5">Competencies</p>
                                                <div className="flex flex-wrap gap-1">
                                                    {c.userCompetencies && c.userCompetencies.length > 0 ? (
                                                        c.userCompetencies.map((uc, i) => (
                                                            <span key={i} className="inline-flex px-1.5 py-0.5 rounded text-[9px] font-medium bg-gray-100 text-gray-700 border border-gray-200">
                                                                {uc.competency.name}
                                                            </span>
                                                        ))
                                                    ) : (
                                                        <span className="text-[9px] text-muted-foreground italic">None listed</span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    {filteredCoaches.length === 0 && (
                                        <div className="col-span-full py-8 text-center bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                                            <p className="text-sm text-muted-foreground">No coaches found matching your search.</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <Button type="submit" className="w-full bg-yellow-400 text-black hover:bg-yellow-500 font-semibold" disabled={isPending}>
                                {isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : "Add Request"}
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </TabsContent>

            {/* Upcoming Tab */}
            <TabsContent value="upcoming">
                <Card>
                    <CardHeader>
                        <CardTitle>My Schedule</CardTitle>
                        <CardDescription>View and manage your coaching sessions.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-8">

                        {/* 1. Waiting for Report (FeedbackTasks) */}
                        {feedbackTasks.length > 0 && (
                            <div className="space-y-3">
                                <h3 className="text-sm font-semibold text-yellow-600 uppercase tracking-wider flex items-center gap-2">
                                    <Clock className="w-4 h-4" /> Pending Coach Report
                                </h3>
                                <div className="space-y-3">
                                    {feedbackTasks.map((booking) => (
                                        <div key={booking.id} className="flex items-center justify-between p-4 border border-yellow-200 bg-yellow-50/50 rounded-lg">
                                            <div className="space-y-1">
                                                <p className="font-semibold">{booking.topic}</p>
                                                <p className="text-sm text-gray-600">Coach: {booking.coach.name} • {new Date(booking.date).toLocaleDateString()}</p>
                                            </div>
                                            <span className="text-xs font-medium text-yellow-700 bg-yellow-100 px-2 py-1 rounded">
                                                Waiting
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* 2. Upcoming Sessions */}
                        <div className="space-y-3">
                            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Scheduled Sessions</h3>
                            {upcoming.length === 0 ? (
                                <p className="text-sm text-muted-foreground italic">No upcoming sessions.</p>
                            ) : (
                                <div className="space-y-4">
                                    {upcoming.map((booking) => (
                                        <div key={booking.id} className="flex items-center justify-between p-4 border rounded-lg bg-card hover:bg-accent/50 transition-colors">
                                            <div className="space-y-1">
                                                <p className="font-medium leading-none">{booking.topic || "General Session"}</p>
                                                <p className="text-sm text-gray-500">Coach: {booking.coach.name}</p>
                                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                    <Calendar className="h-3 w-3" />
                                                    <span>{new Date(booking.date).toLocaleDateString()}</span>
                                                    <Clock className="h-3 w-3 ml-2" />
                                                    <span>{booking.startTime || "?"} - {booking.endTime || "?"} ({booking.method})</span>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className={cn(
                                                    "px-2.5 py-0.5 rounded-full text-xs font-medium border capitalize",
                                                    booking.status === "accepted" ? "bg-green-100 text-green-800 border-green-200" : "bg-yellow-100 text-yellow-800 border-yellow-200"
                                                )}>
                                                    {booking.status}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </TabsContent>

            {/* History Tab */}
            <TabsContent value="closed">
                <Card>
                    <CardHeader>
                        <CardTitle>History</CardTitle>
                        <CardDescription>Past sessions and completed reports.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {history.length === 0 ? (
                            <p className="text-center text-muted-foreground py-8">No history found.</p>
                        ) : (
                            <div className="space-y-4">
                                {history.map((booking) => (
                                    <ViewReportDialog key={booking.id} booking={booking}>
                                        <div className="cursor-pointer flex items-center justify-between p-4 border rounded-lg bg-card opacity-75 hover:opacity-100 transition-opacity">
                                            <div className="space-y-1">
                                                <p className="font-medium leading-none line-through">{booking.topic}</p>
                                                <p className="text-sm text-gray-500">Coach: {booking.coach.name}</p>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className={cn(
                                                        "px-2.5 py-0.5 rounded-full text-xs font-medium border capitalize",
                                                        booking.status === "completed" ? "bg-blue-100 text-blue-800" : "bg-red-100 text-red-800"
                                                    )}>
                                                        {booking.status}
                                                    </span>
                                                </div>
                                            </div>
                                            {booking.status === "completed" && (
                                                <Button size="sm" variant="secondary" className="border-gray-200">
                                                    View Report
                                                </Button>
                                            )}
                                        </div>
                                    </ViewReportDialog>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </TabsContent>
        </Tabs>
    );
}
