import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ZoomIn, ZoomOut, Download, RotateCw } from 'lucide-react';

interface MessengerImageViewerProps {
  imageUrl: string | null;
  onClose: () => void;
  senderName?: string;
  timestamp?: string;
}

export const MessengerImageViewer: React.FC<MessengerImageViewerProps> = ({
  imageUrl,
  onClose,
  senderName,
  timestamp
}) => {
  const [scale, setScale] = React.useState(1);
  const [rotation, setRotation] = React.useState(0);

  if (!imageUrl) return null;

  const handleDownload = () => {
    try {
      const link = document.createElement('a');
      link.href = imageUrl;
      link.download = `messenger_image_${Date.now()}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] bg-black/90 backdrop-blur-md flex flex-col justify-between p-4 dir-rtl select-none">
        {/* Top bar */}
        <div className="flex items-center justify-between text-white z-10 px-2 py-1">
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors cursor-pointer text-white"
              title="إغلاق"
            >
              <X size={20} />
            </button>
            {senderName && (
              <div className="text-right">
                <p className="text-sm font-black text-white">{senderName}</p>
                {timestamp && <p className="text-[11px] text-gray-400 font-medium">{timestamp}</p>}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setScale(s => Math.min(s + 0.3, 3))}
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors cursor-pointer text-white"
              title="تكبير"
            >
              <ZoomIn size={18} />
            </button>
            <button
              onClick={() => setScale(s => Math.max(s - 0.3, 0.6))}
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors cursor-pointer text-white"
              title="تصغير"
            >
              <ZoomOut size={18} />
            </button>
            <button
              onClick={() => setRotation(r => (r + 90) % 360)}
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors cursor-pointer text-white"
              title="تدوير"
            >
              <RotateCw size={18} />
            </button>
            <button
              onClick={handleDownload}
              className="p-2 rounded-full bg-blue-600 hover:bg-blue-700 transition-colors cursor-pointer text-white shadow-md"
              title="تحميل الصورة"
            >
              <Download size={18} />
            </button>
          </div>
        </div>

        {/* Center image */}
        <div className="flex-1 flex items-center justify-center p-2 overflow-hidden">
          <motion.img
            src={imageUrl}
            alt="Messenger Attachment"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale, rotate: rotation, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="max-h-[82vh] max-w-full object-contain rounded-lg shadow-2xl cursor-grab active:cursor-grabbing"
            referrerPolicy="no-referrer"
          />
        </div>

        {/* Footer tip */}
        <div className="text-center text-xs text-gray-400 pb-2">
          انقر في أي مكان خارج الصورة أو على زر الإغلاق للعودة إلى المحادثة
        </div>
      </div>
    </AnimatePresence>
  );
};
