
import React, { useRef, useState, useCallback, useEffect } from 'react';
import { Camera as CameraIcon, RotateCw, Check, X } from 'lucide-react';

interface CameraProps {
  onCapture: (base64: string) => void;
  onClose: () => void;
  title?: string;
}

export const Camera: React.FC<CameraProps> = ({ onCapture, onClose, title = "Capture Photo" }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isReady, setIsReady] = useState(false);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: facingMode }
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsReady(true);
      }
    } catch (err) {
      console.error("Camera access error:", err);
      alert("Could not access camera. Please check permissions.");
    }
  }, [facingMode]);

  useEffect(() => {
    startCamera();
    return () => {
      if (videoRef.current?.srcObject) {
        (videoRef.current.srcObject as MediaStream).getTracks().forEach(track => track.stop());
      }
    };
  }, [startCamera]);

  const capture = () => {
    if (videoRef.current && canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) {
        canvasRef.current.width = videoRef.current.videoWidth;
        canvasRef.current.height = videoRef.current.videoHeight;
        ctx.drawImage(videoRef.current, 0, 0);
        const dataUrl = canvasRef.current.toDataURL('image/jpeg', 0.8);
        onCapture(dataUrl);
      }
    }
  };

  const toggleFacingMode = () => {
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black">
      <div className="flex items-center justify-between p-4 text-white">
        <h3 className="text-lg font-semibold">{title}</h3>
        <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full">
          <X size={24} />
        </button>
      </div>

      <div className="flex-1 relative overflow-hidden flex items-center justify-center bg-gray-900">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          className={`h-full w-full object-contain ${facingMode === 'user' ? 'scale-x-[-1]' : ''}`}
        />
        <canvas ref={canvasRef} className="hidden" />
      </div>

      <div className="p-8 flex items-center justify-center gap-8 bg-black/50">
        <button
          onClick={toggleFacingMode}
          className="p-4 rounded-full bg-gray-800 text-white hover:bg-gray-700 transition"
        >
          <RotateCw size={24} />
        </button>
        <button
          onClick={capture}
          disabled={!isReady}
          className="p-6 rounded-full bg-blue-600 text-white hover:bg-blue-500 disabled:opacity-50 transition transform active:scale-95 shadow-lg"
        >
          <CameraIcon size={32} />
        </button>
        <div className="w-14" /> {/* Spacer */}
      </div>
    </div>
  );
};
