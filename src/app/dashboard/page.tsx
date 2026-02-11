import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { User, Clock } from "lucide-react";
import Link from "next/link";

export default async function DashboardPage() {
    const session = await auth();

    if (!session?.user) {
        redirect("/login");
    }

    if (!session.user.role) {
        redirect("/onboarding");
    }

    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-8">
            <div className="text-center space-y-2">
                <h1 className="text-3xl font-bold tracking-tight">Welcome, {session.user.name}</h1>
                <p className="text-muted-foreground">Select your role to proceed to the dashboard.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl px-4">
                <Link href="/dashboard/coach" className="group">
                    <Card className="h-full hover:border-indigo-500 hover:shadow-lg transition-all cursor-pointer">
                        <CardHeader>
                            <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                <User className="w-6 h-6 text-indigo-600" />
                            </div>
                            <CardTitle>Continue as Coach</CardTitle>
                            <CardDescription>Manage your schedule and incoming booking requests.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                                <li>View upcoming sessions</li>
                                <li>Accept/Reject requests</li>
                                <li>Provide feedback</li>
                            </ul>
                        </CardContent>
                    </Card>
                </Link>

                <Link href="/dashboard/coachee" className="group">
                    <Card className="h-full hover:border-purple-500 hover:shadow-lg transition-all cursor-pointer">
                        <CardHeader>
                            <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                <Clock className="w-6 h-6 text-purple-600" />
                            </div>
                            <CardTitle>Continue as Coachee</CardTitle>
                            <CardDescription>Find a coach and book a session for your development.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                                <li>Browse available coaches</li>
                                <li>Book new sessions</li>
                                <li>Track your progress</li>
                            </ul>
                        </CardContent>
                    </Card>
                </Link>
            </div>
        </div>
    );
}
