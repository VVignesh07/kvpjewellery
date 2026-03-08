
import { useState } from "react";
import { cn } from "@/lib/utils";

interface CloudinaryImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
    src: string;
    width?: number | string;
    height?: number | string;
    priority?: boolean;
    quality?: "auto" | "auto:low" | "auto:good" | "auto:best";
}

export const CloudinaryImage = ({
    src,
    width,
    height,
    className,
    alt,
    priority = false,
    quality = "auto",
    ...props
}: CloudinaryImageProps) => {
    const [error, setError] = useState(false);

    // If no src, return placeholder immediately
    if (!src) {
        return (
            <div className={cn("w-full h-full bg-muted flex items-center justify-center", className)}>
                <div className="text-muted-foreground text-xs">No image</div>
            </div>
        );
    }

    // Helper to construct optimized Cloudinary URL
    const getOptimizedUrl = (url: string, w?: number | string, h?: number | string) => {
        // If not a Cloudinary URL, return as-is
        if (!url.includes("cloudinary.com")) {
            return url;
        }

        // Split URL to inject transformations
        const parts = url.split("/upload/");
        if (parts.length !== 2) return url;

        const [baseUrl, path] = parts;
        const transformations = ["f_auto", `q_${quality}`, "c_fill"];

        if (w) transformations.push(`w_${w}`);
        if (h) transformations.push(`h_${h}`);

        return `${baseUrl}/upload/${transformations.join(",")}/${path}`;
    };

    const optimizedSrc = getOptimizedUrl(src, width, height);

    // If error loading, show placeholder
    if (error) {
        return (
            <div className={cn("w-full h-full bg-muted flex items-center justify-center", className)}>
                <div className="text-muted-foreground text-xs">Image unavailable</div>
            </div>
        );
    }

    return (
        <img
            src={optimizedSrc}
            alt={alt || "Image"}
            className={cn("w-full h-full object-cover", className)}
            loading={priority ? "eager" : "lazy"}
            decoding={priority ? "sync" : "async"}
            {...(priority ? { fetchPriority: "high" } as any : {})}
            onError={() => setError(true)}
            {...props}
        />
    );
};
