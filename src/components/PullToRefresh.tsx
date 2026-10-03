import React, { useState, useRef, useEffect, ReactNode } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { RefreshCw, ArrowDown, Check } from 'lucide-react';

interface PullToRefreshProps {
  children: ReactNode;
  onRefresh: () => Promise<void> | void;
  disabled?: boolean;
}

export default function PullToRefresh({ children, onRefresh, disabled = false }: PullToRefreshProps) {
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  const startY = useRef<number>(0);
  const isDragging = useRef<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const PULL_THRESHOLD = 70; // Distance needed to trigger refresh
  const MAX_PULL = 110;      // Maximum drag distance

  // Touch start
  const handleTouchStart = (e: React.TouchEvent | React.MouseEvent) => {
    if (disabled || isRefreshing) return;
    
    // Only allow pull-down if window/container is at the very top
    const scrollTop = window.scrollY || document.documentElement.scrollTop || 0;
    if (scrollTop <= 5) {
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
      startY.current = clientY;
      isDragging.current = true;
    }
  };

  // Touch move
  const handleTouchMove = (e: React.TouchEvent | React.MouseEvent) => {
    if (!isDragging.current || disabled || isRefreshing) return;

    const scrollTop = window.scrollY || document.documentElement.scrollTop || 0;
    if (scrollTop > 5) {
      isDragging.current = false;
      setPullDistance(0);
      return;
    }

    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const diff = clientY - startY.current;

    if (diff > 0) {
      // Apply logarithmic-like resistance factor
      const distance = Math.min(diff * 0.42, MAX_PULL);
      setPullDistance(distance);
    } else {
      setPullDistance(0);
    }
  };

  // Touch end / Mouse up
  const handleTouchEnd = async () => {
    if (!isDragging.current) return;
    isDragging.current = false;

    if (pullDistance >= PULL_THRESHOLD && !isRefreshing) {
      setIsRefreshing(true);
      setPullDistance(50); // Lock at spinner height while refreshing

      try {
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
          navigator.vibrate(20);
        }
      } catch (e) {
        // Ignore vibration errors
      }

      try {
        // Run refresh callback + ensure minimum pleasant animation time
        await Promise.all([
          Promise.resolve(onRefresh()),
          new Promise((resolve) => setTimeout(resolve, 850))
        ]);
        
        setIsComplete(true);
        setTimeout(() => {
          setIsComplete(false);
          setIsRefreshing(false);
          setPullDistance(0);
        }, 350);
      } catch (err) {
        console.error('Refresh error:', err);
        setIsRefreshing(false);
        setPullDistance(0);
      }
    } else {
      setPullDistance(0);
    }
  };

  useEffect(() => {
    const handleGlobalMouseUp = () => {
      if (isDragging.current) {
        handleTouchEnd();
      }
    };
    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => {
      window.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [pullDistance, isRefreshing]);

  const progressPercent = Math.min(Math.round((pullDistance / PULL_THRESHOLD) * 100), 100);

  return (
    <div
      ref={containerRef}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleTouchStart}
      onMouseMove={handleTouchMove}
      onMouseUp={handleTouchEnd}
      className="relative min-h-[calc(100vh-140px)] select-none"
    >
      {/* 1. TOP FACEBOOK LITE BLUE & DARK PROGRESS LINE (الخط الأزرق العلوي تحت شريط التنقل) */}
      <div className="fixed top-[88px] sm:top-[92px] left-0 right-0 z-40 pointer-events-none">
        <div className="max-w-2xl mx-auto h-[3px] bg-transparent relative overflow-hidden">
          {/* While pulling: Line fills proportionally */}
          {!isRefreshing && pullDistance > 0 && (
            <motion.div
              style={{ width: `${progressPercent}%` }}
              className="h-full bg-gradient-to-r from-blue-600 via-[#1877f2] to-sky-400 mx-auto rounded-full transition-all duration-75 shadow-xs"
            />
          )}

          {/* While refreshing: Active Facebook Lite animated indeterminate loading bar */}
          {isRefreshing && (
            <div className="w-full h-full bg-blue-100 overflow-hidden relative">
              <motion.div
                animate={{
                  x: ['-100%', '200%'],
                }}
                transition={{
                  repeat: Infinity,
                  duration: 1.1,
                  ease: 'easeInOut',
                }}
                className="w-1/2 h-full bg-gradient-to-r from-[#1877f2] via-blue-500 to-[#1877f2] rounded-full shadow-sm"
              />
            </div>
          )}
        </div>
      </div>

      {/* 2. FLOATING PULL BADGE / SPINNER (دائرة التحديث العائمة بنمط OWN あ لايت) */}
      <AnimatePresence>
        {(pullDistance > 0 || isRefreshing) && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{
              opacity: 1,
              scale: 1,
              y: Math.min(pullDistance, 60),
            }}
            exit={{ opacity: 0, scale: 0.8, y: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="fixed top-[92px] sm:top-[96px] left-1/2 -translate-x-1/2 z-40 pointer-events-none flex items-center justify-center"
          >
            <div className="bg-white px-3 py-1.5 rounded-full shadow-lg border border-blue-100/90 flex items-center gap-2 text-xs font-bold text-gray-800 backdrop-blur-sm">
              {isComplete ? (
                <>
                  <div className="w-5 h-5 rounded-full bg-green-500 text-white flex items-center justify-center">
                    <Check size={13} strokeWidth={3} />
                  </div>
                  <span className="text-green-700 font-extrabold text-[11px]">تم التحديث بنجاح</span>
                </>
              ) : isRefreshing ? (
                <>
                  <RefreshCw size={15} className="text-[#1877f2] animate-spin" strokeWidth={2.5} />
                  <span className="text-[#1877f2] font-black text-[11px]">جاري تحديث البيانات...</span>
                </>
              ) : (
                <>
                  <motion.div
                    animate={{ rotate: pullDistance >= PULL_THRESHOLD ? 180 : 0 }}
                    transition={{ duration: 0.15 }}
                    className="text-[#1877f2]"
                  >
                    <ArrowDown size={15} strokeWidth={2.6} />
                  </motion.div>
                  <span className="text-gray-600 text-[11px]">
                    {pullDistance >= PULL_THRESHOLD ? 'أفلت للتحديث الآن' : 'اسحب لأسفل للتحديث'}
                  </span>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 3. CONTENT BODY with smooth translation down during drag */}
      <motion.div
        animate={{
          y: isRefreshing ? 45 : pullDistance > 0 ? pullDistance * 0.45 : 0,
        }}
        transition={{
          type: isDragging.current ? 'just' : 'spring',
          stiffness: 400,
          damping: 32,
        }}
      >
        {children}
      </motion.div>
    </div>
  );
}
