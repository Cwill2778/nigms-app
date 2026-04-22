"use client";

import BeforeAfterSlider, { type GalleryItem } from "./BeforeAfterSlider";

// Dummy data — swap these out for real Supabase rows later
const DUMMY_ITEMS: GalleryItem[] = [
  {
    id: "1",
    title: "Deck Restoration",
    beforeImage: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80",
    afterImage: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80",
  },
  {
    id: "2",
    title: "Kitchen Repair",
    beforeImage: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&q=80",
    afterImage: "https://images.unsplash.com/photo-1556909172-54557c7e4fb7?w=800&q=80",
  },
  {
    id: "3",
    title: "Fence Installation",
    beforeImage: "https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=800&q=80",
    afterImage: "https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=800&q=80",
  },
  {
    id: "4",
    title: "Bathroom Refresh",
    beforeImage: "https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=800&q=80",
    afterImage: "https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=800&q=80",
  },
  {
    id: "5",
    title: "Drywall Patch",
    beforeImage: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80",
    afterImage: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80",
  },
  {
    id: "6",
    title: "Exterior Paint",
    beforeImage: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&q=80",
    afterImage: "https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=800&q=80",
  },
];

interface ProjectGalleryProps {
  items?: GalleryItem[];
}

export default function ProjectGallery({ items = DUMMY_ITEMS }: ProjectGalleryProps) {
  if (items.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-500 dark:text-gray-400">No gallery photos yet. Check back soon!</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {items.map((item) => (
        <BeforeAfterSlider key={item.id} item={item} />
      ))}
    </div>
  );
}
