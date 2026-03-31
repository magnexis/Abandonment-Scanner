import { X } from "lucide-react";

export function ImageModal({
  imageUrl,
  title,
  onClose
}: {
  imageUrl: string;
  title: string;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
      <div className="relative max-w-5xl overflow-hidden rounded-3xl border border-border bg-panel shadow-panel">
        <button className="absolute right-4 top-4 z-10 rounded-full bg-black/50 p-2 text-white" onClick={onClose}>
          <X size={16} />
        </button>
        <img src={imageUrl} alt={title} className="max-h-[80vh] w-full object-cover" />
      </div>
    </div>
  );
}

