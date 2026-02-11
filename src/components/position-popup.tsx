"use client";

import { useState, useTransition } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { updateUserPosition } from "@/actions/schedule";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

type Position = {
    id: string;
    name: string;
};

export function PositionPopup({ positions, initialOpen }: { positions: Position[], initialOpen: boolean }) {
    const [open, setOpen] = useState(initialOpen);
    const [selectedId, setSelectedId] = useState("");
    const [isPending, startTransition] = useTransition();

    async function handleSave() {
        if (!selectedId) {
            toast.error("Please select a position");
            return;
        }

        startTransition(async () => {
            try {
                await updateUserPosition(selectedId);
                toast.success("Position saved successfully");
                setOpen(false);
            } catch (err) {
                toast.error("Failed to save position");
            }
        });
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="sm:max-w-[425px]" onPointerDownOutside={(e) => e.preventDefault()}>
                <DialogHeader>
                    <DialogTitle>Complete Your Profile</DialogTitle>
                    <DialogDescription>
                        Welcome! Please select your current position in the company to continue.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="position">Select Position</Label>
                        <select
                            id="position"
                            value={selectedId}
                            onChange={(e) => setSelectedId(e.target.value)}
                            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            <option value="">Choose a position...</option>
                            {positions.map((p) => (
                                <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                        </select>
                    </div>
                </div>
                <Button onClick={handleSave} disabled={isPending || !selectedId}>
                    {isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : "Save & Continue"}
                </Button>
            </DialogContent>
        </Dialog>
    );
}
