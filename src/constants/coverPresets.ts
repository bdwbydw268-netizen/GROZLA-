export interface CoverPreset {
  id: string;
  name: string;
  category: string;
  url: string;
  gradient: string;
  description: string;
}

// Ultra-sleek, responsive, high-definition SVG Default Facebook Cover
export const MODERN_DEFAULT_COVER_SVG = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 600" width="100%" height="100%" preserveAspectRatio="xMidYMid slice">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="%230b132b" />
      <stop offset="35%" stop-color="%231c2541" />
      <stop offset="70%" stop-color="%231e3a8a" />
      <stop offset="100%" stop-color="%231877f2" />
    </linearGradient>
    <linearGradient id="glowGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="%2300f2fe" stop-opacity="0.4" />
      <stop offset="100%" stop-color="%234facfe" stop-opacity="0" />
    </linearGradient>
    <linearGradient id="glowGrad2" x1="100%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="%238b5cf6" stop-opacity="0.35" />
      <stop offset="100%" stop-color="%23ec4899" stop-opacity="0" />
    </linearGradient>
    <radialGradient id="sunGlow" cx="80%" cy="20%" r="60%">
      <stop offset="0%" stop-color="%2360a5fa" stop-opacity="0.45" />
      <stop offset="50%" stop-color="%231877f2" stop-opacity="0.15" />
      <stop offset="100%" stop-color="%23000000" stop-opacity="0" />
    </radialGradient>
    <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
      <path d="M 40 0 L 0 0 0 40" fill="none" stroke="%23ffffff" stroke-width="0.75" stroke-opacity="0.06" />
    </pattern>
  </defs>

  <!-- Background Base -->
  <rect width="100%" height="100%" fill="url(%23bgGrad)" />

  <!-- Abstract Glow Waves -->
  <rect width="100%" height="100%" fill="url(%23sunGlow)" />
  <circle cx="200" cy="100" r="350" fill="url(%23glowGrad1)" />
  <circle cx="1400" cy="500" r="450" fill="url(%23glowGrad2)" />

  <!-- Modern Grid Overlay -->
  <rect width="100%" height="100%" fill="url(%23grid)" />

  <!-- Organic Wave Curves -->
  <path d="M-100,500 C300,350 500,580 900,420 C1300,260 1500,480 1800,380 L1800,700 L-100,700 Z" fill="%23ffffff" fill-opacity="0.04" />
  <path d="M-100,550 C400,420 700,600 1100,450 C1400,340 1600,520 1800,460 L1800,700 L-100,700 Z" fill="%231877f2" fill-opacity="0.15" />
  <path d="M-50,200 Q400,50 850,260 T1700,180" fill="none" stroke="%2338bdf8" stroke-width="2.5" stroke-opacity="0.25" />
  <path d="M0,280 Q500,120 950,320 T1800,240" fill="none" stroke="%23818cf8" stroke-width="2" stroke-opacity="0.2" />

  <!-- Floating Ambient Particles -->
  <circle cx="320" cy="180" r="4" fill="%23ffffff" fill-opacity="0.5" />
  <circle cx="450" cy="380" r="3" fill="%2338bdf8" fill-opacity="0.6" />
  <circle cx="780" cy="140" r="5" fill="%2360a5fa" fill-opacity="0.4" />
  <circle cx="1150" cy="220" r="3.5" fill="%23ffffff" fill-opacity="0.5" />
  <circle cx="1320" cy="130" r="4.5" fill="%23a855f7" fill-opacity="0.6" />
  <circle cx="950" cy="480" r="3" fill="%2338bdf8" fill-opacity="0.4" />
  <circle cx="1500" cy="320" r="4" fill="%23ffffff" fill-opacity="0.45" />

  <!-- Subtle Facebook / GROZLA Modern Geometric Watermark -->
  <g transform="translate(1420, 50)" opacity="0.12">
    <circle cx="60" cy="60" r="55" fill="none" stroke="%23ffffff" stroke-width="6" />
    <path d="M45,35 L75,35 L75,50 L65,50 L65,85 L45,85 Z" fill="%23ffffff" />
  </g>
</svg>`;

// Ultra-sleek Finland Silk Flag Wavy Cover
export const FINLAND_FLAG_SILK_COVER_SVG = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 600" width="100%" height="100%" preserveAspectRatio="xMidYMid slice">
  <defs>
    <!-- Flag base colors -->
    <linearGradient id="whiteSilk" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="%23f8fafc" />
      <stop offset="50%" stop-color="%23e2e8f0" />
      <stop offset="100%" stop-color="%23cbd5e1" />
    </linearGradient>
    <linearGradient id="blueSilk" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="%2300439c" />
      <stop offset="50%" stop-color="%23002b66" />
      <stop offset="100%" stop-color="%2300183b" />
    </linearGradient>

    <!-- Silk Wave Shadow & Specular Filter Overlays -->
    <linearGradient id="silkFolds1" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="%23000000" stop-opacity="0.45" />
      <stop offset="15%" stop-color="%23ffffff" stop-opacity="0.35" />
      <stop offset="30%" stop-color="%23000000" stop-opacity="0.5" />
      <stop offset="48%" stop-color="%23ffffff" stop-opacity="0.4" />
      <stop offset="65%" stop-color="%23000000" stop-opacity="0.55" />
      <stop offset="82%" stop-color="%23ffffff" stop-opacity="0.3" />
      <stop offset="100%" stop-color="%23000000" stop-opacity="0.5" />
    </linearGradient>

    <linearGradient id="silkDiagonal" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="%23000000" stop-opacity="0.3" />
      <stop offset="25%" stop-color="%23ffffff" stop-opacity="0.25" />
      <stop offset="50%" stop-color="%23000000" stop-opacity="0.4" />
      <stop offset="75%" stop-color="%23ffffff" stop-opacity="0.2" />
      <stop offset="100%" stop-color="%23000000" stop-opacity="0.45" />
    </linearGradient>
  </defs>

  <!-- White Silk Base Background -->
  <rect width="1600" height="600" fill="url(%23whiteSilk)" />

  <!-- Blue Nordic Cross (Vertical bar: x=400, width=240 | Horizontal bar: y=200, height=200) -->
  <rect x="0" y="200" width="1600" height="200" fill="url(%23blueSilk)" />
  <rect x="380" y="0" width="260" height="600" fill="url(%23blueSilk)" />

  <!-- Satin Silk Dynamic Wave Overlays -->
  <rect width="1600" height="600" fill="url(%23silkFolds1)" style="mix-blend-mode: overlay;" />
  <rect width="1600" height="600" fill="url(%23silkDiagonal)" style="mix-blend-mode: multiply;" />

  <!-- Organic Satin Ribbons & Shadow Curves -->
  <path d="M0,0 C300,120 500,40 800,180 C1100,320 1300,100 1600,250 L1600,0 Z" fill="%23ffffff" fill-opacity="0.15" />
  <path d="M0,600 C400,450 700,580 1100,420 C1400,300 1500,520 1600,480 L1600,600 Z" fill="%23000000" fill-opacity="0.25" />
  <path d="M200,0 Q600,400 1000,100 T1600,300" fill="none" stroke="%23ffffff" stroke-width="80" stroke-opacity="0.08" />
  <path d="M0,200 Q500,600 1200,200" fill="none" stroke="%23000000" stroke-width="120" stroke-opacity="0.15" />
</svg>`;

export const COVER_PRESETS: CoverPreset[] = [
  {
    id: 'preset-purple-studio-pro',
    name: 'استوديو الإنتاج والموسيقى البنفسجي (Purple Pro Studio 🎹)',
    category: 'تقنية وتصميم',
    url: '/profile_studio_cover.jpg',
    gradient: 'from-purple-900 via-indigo-950 to-black',
    description: 'استوديو صوتي وموسيقي احترافي بنفسجي فائق الوضوح وبدون أي ضباب.'
  },
  {
    id: 'preset-finland-silk',
    name: 'علم فنلندا الحريري المتموج (Finland Silk Flag)',
    category: 'رسمي وفيسبوك',
    url: FINLAND_FLAG_SILK_COVER_SVG,
    gradient: 'from-blue-900 via-slate-100 to-blue-950',
    description: 'راية فنلندا الحريرية ثلاثية الأبعاد بتموجات واقعية فائقة الدقة.'
  },
  {
    id: 'preset-fb-cyber-blue',
    name: 'أزرق فيسبوك العصري (Cyber Blue)',
    category: 'رسمي وفيسبوك',
    url: MODERN_DEFAULT_COVER_SVG,
    gradient: 'from-blue-900 via-indigo-900 to-slate-900',
    description: 'غلاف فيسبوك عصري مع شبكة ثلاثية الأبعاد وأضواء نيون زرقاء متدفقة.'
  },
  {
    id: 'preset-aurora-night',
    name: 'الشفق القطبي الزمردي (Aurora Glow)',
    category: 'طبيعة وكون',
    url: 'https://images.unsplash.com/photo-1531366936337-7c912a4589a7?w=1600&auto=format&fit=crop&q=80',
    gradient: 'from-emerald-950 via-teal-900 to-slate-950',
    description: 'أضواء الشفق القطبي الخضراء والبنفسجية الساحرة تملأ الأفق.'
  },
  {
    id: 'preset-sunset-coastal',
    name: 'شفق الغروب الذهبي (Golden Sunset)',
    category: 'غروب وألوان دافئة',
    url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1600&auto=format&fit=crop&q=80',
    gradient: 'from-amber-600 via-rose-700 to-indigo-950',
    description: 'غروب الشمس الساحلي بألوان ذهبية ووردية مريحة للعين.'
  },
  {
    id: 'preset-space-nebula',
    name: 'سديم الفضاء الكوني (Deep Nebula)',
    category: 'فضاء وخيال',
    url: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1600&auto=format&fit=crop&q=80',
    gradient: 'from-purple-950 via-blue-950 to-slate-950',
    description: 'نجوم وكواكب وسديم أزرق وبنفسجي بدقة سينمائية فائقة.'
  },
  {
    id: 'preset-cyberpunk-neon',
    name: 'أضواء السايبربانك (Cyber Neon)',
    category: 'تقنية وتصميم',
    url: 'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?w=1600&auto=format&fit=crop&q=80',
    gradient: 'from-fuchsia-950 via-violet-900 to-blue-950',
    description: 'تدرجات نيون حيوية تعكس الحداثة والجاذبية.'
  },
  {
    id: 'preset-mountain-mist',
    name: 'قمم الجبال الصباحية (Mountain Mist)',
    category: 'طبيعة وكون',
    url: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1600&auto=format&fit=crop&q=80',
    gradient: 'from-slate-900 via-cyan-950 to-stone-900',
    description: 'سلاسل جبلية شاهقة مع شروق شمس هادئ وضباب نقي.'
  },
  {
    id: 'preset-dark-luxury',
    name: 'الفخامة الداكنة والذهب (Dark Obsidian)',
    category: 'فخامة وبساطة',
    url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1600&auto=format&fit=crop&q=80',
    gradient: 'from-zinc-950 via-neutral-900 to-stone-950',
    description: 'تموجات تجريدية حريرية داكنة تناسب الحسابات الراقية.'
  },
  {
    id: 'preset-emerald-flow',
    name: 'التيار الزمردي التجريدي (Emerald Flow)',
    category: 'تقنية وتصميم',
    url: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?w=1600&auto=format&fit=crop&q=80',
    gradient: 'from-teal-950 via-emerald-900 to-slate-950',
    description: 'خطوط ضوئية مائية زمردية ثلاثية الأبعاد غنية بالتفاصيل.'
  }
];
