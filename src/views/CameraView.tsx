import { useState, useEffect, useRef } from 'react';
import { Camera, ArrowLeft, Loader2 } from 'lucide-react';
import { useStore } from '../stores/store';
import { viam } from '../services/viam';
import * as VIAM from '@viamrobotics/sdk';

export function CameraView() {
  const { currentStore, setCurrentView, stores, setCurrentStore } = useStore();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isStreamReady, setStreamReady] = useState(false);
  
  const [currentTime, setCurrentTime] = useState(new Date());

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamClientRef = useRef<VIAM.StreamClient | null>(null);
  const streamNameRef = useRef<string | null>(null);

  useEffect(() => {
    if (isStreamReady) {
      const timer = setInterval(() => setCurrentTime(new Date()), 1000);
      return () => clearInterval(timer);
    }
  }, [isStreamReady]);

  useEffect(() => {
    if (!currentStore) return;

    setIsLoading(true);
    setStreamReady(false);
    setPreviewUrl(null);
    setError(null);
    
    let isCancelled = false;

    const setupFeed = async () => {
      try {
        const url = await viam.getCameraImage(currentStore.stockMachineId, false);
        if (isCancelled) return;
        setPreviewUrl(url);
      } catch (e) {
        if (isCancelled) return;
        console.error("Failed to load preview image", e);
        setError("Could not load camera preview.");
        setIsLoading(false);
        return;
      }

      try {
        const client = await viam.connect(currentStore.stockMachineId);
        if (isCancelled || !client) return;
        
        const streamClient = new VIAM.StreamClient(client);
        streamClientRef.current = streamClient;
        
        const streamName = 'camera';
        streamNameRef.current = streamName;
        
        const stream = await streamClient.getStream(streamName);
        if (isCancelled) return;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
          if (!isCancelled) {
            setStreamReady(true);
            setIsLoading(false);
          }
        }
      } catch (err) {
        if (isCancelled) return;
        console.error("Failed to get camera stream:", err);
        setError("Stream failed. Displaying static image.");
        setIsLoading(false);
      }
    };

    setupFeed();

    return () => {
      isCancelled = true;
      const client = streamClientRef.current;
      const name = streamNameRef.current;

      if (client && name) {
        client.remove(name).catch(e => console.error("Error removing stream on server:", e));
      }

      if (videoRef.current && videoRef.current.srcObject) {
        const mediaStream = videoRef.current.srcObject as MediaStream;
        mediaStream.getTracks().forEach(track => track.stop());
      }
      
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [currentStore]);

  if (!currentStore) {
    return (
      <div className="p-6">
        <div className="text-center py-8">
          <Camera className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No Store Selected</h3>
          <p className="text-gray-600 mb-6">Choose a store to view its camera feed</p>
          <div className="space-y-2 max-w-sm mx-auto">
            {stores.map(store => (
              <button
                key={store.id}
                onClick={() => { setCurrentStore(store); setCurrentView('camera'); }}
                className="w-full text-left p-3 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="font-medium text-gray-900">{store.name}</div>
                <div className="text-sm text-gray-500">{store.address}</div>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const isUpgrading = previewUrl && !isStreamReady;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <button onClick={() => setCurrentView('stores')} className="p-2 hover:bg-gray-100 rounded-lg">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{currentStore.name}</h2>
            <p className="text-gray-600">Live Camera Feed</p>
          </div>
        </div>
      </div>
      
      <div className="bg-gray-900 rounded-lg overflow-hidden aspect-video relative flex items-center justify-center">
        {(isLoading && !previewUrl) && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400">
            <Loader2 className="animate-spin h-12 w-12 mb-4" />
            <p>Connecting to camera...</p>
          </div>
        )}
        
        {error && !previewUrl && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center text-red-400 p-4">
            <Camera className="w-12 h-12 mx-auto mb-4" />
            <p className="font-semibold">Connection Failed</p>
            <p className="text-sm">{error}</p>
          </div>
        )}

        {previewUrl && (
          <img 
            src={previewUrl} 
            alt="Camera Preview"
            className={`w-full h-full object-cover transition-opacity duration-300 ${isStreamReady ? 'opacity-0' : 'opacity-100'}`}
          />
        )}
        
        <video 
          ref={videoRef}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${isStreamReady ? 'opacity-100' : 'opacity-0'}`}
          autoPlay 
          playsInline 
          muted
        />

        <div className={`absolute top-3 left-3 flex items-center space-x-2 bg-black/50 text-white px-3 py-1 rounded-full text-xs font-bold backdrop-blur-sm transition-opacity duration-300 ${isStreamReady ? 'opacity-100' : 'opacity-0'}`}>
          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
          <span>LIVE</span>
        </div>

        <div className={`absolute bottom-3 right-3 bg-black/50 text-white px-3 py-1 rounded-md text-sm font-mono backdrop-blur-sm transition-opacity duration-300 ${isStreamReady ? 'opacity-100' : 'opacity-0'}`}>
          {currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
        </div>
        
        {isUpgrading && (
          <>
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer" />
            <div className="absolute bottom-3 left-3 flex items-center space-x-2 bg-black/50 text-white px-3 py-1 rounded-full text-xs font-bold backdrop-blur-sm">
              <Loader2 className="w-3 h-3 animate-spin" />
              <span>CONNECTING TO LIVE FEED...</span>
            </div>
          </>
        )}

      </div>
      {error && (
        <p className="text-center text-sm text-yellow-600 mt-2">{error}</p>
      )}
    </div>
  );
}
