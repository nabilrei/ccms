import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { users } from "@/db/schema";
import { db } from "@/db";
import { eq } from "drizzle-orm";

import { RoleSwitcher } from "@/components/role-switcher";
import { UserNav } from "@/components/user-nav";

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await auth();

    if (!session?.user) {
        redirect("/login");
    }

    if (!session.user.role) {
        // If user has no role, redirect to onboarding
        redirect("/onboarding");
    }

    // If user has role, ensure they are in the right place or just let them access.
    // The specific pages will handle role-based content, but layout can enforce basic structure.

    // Fetch full user and positions/competencies for UserNav
    const user = await db.query.users.findFirst({
        where: eq(users.id, session.user.id),
        with: {
            userCompetencies: true
        }
    });
    const allPositions = await db.query.positions.findMany();
    const allCompetencies = await db.query.competencies.findMany();

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <header className="bg-white/80 backdrop-blur-md border-b sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
                    <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">CCMS</h1>
                    <div className="flex items-center gap-4">
                        <UserNav
                            user={session.user}
                            positions={allPositions}
                            currentPositionId={user?.positionId}
                            allCompetencies={allCompetencies}
                            currentCompetencyIds={user?.userCompetencies?.map(uc => uc.competencyId) || []}
                        />
                        <RoleSwitcher currentRole={session.user.role} />
                    </div>
                </div>
            </header>
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {children}
            </main>
        </div>
    );
}
