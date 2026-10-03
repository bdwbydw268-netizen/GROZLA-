import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, X, Play, Pause, RotateCcw, Compass, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Zap, Flame, Footprints, Shield } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

interface JRPOHModalProps {
  onClose: () => void;
}

export default function JRPOHModal({ onClose }: JRPOHModalProps) {
  const { showToast } = useAppContext();
  
  // Character position & movement state
  const [posX, setPosX] = useState(50); // percentage 0-100
  const [posY, setPosY] = useState(70); // percentage 0-100
  const [direction, setDirection] = useState<'up' | 'down' | 'left' | 'right'>('right');
  const [movementMode, setMovementMode] = useState<'walk' | 'run'>('walk');
  const [isMoving, setIsMoving] = useState(false);
  const [steeringAngle, setSteeringAngle] = useState(0); // Wheel angle
  const [activeKey, setActiveKey] = useState<string | null>(null);

  // Stats
  const [distance, setDistance] = useState(0);
  const [speed, setSpeed] = useState(2);

  const moveSpeed = movementMode === 'run' ? 1.5 : 0.7;

  // Handle continuous movement when a button or key is held
  useEffect(() => {
    let interval: any;
    if (isMoving && activeKey) {
      interval = setInterval(() => {
        setPosX(prevX => {
          let nextX = prevX;
          if (activeKey === 'right' || activeKey === 'd') nextX += moveSpeed;
          if (activeKey === 'left' || activeKey === 'a') nextX -= moveSpeed;
          return Math.max(5, Math.min(95, nextX));
        });
        setPosY(prevY => {
          let nextY = prevY;
          if (activeKey === 'down' || activeKey === 's') nextY += moveSpeed * 0.5;
          if (activeKey === 'up' || activeKey === 'w') nextY -= moveSpeed * 0.5;
          return Math.max(50, Math.min(88, nextY));
        });
        setDistance(prev => prev + (movementMode === 'run' ? 0.5 : 0.2));
      }, 30);
    }
    return () => clearInterval(interval);
  }, [isMoving, activeKey, moveSpeed, movementMode]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (['arrowup', 'w', 'arrowdown', 's', 'arrowleft', 'a', 'arrowright', 'd'].includes(key)) {
        setIsMoving(true);
        if (key === 'arrowup' || key === 'w') { setDirection('up'); setActiveKey('up'); setSteeringAngle(0); }
        if (key === 'arrowdown' || key === 's') { setDirection('down'); setActiveKey('down'); setSteeringAngle(180); }
        if (key === 'arrowleft' || key === 'a') { setDirection('left'); setActiveKey('left'); setSteeringAngle(-90); }
        if (key === 'arrowright' || key === 'd') { setDirection('right'); setActiveKey('right'); setSteeringAngle(90); }
      }
      if (key === 'shift') {
        setMovementMode(prev => prev === 'walk' ? 'run' : 'walk');
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (['arrowup', 'w', 'arrowdown', 's', 'arrowleft', 'a', 'arrowright', 'd', 'up', 'down', 'left', 'right'].includes(key)) {
        setIsMoving(false);
        setActiveKey(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  const startMove = (dir: 'up' | 'down' | 'left' | 'right', angle: number) => {
    setDirection(dir);
    setActiveKey(dir);
    setSteeringAngle(angle);
    setIsMoving(true);
  };

  const stopMove = () => {
    setIsMoving(false);
    setActiveKey(null);
  };

  return (
    <div className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-2 sm:p-4 dir-rtl overflow-hidden select-none">
      {/* Top Header Bar */}
      <div className="w-full max-w-5xl flex items-center justify-between bg-slate-900/80 border border-purple-500/30 rounded-2xl px-4 py-3 mb-3 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center font-black shadow-lg shadow-purple-500/30">
            <Sparkles size={20} className="animate-pulse" />
          </div>
          <div>
            <h2 className="text-white font-black text-base sm:text-lg flex items-center gap-2">
              محاكي عالم JRPOH الليلي
              <span className="bg-purple-500/20 text-purple-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-purple-500/30">
                وضع التفاعل الحي 🌌
              </span>
            </h2>
            <p className="text-xs text-purple-300 font-medium">تحكم بحركة الشخصية مشي وجري وعجلة الاتجاهات في الشارع الأرجواني المطر</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl transition-all cursor-pointer border border-slate-700"
          title="إغلاق المحاكي"
        >
          <X size={20} />
        </button>
      </div>

      {/* Main Interactive Stage / Viewport */}
      <div className="w-full max-w-5xl h-[60vh] sm:h-[65vh] rounded-3xl overflow-hidden relative shadow-2xl border-2 border-purple-500/40 bg-slate-950 flex flex-col items-center justify-end">
        {/* Background Image: Purple Rainy Street */}
        <div 
          className="absolute inset-0 bg-cover bg-center transition-transform duration-300 filter brightness-90 contrast-110"
          style={{ 
            backgroundImage: `url('https://i.pinimg.com/736x/4b/b6/74/4bb6744fba62d98fe64e6b6c24934b53.jpg')`,
            transform: isMoving ? (movementMode === 'run' ? 'scale(1.02)' : 'scale(1.01)') : 'scale(1)'
          }}
        >
          {/* Neon Purple Overlay & Rain Effect */}
          <div className="absolute inset-0 bg-gradient-to-t from-purple-950/70 via-indigo-950/30 to-black/40"></div>
          
          {/* Ambient Lighting Glows */}
          <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-purple-600/15 rounded-full blur-3xl pointer-events-none animate-pulse"></div>
          <div className="absolute bottom-10 right-1/4 w-80 h-80 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none"></div>
        </div>

        {/* Stats HUD overlay */}
        <div className="absolute top-4 right-4 z-20 flex items-center gap-3 bg-black/60 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/10 text-white text-xs font-bold shadow-lg">
          <div className="flex items-center gap-1.5 text-purple-300">
            <Footprints size={14} />
            <span>المسافة: {distance.toFixed(1)} م</span>
          </div>
          <div className="w-px h-4 bg-white/20"></div>
          <div className="flex items-center gap-1.5 text-amber-300">
            <Zap size={14} />
            <span>الوضع: {movementMode === 'run' ? '🏃‍♂️ جري سريع' : '🚶‍♂️ مشي عادي'}</span>
          </div>
        </div>

        {/* Character Avatar on Stage */}
        <div 
          className="absolute z-10 transition-all duration-75 ease-out flex flex-col items-center pointer-events-none"
          style={{ left: `${posX}%`, top: `${posY}%`, transform: 'translate(-50%, -100%)' }}
        >
          {/* Character Name Tag */}
          <div className="bg-purple-900/80 text-white text-[11px] font-black px-3 py-1 rounded-full backdrop-blur-xs border border-purple-400/40 shadow-lg mb-1 whitespace-nowrap">
            🌟 شخصية JRPOH
          </div>

          {/* Animated Runner / Walker figure */}
          <motion.div 
            animate={isMoving ? { y: [0, -6, 0], rotate: direction === 'left' ? -5 : direction === 'right' ? 5 : 0 } : { y: 0 }}
            transition={{ repeat: Infinity, duration: movementMode === 'run' ? 0.25 : 0.5 }}
            className={`w-16 h-24 rounded-2xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-600 shadow-2xl flex flex-col items-center justify-center border-2 border-white/40 ${isMoving ? 'shadow-purple-500/60 shadow-2xl' : ''}`}
          >
            <div className="w-9 h-9 rounded-full bg-white/90 border-2 border-purple-300 flex items-center justify-center shadow-inner overflow-hidden mb-1">
              <img src="https://ui-avatars.com/api/?name=JRPOH&background=6366f1&color=fff" alt="" className="w-full h-full object-cover" />
            </div>
            <div className="w-8 h-8 rounded-lg bg-indigo-900/80 flex items-center justify-center text-white text-xs font-black shadow-inner">
              {direction === 'left' ? '⬅️' : direction === 'right' ? '➡️' : direction === 'up' ? '⬆️' : '⬇️'}
            </div>
          </motion.div>
          {/* Shadow beneath character */}
          <div className="w-12 h-3 bg-black/50 rounded-full blur-xs mt-1"></div>
        </div>

        {/* Bottom Control Panel */}
        <div className="w-full bg-slate-900/90 backdrop-blur-md border-t border-purple-500/30 p-3 sm:p-4 relative z-20 flex flex-wrap items-center justify-between gap-4">
          
          {/* Left: Mode Toggle & Quick Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setMovementMode(prev => prev === 'walk' ? 'run' : 'walk')}
              className={`px-4 py-2.5 rounded-xl font-black text-xs transition-all flex items-center gap-2 cursor-pointer shadow-md ${
                movementMode === 'run' 
                  ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-orange-500/30' 
                  : 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-purple-500/30'
              }`}
            >
              {movementMode === 'run' ? <Flame size={16} className="animate-bounce" /> : <Footprints size={16} />}
              <span>{movementMode === 'run' ? 'وضع الجري 🏃‍♂️' : 'وضع المشي 🚶‍♂️'}</span>
            </button>

            <button
              onClick={() => { setPosX(50); setPosY(70); setDistance(0); showToast('تم إعادة تعيين الموقع بنجاح 📍'); }}
              className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl transition-all cursor-pointer border border-slate-700"
              title="إعادة تعيين"
            >
              <RotateCcw size={16} />
            </button>
          </div>

          {/* Center: Steering Wheel / Direction Wheel (عجلة دوران اتجاهات) */}
          <div className="flex items-center gap-4 bg-slate-950/80 px-4 py-2 rounded-2xl border border-purple-500/20">
            <div className="text-right hidden sm:block">
              <p className="text-[11px] font-black text-purple-300">عجلة الاتجاهات</p>
              <p className="text-[9px] text-slate-400">تدوير وتحكم دقيق</p>
            </div>
            
            <div className="relative w-14 h-14 rounded-full bg-slate-900 border-2 border-purple-500/50 flex items-center justify-center shadow-inner">
              <motion.div 
                animate={{ rotate: steeringAngle }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                className="absolute inset-1 rounded-full border border-dashed border-purple-400/60 flex items-center justify-center"
              >
                <div className="w-3 h-3 rounded-full bg-purple-400 shadow-md absolute top-1"></div>
              </motion.div>
              <Compass size={22} className="text-purple-300 relative z-10" />
            </div>
          </div>

          {/* Right: D-Pad Directional Buttons (أزرار الاتجاهات) */}
          <div className="grid grid-cols-3 gap-1 w-32 h-28">
            <div></div>
            <button
              onMouseDown={() => startMove('up', 0)}
              onMouseUp={stopMove}
              onTouchStart={() => startMove('up', 0)}
              onTouchEnd={stopMove}
              className="bg-purple-600 hover:bg-purple-500 text-white rounded-lg flex items-center justify-center shadow-md active:scale-95 transition-all cursor-pointer"
              title="أعلى / للأمام"
            >
              <ArrowUp size={18} />
            </button>
            <div></div>

            <button
              onMouseDown={() => startMove('left', -90)}
              onMouseUp={stopMove}
              onTouchStart={() => startMove('left', -90)}
              onTouchEnd={stopMove}
              className="bg-purple-600 hover:bg-purple-500 text-white rounded-lg flex items-center justify-center shadow-md active:scale-95 transition-all cursor-pointer"
              title="يسار"
            >
              <ArrowLeft size={18} />
            </button>
            <div className="bg-slate-800 rounded-lg flex items-center justify-center text-purple-300 font-black text-[10px]">
              JR
            </div>
            <button
              onMouseDown={() => startMove('right', 90)}
              onMouseUp={stopMove}
              onTouchStart={() => startMove('right', 90)}
              onTouchEnd={stopMove}
              className="bg-purple-600 hover:bg-purple-500 text-white rounded-lg flex items-center justify-center shadow-md active:scale-95 transition-all cursor-pointer"
              title="يمين"
            >
              <ArrowRight size={18} />
            </button>

            <div></div>
            <button
              onMouseDown={() => startMove('down', 180)}
              onMouseUp={stopMove}
              onTouchStart={() => startMove('down', 180)}
              onTouchEnd={stopMove}
              className="bg-purple-600 hover:bg-purple-500 text-white rounded-lg flex items-center justify-center shadow-md active:scale-95 transition-all cursor-pointer"
              title="أسفل / للخلف"
            >
              <ArrowDown size={18} />
            </button>
            <div></div>
          </div>

        </div>
      </div>
    </div>
  );
}
