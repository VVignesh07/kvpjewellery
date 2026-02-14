import { useEffect } from "react";

interface MetaTagsProps {
    title?: string;
    description?: string;
    image?: string;
    url?: string;
}

const MetaTags = ({
    title = "KVP JEWELLERY — Luxury Gold Jewellery",
    description = "Discover handcrafted luxury gold jewellery at KVP JEWELLERY — earrings, rings, necklaces & bangles.",
    image = "https://res.cloudinary.com/demo/image/upload/v1/kvp_fancy_jewellery_og.jpg",
    url = window.location.href,
}: MetaTagsProps) => {
    useEffect(() => {
        // Update Document Title
        if (title) document.title = title;

        // Update Meta Tags
        const updateMeta = (selector: string, attr: string, value: string) => {
            const el = document.querySelector(selector);
            if (el) el.setAttribute(attr, value);
        };

        updateMeta('meta[name="description"]', "content", description);
        updateMeta('link[rel="canonical"]', "href", url);

        // Open Graph
        updateMeta('meta[property="og:title"]', "content", title);
        updateMeta('meta[property="og:description"]', "content", description);
        updateMeta('meta[property="og:image"]', "content", image);
        updateMeta('meta[property="og:url"]', "content", url);

        // Twitter
        updateMeta('meta[property="twitter:title"]', "content", title);
        updateMeta('meta[property="twitter:description"]', "content", description);
        updateMeta('meta[property="twitter:image"]', "content", image);
        updateMeta('meta[property="twitter:url"]', "content", url);
    }, [title, description, image, url]);

    return null;
};

export default MetaTags;
