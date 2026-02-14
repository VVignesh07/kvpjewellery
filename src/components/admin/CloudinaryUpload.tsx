
import { useState, useId, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Upload, Cloud } from "lucide-react";
import { toast } from "sonner";

interface CloudinaryUploadProps {
    onUpload: (url: string) => void;
    disabled?: boolean;
    maxFiles?: number;
    currentCount?: number;
}

export const CloudinaryUpload = ({ onUpload, disabled, maxFiles = 4, currentCount = 0 }: CloudinaryUploadProps) => {
    const [uploading, setUploading] = useState(false);
    const [dragActive, setDragActive] = useState(false);
    const remainingSlots = maxFiles - currentCount;
    const inputRef = useRef<HTMLInputElement>(null);
    const generatedId = useId();
    const inputId = `cloudinary-upload-${generatedId.replace(/:/g, "")}`;

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const handleDrop = async (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            await handleFileProcess(e.dataTransfer.files);
        }
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        console.log("File input change detected", e.target.files);
        if (e.target.files && e.target.files.length > 0) {
            await handleFileProcess(e.target.files);
        }
        // Reset input value to allow selecting the same file again if needed
        if (inputRef.current) {
            inputRef.current.value = "";
        }
    };

    const handleFileProcess = async (files: FileList) => {
        if (!files || files.length === 0) return;

        if (files.length > remainingSlots) {
            toast.error(`You can only upload ${remainingSlots} more image${remainingSlots !== 1 ? 's' : ''}`);
            return;
        }

        setUploading(true);
        const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
        const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

        console.log("Starting upload...", { cloudName, uploadPreset: uploadPreset ? "exists" : "missing", files: files.length });

        if (!cloudName || !uploadPreset) {
            toast.error("Cloudinary configuration missing. Check .env file.");
            setUploading(false);
            return;
        }

        try {
            // Upload each file sequentially
            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                const formData = new FormData();
                formData.append("file", file);
                formData.append("upload_preset", uploadPreset);

                const response = await fetch(
                    `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
                    {
                        method: "POST",
                        body: formData,
                    }
                );

                if (!response.ok) {
                    const errorData = await response.json();
                    console.error("Cloudinary Error Details:", errorData);
                    throw new Error(errorData.error?.message || `Upload failed for ${file.name}`);
                }

                const data = await response.json();
                console.log('✅ Cloudinary upload success:', data.secure_url);
                onUpload(data.secure_url);
            }
            toast.success("Images uploaded successfully!");
        } catch (error) {
            console.error("Upload error:", error);
            const errorMessage = error instanceof Error ? error.message : "Failed to upload images.";
            toast.error(errorMessage);
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="flex flex-col gap-2">
            <div
                className={`relative w-full h-32 border-2 border-dashed rounded-lg transition-all duration-200 ease-in-out flex flex-col items-center justify-center text-center cursor-pointer overflow-hidden ${dragActive
                    ? "border-primary bg-primary/5 scale-[1.01] ring-2 ring-primary/20"
                    : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50"
                    } ${disabled || uploading || remainingSlots <= 0 ? "opacity-50 cursor-not-allowed" : ""}`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => {
                    console.log("Upload area clicked", { disabled, uploading, remainingSlots });
                    if (!disabled && !uploading && remainingSlots > 0) {
                        inputRef.current?.click();
                    }
                }}
            >
                <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground p-4">
                    {uploading ? (
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    ) : (
                        <Cloud className={`h-10 w-10 transition-colors ${dragActive ? "text-primary" : "text-muted-foreground"}`} />
                    )}
                    <div className="font-medium text-sm">
                        {uploading ? (
                            "Uploading..."
                        ) : (
                            <>
                                <span className="text-primary font-semibold">Click to upload</span> or drag and drop
                            </>
                        )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                        {remainingSlots} slots remaining (JPG, PNG, WEBP)
                    </p>
                </div>

                {/* Hidden Input */}
                <input
                    id={inputId}
                    ref={inputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={handleFileChange}
                    disabled={disabled || uploading || remainingSlots <= 0}
                />
            </div>
        </div>
    );
};
