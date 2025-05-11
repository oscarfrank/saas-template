import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { router } from "@inertiajs/react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useState } from "react";
import { CustomAlertDialog } from "@/components/ui/custom-alert-dialog";
import { toast } from "sonner";

interface EmailTemplateFormProps {
    template?: any;
    placeholders: Record<string, string>;
}

export function EmailTemplateForm({ template, placeholders }: EmailTemplateFormProps) {
    const [formData, setFormData] = useState({
        name: template?.name || "",
        shortcode: template?.shortcode || "",
        content: template?.content || "",
        placeholders: template?.placeholders || [],
        is_active: template?.is_active ?? true,
    });

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        if (template) {
            router.put(route("email-templates.update", template.id), formData, {
                onSuccess: () => {
                    toast.success("Template updated successfully");
                    setIsSubmitting(false);
                },
                onError: () => {
                    toast.error("Failed to update template");
                    setIsSubmitting(false);
                }
            });
        } else {
            router.post(route("email-templates.store"), formData, {
                onSuccess: () => {
                    toast.success("Template created successfully");
                    setIsSubmitting(false);
                },
                onError: () => {
                    toast.error("Failed to create template");
                    setIsSubmitting(false);
                }
            });
        }
    };

    const handleCancel = () => {
        if (formData.name || formData.content) {
            setIsCancelDialogOpen(true);
        } else {
            router.visit(route("email-templates.index"));
        }
    };

    const insertPlaceholder = (placeholder: string) => {
        const textarea = document.querySelector('textarea') as HTMLTextAreaElement;
        const cursorPosition = textarea?.selectionStart || formData.content.length;
        const newContent = formData.content.slice(0, cursorPosition) + 
            `{{${placeholder}}}` + 
            formData.content.slice(cursorPosition);
        setFormData(prev => ({ ...prev, content: newContent }));
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-8">
            <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                    <label className="text-sm font-medium">Name</label>
                    <Input
                        placeholder="Enter template name"
                        value={formData.name}
                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                        required
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium">Shortcode</label>
                    <Input
                        placeholder="e.g., welcome_email, loan_approval"
                        value={formData.shortcode}
                        onChange={(e) => setFormData(prev => ({ ...prev, shortcode: e.target.value.toLowerCase().replace(/\s+/g, '_') }))}
                        required
                        pattern="[a-z0-9_]+"
                        title="Only lowercase letters, numbers, and underscores are allowed"
                    />
                    <p className="text-sm text-muted-foreground">
                        This will be used to reference the template in code
                    </p>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Available Placeholders</CardTitle>
                    <CardDescription>
                        Click on a placeholder to insert it into the content
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-wrap gap-2">
                        {Object.entries(placeholders).map(([key, value]) => (
                            <Badge
                                key={key}
                                variant="secondary"
                                className="cursor-pointer"
                                onClick={() => insertPlaceholder(key)}
                            >
                                {`{{${key}}}`}
                            </Badge>
                        ))}
                    </div>
                </CardContent>
            </Card>

            <div className="space-y-2">
                <label className="text-sm font-medium">Content</label>
                <Textarea
                    placeholder="Enter email content"
                    className="min-h-[200px]"
                    value={formData.content}
                    onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                    required
                />
                <p className="text-sm text-muted-foreground">
                    Use the placeholders above to insert dynamic content
                </p>
            </div>

            <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                    <label className="text-base font-medium">Active</label>
                    <p className="text-sm text-muted-foreground">
                        Enable or disable this email template
                    </p>
                </div>
                <Switch
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
                />
            </div>

            <div className="flex justify-end space-x-4">
                <Button
                    type="button"
                    variant="outline"
                    onClick={handleCancel}
                    disabled={isSubmitting}
                >
                    Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                    {template ? "Update Template" : "Create Template"}
                </Button>
            </div>

            <CustomAlertDialog
                isOpen={isCancelDialogOpen}
                onClose={() => setIsCancelDialogOpen(false)}
                onConfirm={() => router.visit(route("email-templates.index"))}
                title="Discard Changes"
                description="Are you sure you want to discard your changes? This action cannot be undone."
            />
        </form>
    );
} 