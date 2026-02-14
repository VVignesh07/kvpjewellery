import { Reorder, useDragControls, motion } from "framer-motion";
import { X, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ImageReorderProps {
    images: string[];
    setImages: React.Dispatch<React.SetStateAction<string[]>>;
    onRemove: (index: number) => void;
}

export const ImageReorder = ({ images, setImages, onRemove }: ImageReorderProps) => {
    if (images.length === 0) return null;

    return (
        <div className="space-y-2">
            <p className="text-sm text-muted-foreground text-center sm:text-left">
                Drag images to reorder (Changes are auto-saved on update)
            </p>
            <Reorder.Group
                axis="x"
                values={images}
                onReorder={setImages}
                className="grid grid-cols-2 md:grid-cols-4 gap-4"
                as="div"
            >
                {images.map((image, index) => (
                    <ReorderItem
                        key={image} // Using URL as key is standard for simple strings, assuming unique URLs
                        image={image}
                        index={index}
                        onRemove={() => onRemove(index)}
                    />
                ))}
            </Reorder.Group>
        </div>
    );
};

const ReorderItem = ({ image, index, onRemove }: { image: string; index: number; onRemove: () => void }) => {
    const controls = useDragControls();

    return (
        <Reorder.Item
            value={image}
            id={image}
            dragListener={false}
            dragControls={controls}
            className="relative group aspect-square bg-gray-100 rounded-lg overflow-hidden border border-gray-200 shadow-sm hover:shadow-md transition-shadow cursor-move"
            as="div"
        >
            <img
                src={image}
                alt={`Product ${index + 1}`}
                className="w-full h-full object-cover pointer-events-none"
            />

            {/* Overlay */}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />

            {/* Drag Handle */}
            <div
                className="absolute top-2 left-2 p-1.5 bg-white/80 backdrop-blur-sm rounded-md shadow-sm opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing"
                onPointerDown={(e) => controls.start(e)}
            >
                <GripVertical className="w-4 h-4 text-gray-700" />
            </div>

            {/* Remove Button */}
            <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute top-2 right-2 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => {
                    e.stopPropagation(); // Prevent drag start
                    onRemove();
                }}
            >
                <X className="w-3 h-3" />
            </Button>

            {/* Badge */}
            <div className="absolute bottom-2 left-2 px-2 py-0.5 bg-black/60 text-white text-[10px] rounded backdrop-blur-sm">
                #{index + 1}
            </div>
        </Reorder.Item>
    );
};
