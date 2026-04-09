import React, { useRef, useEffect, useState } from 'react';
import { Shield, EyeOff, Volume2, StopCircle, Settings, RefreshCw, Eye, ZoomIn, ZoomOut, Sun, Moon, Contrast } from 'lucide-react';

interface NoteViewerProps {
  fileUrl: string;
  buyerPhone: string;
  buyerName: string;
  textContent?: string;
}

const NoteViewer: React.FC<NoteViewerProps> = ({ fileUrl, buyerPhone, buyerName, textContent }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  const [isPlaying, setIsPlaying] = useState(false);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const [showSettings, setShowSettings] = useState(false);
  const [wmText, setWmText] = useState(`${buyerName} | ${buyerPhone} | LICENSED COPY`);
  const [wmColor, setWmColor] = useState('#ef4444');
  const [wmOpacity, setWmOpacity] = useState(0.12);

  const [showA11y, setShowA11y] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [visualFilter, setVisualFilter] = useState<'none' | 'invert' | 'contrast' | 'sepia'>('none');

  useEffect(() => {
    setIsLoaded(false);
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = fileUrl;

    img.onload = () => {
      setImage(img);
      setIsLoaded(true);
    };
  }, [fileUrl]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !image) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = image.width;
    canvas.height = image.height;

    ctx.drawImage(image, 0, 0);

    ctx.save();
    ctx.globalAlpha = wmOpacity;
    ctx.font = 'bold 24px "Space Grotesk", sans-serif';
    ctx.fillStyle = wmColor;
    ctx.rotate(-Math.PI / 6);

    const stepX = 300;
    const stepY = 150;

    for (let x = -image.height; x < image.width * 2; x += stepX) {
      for (let y = -image.width; y < image.height * 2; y += stepY) {
        ctx.fillText(wmText, x, y);
      }
    }
    ctx.restore();
  }, [image, wmText, wmColor, wmOpacity]);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      synthRef.current = window.speechSynthesis;
    }

    return () => {
      if (synthRef.current) {
        synthRef.current.cancel();
      }
    };
  }, []);

  const toggleAudio = () => {
    if (!synthRef.current || !textContent) {
      alert('Audio not available for this note.');
      return;
    }

    if (isPlaying) {
      synthRef.current.cancel();
      setIsPlaying(false);
    } else {
      utteranceRef.current = new SpeechSynthesisUtterance(textContent);
      utteranceRef.current.rate = 1.1;
      utteranceRef.current.pitch = 1;
      utteranceRef.current.onend = () => setIsPlaying(false);

      synthRef.current.speak(utteranceRef.current);
      setIsPlaying(true);
    }
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
  };

  const handleResetSettings = () => {
    setWmText(`${buyerName} | ${buyerPhone} | LICENSED COPY`);
    setWmColor('#ef4444');
    setWmOpacity(0.12);
  };

  const handleResetA11y = () => {
    setZoom(1);
    setVisualFilter('none');
  };

  const getFilterStyle = () => {
    switch (visualFilter) {
      case 'invert':
        return 'invert(1) hue-rotate(180deg)';
      case 'contrast':
        return 'contrast(1.5) grayscale(1)';
      case 'sepia':
        return 'sepia(1)';
      default:
        return 'none';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 justify-between items-center bg-gray-50 border border-gray-200 p-2 rounded-lg">
        {textContent ? (
          <div className="flex items-center">
            <button
              onClick={toggleAudio}
              className={`p-2 rounded-full transition-all mr-2 ${
                isPlaying ? 'bg-red-100 text-red-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
              aria-label={isPlaying ? 'Stop Audio' : 'Play Audio'}
            >
              {isPlaying ? <StopCircle size={20} /> : <Volume2 size={20} />}
            </button>
            <div className="text-xs">
              <p className="font-bold text-gray-900">{isPlaying ? 'Playing...' : 'Listen'}</p>
            </div>
          </div>
        ) : (
          <div />
        )}

        <div className="flex items-center gap-2">
          <button
            onClick={() => { setShowA11y(!showA11y); setShowSettings(false); }}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${showA11y ? 'bg-blue-600 text-white' : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-100'}`}
            aria-label="Toggle Accessibility Options"
          >
            <Eye size={14} />
            <span className="hidden sm:inline">View Options</span>
          </button>

          <button
            onClick={() => { setShowSettings(!showSettings); setShowA11y(false); }}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${showSettings ? 'bg-black text-white' : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-100'}`}
            aria-label="Toggle Watermark Settings"
          >
            <Settings size={14} />
            <span className="hidden sm:inline">Admin</span>
          </button>
        </div>
      </div>

      {showA11y && (
        <div className="bg-white border border-blue-100 p-4 rounded-xl shadow-sm animate-in fade-in slide-in-from-top-2">
          <div className="flex justify-between items-center mb-4 border-b border-gray-100 pb-2">
            <h3 className="font-bold text-gray-900 text-sm flex items-center">
              <Eye size={14} className="mr-2 text-blue-600" />
              Reader Accessibility
            </h3>
            <button onClick={handleResetA11y} className="text-xs text-blue-600 hover:underline flex items-center">
              <RefreshCw size={10} className="mr-1" /> Reset
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-2">Zoom Level ({Math.round(zoom * 100)}%)</label>
              <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-lg">
                <button
                  onClick={() => setZoom(z => Math.max(0.5, z - 0.25))}
                  className="p-2 hover:bg-white rounded-md transition-colors"
                  aria-label="Zoom Out"
                >
                  <ZoomOut size={16} className="text-gray-600" />
                </button>
                <input
                  type="range"
                  min="0.5"
                  max="3"
                  step="0.25"
                  value={zoom}
                  onChange={(e) => setZoom(parseFloat(e.target.value))}
                  className="flex-1 h-2 bg-gray-300 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
                <button
                  onClick={() => setZoom(z => Math.min(3, z + 0.25))}
                  className="p-2 hover:bg-white rounded-md transition-colors"
                  aria-label="Zoom In"
                >
                  <ZoomIn size={16} className="text-gray-600" />
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-2">Display Mode</label>
              <div className="flex gap-2">
                <button
                  onClick={() => setVisualFilter('none')}
                  className={`flex-1 p-2 rounded-lg border text-xs font-medium flex flex-col items-center gap-1 ${visualFilter === 'none' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 hover:bg-gray-50'}`}
                >
                  <Sun size={14} /> Normal
                </button>
                <button
                  onClick={() => setVisualFilter('invert')}
                  className={`flex-1 p-2 rounded-lg border text-xs font-medium flex flex-col items-center gap-1 ${visualFilter === 'invert' ? 'border-blue-500 bg-gray-900 text-white' : 'border-gray-200 hover:bg-gray-50'}`}
                >
                  <Moon size={14} /> Dark
                </button>
                <button
                  onClick={() => setVisualFilter('contrast')}
                  className={`flex-1 p-2 rounded-lg border text-xs font-medium flex flex-col items-center gap-1 ${visualFilter === 'contrast' ? 'border-blue-500 bg-white text-black ring-2 ring-black/5' : 'border-gray-200 hover:bg-gray-50'}`}
                >
                  <Contrast size={14} /> High C.
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showSettings && (
        <div className="bg-white border border-gray-200 p-4 rounded-xl shadow-sm animate-in fade-in slide-in-from-top-2">
          <div className="flex justify-between items-center mb-4 border-b border-gray-100 pb-2">
            <h3 className="font-bold text-gray-900 text-sm">Watermark Settings</h3>
            <button onClick={handleResetSettings} className="text-xs text-blue-600 hover:underline flex items-center">
              <RefreshCw size={10} className="mr-1" /> Reset Defaults
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Watermark Text</label>
              <input
                type="text"
                value={wmText}
                onChange={(e) => setWmText(e.target.value)}
                className="w-full text-sm border border-gray-300 rounded p-2 focus:ring-2 focus:ring-black outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Color (Hex)</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={wmColor}
                  onChange={(e) => setWmColor(e.target.value)}
                  className="h-9 w-12 cursor-pointer border-0 p-0 rounded"
                />
                <input
                  type="text"
                  value={wmColor}
                  onChange={(e) => setWmColor(e.target.value)}
                  className="w-full text-sm border border-gray-300 rounded p-2 font-mono uppercase"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Opacity ({Math.round(wmOpacity * 100)}%)</label>
              <input
                type="range"
                min="0.05"
                max="1"
                step="0.05"
                value={wmOpacity}
                onChange={(e) => setWmOpacity(parseFloat(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-black"
              />
            </div>
          </div>
        </div>
      )}

      <div
        className="relative overflow-auto max-h-[80vh] border border-gray-200 rounded-xl bg-gray-50/50 flex justify-center scrollbar-thin scrollbar-thumb-gray-300"
        onContextMenu={handleContextMenu}
      >
        {!isLoaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100 z-10 h-96 rounded-xl">
            <div className="text-center">
              <Shield className="w-8 h-8 text-green-600 mx-auto animate-pulse" />
              <p className="text-xs text-gray-500 mt-2">Securing Document...</p>
            </div>
          </div>
        )}

        <div
          style={{
            width: isLoaded ? `${image?.width ? image.width * zoom : 100}%` : '100%',
            maxWidth: 'none',
            transition: 'width 0.2s ease-out'
          }}
          className="relative"
        >
          <canvas
            ref={canvasRef}
            className="w-full h-auto shadow-lg bg-white"
            style={{ filter: getFilterStyle() }}
          />
        </div>

        <div className="absolute top-2 right-2 bg-black/50 text-white text-[10px] px-2 py-1 rounded backdrop-blur-sm flex items-center pointer-events-none z-20 sticky">
          <EyeOff size={10} className="mr-1" />
          Protected View
        </div>
      </div>
    </div>
  );
};

export default NoteViewer;
