import React, { useState, useEffect } from 'react';
import { Store, Plus, Search, MapPin, MessageCircle, X, Image, Tag, ShoppingBag, Trash2, CheckCircle2 } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { motion, AnimatePresence } from 'motion/react';
import { DEFAULT_AVATAR } from '../constants/avatar';

interface MarketplaceItem {
  id: string;
  title: string;
  price: number;
  currency: string;
  category: string;
  location: string;
  description: string;
  imageUrl: string;
  sellerId: string;
  sellerName: string;
  sellerAvatar: string;
  createdAt: string;
}

const CATEGORIES = [
  'الكل',
  'إلكترونيات',
  'سيارات ومركبات',
  'عقارات ومنازل',
  'ملابس وأزياء',
  'أثاث ومستلزمات منزلية',
  'ألعاب وهوايات'
];

const INITIAL_ITEMS: MarketplaceItem[] = [
  {
    id: 'item-1',
    title: 'آيفون 14 برو ماكس 256 جيجابايت - حالة ممتازة',
    price: 850,
    currency: '$',
    category: 'إلكترونيات',
    location: 'بغداد، العراق',
    description: 'جهاز آيفون 14 برو ماكس بنسبة بطارية 92٪، بدون أي خدوش مع العلبة الأصلية والشاحن.',
    imageUrl: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?auto=format&fit=crop&q=80&w=800',
    sellerId: 'user-1',
    sellerName: 'أحمد علي',
    sellerAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=150',
    createdAt: 'منذ ساعتين'
  },
  {
    id: 'item-2',
    title: 'بلايستيشن 5 مع ذراعين و3 ألعاب',
    price: 480,
    currency: '$',
    category: 'إلكترونيات',
    location: 'أربيل، العراق',
    description: 'بلايستيشن 5 إصدار الأقراص بحالة كالجديدة تماماً مع يدين تحكم وألعاب FIFA 24 و Spider-Man 2.',
    imageUrl: 'https://images.unsplash.com/photo-1606813907291-d86efa9b94db?auto=format&fit=crop&q=80&w=800',
    sellerId: 'user-2',
    sellerName: 'سارة محمود',
    sellerAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150',
    createdAt: 'منذ يوم'
  },
  {
    id: 'item-3',
    title: 'طقم كنبة مودرن 5 مقاعد - لون رمادي',
    price: 320,
    currency: '$',
    category: 'أثاث ومستلزمات منزلية',
    location: 'البصرة، العراق',
    description: 'طقم أثاث صالة فاخر ومريح جداً، القماش مضاد للبقع واستخدام خفيف لمدة 3 أشهر فقط.',
    imageUrl: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&q=80&w=800',
    sellerId: 'user-3',
    sellerName: 'عمر الخالد',
    sellerAvatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&q=80&w=150',
    createdAt: 'منذ 3 أيام'
  }
];

export default function Marketplace() {
  const { currentUser, setCurrentView, setActiveChat, showToast } = useAppContext();
  const [items, setItems] = useState<MarketplaceItem[]>(() => {
    const saved = localStorage.getItem('fb_marketplace_items');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return INITIAL_ITEMS;
      }
    }
    return INITIAL_ITEMS;
  });

  const [selectedCategory, setSelectedCategory] = useState<string>('الكل');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showAddItemModal, setShowAddItemModal] = useState<boolean>(false);
  const [selectedItemDetails, setSelectedItemDetails] = useState<MarketplaceItem | null>(null);

  // New Item Form State
  const [newTitle, setNewTitle] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [newCategory, setNewCategory] = useState('إلكترونيات');
  const [newLocation, setNewLocation] = useState('بغداد');
  const [newDescription, setNewDescription] = useState('');
  const [newImageUrl, setNewImageUrl] = useState('');

  useEffect(() => {
    localStorage.setItem('fb_marketplace_items', JSON.stringify(items));
  }, [items]);

  const filteredItems = items.filter(item => {
    const matchesCategory = selectedCategory === 'الكل' || item.category === selectedCategory;
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.location.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleCreateItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newPrice || !currentUser) {
      if (showToast) showToast('يرجى كتابة عنوان السلعة والسعر');
      return;
    }

    const newItem: MarketplaceItem = {
      id: 'item-' + Date.now(),
      title: newTitle.trim(),
      price: parseFloat(newPrice) || 0,
      currency: '$',
      category: newCategory,
      location: newLocation.trim() || 'غير محدد',
      description: newDescription.trim() || 'لا يوجد وصف للمنتج.',
      imageUrl: newImageUrl.trim() || 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&q=80&w=800',
      sellerId: currentUser.id,
      sellerName: currentUser.name,
      sellerAvatar: currentUser.avatar || DEFAULT_AVATAR,
      createdAt: 'الآن'
    };

    setItems([newItem, ...items]);
    setShowAddItemModal(false);
    
    // Reset form
    setNewTitle('');
    setNewPrice('');
    setNewDescription('');
    setNewImageUrl('');

    if (showToast) showToast('تم عرض اغراضك للبيع بنجاح في المتجر!');
  };

  const handleDeleteItem = (itemId: string) => {
    setItems(items.filter(i => i.id !== itemId));
    if (selectedItemDetails?.id === itemId) {
      setSelectedItemDetails(null);
    }
    if (showToast) showToast('تم حذف السلعة من المتجر');
  };

  const handleContactSeller = (sellerId: string) => {
    setActiveChat({ id: sellerId, type: 'user' });
    setCurrentView('messages');
  };

  return (
    <div className="space-y-4 pb-12 dir-rtl">
      {/* Header Bar */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-50 text-[#1877f2] flex items-center justify-center font-bold">
            <Store size={22} />
          </div>
          <div>
            <h2 className="text-xl font-black text-gray-900">المتجر (Marketplace)</h2>
            <p className="text-xs text-gray-500 font-medium">بيع واشترِ أغراضك بسهولة مع مجتمعك</p>
          </div>
        </div>

        {/* Add Item Button */}
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowAddItemModal(true)}
          className="bg-[#1877f2] hover:bg-blue-600 text-white font-extrabold text-sm px-4 py-2.5 rounded-xl shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer"
        >
          <Plus size={18} strokeWidth={2.5} />
          <span>عرض غرض للبيع</span>
        </motion.button>
      </div>

      {/* Search & Categories Bar */}
      <div className="bg-white rounded-2xl p-3 shadow-sm border border-gray-100 space-y-3">
        {/* Search Input */}
        <div className="relative">
          <Search size={18} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="البحث في أغراض المتجر..."
            className="w-full bg-gray-100 focus:bg-white text-gray-800 text-xs font-bold pr-10 pl-4 py-2.5 rounded-xl outline-hidden border border-transparent focus:border-blue-400 transition-all"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <X size={16} />
            </button>
          )}
        </div>

        {/* Categories Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {CATEGORIES.map((cat, catIdx) => (
            <button
              key={`market-cat-${cat}-${catIdx}`}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold whitespace-nowrap transition-all cursor-pointer shrink-0 ${
                selectedCategory === cat 
                  ? 'bg-[#8b5cf6] text-white shadow-xs' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Items Grid */}
      {filteredItems.length === 0 ? (
        <div className="bg-white rounded-2xl p-10 text-center shadow-sm border border-gray-100 space-y-3">
          <ShoppingBag size={48} className="mx-auto text-gray-300" />
          <p className="text-gray-600 font-bold text-sm">لا توجد أغراض معروضة تنطبق على هذا البحث</p>
          <button
            onClick={() => { setSelectedCategory('الكل'); setSearchQuery(''); }}
            className="text-[#8b5cf6] font-extrabold text-xs hover:underline cursor-pointer"
          >
            عرض كافة الأغراض
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {filteredItems.map((item, itemIdx) => (
            <motion.div
              key={`market-item-${item.id}-${itemIdx}`}
              whileHover={{ y: -2 }}
              onClick={() => setSelectedItemDetails(item)}
              className="bg-white rounded-2xl overflow-hidden shadow-xs border border-gray-100 cursor-pointer group hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                {/* Image */}
                <div className="relative aspect-square w-full bg-gray-100 overflow-hidden">
                  <img
                    src={item.imageUrl}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&q=80&w=800';
                    }}
                  />
                  <div className="absolute top-2 right-2 bg-black/70 backdrop-blur-md text-white px-2 py-0.5 rounded-lg text-[11px] font-black dir-ltr">
                    {item.currency}{item.price}
                  </div>
                  <div className="absolute bottom-2 right-2 bg-white/90 backdrop-blur-md text-gray-800 px-2 py-0.5 rounded-lg text-[10px] font-bold">
                    {item.category}
                  </div>
                </div>

                {/* Content */}
                <div className="p-3 space-y-1">
                  <h3 className="font-extrabold text-gray-900 text-xs sm:text-sm line-clamp-2 leading-snug">
                    {item.title}
                  </h3>
                  <div className="flex items-center gap-1 text-[11px] text-gray-500 font-medium">
                    <MapPin size={12} className="shrink-0 text-gray-400" />
                    <span className="truncate">{item.location}</span>
                  </div>
                </div>
              </div>

              {/* Seller info footer */}
              <div className="px-3 pb-3 pt-1 border-t border-gray-50 flex items-center justify-between text-[11px]">
                <div className="flex items-center gap-1.5 truncate">
                  <img src={item.sellerAvatar} alt={item.sellerName} className="w-5 h-5 rounded-full object-cover shrink-0" />
                  <span className="font-bold text-gray-700 truncate">{item.sellerName}</span>
                </div>
                {currentUser?.id === item.sellerId && (
                  <span className="text-[10px] text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded-md font-bold">سلعتك</span>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Item Details Modal */}
      <AnimatePresence>
        {selectedItemDetails && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs dir-rtl">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-100 p-5 space-y-4"
            >
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <div className="flex items-center gap-2">
                  <Tag size={18} className="text-[#1877f2]" />
                  <span className="font-black text-sm text-gray-900">تفاصيل الغرض المعروض</span>
                </div>
                <button onClick={() => setSelectedItemDetails(null)} className="p-1 rounded-full hover:bg-gray-100 text-gray-500 cursor-pointer">
                  <X size={20} />
                </button>
              </div>

              {/* Image Banner */}
              <div className="relative w-full rounded-2xl overflow-hidden bg-gray-100 aspect-video">
                <img
                  src={selectedItemDetails.imageUrl}
                  alt={selectedItemDetails.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-3 right-3 bg-blue-600 text-white font-black text-lg px-3 py-1 rounded-xl shadow-lg dir-ltr">
                  {selectedItemDetails.currency}{selectedItemDetails.price}
                </div>
              </div>

              {/* Title & Info */}
              <div className="space-y-2">
                <h2 className="text-lg font-black text-gray-900">{selectedItemDetails.title}</h2>
                <div className="flex flex-wrap items-center gap-3 text-xs text-gray-600 font-bold">
                  <span className="bg-gray-100 px-2.5 py-1 rounded-lg">{selectedItemDetails.category}</span>
                  <span className="flex items-center gap-1 text-gray-500"><MapPin size={14} /> {selectedItemDetails.location}</span>
                  <span className="text-gray-400">{selectedItemDetails.createdAt}</span>
                </div>
              </div>

              {/* Description */}
              <div className="bg-gray-50 p-3 rounded-2xl border border-gray-100 space-y-1">
                <h4 className="font-extrabold text-xs text-gray-700">الوصف:</h4>
                <p className="text-xs text-gray-800 font-medium leading-relaxed whitespace-pre-wrap">{selectedItemDetails.description}</p>
              </div>

              {/* Seller Box */}
              <div className="flex items-center justify-between bg-blue-50/60 p-3 rounded-2xl border border-blue-100">
                <div className="flex items-center gap-3">
                  <img src={selectedItemDetails.sellerAvatar} alt={selectedItemDetails.sellerName} className="w-10 h-10 rounded-full object-cover border border-white shadow-2xs" />
                  <div>
                    <h4 className="font-black text-xs text-gray-900">{selectedItemDetails.sellerName}</h4>
                    <p className="text-[11px] text-gray-500 font-medium">البائع</p>
                  </div>
                </div>

                {currentUser?.id !== selectedItemDetails.sellerId ? (
                  <button
                    onClick={() => handleContactSeller(selectedItemDetails.sellerId)}
                    className="bg-[#1877f2] hover:bg-blue-600 text-white font-extrabold text-xs px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
                  >
                    <MessageCircle size={16} />
                    <span>تواصل مع البائع</span>
                  </button>
                ) : (
                  <button
                    onClick={() => handleDeleteItem(selectedItemDetails.id)}
                    className="bg-red-50 text-red-600 hover:bg-red-100 font-extrabold text-xs px-3 py-2 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Trash2 size={16} />
                    <span>حذف العرض</span>
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add Item Modal */}
      <AnimatePresence>
        {showAddItemModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs dir-rtl">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-100 p-5 space-y-4"
            >
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <div className="flex items-center gap-2">
                  <ShoppingBag size={20} className="text-[#1877f2]" />
                  <span className="font-black text-base text-gray-900">عرض غرض جديد للبيع</span>
                </div>
                <button onClick={() => setShowAddItemModal(false)} className="p-1 rounded-full hover:bg-gray-100 text-gray-500 cursor-pointer">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleCreateItem} className="space-y-3">
                {/* Title */}
                <div>
                  <label className="block text-xs font-black text-gray-700 mb-1">اسم الغرض / العنوان *</label>
                  <input
                    type="text"
                    required
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="مثال: شاشة سامسونج 55 بوصة سمارت"
                    className="w-full bg-gray-50 border border-gray-200 focus:border-blue-500 rounded-xl px-3 py-2 text-xs font-bold outline-hidden transition-all"
                  />
                </div>

                {/* Price & Category */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-black text-gray-700 mb-1">السعر ($) *</label>
                    <input
                      type="number"
                      required
                      min="0"
                      value={newPrice}
                      onChange={(e) => setNewPrice(e.target.value)}
                      placeholder="150"
                      className="w-full bg-gray-50 border border-gray-200 focus:border-blue-500 rounded-xl px-3 py-2 text-xs font-bold outline-hidden transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-black text-gray-700 mb-1">الفئة</label>
                    <select
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 focus:border-blue-500 rounded-xl px-3 py-2 text-xs font-bold outline-hidden transition-all"
                    >
                      {CATEGORIES.filter(c => c !== 'الكل').map((c, cIdx) => (
                        <option key={`market-cat-opt-${c}-${cIdx}`} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Location */}
                <div>
                  <label className="block text-xs font-black text-gray-700 mb-1">المدينة / الموقع</label>
                  <input
                    type="text"
                    value={newLocation}
                    onChange={(e) => setNewLocation(e.target.value)}
                    placeholder="بغداد - المنصور"
                    className="w-full bg-gray-50 border border-gray-200 focus:border-blue-500 rounded-xl px-3 py-2 text-xs font-bold outline-hidden transition-all"
                  />
                </div>

                {/* Image URL */}
                <div>
                  <label className="block text-xs font-black text-gray-700 mb-1">رابط صورة المنتج (اختياري)</label>
                  <input
                    type="url"
                    value={newImageUrl}
                    onChange={(e) => setNewImageUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full bg-gray-50 border border-gray-200 focus:border-blue-500 rounded-xl px-3 py-2 text-xs font-bold outline-hidden transition-all dir-ltr text-left"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-xs font-black text-gray-700 mb-1">الوصف التفصيلي</label>
                  <textarea
                    rows={3}
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                    placeholder="اذكر حالة المنتج، مدة الاستخدام، الملحقات إن وجدت..."
                    className="w-full bg-gray-50 border border-gray-200 focus:border-blue-500 rounded-xl px-3 py-2 text-xs font-bold outline-hidden transition-all resize-none"
                  ></textarea>
                </div>

                {/* Submit */}
                <div className="pt-2">
                  <button
                    type="submit"
                    className="w-full bg-[#1877f2] hover:bg-blue-600 text-white font-extrabold text-sm py-3 rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    <CheckCircle2 size={18} />
                    <span>نشر السلعة في المتجر</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
