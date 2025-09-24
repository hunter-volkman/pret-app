import { useEffect, useState, useMemo } from 'react';
import { X, Camera, Calendar, AlertTriangle, Loader2, Film } from 'lucide-react';
import { StoreData } from '../stores/store';
import { format } from 'date-fns';
import { ImageThumbnail } from './ImageThumbnail';
import { ImageLightbox } from './ImageLightbox';
import GIF from 'gif.js.optimized';

interface FetchedImage {
  timestamp: string;
  imageUrl: string;
}

interface ImageModalProps {
  store: StoreData;
  onClose: () => void;
}

export function ImageModal({ store, onClose }: ImageModalProps) {
  const [status, setStatus] = useState<'loading' | 'error' | 'success'>('loading');
  const [images, setImages] = useState<FetchedImage[]>([]);
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [lightboxState, setLightboxState] = useState<{ index: number; mode: 'still' | 'timelapse' } | null>(null);
  const [gifState, setGifState] = useState<{ status: 'idle' | 'processing' | 'done', url?: string, progress?: number }>({ status: 'idle' });

  useEffect(() => {
    setStatus('loading');
    setGifState({ status: 'idle' });
    const fetchImages = async () => {
      try {
        const response = await fetch(`/api/stock-images?locationId=${store.id}&date=${selectedDate}`);
        if (!response.ok) throw new Error(`API Error: ${response.status}`);
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
      if (e.key === 'Escape' && !lightboxState) onClose();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose, lightboxState]);

  const createTimelapse = async () => {
    if (gifState.status === 'processing' || images.length < 2) return;
    setGifState({ status: 'processing', progress: 0 });

    const sampleImg = new Image();
    sampleImg.src = images[0].imageUrl;
    
    sampleImg.onload = async () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) {
        setGifState({ status: 'idle' });
        return;
      }
      canvas.width = sampleImg.width;
      canvas.height = sampleImg.height;

      const gif = new GIF({
        workers: 4, workerScript: '/gif.worker.js', quality: 10,
        width: canvas.width, height: canvas.height, repeat: 0,
      });

      const loadedImages = await Promise.all(images.map(imgData => new Promise<HTMLImageElement>(res => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.src = imgData.imageUrl;
        img.onload = () => res(img);
      })));

      for (const img of loadedImages) {
        ctx.drawImage(img, 0, 0);
        gif.addFrame(ctx, { copy: true, delay: 200 });
      }

      gif.on('progress', (p) => setGifState(s => ({...s, status: 'processing', progress: Math.round(p * 100)})));
      gif.on('finished', (blob) => {
        const url = URL.createObjectURL(blob);
        setGifState({ status: 'done', url });
        setLightboxState({ index: 0, mode: 'timelapse' });
      });
      gif.render();
    };
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };
  
  const todayString = useMemo(() => format(new Date(), 'yyyy-MM-dd'), []);
  
  return (
    <>
      <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-2 sm:p-4 z-[9999] backdrop-blur-sm" onClick={handleBackdropClick}>
        <div className="bg-white rounded-2xl max-w-full w-full md:max-w-7xl h-[95vh] sm:h-[90vh] flex flex-col animate-in fade-in-0 zoom-in-95 duration-300">
          {/* --- ✨ ROBUST RESPONSIVE HEADER --- */}
          <header className="flex flex-wrap items-center justify-between gap-4 px-4 sm:px-6 py-3 border-b border-gray-200">
            {/* Title Group */}
            <div className="flex items-center space-x-3">
                <div className="bg-green-100 text-green-600 p-2 rounded-lg"><Camera className="w-6 h-6" /></div>
                <div>
                    <h3 className="text-lg font-bold text-gray-900">Stock Snapshot History</h3>
                    <p className="text-sm text-gray-500">{store.name}</p>
                </div>
            </div>

            {/* Controls Group */}
            <div className="flex items-center gap-2 sm:gap-4 w-full justify-end sm:w-auto">
                {status === 'success' && images.length > 1 && (
                    <button onClick={createTimelapse} disabled={gifState.status === 'processing'} className="flex items-center space-x-2 bg-blue-600 text-white px-3 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors disabled:bg-blue-300 disabled:cursor-not-allowed">
                        {gifState.status === 'processing' ? <Loader2 className="w-5 h-5 animate-spin" /> : <Film className="w-5 h-5" />}
                        <span className="hidden sm:inline">Create Timelapse</span>
                        <span className="sm:hidden">Timelapse</span>
                    </button>
                )}
                <div className="relative flex items-center">
                    <Calendar className="absolute left-3 z-10 w-4 h-4 text-gray-500 pointer-events-none" />
                    <input 
                        type="date" 
                        value={selectedDate} 
                        max={todayString} 
                        onChange={(e) => setSelectedDate(e.target.value)} 
                        className="appearance-none bg-white border border-gray-300 rounded-lg pl-9 pr-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>
                <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
                    <X className="w-5 h-5 text-gray-600" />
                </button>
            </div>
          </header>
          <main className="flex-1 p-4 sm:p-6 overflow-y-auto">
            {status === 'loading' && <div className="flex flex-col items-center justify-center h-full text-gray-500"><Loader2 className="w-12 h-12 animate-spin mb-4" /><h4 className="font-bold text-lg">Loading Snapshots...</h4></div>}
            {status === 'error' && <div className="flex flex-col items-center justify-center h-full text-red-500 bg-red-50 rounded-lg p-8"><AlertTriangle className="w-12 h-12 mb-4" /><h4 className="font-bold text-lg">Could Not Load Images</h4></div>}
            {status === 'success' && (images.length === 0 ? <div className="flex flex-col items-center justify-center h-full text-gray-500 text-center"><Camera className="w-12 h-12 mb-4" /><h4 className="font-bold text-lg">No Snapshots Found</h4><p className="text-sm">No images were captured for this store on {selectedDate}.</p></div> : <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">{images.map((img, index) => <ImageThumbnail key={img.timestamp} imageUrl={img.imageUrl} timestamp={img.timestamp} timezone={store.timezone} onClick={() => setLightboxState({ index, mode: 'still' })} />)}</div>)}
          </main>
          <footer className="px-4 sm:px-6 py-3 bg-gray-50/70 border-t border-gray-200 flex justify-end">
            <button
                onClick={onClose}
                className="bg-gray-200 text-gray-800 px-6 py-2 rounded-lg font-medium hover:bg-gray-300 text-sm"
            >
                Close
            </button>
          </footer>
        </div>
      </div>
      {lightboxState !== null && (
        <ImageLightbox
          images={images}
          startIndex={lightboxState.index}
          initialMode={lightboxState.mode}
          onClose={() => setLightboxState(null)}
          timelapseUrl={gifState.status === 'done' ? gifState.url : undefined}
          store={store}
        />
      )}
    </>
  );
}
