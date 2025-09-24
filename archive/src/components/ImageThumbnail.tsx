import { formatTimeInZone } from '../utils/time';

interface ImageThumbnailProps {
  imageUrl: string;
  timestamp: string;
  timezone: string;
  onClick: () => void;
}

export function ImageThumbnail({ imageUrl, timestamp, timezone, onClick }: ImageThumbnailProps) {
  const formattedTime = formatTimeInZone(new Date(timestamp), timezone);

  return (
    <button
      onClick={onClick}
      className="group relative aspect-video w-full bg-gray-900 rounded-lg overflow-hidden shadow-md transition-transform transform-gpu hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
    >
      <img
        src={imageUrl}
        alt={`Snapshot from ${new Date(timestamp).toLocaleString()}`}
        className="w-full h-full object-cover transition-opacity group-hover:opacity-80"
        loading="lazy"
      />
      <div className="absolute bottom-2 right-2 bg-black/60 text-white px-2 py-0.5 rounded-md text-xs font-mono backdrop-blur-sm">
        {formattedTime}
      </div>
    </button>
  );
}
