import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Pencil, Trash } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Switch } from "@/components/ui/switch";
import { router } from "@inertiajs/react";
import { useState } from "react";
import { CustomAlertDialog } from "@/components/ui/custom-alert-dialog";
import { toast } from "sonner";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

export const createColumns = (): ColumnDef<any>[] => [
    {
        accessorKey: "name",
        header: "Name",
        cell: ({ row }) => {
            const [isDetailsOpen, setIsDetailsOpen] = useState(false);
            const template = row.original;

            return (
                <>
                    <button
                        onClick={() => setIsDetailsOpen(true)}
                        className="text-left hover:underline"
                    >
                        {row.getValue("name")}
                    </button>

                    <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
                        <DialogContent className="max-w-2xl">
                            <DialogHeader>
                                <DialogTitle>{template.name}</DialogTitle>
                                <DialogDescription>
                                    Template Details
                                </DialogDescription>
                            </DialogHeader>

                            <div className="space-y-4">
                                <div>
                                    <h4 className="text-sm font-medium">Shortcode</h4>
                                    <Badge variant="secondary" className="mt-1">
                                        {template.shortcode}
                                    </Badge>
                                </div>

                                <div>
                                    <h4 className="text-sm font-medium">Content</h4>
                                    <div className="mt-1 whitespace-pre-wrap rounded-md bg-muted p-3 text-sm">
                                        {template.content}
                                    </div>
                                </div>

                                <div>
                                    <h4 className="text-sm font-medium">Placeholders</h4>
                                    <div className="mt-1 flex flex-wrap gap-2">
                                        {template.placeholders.map((placeholder: string) => (
                                            <Badge key={placeholder} variant="outline">
                                                {`{{${placeholder}}}`}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>

                                <div className="flex justify-end space-x-2">
                                    <Button
                                        variant="outline"
                                        onClick={() => setIsDetailsOpen(false)}
                                    >
                                        Close
                                    </Button>
                                    <Button
                                        onClick={() => {
                                            setIsDetailsOpen(false);
                                            router.visit(route("email-templates.edit", template.id));
                                        }}
                                    >
                                        Edit Template
                                    </Button>
                                </div>
                            </div>
                        </DialogContent>
                    </Dialog>
                </>
            );
        },
    },
    {
        accessorKey: "shortcode",
        header: "Shortcode",
        cell: ({ row }) => {
            const shortcode = row.getValue("shortcode") as string;
            return (
                <Badge variant="secondary">
                    {shortcode}
                </Badge>
            );
        },
    },
    {
        accessorKey: "is_active",
        header: "Status",
        cell: ({ row }) => {
            const isActive = row.getValue("is_active") as boolean;
            const [isUpdating, setIsUpdating] = useState(false);

            return (
                <Switch
                    checked={isActive}
                    disabled={isUpdating}
                    onCheckedChange={() => {
                        setIsUpdating(true);
                        router.put(
                            route("email-templates.toggle-status", row.original.id),
                            {},
                            {
                                onSuccess: () => {
                                    toast.success("Template status updated successfully");
                                    setIsUpdating(false);
                                },
                                onError: () => {
                                    toast.error("Failed to update template status");
                                    setIsUpdating(false);
                                }
                            }
                        );
                    }}
                />
            );
        },
    },
    {
        id: "actions",
        cell: ({ row }) => {
            const template = row.original;
            const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
            const [isDeleting, setIsDeleting] = useState(false);

            const handleDelete = () => {
                setIsDeleting(true);
                router.delete(route("email-templates.destroy", template.id), {
                    onSuccess: () => {
                        toast.success("Template deleted successfully");
                        setIsDeleteDialogOpen(false);
                        router.reload();
                    },
                    onError: () => {
                        toast.error("Failed to delete template");
                        setIsDeleting(false);
                    }
                });
            };

            return (
                <>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Open menu</span>
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                                onClick={() =>
                                    router.visit(
                                        route("email-templates.edit", template.id)
                                    )
                                }
                            >
                                <Pencil className="mr-2 h-4 w-4" />
                                Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={() => setIsDeleteDialogOpen(true)}
                                className="text-red-600"
                            >
                                <Trash className="mr-2 h-4 w-4" />
                                Delete
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    <CustomAlertDialog
                        isOpen={isDeleteDialogOpen}
                        onClose={() => setIsDeleteDialogOpen(false)}
                        onConfirm={handleDelete}
                        title="Delete Template"
                        description={`Are you sure you want to delete the template "${template.name}"? This action cannot be undone.`}
                        isLoading={isDeleting}
                    />
                </>
            );
        },
    },
]; 