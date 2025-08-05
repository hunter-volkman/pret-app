import React, { useEffect, useState, useCallback } from 'react';
import { X, ChevronLeft, ChevronRight, Film, Image as ImageIcon } from 'lucide-react';
import { StoreData } from '../stores/store';
import { formatTimeInZone } from '../utils/time';

interface FetchedImage {
  timestamp: string;
  imageUrl: string;
}

interface ImageLightboxProps {
  images: FetchedImage[];
  startIndex: number;
  initialMode: 'still' | 'timelapse';
  onClose: () => void;
  timelapseUrl?: string;
  store: StoreData;
}

export function ImageLightbox({ images, startIndex, initialMode, onClose, timelapseUrl, store }: ImageLightboxProps) {
  const [currentIndex, setCurrentIndex] = useState(startIndex);
  const [showTimelapse, setShowTimelapse] = useState(initialMode === 'timelapse' && !!timelapseUrl);
  // --- ✨ STATE FOR SWIPE GESTURES ---
  const [touchStart, setTouchStart] = useState<number | null>(null);

  const currentImage = images[currentIndex];
  
  const handleNext = useCallback(() => setCurrentIndex((prev) => (prev + 1) % images.length), [images.length]);
  const handlePrev = useCallback(() => setCurrentIndex((prev) => (prev - 1 + images.length) % images.length), [images.length]);

  useEffect(() => {
    const handleKeydown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (!showTimelapse) {
        if (e.key === 'ArrowRight') handleNext();
        if (e.key === 'ArrowLeft') handlePrev();
      }
    };
    document.addEventListener('keydown', handleKeydown);
    return () => document.removeEventListener('keydown', handleKeydown);
  }, [onClose, handleNext, handlePrev, showTimelapse]);

  // --- ✨ SWIPE HANDLER LOGIC ---
  const handleTouchStart = (e: React.TouchEvent) => {
    if (showTimelapse) return;
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStart === null || showTimelapse) return;
    const touchEnd = e.changedTouches[0].clientX;
    const diff = touchStart - touchEnd;
    
    if (diff > 50) { // Swiped left
      handleNext();
    } else if (diff < -50) { // Swiped right
      handlePrev();
    }
    setTouchStart(null);
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  const formattedDate = new Date(currentImage.timestamp).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });

  return (
    <div 
      className="fixed inset-0 bg-black/80 flex flex-col items-center justify-center p-4 z-[10000] backdrop-blur-md animate-in fade-in-0 duration-300" 
      onClick={handleBackdropClick}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <header className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between text-white z-10">
        <div className="font-mono text-xs sm:text-sm bg-black/40 px-3 py-1 rounded-lg backdrop-blur-sm">
          {showTimelapse ? `Daily Timelapse | ${formattedDate}` : `${currentIndex + 1}/${images.length} | ${new Date(currentImage.timestamp).toLocaleString()}`}
        </div>
        <button onClick={onClose} className="p-2 bg-black/40 hover:bg-black/60 rounded-full transition-colors">
          <X className="w-6 h-6" />
        </button>
      </header>
      
      <div className="relative w-full h-full flex items-center justify-center">
        {!showTimelapse && (
          // --- ✨ ARROWS ALWAYS VISIBLE ---
          <button onClick={handlePrev} className="absolute left-4 p-3 bg-black/40 hover:bg-black/60 rounded-full transition-colors z-10">
            <ChevronLeft className="w-8 h-8 text-white" />
          </button>
        )}

        <div className="relative max-w-[85vw] max-h-[85vh] flex items-center justify-center">
          {showTimelapse && timelapseUrl ? (
            <>
              <img src={timelapseUrl} alt="Generated Timelapse" className="max-w-full max-h-full object-contain rounded-lg shadow-2xl" />
            </>
          ) : (
            <>
              <img src={currentImage.imageUrl} alt={`Snapshot at ${currentImage.timestamp}`} className="max-w-full max-h-full object-contain rounded-lg shadow-2xl" />
              <div className="absolute top-3 left-3 bg-black/60 text-white px-3 py-1 rounded-full text-xs font-medium backdrop-blur-sm">
                SNAPSHOT
              </div>
              <div className="absolute bottom-3 right-3 bg-black/60 text-white px-3 py-1 rounded-md text-sm font-mono backdrop-blur-sm">
                {formatTimeInZone(new Date(currentImage.timestamp), store.timezone)}
              </div>
            </>
          )}
        </div>
        
        {!showTimelapse && (
          // --- ✨ ARROWS ALWAYS VISIBLE ---
          <button onClick={handleNext} className="absolute right-4 p-3 bg-black/40 hover:bg-black/60 rounded-full transition-colors z-10">
            <ChevronRight className="w-8 h-8 text-white" />
          </button>
        )}
      </div>

      <footer className="absolute bottom-0 left-0 right-0 p-4 flex items-center justify-center space-x-4 z-10">
        {timelapseUrl && (
          <button onClick={() => setShowTimelapse(!showTimelapse)} className="flex items-center space-x-2 bg-black/50 text-white px-4 py-2 rounded-lg font-semibold hover:bg-black/70 transition-colors">
            {showTimelapse ? <ImageIcon className="w-5 h-5" /> : <Film className="w-5 h-5" />}
            <span>{showTimelapse ? 'View Stills' : 'View Timelapse'}</span>
          </button>
        )}
      </footer>
    </div>
  );
}
