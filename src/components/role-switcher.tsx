"use client";

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ChevronDown, Check } from "lucide-react"
import { useRouter, usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

export function RoleSwitcher({ currentRole }: { currentRole?: string | null }) {
    const router = useRouter()
    const pathname = usePathname()

    // Determine active view strictly
    // Fix: "coachee" starts with "coach", so we need to be careful.
    // We check if the path segment is exactly "coach" or "coachee"
    const segments = pathname.split("/"); // ["", "dashboard", "coach", ...]
    const isCoachView = segments.includes("coach");
    const isCoacheeView = segments.includes("coachee");

    // Display label logic:
    // If we are in coach view -> Coach
    // If we are in coachee view -> Coachee
    // If we are just in /dashboard -> Select Role (or maybe currentRole if available?)
    let label = "Select Role";
    let badgeClass = "bg-gray-100 text-gray-700 hover:bg-gray-200";

    if (isCoachView) {
        label = "Coach";
        badgeClass = "bg-teal-100 text-teal-700 hover:bg-teal-200";
    } else if (isCoacheeView) {
        label = "Coachee";
        badgeClass = "bg-indigo-100 text-indigo-700 hover:bg-indigo-200";
    } else if (currentRole) {
        // Fallback for /dashboard page, show their assigned role or generic
        // Actually user wants to choose. Let's keep generic if not in specific dashboard.
        // Or if they are on /dashboard, maybe no badge color?
        // Let's stick to what we have but cleaned up.
        label = currentRole; // e.g. "admin" ?
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger className="outline-none">
                <span className={cn(
                    "text-xs px-3 py-1.5 rounded-full font-medium flex items-center gap-1.5 transition-colors",
                    badgeClass
                )}>
                    {label}
                    <ChevronDown className="w-3 h-3 opacity-50" />
                </span>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[150px]">
                <DropdownMenuItem onClick={() => router.push("/dashboard/coach")} className="justify-between cursor-pointer">
                    Coach
                    {isCoachView && <Check className="w-4 h-4 ml-2 text-teal-600" />}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push("/dashboard/coachee")} className="justify-between cursor-pointer">
                    Coachee
                    {isCoacheeView && <Check className="w-4 h-4 ml-2 text-indigo-600" />}
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
