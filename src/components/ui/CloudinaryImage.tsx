
import { useState } from "react";
import { cn } from "@/lib/utils";

interface CloudinaryImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
    src: string;
    width?: number | string;
    height?: number | string;
    priority?: boolean;
}

export const CloudinaryImage = ({
    src,
    width,
    height,
    className,
    alt,
    priority = false,
    ...props
}: CloudinaryImageProps) => {
    const [loaded, setLoaded] = useState(false);
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
        const transformations = ["f_auto", "q_auto", "c_fill"];

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
        <div
            className={cn(
                "relative overflow-hidden bg-muted/20",
                className
            )}
        >
            <img
                src={optimizedSrc}
                alt={alt || "Image"}
                className={cn(
                    "w-full h-full object-cover transition-opacity duration-300",
                    loaded ? "opacity-100" : "opacity-0"
                )}
                loading={priority ? "eager" : "lazy"}
                onLoad={() => setLoaded(true)}
                onError={() => setError(true)}
                {...props}
            />
            {!loaded && !error && (
                <div className="absolute inset-0 flex items-center justify-center bg-muted/20 animate-pulse">
                    <div className="text-xs text-muted-foreground">Loading...</div>
                </div>
            )}
        </div>
    );
};
