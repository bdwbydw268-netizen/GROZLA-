import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Sparkles, 
  RefreshCw, 
  Search, 
  Check, 
  Image as ImageIcon, 
  Wand2, 
  Upload, 
  ShieldCheck, 
  AlertTriangle, 
  ScanFace, 
  CheckCircle2, 
  Smile, 
  Lightbulb, 
  Eye, 
  Maximize2, 
  Palette,
  FileCheck,
  Tag,
  Cloud,
  Database
} from 'lucide-react';
import { AiGeneratedImage, AiUploadContext, AiImageAnalysisResult } from '../types';
import { compressImage, validateImageFile } from '../utils/imageUtils';
import { useAppContext } from '../context/AppContext';

export interface AiImagePickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectImage: (imageUrl: string, title?: string, analysis?: AiImageAnalysisResult) => void;
  postContent?: string;
  context?: AiUploadContext;
  title?: string;
  subtitle?: string;
  profileAvatarRef?: string;
}

interface DomainCategory {
  id: string;
  name: string;
  icon: string;
  description: string;
  defaultPrompt: string;
}

const DOMAINS: DomainCategory[] = [
  { id: 'all', name: 'الكل والمميز', icon: '✨', description: 'تشكيلة مختارة في كافة المجالات', defaultPrompt: 'stunning beautiful masterpiece award winning photography in diverse fields' },
  { id: 'portraits', name: 'صور شخصية وبورتريه', icon: '👤', description: 'أفاتار احترافي، شخصيات 3D، ووجوه معبرة', defaultPrompt: 'professional studio portrait headshot, warm elegant rim lighting, highly detailed face, clean background' },
  { id: 'nature', name: 'طبيعة ومناظر', icon: '🌿', description: 'شلالات، جبال، غابات، وبحار ساحرة', defaultPrompt: 'majestic waterfall and green misty mountains at golden sunset cinematic national geographic' },
  { id: 'tech', name: 'تكنولوجيا وذكاء اصطناعي', icon: '🤖', description: 'روبوتات، شبكات مستقبلية، سايبربانك', defaultPrompt: 'futuristic humanoid AI robot with glowing holographic interface and cyber city lights' },
  { id: 'cars', name: 'سيارات وسرعة', icon: '🏎️', description: 'سيارات رياضية فاخرة، دراجات، وسرعة', defaultPrompt: 'sleek hypercar drifting on neon wet asphalt highway 8k octane render' },
  { id: 'space', name: 'فضاء وفلك', icon: '🚀', description: 'مجرات، كواكب، كويكبات، ومكوكات فضائية', defaultPrompt: 'breathtaking galaxy nebula with cosmic astronaut floating near glowing rings of Saturn' },
  { id: 'art', name: 'فنون وتصميم', icon: '🎨', description: 'لوحات فنية، ألوان مائية، وفنون رقمية ثلاثية الأبعاد', defaultPrompt: 'abstract 3d fluid geometry iridescent marble sculpture pastel colors studio lighting' },
  { id: 'food', name: 'طعام ومأكولات', icon: '🍕', description: 'أطباق شرقية وعالمية، حلويات وقهوة', defaultPrompt: 'delicious gourmet artisan burger with melting cheddar cheese and steam crispy fries close-up food photography' },
  { id: 'sports', name: 'رياضة ولياقة', icon: '⚽', description: 'كرة قدم، تدريب لياقة، وملاعب مشتعلة', defaultPrompt: 'football player kicking glowing ball in grand stadium under dramatic spotlights' },
  { id: 'anime', name: 'أنمي وخيال', icon: '🎭', description: 'شخصيات أنمي ملحمية، عوالم خيالية ساحرة', defaultPrompt: 'Makoto Shinkai style gorgeous anime scenery sunset clouds overlooking vibrant fantasy coastal city' },
  { id: 'cinematic', name: 'سينمائي وخلفيات', icon: '🌌', description: 'مشاهد أفلام 4K، إضاءة دراماتيكية', defaultPrompt: 'cinematic dramatic movie shot 8k volumetric fog atmospheric neon twilight aesthetics' },
  { id: 'business', name: 'أعمال ونجاح', icon: '💼', description: 'مكاتب عصرية، شركات ناشئة، وريادة', defaultPrompt: 'modern luxury executive corporate boardroom with panoramic sunset city view minimalist' },
  { id: 'islamic', name: 'تراث وأصالة', icon: '🕌', description: 'معالم إسلامية وتاريخية، أسواق عريقة', defaultPrompt: 'grand historic Islamic mosque with ornate turquoise tiles glowing under starry night sky' },
  { id: 'flowers', name: 'زهور وجمال', icon: '🌺', description: 'باقات ورد نضرة، حدائق ساكورا، وأزياء', defaultPrompt: 'lush romantic bouquet of fresh peonies with morning dew drops soft pastel lighting macro' },
  { id: 'animals', name: 'حيوانات وبرية', icon: '🦁', description: 'أسود، خيول عربية أصيلة، وطيور نادرة', defaultPrompt: 'majestic royal Arabian black horse galloping through desert sand dunes sunrise' }
];

const STYLES = [
  { id: 'photorealistic', name: 'واقعي فوتوغرافي' },
  { id: '3d-render', name: 'ثلاثي الأبعاد 3D' },
  { id: 'anime', name: 'أنمي وكرتون' },
  { id: 'cinematic', name: 'سينمائي 4K' },
  { id: 'cyberpunk', name: 'سايبربانك ونيون' },
  { id: 'oil-painting', name: 'لوحة زيتية فنية' }
];

// Curated reaction stickers for comments
const COMMENT_REACTIONS_PRESETS = [
  { title: 'أحسنت وتصفيق', icon: '👏', prompt: 'cute friendly 3D cartoon hands clapping celebration with golden confetti, colorful glossy render' },
  { title: 'إعجاب قوي', icon: '👍', prompt: 'vibrant 3D glossy thumbs up icon with sparkling stars around it, playful cheerful sticker style' },
  { title: 'قلب وحب', icon: '❤️', prompt: 'glowing 3D crystal neon ruby heart floating in magical soft bokeh background romantic aesthetic' },
  { title: 'ضحك وسعادة', icon: '😂', prompt: 'hilarious cheerful 3D smiley emoji with happy tears of joy, bright glossy studio lighting' },
  { title: 'فكرة عبقرية', icon: '💡', prompt: 'glowing energetic 3D electric lightbulb with sparks and creative brainstorm geometric particles' },
  { title: 'حماس ونار', icon: '🔥', prompt: 'stylized 3D glowing flame fireball with colorful sparks on clean dark backdrop, energetic sticker' },
  { title: 'مذهل ورائع', icon: '🤩', prompt: 'adorable 3D astronaut cat floating with star-shaped sparkling glasses in colorful nebula space' },
  { title: 'فنجان قهوة', icon: '☕', prompt: 'cozy steaming artisan ceramic coffee cup with beautiful heart latte art, warm morning aesthetic' }
];

export default function AiImagePickerModal({
  isOpen,
  onClose,
  onSelectImage,
  postContent = '',
  context = 'general',
  title,
  subtitle,
  profileAvatarRef
}: AiImagePickerModalProps) {
  const { showToast } = useAppContext();
  // Tabs: 'generate' | 'upload' | 'presets'
  const [activeTab, setActiveTab] = useState<'generate' | 'upload' | 'presets'>('generate');
  const [activeCategory, setActiveCategory] = useState<string>(context === 'profile' ? 'portraits' : 'all');
  const [activeStyle, setActiveStyle] = useState<string>('photorealistic');
  const [customPrompt, setCustomPrompt] = useState<string>('');
  const [images, setImages] = useState<AiGeneratedImage[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPreview, setSelectedPreview] = useState<AiGeneratedImage | null>(null);

  // Upload Tab States
  const [uploadedBase64, setUploadedBase64] = useState<string | null>(null);
  const [isAnalyzingImage, setIsAnalyzingImage] = useState<boolean>(false);
  const [analysisResult, setAnalysisResult] = useState<AiImageAnalysisResult | null>(null);
  const [uploadFilter, setUploadFilter] = useState<'normal' | 'vibrant' | 'dramatic' | 'bw'>('normal');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Dynamic Titles based on context
  const modalTitle = title || (
    context === 'profile' ? 'رفع وتوليد صورة الملف الشخصي (AI و Firestore) 👤✨' :
    context === 'appeal' ? 'مراجعة ورفع صور الطعون (AI و Firestore) 🛡️🤖' :
    context === 'comment' ? 'إرفاق وتوليد صورة للتعليق (AI و Firestore) 💬🎨' :
    'إضافة صور: اعتمد على الذكاء الاصطناعي (AI) و Firestore 🚀'
  );

  const modalSubtitle = subtitle || (
    context === 'profile' ? 'اعتمد على الذكاء الاصطناعي لتوليد صورة رمزية في أي مجال أو ارفع من جهازك مع الحفظ السحابي في Firestore.' :
    context === 'appeal' ? 'اعتمد على الذكاء الاصطناعي لمراجعة صورتك قبل تقديم الطعن مع الحفظ التلقائي في Firestore.' :
    context === 'comment' ? 'اعتمد على الذكاء الاصطناعي لتوليد ملصقات وتصاميم مخصصة لتعليقك مع الحفظ في Firestore.' :
    'اعتمد على الذكاء الاصطناعي لتوليد صور في أي مجال، أو ارفع من جهازك مع الضغط والحفظ السحابي في Firestore.'
  );

  // Fetch images for selected category or prompt
  const fetchDomainImages = async (categoryKey: string, promptText?: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/ai/generate-domain-images', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: categoryKey === 'all' ? undefined : categoryKey,
          prompt: promptText?.trim() || undefined,
          style: activeStyle,
          count: 8
        })
      });

      if (!res.ok) {
        throw new Error('فشل جلب صور الذكاء الاصطناعي');
      }

      const data = await res.json();
      if (data.images && Array.isArray(data.images) && data.images.length > 0) {
        setImages(data.images);
      } else {
        setError('لم تتوفر صور فورية، جرب فئة أخرى أو اكتب وصفاً مختلفاً.');
      }
    } catch (err: any) {
      console.error('Error loading domain images:', err);
      setError('تعذر تحميل الصور، يرجى المحاولة بعد قليل.');
    } finally {
      setLoading(false);
    }
  };

  // Smart suggestions tailored to the context text (post or comment)
  const fetchSmartSuggestions = async () => {
    setLoading(true);
    setError(null);
    try {
      if (context === 'comment') {
        const res = await fetch('/api/ai/suggest-comment-images', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ commentText: postContent })
        });
        if (res.ok) {
          const data = await res.json();
          if (data.images && data.images.length > 0) {
            setImages(data.images);
            return;
          }
        }
      } else {
        const res = await fetch('/api/ai/suggest-post-images', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ postText: postContent })
        });
        if (res.ok) {
          const data = await res.json();
          if (data.images && data.images.length > 0) {
            setImages(data.images);
            return;
          }
        }
      }
      fetchDomainImages(activeCategory);
    } catch {
      fetchDomainImages(activeCategory);
    } finally {
      setLoading(false);
    }
  };

  // Analyze an uploaded local image using AI Vision
  const handleUploadImageFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = validateImageFile(file, 25);
    if (!validation.valid) {
      showToast(validation.error || 'الملف المختار غير صالح.');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    try {
      showToast('جاري قراءة وضغط الصورة للفحص... ⏳');
      const compressed = await compressImage(file, 900, 900, 0.75);
      setUploadedBase64(compressed);
      setAnalysisResult(null);
      setIsAnalyzingImage(true);

      const res = await fetch('/api/ai/analyze-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: compressed,
          context,
          profileAvatar: profileAvatarRef,
          userPrompt: customPrompt
        })
      });

      if (res.ok) {
        const data = await res.json();
        setAnalysisResult(data);
      }
    } catch (err) {
      console.warn('Error uploading/analyzing image:', err);
      showToast('تعذر فحص الصورة عبر الذكاء الاصطناعي، ولكن يمكنك استخدامها مباشرة.');
    } finally {
      setIsAnalyzingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Initial load when modal opens
  useEffect(() => {
    if (isOpen) {
      if (context === 'appeal') {
        setActiveTab('upload');
      } else if (images.length === 0) {
        if (postContent.trim()) {
          fetchSmartSuggestions();
        } else {
          fetchDomainImages(activeCategory);
        }
      }
    }
  }, [isOpen]);

  const handleCategoryClick = (categoryId: string) => {
    setActiveCategory(categoryId);
    setCustomPrompt('');
    fetchDomainImages(categoryId);
  };

  const handlePromptSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customPrompt.trim()) return;
    fetchDomainImages(activeCategory, customPrompt);
  };

  const handleApplyImage = (url: string, titleStr?: string) => {
    onSelectImage(url, titleStr, analysisResult || undefined);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[120] bg-black/80 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 dir-rtl">
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 15 }}
        className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] border border-gray-150"
      >
        {/* Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-700 text-white flex items-center justify-between shrink-0 shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-white/20 flex items-center justify-center backdrop-blur-md shadow-xs shrink-0">
              <Sparkles size={24} className="text-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-sm sm:text-base">
                  {modalTitle}
                </h3>
              </div>
              
              {/* Core Feature Badges: AI & Firestore */}
              <div className="flex flex-wrap items-center gap-2 mt-1">
                <span className="text-[10px] bg-amber-400 text-slate-950 font-black px-2.5 py-0.5 rounded-full shadow-xs flex items-center gap-1">
                  <Sparkles size={11} />
                  <span>اعتمد على الذكاء الاصطناعي (AI)</span>
                </span>
                <span className="text-[10px] bg-sky-300 text-slate-950 font-black px-2.5 py-0.5 rounded-full shadow-xs flex items-center gap-1">
                  <Cloud size={11} />
                  <span>قاعدة بيانات Firestore السحابية</span>
                </span>
              </div>

              <p className="text-[11px] text-blue-100 font-bold mt-1 line-clamp-1">
                {modalSubtitle}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white cursor-pointer transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation Tabs (Generate / Upload / Presets) */}
        <div className="px-5 pt-3 bg-gray-50 border-b border-gray-200 flex items-center gap-2 shrink-0 overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => setActiveTab('generate')}
            className={`px-4 py-2.5 rounded-t-2xl font-black text-xs sm:text-sm flex items-center gap-2 transition-all cursor-pointer border-b-2 whitespace-nowrap ${
              activeTab === 'generate'
                ? 'bg-white text-purple-700 border-purple-600 shadow-xs'
                : 'text-gray-600 hover:text-gray-900 border-transparent hover:bg-gray-100'
            }`}
          >
            <Wand2 size={16} className="text-purple-600" />
            <span>١. توليد بالذكاء الاصطناعي AI</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('upload')}
            className={`px-4 py-2.5 rounded-t-2xl font-black text-xs sm:text-sm flex items-center gap-2 transition-all cursor-pointer border-b-2 whitespace-nowrap ${
              activeTab === 'upload'
                ? 'bg-white text-blue-600 border-blue-600 shadow-xs'
                : 'text-gray-600 hover:text-gray-900 border-transparent hover:bg-gray-100'
            }`}
          >
            <Upload size={16} className="text-blue-600" />
            <span>٢. رفع وحفظ في Firestore</span>
            <span className="text-[10px] bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full font-bold">تخزين سحابي</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('presets')}
            className={`px-4 py-2.5 rounded-t-2xl font-black text-xs sm:text-sm flex items-center gap-2 transition-all cursor-pointer border-b-2 whitespace-nowrap ${
              activeTab === 'presets'
                ? 'bg-white text-indigo-600 border-indigo-600 shadow-xs'
                : 'text-gray-600 hover:text-gray-900 border-transparent hover:bg-gray-100'
            }`}
          >
            <Palette size={16} className="text-indigo-600" />
            <span>٣. معرض الصور في كافة المجالات</span>
          </button>
        </div>

        {/* BODY CONTENT BY TAB */}
        <div className="flex-1 overflow-y-auto">
          {/* TAB 1: AI GENERATION IN ANY FIELD */}
          {activeTab === 'generate' && (
            <div className="flex flex-col h-full">
              {/* AI & Firestore Banner */}
              <div className="mx-4 mt-3 mb-1 p-2.5 bg-gradient-to-r from-purple-50 via-indigo-50 to-blue-50 border border-purple-200/80 rounded-2xl flex items-center justify-between text-xs font-black text-purple-950 shrink-0 shadow-2xs">
                <div className="flex items-center gap-2">
                  <Sparkles size={16} className="text-purple-600 animate-pulse shrink-0" />
                  <span>اعتمد على الذكاء الاصطناعي (AI) لتوليد صور فريدة في كافة المجالات وحفظها في Firestore</span>
                </div>
                <span className="text-[10px] bg-purple-600 text-white font-extrabold px-2 py-0.5 rounded-full shrink-0">
                  Gemini AI
                </span>
              </div>

              {/* Categories Ribbon */}
              <div className="p-3 bg-gray-50/80 border-b border-gray-200 overflow-x-auto no-scrollbar flex items-center gap-1.5 shrink-0">
                {DOMAINS.map((domain) => {
                  const isSelected = activeCategory === domain.id;
                  return (
                    <button
                      key={domain.id}
                      type="button"
                      onClick={() => handleCategoryClick(domain.id)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black whitespace-nowrap transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-blue-600 text-white shadow-xs scale-102'
                          : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                      }`}
                    >
                      <span>{domain.icon}</span>
                      <span>{domain.name}</span>
                    </button>
                  );
                })}
              </div>

              {/* Prompt Box & Style Selector */}
              <div className="p-4 bg-white border-b border-gray-100 space-y-3 shrink-0">
                <form onSubmit={handlePromptSubmit} className="flex flex-col sm:flex-row gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      type="text"
                      value={customPrompt}
                      onChange={(e) => setCustomPrompt(e.target.value)}
                      placeholder={
                        context === 'profile'
                          ? "اكتب مواصفات صورة ملفك الشخصي (مثال: رائد أعمال شاب ببدلة كلاسيكية، بورتريه ثلاثي الأبعاد)..."
                          : "اكتب وصفاً لأي صورة تريد توليدها في هذا المجال (مثال: نمر سيبيري أبيض بين الثلوج)..."
                      }
                      className="w-full pr-10 pl-3 py-2.5 bg-gray-50 rounded-2xl border border-gray-200 text-xs sm:text-sm font-bold outline-none focus:border-blue-500 focus:bg-white transition-all text-gray-900"
                    />
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <select
                      value={activeStyle}
                      onChange={(e) => setActiveStyle(e.target.value)}
                      className="px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-2xl text-xs font-bold text-gray-800 outline-none focus:border-blue-500 cursor-pointer"
                    >
                      {STYLES.map((st) => (
                        <option key={st.id} value={st.id}>{st.name}</option>
                      ))}
                    </select>

                    <button
                      type="submit"
                      disabled={loading || !customPrompt.trim()}
                      className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 text-white rounded-2xl text-xs sm:text-sm font-black flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
                    >
                      <Wand2 size={16} />
                      <span>توليد الآن</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => fetchDomainImages(activeCategory, customPrompt)}
                      disabled={loading}
                      className="p-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-2xl transition-colors cursor-pointer"
                      title="إعادة التوليد"
                    >
                      <RefreshCw size={17} className={loading ? 'animate-spin text-blue-600' : ''} />
                    </button>
                  </div>
                </form>

                {/* Quick Hint / Magic prompt helper */}
                <div className="flex items-center justify-between text-[11px] text-gray-500 font-bold px-1">
                  <span>💡 نصيحة: يمكنك كتابة أي وصف بالعربية أو الإنجليزية، وسيقوم الذكاء الاصطناعي برسمه فوراً بدقة عالية.</span>
                  {postContent.trim() && (
                    <button
                      type="button"
                      onClick={fetchSmartSuggestions}
                      className="text-purple-600 hover:underline flex items-center gap-1 cursor-pointer font-black"
                    >
                      <Sparkles size={12} />
                      <span>اقتراح صور من سياق المحتوى</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Images Grid */}
              <div className="p-4 flex-1">
                {loading ? (
                  <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
                    <div className="w-16 h-16 rounded-3xl bg-blue-50 border border-blue-200 flex items-center justify-center relative shadow-sm">
                      <Wand2 className="text-blue-600 animate-spin" size={32} />
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-black text-gray-800">جاري رسم وتوليد صور الذكاء الاصطناعي...</p>
                      <p className="text-xs text-gray-500 font-bold">توليد نماذج بدقة عالية وتفاصيل احترافية</p>
                    </div>
                  </div>
                ) : error ? (
                  <div className="p-8 text-center bg-gray-50 rounded-2xl border border-gray-200 space-y-3">
                    <AlertTriangle className="mx-auto text-amber-500" size={36} />
                    <p className="text-sm font-black text-gray-800">{error}</p>
                    <button
                      onClick={() => fetchDomainImages(activeCategory)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-black cursor-pointer shadow-xs"
                    >
                      إعادة المحاولة
                    </button>
                  </div>
                ) : images.length === 0 ? (
                  <div className="p-12 text-center text-gray-500 font-bold">لا توجد صور متاحة حالياً.</div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {images.map((img, imgIdx) => (
                      <div
                        key={img.id ? `ai-picker-img-${img.id}-${imgIdx}` : `ai-picker-idx-${imgIdx}`}
                        className="group relative bg-gray-50 rounded-2xl overflow-hidden border border-gray-200 hover:border-blue-500 hover:shadow-lg transition-all flex flex-col"
                      >
                        <div className="aspect-square w-full overflow-hidden bg-gray-100 relative">
                          <img
                            src={img.url}
                            alt={img.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            loading="lazy"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-2.5">
                            <button
                              type="button"
                              onClick={() => handleApplyImage(img.url, img.title)}
                              className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black shadow-md flex items-center justify-center gap-1.5 cursor-pointer transition-all active:scale-95"
                            >
                              <Check size={14} />
                              <span>استخدام هذه الصورة</span>
                            </button>
                          </div>
                        </div>
                        <div className="p-2.5 bg-white flex items-center justify-between border-t border-gray-100">
                          <span className="text-[11px] font-black text-gray-800 truncate">{img.title}</span>
                          <button
                            type="button"
                            onClick={() => setSelectedPreview(img)}
                            className="p-1 text-gray-400 hover:text-gray-700 rounded-lg cursor-pointer"
                            title="معاينة بكامل الشاشة"
                          >
                            <Eye size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: UPLOAD FROM DEVICE WITH AI INSPECTION & ENHANCEMENT */}
          {activeTab === 'upload' && (
            <div className="p-5 sm:p-6 space-y-6">
              {/* Firestore and AI Status Banner */}
              <div className="p-3 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl flex items-center justify-between text-xs font-black text-blue-950 shadow-2xs">
                <div className="flex items-center gap-2">
                  <Cloud size={18} className="text-blue-600 shrink-0" />
                  <span>رفع وتخزين سحابي مباشر في قاعدة بيانات Firestore مع فحص الأمان بالذكاء الاصطناعي AI</span>
                </div>
                <span className="text-[10px] bg-blue-600 text-white font-extrabold px-2.5 py-0.5 rounded-full shrink-0">
                  Firestore ☁️
                </span>
              </div>

              {/* Upload Input Area */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleUploadImageFile}
              />

              {!uploadedBase64 ? (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-blue-300 hover:border-blue-500 bg-blue-50/30 hover:bg-blue-50/60 rounded-3xl p-8 sm:p-12 text-center cursor-pointer transition-all flex flex-col items-center justify-center space-y-3 group"
                >
                  <div className="w-16 h-16 rounded-3xl bg-blue-100 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform shadow-xs">
                    <Upload size={32} />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-base font-black text-gray-900">
                      اضغط لاختيار صورة من جهازك أو سحبها وإفلاتها هنا
                    </h4>
                    <p className="text-xs text-gray-500 font-bold">
                      يدعم صور الهاتف والكمبيوتر (JPG, PNG, WebP) مع فحص أمان ذكي فوري وحفظ مستديم في Firestore
                    </p>
                  </div>
                  <button
                    type="button"
                    className="px-6 py-2.5 bg-blue-600 text-white rounded-2xl text-xs font-black shadow-md shadow-blue-500/20 group-hover:bg-blue-700"
                  >
                    تصفح الصور من جهازك
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Photo Preview & Control Bar */}
                  <div className="flex flex-col sm:flex-row items-center gap-6 bg-gray-50 p-4 sm:p-5 rounded-3xl border border-gray-200">
                    <div className="relative w-40 h-40 sm:w-48 sm:h-48 rounded-2xl overflow-hidden shadow-md border-2 border-white shrink-0 bg-black">
                      <img
                        src={uploadedBase64}
                        alt="Uploaded preview"
                        className={`w-full h-full object-cover ${
                          uploadFilter === 'vibrant' ? 'contrast-125 saturate-150' :
                          uploadFilter === 'dramatic' ? 'contrast-150 brightness-90' :
                          uploadFilter === 'bw' ? 'grayscale contrast-125' : ''
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="absolute bottom-2 right-2 bg-black/70 hover:bg-black text-white text-[10px] font-bold px-2 py-1 rounded-lg backdrop-blur-xs flex items-center gap-1 cursor-pointer"
                      >
                        <RefreshCw size={11} />
                        <span>تغيير</span>
                      </button>
                    </div>

                    <div className="flex-1 space-y-3 text-right w-full">
                      {/* Badge indicator on uploaded photo */}
                      <div className="p-2 bg-gradient-to-r from-purple-50 via-indigo-50 to-blue-50 border border-indigo-200 rounded-xl flex items-center justify-between text-xs font-black text-indigo-950">
                        <div className="flex items-center gap-1.5">
                          <Sparkles size={14} className="text-purple-600" />
                          <span>معتمد على الذكاء الاصطناعي AI و Firestore</span>
                        </div>
                        <span className="text-[10px] bg-emerald-100 text-emerald-800 font-extrabold px-2 py-0.5 rounded-md">
                          جاهز للحفظ السحابي
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-gray-700">تطبيق نمط مرئي على الصورة:</span>
                        <span className="text-[11px] font-bold text-gray-400">فلاتر ذكية</span>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {[
                          { id: 'normal', name: 'الأصلية' },
                          { id: 'vibrant', name: 'ألوان حيوية' },
                          { id: 'dramatic', name: 'سينمائي' },
                          { id: 'bw', name: 'أبيض وأسود' },
                        ].map(f => (
                          <button
                            key={f.id}
                            type="button"
                            onClick={() => setUploadFilter(f.id as any)}
                            className={`p-2 rounded-xl text-xs font-black border transition-all cursor-pointer ${
                              uploadFilter === f.id
                                ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                                : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-100'
                            }`}
                          >
                            {f.name}
                          </button>
                        ))}
                      </div>

                      <div className="pt-2 flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => handleApplyImage(uploadedBase64, 'صورة مرفوعة')}
                          className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-xs sm:text-sm font-black shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 cursor-pointer transition-transform active:scale-98"
                        >
                          <Check size={18} />
                          <span>تأكيد واستخدام الصورة (حفظ سحابي في Firestore)</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setUploadedBase64(null);
                            setAnalysisResult(null);
                          }}
                          className="px-4 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-2xl text-xs font-bold cursor-pointer"
                        >
                          إلغاء
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* AI VISION ANALYSIS REPORT */}
                  <div className="bg-white rounded-3xl border border-gray-200 p-5 space-y-4 shadow-xs">
                    <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                      <div className="flex items-center gap-2 text-indigo-700 font-black text-sm">
                        <ScanFace size={20} />
                        <span>تقرير فحص الذكاء الاصطناعي (AI Vision Report)</span>
                      </div>
                      {isAnalyzingImage ? (
                        <div className="flex items-center gap-1.5 text-xs text-blue-600 font-bold">
                          <RefreshCw size={14} className="animate-spin" />
                          <span>جاري فحص وتدقيق الصورة...</span>
                        </div>
                      ) : (
                        <span className="text-[11px] bg-emerald-100 text-emerald-800 font-black px-2.5 py-0.5 rounded-full">
                          مكتمل بنجاح
                        </span>
                      )}
                    </div>

                    {isAnalyzingImage ? (
                      <div className="py-6 text-center space-y-2">
                        <div className="w-8 h-8 mx-auto border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
                        <p className="text-xs font-bold text-gray-500">يقوم الذكاء الاصطناعي بمطابقة المعايير وتحليل الملامح...</p>
                      </div>
                    ) : analysisResult ? (
                      <div className="space-y-4 text-right">
                        {/* Status Highlights */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center gap-2.5">
                            <ShieldCheck size={22} className="text-emerald-600 shrink-0" />
                            <div>
                              <p className="text-[10px] text-emerald-800 font-bold">سلامة المعايير</p>
                              <p className="text-xs font-black text-emerald-950">
                                {analysisResult.isSafe ? 'آمنة تماماً ومطابقة' : 'تنبيه أمني'}
                              </p>
                            </div>
                          </div>

                          <div className="p-3 rounded-2xl bg-blue-50 border border-blue-200 flex items-center gap-2.5">
                            <Sparkles size={22} className="text-blue-600 shrink-0" />
                            <div>
                              <p className="text-[10px] text-blue-800 font-bold">تقييم الجودة</p>
                              <p className="text-xs font-black text-blue-950">{analysisResult.score ?? 95}/100</p>
                            </div>
                          </div>

                          <div className="p-3 rounded-2xl bg-purple-50 border border-purple-200 flex items-center gap-2.5">
                            <Tag size={22} className="text-purple-600 shrink-0" />
                            <div>
                              <p className="text-[10px] text-purple-800 font-bold">المجال المصنف</p>
                              <p className="text-xs font-black text-purple-950">{analysisResult.domain || 'عام'}</p>
                            </div>
                          </div>
                        </div>

                        {/* Summary */}
                        <div className="p-3.5 bg-slate-50 rounded-2xl border border-gray-200/80 space-y-1">
                          <h5 className="text-xs font-black text-gray-900">{analysisResult.label}</h5>
                          <p className="text-xs text-gray-700 font-medium leading-relaxed">{analysisResult.summary}</p>
                        </div>

                        {/* Special Appeal Checks */}
                        {context === 'appeal' && (
                          <div className="p-3.5 bg-amber-50/80 rounded-2xl border border-amber-200 space-y-2">
                            <div className="flex items-center gap-1.5 text-xs font-black text-amber-900">
                              <AlertTriangle size={16} className="text-amber-600" />
                              <span>تأكيد جاهزية الطعن لاستعادة الحساب:</span>
                            </div>
                            <ul className="text-xs font-bold text-amber-950 space-y-1 list-disc list-inside">
                              <li>خلو الصورة من الضبابية: {analysisResult.isBlurry ? '❌ ضبابية (يرجى اختيار صورة أوضح)' : '✅ واضحة تماماً'}</li>
                              <li>فردية الصورة: تأكد من عدم وجود أصدقاء آخرين بالصورة لتسهيل المطابقة الآلية.</li>
                              {analysisResult.resemblanceScore && (
                                <li>نسبة التطابق التقديرية مع الحساب: {analysisResult.resemblanceScore}%</li>
                              )}
                            </ul>
                          </div>
                        )}

                        {/* Suggestions */}
                        {analysisResult.suggestions && analysisResult.suggestions.length > 0 && (
                          <div className="space-y-1.5">
                            <p className="text-xs font-black text-gray-800 flex items-center gap-1.5">
                              <Lightbulb size={15} className="text-amber-500" />
                              <span>توصيات الذكاء الاصطناعي:</span>
                            </p>
                            <div className="flex flex-wrap gap-1.5">
                              {analysisResult.suggestions.map((sug, idx) => (
                                <span key={`ai-sug-${idx}`} className="text-[11px] bg-gray-100 text-gray-800 px-3 py-1 rounded-xl font-bold border border-gray-200">
                                  {sug}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ) : null}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: CURATED PRESETS & STICKERS */}
          {activeTab === 'presets' && (
            <div className="p-5 space-y-5">
              <div className="space-y-1 text-right">
                <h4 className="text-sm font-black text-gray-900">
                  {context === 'comment' ? 'ملصقات وتفاعلات الذكاء الاصطناعي السريعة للتعليقات' : 'تصاميم مختارة بجودة فائقة'}
                </h4>
                <p className="text-xs text-gray-500 font-bold">
                  اختر أي تصميم أو ملصق بضغطة زر واحدة لتطبيقه مباشرة
                </p>
              </div>

              {context === 'comment' ? (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {COMMENT_REACTIONS_PRESETS.map((pst, idx) => {
                    const presetImgUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(pst.prompt)}?width=400&height=400&nologo=true&seed=${1000 + idx * 777}&model=flux`;
                    return (
                      <div
                        key={`comment-preset-${pst.title}-${idx}`}
                        onClick={() => handleApplyImage(presetImgUrl, pst.title)}
                        className="bg-gray-50 hover:bg-blue-50 border border-gray-200 hover:border-blue-400 rounded-2xl p-3 text-center cursor-pointer transition-all group flex flex-col items-center justify-between"
                      >
                        <div className="w-24 h-24 rounded-2xl overflow-hidden mb-2 bg-white shadow-xs">
                          <img src={presetImgUrl} alt={pst.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                        </div>
                        <div className="space-y-0.5">
                          <p className="text-xs font-black text-gray-800 flex items-center justify-center gap-1">
                            <span>{pst.icon}</span>
                            <span>{pst.title}</span>
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {DOMAINS.slice(1, 9).map((dm, idx) => {
                    const presetImgUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(dm.defaultPrompt)}?width=500&height=500&nologo=true&seed=${5000 + idx * 888}&model=flux`;
                    return (
                      <div
                        key={dm.id}
                        onClick={() => handleApplyImage(presetImgUrl, dm.name)}
                        className="bg-white rounded-2xl overflow-hidden border border-gray-200 hover:border-blue-500 hover:shadow-md transition-all cursor-pointer group flex flex-col"
                      >
                        <div className="aspect-square w-full overflow-hidden bg-gray-100">
                          <img src={presetImgUrl} alt={dm.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                        </div>
                        <div className="p-2.5 flex items-center justify-between bg-white">
                          <span className="text-xs font-black text-gray-800">{dm.name}</span>
                          <span className="text-sm">{dm.icon}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* FULLSCREEN PREVIEW MODAL */}
        <AnimatePresence>
          {selectedPreview && (
            <div className="fixed inset-0 z-[130] bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="max-w-2xl w-full bg-gray-900 rounded-3xl overflow-hidden text-white flex flex-col shadow-2xl border border-gray-700"
              >
                <div className="p-4 flex items-center justify-between border-b border-gray-800">
                  <h4 className="text-sm font-black text-gray-100">{selectedPreview.title}</h4>
                  <button onClick={() => setSelectedPreview(null)} className="p-1 rounded-full hover:bg-gray-800 text-gray-400">
                    <X size={20} />
                  </button>
                </div>
                <div className="w-full max-h-[60vh] overflow-hidden flex items-center justify-center bg-black">
                  <img src={selectedPreview.url} alt={selectedPreview.title} className="max-w-full max-h-[60vh] object-contain" />
                </div>
                {/* AI & Firestore Banner */}
                <div className="mx-4 my-2 px-3 py-1.5 rounded-xl bg-gradient-to-r from-purple-900/70 to-blue-900/70 border border-purple-500/30 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 text-purple-200 font-extrabold">
                    <Sparkles size={14} className="text-amber-300" />
                    <span>اعتمد على الذكاء الاصطناعي (AI) و Firestore</span>
                  </div>
                  <span className="text-[10px] text-cyan-300 bg-cyan-950/80 px-2 py-0.5 rounded-md border border-cyan-800 font-bold">
                    حفظ سحابي آمن
                  </span>
                </div>
                <div className="p-4 flex items-center justify-between bg-gray-950 border-t border-gray-800">
                  <span className="text-xs text-gray-400 font-bold">{selectedPreview.category}</span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        handleApplyImage(selectedPreview.url, selectedPreview.title);
                        setSelectedPreview(null);
                      }}
                      className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black cursor-pointer shadow-md flex items-center gap-1.5"
                    >
                      <Check size={16} />
                      <span>تطبيق واستخدام الصورة (حفظ سحابي في Firestore)</span>
                    </button>
                    <button
                      onClick={() => setSelectedPreview(null)}
                      className="px-4 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl text-xs font-bold cursor-pointer"
                    >
                      إغلاق
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
