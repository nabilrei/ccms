import { setUserRole } from "@/actions/index";
import { auth } from "@/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { redirect } from "next/navigation";

export default async function OnboardingPage() {
    const session = await auth();
    if (!session?.user) redirect("/login");
    // Check if role already exists, redirect to dashboard
    if (session.user.role) {
        redirect("/dashboard");
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
            <Card className="w-full max-w-2xl shadow-xl">
                <CardHeader>
                    <CardTitle className="text-3xl text-center">Welcome! Select your role</CardTitle>
                    <CardDescription className="text-center">How will you use this application today?</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-8 p-8">
                    <form action={setUserRole.bind(null, "coachee")} className="flex flex-col h-full">
                        <Button variant="outline" className="h-48 w-full flex flex-col gap-4 text-xl hover:bg-emerald-50 hover:border-emerald-200 transition-all border-2">
                            <span className="text-4xl">👨‍🎓</span>
                            <span>I am a Coachee</span>
                            <span className="text-sm font-normal text-muted-foreground">Find a coach and book sessions</span>
                        </Button>
                    </form>

                    <form action={setUserRole.bind(null, "coach")} className="flex flex-col h-full">
                        <Button variant="outline" className="h-48 w-full flex flex-col gap-4 text-xl hover:bg-violet-50 hover:border-violet-200 transition-all border-2">
                            <span className="text-4xl">🧑‍🏫</span>
                            <span>I am a Coach</span>
                            <span className="text-sm font-normal text-muted-foreground">Manage your schedule and bookings</span>
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
