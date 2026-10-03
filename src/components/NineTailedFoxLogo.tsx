import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Volume2, VolumeX, Sparkles, RefreshCw, Zap } from 'lucide-react';

interface NineTailedFoxLogoProps {
  onClick?: () => void;
  direction?: 'rtl' | 'ltr';
}

export default function NineTailedFoxLogo({ onClick }: NineTailedFoxLogoProps) {
  // Animation state: 'idle' | 'charging' | 'firing' | 'exploding' | 'revealed'
  const [animState, setAnimState] = useState<'idle' | 'charging' | 'firing' | 'exploding' | 'revealed'>('charging');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [bijuuKey, setBijuuKey] = useState(0);
  const isPlayingRef = useRef(false);

  // Synthesize Naruto Kyuubi Chakra & Bijuudama blast sound using Web Audio API
  const playSoundEffect = () => {
    if (!soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      // 1. Charge Sound: Rising high-energy chakra whistle
      const chargeOsc = ctx.createOscillator();
      const chargeGain = ctx.createGain();
      chargeOsc.type = 'sawtooth';
      chargeOsc.frequency.setValueAtTime(140, ctx.currentTime);
      chargeOsc.frequency.exponentialRampToValueAtTime(850, ctx.currentTime + 0.45);

      chargeGain.gain.setValueAtTime(0.01, ctx.currentTime);
      chargeGain.gain.linearRampToValueAtTime(0.12, ctx.currentTime + 0.35);
      chargeGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);

      chargeOsc.connect(chargeGain);
      chargeGain.connect(ctx.destination);
      chargeOsc.start(ctx.currentTime);
      chargeOsc.stop(ctx.currentTime + 0.5);

      // 2. Blast Sound: Deep punchy bass impact & energy dispersion (left to right impact)
      setTimeout(() => {
        try {
          const blastOsc = ctx.createOscillator();
          const blastGain = ctx.createGain();
          blastOsc.type = 'sine';
          blastOsc.frequency.setValueAtTime(260, ctx.currentTime);
          blastOsc.frequency.exponentialRampToValueAtTime(32, ctx.currentTime + 0.45);

          blastGain.gain.setValueAtTime(0.2, ctx.currentTime);
          blastGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.45);

          blastOsc.connect(blastGain);
          blastGain.connect(ctx.destination);
          blastOsc.start(ctx.currentTime);
          blastOsc.stop(ctx.currentTime + 0.45);

          // Secondary noise crackle
          const bufferSize = ctx.sampleRate * 0.15;
          const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
          const data = buffer.getChannelData(0);
          for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
          }
          const noise = ctx.createBufferSource();
          noise.buffer = buffer;
          const noiseFilter = ctx.createBiquadFilter();
          noiseFilter.type = 'bandpass';
          noiseFilter.frequency.value = 1200;
          const noiseGain = ctx.createGain();
          noiseGain.gain.setValueAtTime(0.08, ctx.currentTime);
          noiseGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);

          noise.connect(noiseFilter);
          noiseFilter.connect(noiseGain);
          noiseGain.connect(ctx.destination);
          noise.start(ctx.currentTime);
        } catch {}
      }, 480);
    } catch {
      // Audio not permitted or not supported
    }
  };

  // Launch the Bijuu Bomb sequence (Kurama on Left, fires from Left to Right into Facebook on Right)
  const launchBijuuAttack = () => {
    if (isPlayingRef.current) return;
    isPlayingRef.current = true;
    setBijuuKey(prev => prev + 1);
    setAnimState('charging');
    playSoundEffect();

    // Sequence timing:
    // 0ms -> charging (Kurama on left gathers particles at mouth)
    // 500ms -> firing (Bijuudama shoots from left to right)
    // 780ms -> exploding (hits the facebook wordmark on right)
    // 1000ms -> revealed (facebook text emerges with electric blue chakra)
    // 2000ms -> idle (settled)
    setTimeout(() => {
      setAnimState('firing');
    }, 500);

    setTimeout(() => {
      setAnimState('exploding');
    }, 780);

    setTimeout(() => {
      setAnimState('revealed');
    }, 1000);

    setTimeout(() => {
      setAnimState('idle');
      isPlayingRef.current = false;
    }, 2000);
  };

  // Trigger on initial mount with a brief delay
  useEffect(() => {
    const timer = setTimeout(() => {
      launchBijuuAttack();
    }, 400);
    return () => clearTimeout(timer);
  }, []);

  const handleContainerClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    launchBijuuAttack();
    if (onClick) {
      onClick();
    }
  };

  // 9 tails data: sweeping gracefully to the left and back
  const tails = [
    { id: 1, angle: -82, length: 36, delay: 0.1, x: -18, y: 8 },
    { id: 2, angle: -68, length: 42, delay: 0.2, x: -15, y: 5 },
    { id: 3, angle: -54, length: 46, delay: 0.3, x: -12, y: 2 },
    { id: 4, angle: -40, length: 49, delay: 0.15, x: -9, y: 0 },
    { id: 5, angle: -26, length: 50, delay: 0.25, x: -6, y: -2 },
    { id: 6, angle: -12, length: 48, delay: 0.15, x: -3, y: -3 },
    { id: 7, angle: 2, length: 45, delay: 0.35, x: 0, y: -4 },
    { id: 8, angle: 16, length: 40, delay: 0.2, x: 3, y: -3 },
    { id: 9, angle: 30, length: 35, delay: 0.4, x: 6, y: -1 },
  ];

  return (
    <div 
      className="relative flex items-center select-none group cursor-pointer"
      onClick={handleContainerClick}
      title="كوراما يطلق كرة بيجو من اليسار إلى اليمين لتظهر كلمة فيسبوك! 🦊💥"
      dir="ltr" /* Force LTR so Kurama is strictly on the LEFT and Facebook is strictly on the RIGHT */
    >
      {/* Horizontal Flex Container: Kurama on Left -> Bijuu Path in Middle -> Facebook on Right */}
      <div className="relative flex items-center justify-start gap-1 py-1">
        
        {/* ============================================================== */}
        {/* 1. NINE-TAILED FOX (KURAMA / ثعلب ذيول تسعة) ON THE LEFT SIDE */}
        {/* ============================================================== */}
        <div className="relative flex items-center justify-center shrink-0">
          <motion.div 
            className="relative z-10 flex items-center justify-center"
            animate={
              animState === 'charging' 
                ? { scale: [1, 1.15, 1.2], x: [0, -2, -4] } 
                : animState === 'firing'
                ? { scale: [1.2, 1.05], x: [-4, 2, 0] } /* Recoil and lunge forward to the right */
                : { scale: [1, 1.03, 1], y: [0, -1, 0] }
            }
            transition={{
              duration: animState === 'charging' ? 0.5 : animState === 'firing' ? 0.25 : 2.5,
              repeat: animState === 'idle' ? Infinity : 0,
              ease: "easeInOut"
            }}
          >
            {/* Fiery Chakra Aura Glow behind Kurama */}
            <motion.div 
              className="absolute -inset-2 rounded-full pointer-events-none filter blur-md"
              animate={{
                opacity: animState === 'charging' ? [0.4, 0.9, 1] : [0.25, 0.5, 0.25],
                background: animState === 'charging' 
                  ? 'radial-gradient(circle, rgba(239,68,68,0.85) 0%, rgba(147,51,234,0.65) 50%, transparent 80%)'
                  : 'radial-gradient(circle, rgba(249,115,22,0.6) 0%, rgba(220,38,38,0.4) 60%, transparent 85%)'
              }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />

            {/* SVG Illustration of Kurama Facing to the Right */}
            <svg 
              width="68" 
              height="52" 
              viewBox="0 0 105 80" 
              className="overflow-visible filter drop-shadow-[0_2px_6px_rgba(234,88,12,0.45)]"
            >
              <defs>
                {/* Flame Gradient for Tails */}
                <linearGradient id="kyuubiTailGradSide" x1="0%" y1="100%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#991b1b" />
                  <stop offset="35%" stopColor="#c2410c" />
                  <stop offset="70%" stopColor="#ea580c" />
                  <stop offset="90%" stopColor="#f97316" />
                  <stop offset="100%" stopColor="#fef08a" />
                </linearGradient>

                {/* Kurama Body Gradient */}
                <linearGradient id="kyuubiFurGradSide" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#ea580c" />
                  <stop offset="55%" stopColor="#c2410c" />
                  <stop offset="100%" stopColor="#7f1d1d" />
                </linearGradient>

                {/* Eye Glow Filter */}
                <filter id="eyeGlowSide" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="2" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>

              {/* --- 9 TAILS (الذيول التسعة) Sweeping back to the LEFT --- */}
              <g className="origin-bottom">
                {tails.map((tail) => (
                  <motion.g
                    key={tail.id}
                    style={{ transformOrigin: '38px 65px' }}
                    animate={{
                      rotate: [
                        tail.angle - 3,
                        tail.angle + 4,
                        tail.angle - 3
                      ],
                      scaleY: animState === 'charging' ? [1, 1.15, 1.1] : [1, 1.05, 1]
                    }}
                    transition={{
                      duration: 1.8 + tail.delay,
                      repeat: Infinity,
                      ease: "easeInOut",
                      delay: tail.delay
                    }}
                  >
                    {/* Tail Outer Flame Path */}
                    <path
                      d={`M 38 65 Q ${38 + tail.x * 1.5} ${65 - tail.length * 0.5}, ${38 + tail.x * 2.2} ${65 - tail.length} Q ${38 + tail.x * 0.8} ${65 - tail.length * 0.7}, 38 65`}
                      fill="url(#kyuubiTailGradSide)"
                      stroke="#dc2626"
                      strokeWidth="0.8"
                      opacity="0.95"
                    />
                    {/* Tail Inner Chakra Flame Highlight */}
                    <path
                      d={`M 38 65 Q ${38 + tail.x * 1.2} ${65 - tail.length * 0.45}, ${38 + tail.x * 1.8} ${65 - tail.length * 0.85} Q ${38 + tail.x * 0.6} ${65 - tail.length * 0.6}, 38 65`}
                      fill="#fed7aa"
                      opacity="0.75"
                    />
                  </motion.g>
                ))}
              </g>

              {/* --- FOX BODY (Proudy Standing, Facing Right) --- */}
              {/* Haunches / Back */}
              <path
                d="M 28 68 C 25 54, 34 46, 44 48 C 50 49, 58 52, 60 68 Z"
                fill="url(#kyuubiFurGradSide)"
                stroke="#7f1d1d"
                strokeWidth="1.2"
              />
              {/* Chest Fur Tufts */}
              <path
                d="M 44 52 L 48 58 L 52 54 L 56 60 L 60 54 L 52 48 Z"
                fill="#ffedd5"
                opacity="0.9"
              />

              {/* Left Back Ear */}
              <path d="M 48 38 L 42 18 C 45 23, 49 29, 53 34 Z" fill="#991b1b" stroke="#450a0a" strokeWidth="0.8" />

              {/* Right Front Ear (Pointing Forward/Right) */}
              <motion.path
                d="M 58 38 L 66 16 C 63 22, 61 30, 60 36 Z"
                fill="#ea580c"
                stroke="#7f1d1d"
                strokeWidth="1"
                animate={{ rotate: animState === 'charging' ? [2, -3, 2] : 0 }}
              />
              <path d="M 59 34 L 64 20 C 62 24, 60 28, 59 32 Z" fill="#450a0a" />

              {/* Head & Muzzle (Facing to the RIGHT towards Facebook!) */}
              <path
                d="M 46 44 C 46 36, 56 34, 64 36 L 76 44 L 66 52 C 58 54, 48 52, 46 44 Z"
                fill="url(#kyuubiFurGradSide)"
                stroke="#7f1d1d"
                strokeWidth="1.2"
              />

              {/* Kurama's Iconic Black Eye Markings (Around Eye Socket, aimed right) */}
              <path
                d="M 54 40 Q 61 38, 65 43 Q 60 45, 54 40 Z"
                fill="#0f172a"
              />

              {/* Piercing Crimson Eye with Vertical Slit Pupil */}
              <ellipse cx="61" cy="41" rx="2.8" ry="2.2" fill="#ef4444" filter="url(#eyeGlowSide)" />
              <line x1="61" y1="39.5" x2="61" y2="42.5" stroke="#000" strokeWidth="1" strokeLinecap="round" />

              {/* Nose Tip at Snout pointing Right */}
              <polygon points="76,43 78,44 76,45" fill="#18181b" />

              {/* Open Roaring Mouth Facing Directly Right to Shoot Bijuu Bomb */}
              <motion.path
                d={animState === 'charging' || animState === 'firing' ? "M 67 46 L 77 47 L 70 53 Z" : "M 68 47 L 76 47 L 71 50 Z"}
                fill="#450a0a"
                stroke="#18181b"
                strokeWidth="0.8"
              />
              {/* Sharp White Fangs in Open Mouth */}
              <polygon points="71,47 72,49 73,47" fill="#fff" />
              <polygon points="74,47 75,49 76,47" fill="#fff" />
              <polygon points="71,51 72,49.5 73,51" fill="#fff" />

              {/* Front Paws Braced on Ground */}
              <ellipse cx="58" cy="69" rx="4.5" ry="3" fill="#ea580c" stroke="#7f1d1d" strokeWidth="0.8" />
              <line x1="56" y1="68" x2="56" y2="72" stroke="#450a0a" strokeWidth="0.8" />
              <line x1="58" y1="68" x2="58" y2="72" stroke="#450a0a" strokeWidth="0.8" />
              <line x1="60" y1="68" x2="60" y2="72" stroke="#450a0a" strokeWidth="0.8" />

              <ellipse cx="68" cy="69" rx="4.5" ry="3" fill="#ea580c" stroke="#7f1d1d" strokeWidth="0.8" />
              <line x1="66" y1="68" x2="66" y2="72" stroke="#450a0a" strokeWidth="0.8" />
              <line x1="68" y1="68" x2="68" y2="72" stroke="#450a0a" strokeWidth="0.8" />
              <line x1="70" y1="68" x2="70" y2="72" stroke="#450a0a" strokeWidth="0.8" />
            </svg>
          </motion.div>
        </div>

        {/* ============================================================== */}
        {/* 2. BIJUU BOMB (كرة بيجو) PROJECTILE (FROM LEFT TO RIGHT ➡️)     */}
        {/* ============================================================== */}
        {/* Swirling Chakra Inward Gathering Particles at Kurama's Mouth on the Left */}
        <AnimatePresence>
          {animState === 'charging' && (
            <motion.div 
              key={`particles-side-${bijuuKey}`}
              className="absolute z-20 pointer-events-none -translate-x-1/2 -translate-y-1/2"
              style={{ left: '52px', top: '29px' }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {[...Array(12)].map((_, i) => {
                const angle = (i * 360) / 12;
                const distance = 24;
                const x = Math.cos((angle * Math.PI) / 180) * distance;
                const y = Math.sin((angle * Math.PI) / 180) * distance;
                return (
                  <motion.div
                    key={i}
                    className="absolute w-2 h-2 rounded-full -translate-x-1/2 -translate-y-1/2"
                    style={{
                      background: i % 2 === 0 ? '#9333ea' : '#ef4444',
                      boxShadow: i % 2 === 0 ? '0 0 6px #a855f7' : '0 0 6px #f87171'
                    }}
                    initial={{ x, y, scale: 1, opacity: 0.9 }}
                    animate={{ x: 0, y: 0, scale: 0.2, opacity: 0 }}
                    transition={{
                      duration: 0.45,
                      repeat: Infinity,
                      delay: (i * 0.03) % 0.3,
                      ease: "easeIn"
                    }}
                  />
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>

        {/* The Dense Bijuu Bomb Sphere (Shoots horizontally from Left to Right ➡️) */}
        <AnimatePresence>
          {(animState === 'charging' || animState === 'firing') && (
            <motion.div
              key={`bijuudama-side-${bijuuKey}`}
              className="absolute z-30 pointer-events-none flex items-center justify-center -translate-x-1/2 -translate-y-1/2"
              style={{ left: '52px', top: '29px' }}
              initial={{ scale: 0, opacity: 0, x: 0 }}
              animate={
                animState === 'charging'
                  ? { 
                      scale: [0, 0.7, 1.15, 1.25], 
                      opacity: 1, 
                      x: 0 
                    }
                  : { 
                      scale: [1.25, 1.6, 2.2], 
                      x: [0, 88], /* Shoots directly across from LEFT to RIGHT into facebook! */
                      opacity: [1, 1, 0.85]
                    }
              }
              transition={{
                duration: animState === 'charging' ? 0.48 : 0.28,
                ease: animState === 'charging' ? "easeOut" : "easeIn"
              }}
            >
              {/* Outer Chakra Energy Rings (spinning) */}
              <motion.div 
                className="absolute w-8 h-8 rounded-full border-2 border-dashed border-red-500/80"
                animate={{ rotate: 360 }}
                transition={{ duration: 0.6, repeat: Infinity, ease: "linear" }}
              />
              <motion.div 
                className="absolute w-10 h-10 rounded-full border border-purple-400/70"
                animate={{ rotate: -360, scale: [0.9, 1.1, 0.9] }}
                transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
              />

              {/* Core of the Bijuu Bomb: Ultra Dense Obsidian Black + Crimson/Violet Aura */}
              <div 
                className="w-6 h-6 rounded-full relative shadow-[0_0_15px_#9333ea,0_0_28px_#ef4444]"
                style={{
                  background: 'radial-gradient(circle at 35% 35%, #581c87 0%, #1e1b4b 45%, #050505 100%)',
                  border: '1.5px solid #c084fc'
                }}
              >
                {/* Glowing Core Specular Flare */}
                <div className="absolute top-1 left-1.5 w-1.5 h-1.5 rounded-full bg-white/90 filter blur-[0.5px]" />
              </div>

              {/* Horizontal Laser / Chakra Trail when firing from Left to Right */}
              {animState === 'firing' && (
                <motion.div 
                  className="absolute right-full top-1/2 -translate-y-1/2 h-3.5 bg-gradient-to-r from-transparent via-purple-600 to-red-500 rounded-full shadow-[0_0_12px_#ef4444]"
                  initial={{ width: 0 }}
                  animate={{ width: 85 }}
                  transition={{ duration: 0.25 }}
                />
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Detonation / Shockwave Explosion over the Word on the Right */}
        <AnimatePresence>
          {animState === 'exploding' && (
            <motion.div 
              key={`explosion-side-${bijuuKey}`}
              className="absolute z-40 pointer-events-none flex items-center justify-center -translate-x-1/2 -translate-y-1/2"
              style={{ left: '140px', top: '29px' }}
              initial={{ scale: 0.2, opacity: 1 }}
              animate={{ scale: [0.2, 2.8, 3.6], opacity: [1, 0.8, 0] }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            >
              {/* Expanding Shockwave Wave */}
              <div className="w-16 h-16 rounded-full border-4 border-[#1877f2] shadow-[0_0_30px_#1877f2,0_0_50px_#ef4444] bg-white/20 filter blur-[1px]" />
              {/* Secondary Fiery Flash */}
              <motion.div 
                className="absolute w-20 h-20 rounded-full bg-radial from-amber-200 via-orange-500 to-transparent"
                initial={{ opacity: 0.9 }}
                animate={{ opacity: 0, scale: 2 }}
                transition={{ duration: 0.35 }}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* ============================================================== */}
        {/* 3. THE WORD "facebook" ON THE RIGHT SIDE (اللون البنفسجي الأنيق) */}
        {/* ============================================================== */}
        <div className="relative z-10 flex items-center pl-1">
          <motion.h1
            className="text-[28px] font-black tracking-tighter cursor-pointer lowercase select-none"
            style={{ 
              fontFamily: 'system-ui, -apple-system, sans-serif', 
              letterSpacing: '-1px' 
            }}
            animate={
              animState === 'charging'
                ? { 
                    opacity: 0.2, 
                    filter: 'blur(3px)', 
                    scale: 0.96 
                  }
                : animState === 'firing'
                ? { 
                    opacity: 0.35, 
                    filter: 'blur(2px)', 
                    scale: 0.98 
                  }
                : animState === 'exploding'
                ? { 
                    opacity: 1, 
                    filter: 'blur(0px)', 
                    scale: [0.85, 1.2, 1.05],
                    textShadow: '0 0 25px #8b5cf6, 0 0 40px #a855f7, 0 0 55px #7c3aed',
                    color: '#ffffff'
                  }
                : animState === 'revealed'
                ? { 
                    opacity: 1, 
                    scale: [1.06, 1],
                    textShadow: '0 0 14px rgba(139,92,246,0.65)',
                    color: '#8b5cf6'
                  }
                : { 
                    opacity: 1, 
                    scale: 1,
                    textShadow: '0 0 0px transparent',
                    color: '#8b5cf6'
                  }
            }
            transition={{
              duration: animState === 'exploding' ? 0.35 : 0.4,
              ease: "easeOut"
            }}
          >
            <span className="relative inline-block text-[#8b5cf6]">
              facebook

              {/* Sparkles / Bijuu Flare Tag above the word */}
              <AnimatePresence>
                {(animState === 'revealed' || animState === 'exploding') && (
                  <motion.span
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: [0, 0.95, 0], y: -8 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.7 }}
                    className="absolute -top-3 left-0 right-0 text-center text-xs font-bold text-purple-400 pointer-events-none drop-shadow-sm flex items-center justify-center gap-0.5"
                  >
                    <Sparkles size={11} className="text-yellow-400 animate-spin" />
                    <span className="text-[9px] text-purple-500 font-black tracking-widest uppercase">BIJUU!</span>
                    <Sparkles size={11} className="text-yellow-400 animate-spin" />
                  </motion.span>
                )}
              </AnimatePresence>
            </span>
          </motion.h1>

          {/* Sound Mute/Unmute Indicator */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setSoundEnabled(!soundEnabled);
            }}
            className="p-1 text-gray-300 hover:text-gray-700 rounded-full transition-colors opacity-0 group-hover:opacity-100 ml-1"
            title={soundEnabled ? 'كتم صوت كرة بيجو' : 'تشغيل صوت كرة بيجو'}
          >
            {soundEnabled ? <Volume2 size={11} className="text-purple-600" /> : <VolumeX size={11} />}
          </button>
        </div>
      </div>
    </div>
  );
}
