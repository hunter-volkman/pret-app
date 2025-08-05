import { useEffect, useState, useMemo } from 'react';
import { X, Camera, Calendar, AlertTriangle, Loader2 } from 'lucide-react';
import { StoreData } from '../stores/store';
import { format } from 'date-fns';
import { ImageThumbnail } from './ImageThumbnail';
import { ImageLightbox } from './ImageLightbox';

interface FetchedImage {
  timestamp: string;
  imageUrl: string;
}

// THIS INTERFACE WAS MISSING
interface ImageModalProps {
  store: StoreData;
  onClose: () => void;
}

export function ImageModal({ store, onClose }: ImageModalProps) {
  const [status, setStatus] = useState<'loading' | 'error' | 'success'>('loading');
  const [images, setImages] = useState<FetchedImage[]>([]);
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  useEffect(() => {
    const fetchImages = async () => {
      setStatus('loading');
      try {
        const response = await fetch(`/api/stock-images?locationId=${store.id}&date=${selectedDate}`);
        if (!response.ok) {
          throw new Error(`API Error: ${response.status}`);
        }
        const data: FetchedImage[] = await response.json();
        setImages(data);
        setStatus('success');
      } catch (error) {
        console.error(`Failed to fetch images for date ${selectedDate}:`, error);
        setStatus('error');
      }
    };
    fetchImages();
  }, [store.id, selectedDate]);
  
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
        if (e.key === 'Escape' && lightboxIndex === null) {
            onClose();
        }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose, lightboxIndex]);

  const handleBackdropClick = (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) onClose();
  };
  
  const todayString = useMemo(() => format(new Date(), 'yyyy-MM-dd'), []);
  
  const renderContent = () => {
    switch (status) {
      case 'loading':
        return (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <Loader2 className="w-12 h-12 animate-spin mb-4" />
            <h4 className="font-bold text-lg">Loading Snapshots...</h4>
            <p className="text-sm">Fetching images for {selectedDate}</p>
          </div>
        );
      case 'error':
        return (
          <div className="flex flex-col items-center justify-center h-full text-red-500 bg-red-50 rounded-lg p-8">
            <AlertTriangle className="w-12 h-12 mb-4" />
            <h4 className="font-bold text-lg">Could Not Load Images</h4>
            <p className="text-sm text-center">An error occurred while fetching data. Please try again or select a different date.</p>
          </div>
        );
      case 'success':
        if (images.length === 0) {
           return (
             <div className="flex flex-col items-center justify-center h-full text-gray-500 text-center">
               <Camera className="w-12 h-12 mb-4" />
               <h4 className="font-bold text-lg">No Snapshots Found</h4>
               <p className="text-sm">No images were captured for this store on {selectedDate}.</p>
             </div>
           );
        }
        return (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {images.map((img, index) => (
              <ImageThumbnail
                key={img.timestamp}
                imageUrl={img.imageUrl}
                timestamp={img.timestamp}
                onClick={() => setLightboxIndex(index)}
              />
            ))}
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-[9999] backdrop-blur-sm" onClick={handleBackdropClick}>
        <div className="bg-white rounded-2xl max-w-full w-full md:max-w-7xl h-[90vh] flex flex-col animate-in fade-in-0 zoom-in-95 duration-300">
          <header className="flex flex-col sm:flex-row items-center justify-between px-6 py-4 border-b border-gray-200 flex-shrink-0 gap-4">
            <div className="flex items-center space-x-3">
              <div className="bg-green-100 text-green-600 p-2 rounded-lg"><Camera className="w-6 h-6" /></div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Stock Snapshot History</h3>
                <p className="text-sm text-gray-500">{store.name}</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
                <div className="relative">
                    <input 
                        type="date"
                        value={selectedDate}
                        max={todayString}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        className="border border-gray-300 rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
                <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                    <X className="w-5 h-5 text-gray-600" />
                </button>
            </div>
          </header>
          <main className="flex-1 p-6 overflow-y-auto">
            {renderContent()}
          </main>
        </div>
      </div>
      {lightboxIndex !== null && (
        <ImageLightbox
          images={images}
          startIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
        />
      )}
    </>
  );
}
