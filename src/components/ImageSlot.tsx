import { useState, useEffect } from 'react';
import { Loader2, ImageOff, Clock } from 'lucide-react';
import { StoreData } from '../stores/store';

interface ImageSlotProps {
  store: StoreData;
  targetTime: Date;
}

interface FetchedImage {
  timestamp: string;
  imageUrl: string;
}

export function ImageSlot({ store, targetTime }: ImageSlotProps) {
  const [status, setStatus] = useState<'loading' | 'error' | 'success'>('loading');
  const [image, setImage] = useState<FetchedImage | null>(null);

  useEffect(() => {
    let isCancelled = false;
    const fetchData = async () => {
      try {
        setStatus('loading');
        const response = await fetch(`/api/stock-image?locationId=${store.id}&targetTime=${targetTime.toISOString()}`);
        if (isCancelled) return;

        if (!response.ok) {
          if (response.status === 404) {
             setStatus('error');
             return;
          }
          throw new Error(`API Error: ${response.status}`);
        }

        const data = await response.json();
        if (!isCancelled) {
          setImage(data);
          setStatus('success');
        }
      } catch (error) {
        if (!isCancelled) {
          console.error(`Failed to fetch image for slot ${targetTime.toISOString()}:`, error);
          setStatus('error');
        }
      }
    };
    fetchData();

    return () => { isCancelled = true; };
  }, [store.id, targetTime]);

  const renderContent = () => {
    switch (status) {
      case 'loading':
        return <div className="flex items-center justify-center h-full bg-gray-100 rounded-lg animate-pulse"><Loader2 className="w-6 h-6 text-gray-400 animate-spin" /></div>;
      case 'error':
        return <div className="flex items-center justify-center h-full bg-gray-100 rounded-lg text-gray-400"><ImageOff className="w-6 h-6" /></div>;
      case 'success':
        return <img src={image!.imageUrl} alt={`Snapshot from ${new Date(image!.timestamp).toLocaleString()}`} className="w-full h-full object-cover rounded-lg" />;
      default:
        return null;
    }
  };

  return (
    <div className="flex-shrink-0 w-64 md:w-80">
      <div className="bg-gray-900 rounded-lg aspect-video flex items-center justify-center relative overflow-hidden shadow-lg">
        {renderContent()}
        {status === 'success' && image && (
          <div className="absolute bottom-2 right-2 bg-black/70 text-white px-2 py-0.5 rounded-md text-xs font-mono backdrop-blur-sm">
            {new Date(image.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}
          </div>
        )}
      </div>
      <p className="text-center text-sm text-gray-600 mt-2 font-medium flex items-center justify-center space-x-1.5">
        <Clock className="w-3.5 h-3.5" />
        <span>{targetTime.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true })} Slot</span>
      </p>
    </div>
  );
}
