import { useEffect, useMemo } from 'react';
import { X, Camera } from 'lucide-react';
import { StoreData } from '../stores/store';
import { toZonedTime, format, fromZonedTime } from 'date-fns-tz';
import { ImageSlot } from './ImageSlot';

interface ImageModalProps {
  store: StoreData;
  onClose: () => void;
}

// --- Time Calculation Logic ---
function getStoreTimeWindow(store: StoreData): { start: Date; end: Date } | null {
  const nowInStoreTz = toZonedTime(new Date(), store.timezone);
  const dayOfWeek = nowInStoreTz.getDay();
  const hours = store.openingHours[dayOfWeek];

  if (!hours) return null;

  const todayStr = format(nowInStoreTz, 'yyyy-MM-dd', { timeZone: store.timezone });
  const openTime = fromZonedTime(`${todayStr}T${hours.open}:00`, store.timezone);
  const closeTime = fromZonedTime(`${todayStr}T${hours.close}:00`, store.timezone);

  const start = new Date(openTime.getTime() - 30 * 60 * 1000);
  const end = new Date(closeTime.getTime() + 30 * 60 * 1000);

  return { start, end };
}

function generateTimeSlots(start: Date, end: Date, intervalMinutes: number): Date[] {
  const slots: Date[] = [];
  let current = new Date(start.getTime());
  while (current <= end) {
    slots.push(new Date(current.getTime()));
    current.setMinutes(current.getMinutes() + intervalMinutes);
  }
  return slots;
}

export function ImageModal({ store, onClose }: ImageModalProps) {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  const handleBackdropClick = (e: React.MouseEvent) => e.target === e.currentTarget && onClose();

  const timeSlots = useMemo(() => {
    const window = getStoreTimeWindow(store);
    if (!window) return [];
    // Ensure we don't show future slots
    const now = new Date();
    return generateTimeSlots(window.start, window.end, 30).filter(slot => slot <= now);
  }, [store]);

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-[9999] backdrop-blur-sm" onClick={handleBackdropClick}>
      <div className="bg-white rounded-2xl max-w-full w-full md:max-w-7xl h-[80vh] flex flex-col animate-in fade-in-0 zoom-in-95 duration-300">
        <header className="flex items-center justify-between px-6 py-4 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center space-x-3">
            <div className="bg-green-100 text-green-600 p-2 rounded-lg"><Camera className="w-6 h-6" /></div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Stock Snapshot History</h3>
              <p className="text-sm text-gray-500">{store.name} | Today</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors"><X className="w-5 h-5 text-gray-600" /></button>
        </header>
        <main className="flex-1 p-6 overflow-hidden">
          {timeSlots.length > 0 ? (
             <div className="flex space-x-4 h-full overflow-x-auto pb-4 -mx-6 px-6">
              {timeSlots.map((slot) => (<ImageSlot key={slot.toISOString()} store={store} targetTime={slot} />))}
            </div>
          ) : (
             <div className="flex flex-col items-center justify-center h-full text-gray-500 text-center">
                <Camera className="w-12 h-12 mb-4" />
                <h4 className="font-bold text-lg">No Time Slots Available</h4>
                <p className="text-sm">The store may be closed or has not opened yet today.</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
