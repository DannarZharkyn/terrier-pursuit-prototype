import { ImageIcon } from "lucide-react";
import { photos } from "@/lib/mock-data";

export function PhotoGrid() {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {photos.map((photo, index) => (
        <div
          key={photo}
          className="aspect-square rounded-lg border border-gray-200 bg-gradient-to-br from-gray-100 to-white p-3 shadow-sm"
        >
          <div className="flex h-full flex-col items-center justify-center rounded-md border border-dashed border-gray-300 text-center">
            <ImageIcon className="mb-2 h-7 w-7 text-bu-red" />
            <p className="px-2 text-xs font-semibold text-gray-600">
              {photo}
            </p>
            <p className="mt-1 text-[11px] text-gray-400">
              IMG_{String(index + 128).padStart(4, "0")}.jpg
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
