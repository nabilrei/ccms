import { signIn } from "@/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function LoginPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-4">
            <div className="absolute inset-0 bg-white/10 backdrop-blur-sm pointer-events-none" />

            <Card className="w-full max-w-md shadow-2xl z-10 bg-white/90 backdrop-blur-md border border-white/20">
                <CardHeader className="text-center">
                    <CardTitle className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                        CCMS
                    </CardTitle>
                    <CardDescription className="text-lg text-gray-600">
                        Coaching Management System
                    </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-4">
                    <p className="text-center text-sm text-gray-500 mb-4">
                        Sign in to manage your coaching schedule
                    </p>

                    <form
                        action={async () => {
                            "use server";
                            await signIn("google", { redirectTo: "/dashboard" });
                        }}
                    >
                        <Button variant="outline" className="w-full py-6 text-lg font-medium hover:bg-gray-50" type="submit">
                            {/* Google Icon could go here */}
                            Continue with Google
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
