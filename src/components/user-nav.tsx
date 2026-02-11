"use client";

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { LogOut, User, Settings, Loader2 } from "lucide-react"
import { signOut } from "next-auth/react"
import { useState, useTransition } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { updateUserPosition, updateUserCompetencies, addCustomCompetency } from "@/actions/schedule";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Plus } from "lucide-react";

type Position = {
    id: string;
    name: string;
};

type Competency = {
    id: string;
    name: string;
};

export function UserNav({
    user,
    positions = [],
    currentPositionId,
    allCompetencies = [],
    currentCompetencyIds = []
}: {
    user: { name?: string | null; email?: string | null; image?: string | null },
    positions?: Position[],
    currentPositionId?: string | null,
    allCompetencies?: Competency[],
    currentCompetencyIds?: string[]
}) {
    const [selectedPositionId, setSelectedPositionId] = useState(currentPositionId || "");
    const [selectedCompetencyIds, setSelectedCompetencyIds] = useState<string[]>(currentCompetencyIds);
    const [localCompetencies, setLocalCompetencies] = useState<Competency[]>(allCompetencies);
    const [newCompetencyName, setNewCompetencyName] = useState("");
    const [isAddingCompetency, setIsAddingCompetency] = useState(false);
    const [isPending, startTransition] = useTransition();
    const [open, setOpen] = useState(false);

    const toggleCompetency = (id: string) => {
        setSelectedCompetencyIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    async function handleAddCustomCompetency() {
        if (!newCompetencyName.trim()) return;

        setIsAddingCompetency(true);
        try {
            const id = await addCustomCompetency(newCompetencyName);

            // Add to local list if not already there
            if (!localCompetencies.find(c => c.id === id)) {
                setLocalCompetencies(prev => [...prev, { id, name: newCompetencyName.trim() }]);
            }

            // Auto select it
            if (!selectedCompetencyIds.includes(id)) {
                setSelectedCompetencyIds(prev => [...prev, id]);
            }

            setNewCompetencyName("");
            toast.success("Competency added");
        } catch (err) {
            toast.error("Failed to add competency");
        } finally {
            setIsAddingCompetency(false);
        }
    }

    async function handleSave() {
        if (!selectedPositionId) {
            toast.error("Please select a position");
            return;
        }

        startTransition(async () => {
            try {
                await updateUserPosition(selectedPositionId);
                await updateUserCompetencies(selectedCompetencyIds);
                toast.success("Profile updated successfully");
                setOpen(false);
            } catch (err) {
                toast.error("Failed to update profile");
            }
        });
    }

    const currentPositionName = positions.find(p => p.id === currentPositionId)?.name || "Not set";

    return (
        <div className="flex items-center gap-2">
            <DropdownMenu>
                <DropdownMenuTrigger className="outline-none group">
                    <span className="text-sm font-medium text-gray-700 group-hover:text-indigo-600 transition-colors flex items-center gap-2 cursor-pointer">
                        {user.name}
                        <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-700 font-bold border border-gray-200 group-hover:border-indigo-200 overflow-hidden">
                            {user.image ? (
                                <img src={user.image} alt={user.name || ""} className="w-full h-full object-cover" />
                            ) : (
                                user.name?.[0] || <User className="w-4 h-4" />
                            )}
                        </div>
                    </span>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-[200px]">
                    <div className="px-2 py-1.5 text-xs text-muted-foreground border-b mb-1">
                        <p className="font-semibold text-gray-900">{user.name}</p>
                        <p>{user.email}</p>
                        <p className="mt-1 text-[10px] uppercase tracking-wider text-indigo-500 font-bold">{currentPositionName}</p>
                    </div>

                    <Dialog open={open} onOpenChange={setOpen}>
                        <DialogTrigger asChild>
                            <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="cursor-pointer">
                                <Settings className="w-4 h-4 mr-2" />
                                Edit Profile
                            </DropdownMenuItem>
                        </DialogTrigger>
                        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                                <DialogTitle>Edit Profile</DialogTitle>
                                <DialogDescription>
                                    Update your position and competencies.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-6 py-4">
                                <div className="space-y-2">
                                    <Label htmlFor="position" className="text-sm font-bold">Position</Label>
                                    <select
                                        id="position"
                                        value={selectedPositionId}
                                        onChange={(e) => setSelectedPositionId(e.target.value)}
                                        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        <option value="">Choose a position...</option>
                                        {positions.map((p) => (
                                            <option key={p.id} value={p.id}>{p.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <Label className="text-sm font-bold">Competencies</Label>
                                    </div>

                                    <div className="flex gap-2 mb-4">
                                        <Input
                                            placeholder="Add custom..."
                                            value={newCompetencyName}
                                            onChange={(e) => setNewCompetencyName(e.target.value)}
                                            className="h-8 text-xs"
                                            onKeyDown={(e) => e.key === 'Enter' && handleAddCustomCompetency()}
                                        />
                                        <Button
                                            type="button"
                                            size="sm"
                                            variant="secondary"
                                            className="h-8 px-2"
                                            onClick={handleAddCustomCompetency}
                                            disabled={isAddingCompetency || !newCompetencyName.trim()}
                                        >
                                            {isAddingCompetency ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
                                        </Button>
                                    </div>

                                    <div className="grid grid-cols-2 gap-2">
                                        {localCompetencies.map((c) => (
                                            <div key={c.id} className="flex items-center space-x-2">
                                                <Checkbox
                                                    id={c.id}
                                                    checked={selectedCompetencyIds.includes(c.id)}
                                                    onCheckedChange={() => toggleCompetency(c.id)}
                                                />
                                                <label
                                                    htmlFor={c.id}
                                                    className="text-xs font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                                                >
                                                    {c.name}
                                                </label>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                                <Button onClick={handleSave} disabled={isPending}>
                                    {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Save Changes
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>

                    <DropdownMenuItem onClick={() => signOut({ callbackUrl: "/login" })} className="text-red-600 focus:text-red-600 focus:bg-red-50 cursor-pointer">
                        <LogOut className="w-4 h-4 mr-2" />
                        Log out
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    )
}
