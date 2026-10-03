import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAppContext } from '../context/AppContext';
import { 
  ShieldAlert, 
  LogOut, 
  ShieldX, 
  RefreshCw, 
  HelpCircle, 
  Lock, 
  AlertCircle, 
  Settings, 
  Globe, 
  Search, 
  X, 
  Check, 
  Shield, 
  ShieldCheck,
  ArrowRight,
  ArrowLeft,
  Maximize2,
  Minimize2,
  Scale,
  Sparkles,
  CheckCircle2,
  Bot,
  Zap,
  UserCheck
} from 'lucide-react';
import OwnAiRecoveryModal from './OwnAiRecoveryModal';

interface LanguageItem {
  code: string;
  name: string;
  nativeName: string;
  dir: 'rtl' | 'ltr';
  popular?: boolean;
}

const ALL_LANGUAGES: LanguageItem[] = [
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', dir: 'rtl', popular: true },
  { code: 'en', name: 'English (US)', nativeName: 'English (US)', dir: 'ltr', popular: true },
  { code: 'en-GB', name: 'English (UK)', nativeName: 'English (UK)', dir: 'ltr', popular: true },
  { code: 'fr', name: 'French', nativeName: 'Français (France)', dir: 'ltr', popular: true },
  { code: 'es', name: 'Spanish', nativeName: 'Español', dir: 'ltr', popular: true },
  { code: 'de', name: 'German', nativeName: 'Deutsch', dir: 'ltr', popular: true },
  { code: 'tr', name: 'Turkish', nativeName: 'Türkçe', dir: 'ltr', popular: true },
  { code: 'it', name: 'Italian', nativeName: 'Italiano', dir: 'ltr', popular: true },
  { code: 'pt-BR', name: 'Portuguese (Brazil)', nativeName: 'Português (Brasil)', dir: 'ltr', popular: true },
  { code: 'pt-PT', name: 'Portuguese (Portugal)', nativeName: 'Português (Portugal)', dir: 'ltr' },
  { code: 'ru', name: 'Russian', nativeName: 'Русский', dir: 'ltr', popular: true },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', dir: 'ltr', popular: true },
  { code: 'zh-CN', name: 'Chinese (Simplified)', nativeName: '中文 (简体)', dir: 'ltr', popular: true },
  { code: 'zh-TW', name: 'Chinese (Traditional)', nativeName: '中文 (繁體)', dir: 'ltr' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語', dir: 'ltr', popular: true },
  { code: 'ko', name: 'Korean', nativeName: '한국어', dir: 'ltr', popular: true },
  { code: 'id', name: 'Indonesian', nativeName: 'Bahasa Indonesia', dir: 'ltr', popular: true },
  { code: 'ms', name: 'Malay', nativeName: 'Bahasa Melayu', dir: 'ltr' },
  { code: 'vi', name: 'Vietnamese', nativeName: 'Tiếng Việt', dir: 'ltr', popular: true },
  { code: 'fa', name: 'Persian', nativeName: 'فارسی', dir: 'rtl' },
  { code: 'ur', name: 'Urdu', nativeName: 'اردو', dir: 'rtl' },
  { code: 'bn', name: 'Bengali', nativeName: 'বাংলা', dir: 'ltr' },
  { code: 'tl', name: 'Filipino / Tagalog', nativeName: 'Filipino', dir: 'ltr' },
  { code: 'nl', name: 'Dutch', nativeName: 'Nederlands', dir: 'ltr' },
  { code: 'pl', name: 'Polish', nativeName: 'Polski', dir: 'ltr' },
  { code: 'sv', name: 'Swedish', nativeName: 'Svenska', dir: 'ltr' },
  { code: 'da', name: 'Danish', nativeName: 'Dansk', dir: 'ltr' },
  { code: 'no', name: 'Norwegian', nativeName: 'Norsk (bokmål)', dir: 'ltr' },
  { code: 'fi', name: 'Finnish', nativeName: 'Suomi', dir: 'ltr' },
  { code: 'el', name: 'Greek', nativeName: 'Ελληνικά', dir: 'ltr' },
  { code: 'cs', name: 'Czech', nativeName: 'Čeština', dir: 'ltr' },
  { code: 'hu', name: 'Hungarian', nativeName: 'Magyar', dir: 'ltr' },
  { code: 'ro', name: 'Romanian', nativeName: 'Română', dir: 'ltr' },
  { code: 'uk', name: 'Ukrainian', nativeName: 'Українська', dir: 'ltr' },
  { code: 'th', name: 'Thai', nativeName: 'ภาษาไทย', dir: 'ltr' },
  { code: 'he', name: 'Hebrew', nativeName: 'עברית', dir: 'rtl' },
  { code: 'sw', name: 'Swahili', nativeName: 'Kiswahili', dir: 'ltr' },
  { code: 'ha', name: 'Hausa', nativeName: 'Hausa', dir: 'ltr' },
  { code: 'am', name: 'Amharic', nativeName: 'አማርኛ', dir: 'ltr' },
  { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்', dir: 'ltr' },
  { code: 'te', name: 'Telugu', nativeName: 'తెలుగు', dir: 'ltr' },
  { code: 'mr', name: 'Marathi', nativeName: 'मराठी', dir: 'ltr' },
  { code: 'pa', name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ', dir: 'ltr' },
  { code: 'gu', name: 'Gujarati', nativeName: 'ગુજરાતી', dir: 'ltr' },
  { code: 'ml', name: 'Malayalam', nativeName: 'മലയാളം', dir: 'ltr' },
  { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ', dir: 'ltr' },
  { code: 'ku', name: 'Kurdish', nativeName: 'Kurdî (کوردی)', dir: 'rtl' },
  { code: 'az', name: 'Azerbaijani', nativeName: 'Azərbaycan dili', dir: 'ltr' },
  { code: 'kk', name: 'Kazakh', nativeName: 'Қазақ тілі', dir: 'ltr' },
  { code: 'uz', name: 'Uzbek', nativeName: 'Oʻzbekcha', dir: 'ltr' },
  { code: 'bg', name: 'Bulgarian', nativeName: 'Български', dir: 'ltr' },
  { code: 'sr', name: 'Serbian', nativeName: 'Српски', dir: 'ltr' },
  { code: 'hr', name: 'Croatian', nativeName: 'Hrvatski', dir: 'ltr' },
  { code: 'sk', name: 'Slovak', nativeName: 'Slovenčina', dir: 'ltr' },
];

const DICTIONARY: Record<string, any> = {
  ar: {
    facebookLogo: 'facebook',
    disabledTitle: 'لقد قمنا بتعطيل حسابك',
    noticeDesc1: 'لقد راجعنا حسابك وتبيّن لنا أنه ما زال لا يتبع معايير مجتمعنا بشأن نزاهة الحساب.',
    noticeDesc2: 'لا يمكنك طلب إجراء مراجعة أخرى لهذا القرار.',
    noticeDesc3Prefix: 'إذا كنت تعتقد أن تم تعطيل حسابك عن طريق الخطأ قم بزيارة ',
    communityStandards: 'OWN AI',
    noticeDesc3Suffix: '.',
    learnMoreIntegrity: 'تعرف على المزيد عن نزاهة الحساب',
    downloadYourInfo: 'تنزيل معلوماتك',
    notYouPrefix: 'لست ',
    notYouSuffix: '؟ ',
    loginHere: 'يرجى تسجيل الدخول هنا',
    downloadSuccess: 'تم تجهيز وتنزيل نسخة من معلومات حسابك بنجاح.',
    chooseLanguage: 'اختيار اللغة',
    searchLanguagePlaceholder: 'بحث عن لغة...',
    popularLanguages: 'اللغات الشائعة',
    allLanguages: 'جميع اللغات',
    close: 'إغلاق',
  },
  en: {
    facebookLogo: 'facebook',
    disabledTitle: 'We disabled your account',
    noticeDesc1: 'We reviewed your account and found that it still does not follow our Community Standards on account integrity.',
    noticeDesc2: 'You cannot request another review of this decision.',
    noticeDesc3Prefix: 'If you think your account was disabled by mistake, please visit ',
    communityStandards: 'OWN AI',
    noticeDesc3Suffix: '.',
    learnMoreIntegrity: 'Learn more about account integrity',
    downloadYourInfo: 'Download your information',
    notYouPrefix: 'Not ',
    notYouSuffix: '? ',
    loginHere: 'Please log in here',
    downloadSuccess: 'Your account information has been prepared and downloaded successfully.',
    chooseLanguage: 'Select Language',
    searchLanguagePlaceholder: 'Search for a language...',
    popularLanguages: 'Suggested Languages',
    allLanguages: 'All Languages',
    close: 'Close',
  },
  fr: {
    facebookLogo: 'facebook',
    disabledTitle: 'Nous avons désactivé votre compte',
    noticeDesc1: 'Après examen, nous avons constaté que votre compte ne respecte toujours pas nos règles communautaires relatives à l’intégrité du compte.',
    noticeDesc2: 'Vous ne pouvez plus demander de nouvel examen après cette décision.',
    noticeDesc3Prefix: 'Si vous pensez que votre compte a été désactivé par erreur, veuillez consulter ',
    communityStandards: 'OWN AI',
    noticeDesc3Suffix: '.',
    learnMoreIntegrity: 'En savoir plus sur l’intégrité des comptes',
    downloadYourInfo: 'Télécharger vos informations',
    notYouPrefix: 'Vous n’êtes pas ',
    notYouSuffix: ' ? ',
    loginHere: 'Connectez-vous ici',
    downloadSuccess: 'Vos informations ont été téléchargées.',
    chooseLanguage: 'Choisir la langue',
    searchLanguagePlaceholder: 'Rechercher une langue...',
    popularLanguages: 'Langues suggérées',
    allLanguages: 'Toutes les langues',
    close: 'Fermer',
  },
  es: {
    facebookLogo: 'facebook',
    disabledTitle: 'Hemos inhabilitado tu cuenta',
    noticeDesc1: 'Revisamos tu cuenta y determinamos que aún no cumple con nuestras Normas comunitarias sobre la integridad de la cuenta.',
    noticeDesc2: 'No puedes solicitar otra revisión de esta decisión.',
    noticeDesc3Prefix: 'Si crees que tu cuenta se inhabilitó por error, visita ',
    communityStandards: 'OWN AI',
    noticeDesc3Suffix: '.',
    learnMoreIntegrity: 'Más información sobre la integridad de las cuentas',
    downloadYourInfo: 'Descargar tu información',
    notYouPrefix: '¿No eres ',
    notYouSuffix: '? ',
    loginHere: 'Inicia sesión aquí',
    downloadSuccess: 'Tu información se ha descargado correctamente.',
    chooseLanguage: 'Seleccionar idioma',
    searchLanguagePlaceholder: 'Buscar un idioma...',
    popularLanguages: 'Idiomas sugeridos',
    allLanguages: 'Todos los idiomas',
    close: 'Cerrar',
  },
  de: {
    facebookLogo: 'facebook',
    disabledTitle: 'Wir haben dein Konto deaktiviert',
    noticeDesc1: 'Wir haben dein Konto überprüft und festgestellt, dass es weiterhin gegen unsere Gemeinschaftsstandards zur Kontointegrität verstößt.',
    noticeDesc2: 'Du kannst keine weitere Überprüfung dieser Entscheidung anfordern.',
    noticeDesc3Prefix: 'Wenn du glaubst, dass dein Konto irrtümlich deaktiviert wurde, besuche ',
    communityStandards: 'OWN AI',
    noticeDesc3Suffix: '.',
    learnMoreIntegrity: 'Weitere Informationen zur Kontointegrität',
    downloadYourInfo: 'Deine Informationen herunterladen',
    notYouPrefix: 'Nicht ',
    notYouSuffix: '? ',
    loginHere: 'Hier anmelden',
    downloadSuccess: 'Deine Kontoinformationen wurden heruntergeladen.',
    chooseLanguage: 'Sprache auswählen',
    searchLanguagePlaceholder: 'Sprache suchen...',
    popularLanguages: 'Vorgeschlagene Sprachen',
    allLanguages: 'Alle Sprachen',
    close: 'Schließen',
  },
  tr: {
    facebookLogo: 'facebook',
    disabledTitle: 'Hesabını kapattık',
    noticeDesc1: 'Hesabını inceledik ve hesap bütünlüğüne ilişkin Topluluk Kurallarımıza hâlâ uymadığını belirledik.',
    noticeDesc2: 'Bu karar için başka bir inceleme talep edemezsin.',
    noticeDesc3Prefix: 'Hesabının yanlışlıkla kapatıldığını düşünüyorsan lütfen ',
    communityStandards: 'OWN AI',
    noticeDesc3Suffix: ' sayfasını ziyaret et.',
    learnMoreIntegrity: 'Hesap bütünlüğü hakkında daha fazla bilgi al',
    downloadYourInfo: 'Bilgilerini İndir',
    notYouPrefix: 'Sen ',
    notYouSuffix: ' değil misin? ',
    loginHere: 'Buradan giriş yap',
    downloadSuccess: 'Hesap bilgilerin başarıyla indirildi.',
    chooseLanguage: 'Dil Seç',
    searchLanguagePlaceholder: 'Dil ara...',
    popularLanguages: 'Önerilen Diller',
    allLanguages: 'Tüm Diller',
    close: 'Kapat',
  },
};

export default function DisabledAccount() {
  const { currentUser, logout, language: currentLang, setAppLanguage, showToast } = useAppContext();
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [languageSearchQuery, setLanguageSearchQuery] = useState('');
  const [downloadToast, setDownloadToast] = useState(false);
  const [showIntegrityModal, setShowIntegrityModal] = useState(false);
  const [showCommunityStandardsModal, setShowCommunityStandardsModal] = useState(false);
  const [showOwnAiRecoveryModal, setShowOwnAiRecoveryModal] = useState(false);

  const currentLangObj = useMemo(() => {
    return ALL_LANGUAGES.find(l => l.code === currentLang) || ALL_LANGUAGES[0];
  }, [currentLang]);

  const t = useMemo(() => {
    if (DICTIONARY[currentLang]) return DICTIONARY[currentLang];
    const baseCode = currentLang.split('-')[0];
    if (DICTIONARY[baseCode]) return DICTIONARY[baseCode];
    return currentLangObj.dir === 'rtl' ? DICTIONARY.ar : DICTIONARY.en;
  }, [currentLang, currentLangObj]);

  const handleSelectLanguage = (langCode: string) => {
    setAppLanguage(langCode);
    setShowLanguageModal(false);
  };

  const filteredLanguages = useMemo(() => {
    if (!languageSearchQuery.trim()) return ALL_LANGUAGES;
    const q = languageSearchQuery.toLowerCase();
    return ALL_LANGUAGES.filter(
      l => l.name.toLowerCase().includes(q) || 
           l.nativeName.toLowerCase().includes(q) || 
           l.code.toLowerCase().includes(q)
    );
  }, [languageSearchQuery]);

  const handleDownloadData = () => {
    try {
      const dataToExport = {
        platform: 'Facebook',
        appName: 'GROZLA',
        exportedAt: new Date().toISOString(),
        user: {
          id: currentUser?.id,
          name: currentUser?.name,
          username: currentUser?.username,
          email: currentUser?.email,
          phone: currentUser?.phone || '',
          avatar: currentUser?.avatar,
          status: currentUser?.status,
          suspensionReason: currentUser?.suspensionReason || 'مخالفة معايير مجتمعنا بشأن نزاهة الحساب',
          createdAt: currentUser?.createdAt
        }
      };

      const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `facebook_info_${currentUser?.username || currentUser?.id || 'account'}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setDownloadToast(true);
      setTimeout(() => setDownloadToast(false), 4000);
    } catch {
      setDownloadToast(true);
      setTimeout(() => setDownloadToast(false), 4000);
    }
  };

  if (!currentUser) return null;

  const accountName = currentUser?.name || currentUser?.username || 'SAMADO';

  return (
    <div 
      className={`min-h-screen bg-[#eceff5] text-[#1c1e21] flex flex-col font-sans selection:bg-[#3b5998]/20 ${
        currentLangObj.dir === 'rtl' ? 'dir-rtl text-right' : 'dir-ltr text-left'
      }`}
      dir={currentLangObj.dir}
    >
      {/* 1. Header with purple facebook wordmark */}
      <header className="w-full bg-white border-b border-purple-100 py-2.5 px-4 shadow-xs flex items-center justify-center relative select-none">
        <span className="text-[#8b5cf6] text-[26px] sm:text-[28px] font-black tracking-tighter lowercase leading-none font-sans drop-shadow-xs">
          facebook
        </span>
      </header>

      {/* 2. Main Body Container */}
      <main className="w-full max-w-[430px] mx-auto px-3 py-3 sm:py-4 flex-1 flex flex-col justify-start">
        {/* Main White Card (لقد قمنا بتعطيل حسابك) */}
        <div className="bg-white border border-[#ccd0d5] rounded-[3px] shadow-[0_1px_2px_rgba(0,0,0,0.05)] overflow-hidden">
          
          {/* Card Title */}
          <div className="px-4 py-3 border-b border-[#e5e5e5]">
            <h1 className="text-[#1c1e21] font-bold text-[15px] sm:text-[16px] leading-snug">
              {t.disabledTitle}
            </h1>
          </div>

          {/* Card Text Content */}
          <div className="p-4 space-y-3.5 text-[#1c1e21] text-[13.5px] sm:text-[14px] leading-[1.55]">
            <p>
              {t.noticeDesc1}
            </p>
            <p>
              {t.noticeDesc2}
            </p>
            <p>
              <span>{t.noticeDesc3Prefix}</span>
              <button 
                type="button"
                onClick={() => setShowOwnAiRecoveryModal(true)}
                className="text-[#8b5cf6] hover:underline cursor-pointer font-bold inline-flex items-center gap-1 mx-1 bg-purple-50 hover:bg-purple-100 px-2 py-0.5 rounded-md border border-purple-200 transition-colors shadow-2xs"
              >
                <Bot size={13} className="text-[#8b5cf6]" />
                <span>{t.communityStandards}</span>
              </button>
              <span>{t.noticeDesc3Suffix}</span>
            </p>
          </div>

          {/* Card Footer Link: تعرف على المزيد عن نزاهة الحساب */}
          <div className="py-2.5 px-4 border-t border-[#e5e5e5] text-center bg-white">
            <button
              type="button"
              onClick={() => setShowIntegrityModal(true)}
              className="text-[#385898] hover:underline text-[13px] sm:text-[13.5px] font-normal cursor-pointer"
            >
              {t.learnMoreIntegrity}
            </button>
          </div>
        </div>

        {/* Primary Action Button: تنزيل معلوماتك */}
        <div className="mt-3">
          <button
            type="button"
            onClick={handleDownloadData}
            className="w-full bg-[#4267b2] hover:bg-[#365899] active:bg-[#29487d] text-white font-bold py-2.5 px-4 rounded-[4px] text-[14px] cursor-pointer shadow-xs transition-colors flex items-center justify-center"
          >
            {t.downloadYourInfo}
          </button>
        </div>

        {/* Switch Account Line: لست {accountName}؟ يرجى تسجيل الدخول هنا */}
        <div className="mt-4 text-center text-[13.5px] text-[#4b4f56] leading-normal">
          <span>{t.notYouPrefix}</span>
          <span className="font-semibold text-[#1c1e21]">{accountName}</span>
          <span>{t.notYouSuffix}</span>
          <button
            type="button"
            onClick={logout}
            className="text-[#385898] hover:underline cursor-pointer font-normal"
          >
            {t.loginHere}
          </button>
        </div>

        {/* Secondary Link: تنزيل معلوماتك */}
        <div className="mt-2.5 text-center">
          <button
            type="button"
            onClick={handleDownloadData}
            className="text-[#385898] hover:underline text-[13.5px] cursor-pointer"
          >
            {t.downloadYourInfo}
          </button>
        </div>

        {/* Download Success Notice */}
        {downloadToast && (
          <div className="mt-3 p-2.5 bg-[#e7f3ff] border border-[#1877f2]/30 text-[#0064d1] text-xs rounded-[3px] text-center font-semibold animate-in fade-in">
            {t.downloadSuccess}
          </div>
        )}

        {/* 3. Bottom Languages Box Matching Screenshot */}
        <div className="mt-6 bg-white border border-[#ccd0d5] rounded-[3px] p-3 text-[13px] shadow-[0_1px_1px_rgba(0,0,0,0.03)]">
          <div className="grid grid-cols-2 gap-x-4 gap-y-2">
            
            {/* Column 1 (RTL Right / LTR Left) */}
            <div className="flex flex-col space-y-2">
              <button
                type="button"
                onClick={() => handleSelectLanguage('ar')}
                className={`text-start hover:underline cursor-pointer ${
                  currentLang === 'ar' ? 'font-bold text-[#1c1e21]' : 'text-[#385898]'
                }`}
              >
                العربية
              </button>

              <button
                type="button"
                onClick={() => handleSelectLanguage('en')}
                className={`text-start hover:underline cursor-pointer ${
                  currentLang === 'en' ? 'font-bold text-[#1c1e21]' : 'text-[#385898]'
                }`}
              >
                English (US)
              </button>

              <button
                type="button"
                onClick={() => handleSelectLanguage('pt-BR')}
                className={`text-start hover:underline cursor-pointer ${
                  currentLang === 'pt-BR' ? 'font-bold text-[#1c1e21]' : 'text-[#385898]'
                }`}
              >
                Português (Brasil)
              </button>

              <button
                type="button"
                onClick={() => handleSelectLanguage('it')}
                className={`text-start hover:underline cursor-pointer ${
                  currentLang === 'it' ? 'font-bold text-[#1c1e21]' : 'text-[#385898]'
                }`}
              >
                Italiano
              </button>
            </div>

            {/* Column 2 (RTL Left / LTR Right) */}
            <div className="flex flex-col space-y-2">
              <button
                type="button"
                onClick={() => handleSelectLanguage('fr')}
                className={`text-start hover:underline cursor-pointer ${
                  currentLang === 'fr' ? 'font-bold text-[#1c1e21]' : 'text-[#385898]'
                }`}
              >
                Français (France)
              </button>

              <button
                type="button"
                onClick={() => handleSelectLanguage('es')}
                className={`text-start hover:underline cursor-pointer ${
                  currentLang === 'es' ? 'font-bold text-[#1c1e21]' : 'text-[#385898]'
                }`}
              >
                Español (España)
              </button>

              <button
                type="button"
                onClick={() => handleSelectLanguage('de')}
                className={`text-start hover:underline cursor-pointer ${
                  currentLang === 'de' ? 'font-bold text-[#1c1e21]' : 'text-[#385898]'
                }`}
              >
                Deutsch
              </button>

              {/* [+] Button to open full language chooser */}
              <div className="pt-0.5">
                <button
                  type="button"
                  onClick={() => {
                    setLanguageSearchQuery('');
                    setShowLanguageModal(true);
                  }}
                  className="w-7 h-7 border border-[#ccd0d5] hover:border-[#8b9dc3] bg-[#f5f6f7] hover:bg-[#ebedf0] text-[#4b4f56] rounded-[2px] flex items-center justify-center transition-colors cursor-pointer text-sm font-bold active:scale-95"
                  title={t.chooseLanguage}
                >
                  +
                </button>
              </div>
            </div>

          </div>
        </div>

      </main>

      {/* MODAL: Community Standards Info */}
      <AnimatePresence>
        {showCommunityStandardsModal && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-[4px] border border-[#ccd0d5] max-w-md w-full shadow-xl overflow-hidden"
              dir={currentLangObj.dir}
            >
              <div className="bg-[#3b5998] text-white px-4 py-2.5 flex items-center justify-between">
                <span className="font-bold text-sm">{t.communityStandards}</span>
                <button
                  onClick={() => setShowCommunityStandardsModal(false)}
                  className="text-white/80 hover:text-white cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="p-4 space-y-3 text-xs sm:text-sm text-[#1c1e21] leading-relaxed max-h-[70vh] overflow-y-auto">
                <p className="font-semibold text-gray-900">
                  معايير مجتمعنا بشأن نزاهة الحساب وأصالة الهوية:
                </p>
                <p>
                  نعمل بجد لحماية مجتمعنا والتأكد من أن الأشخاص يتواصلون بهوياتهم الحقيقية. يتم تعطيل الحسابات التي تنتهك معايير النزاهة بشكل دائم لحماية سلامة المستخدمين.
                </p>
                <div className="bg-[#f0f2f5] p-3 rounded text-xs border border-gray-200 space-y-1">
                  <p className="font-bold">أسباب التعطيل الشائعة:</p>
                  <ul className="list-disc list-inside space-y-1 text-gray-700">
                    <li>استخدام أسماء أو بيانات مزيفة تخالف قواعد المنصة.</li>
                    <li>انتحال صفة أو إنشاء حسابات مضللة.</li>
                  </ul>
                </div>

                {/* OWN AI Bottom Banner Section */}
                <div className="pt-3 border-t border-gray-200">
                  <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-cyan-50 p-3 rounded-xl border border-blue-200/90 flex items-center justify-between gap-2 shadow-xs">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#1877f2] to-cyan-500 text-white flex items-center justify-center shadow-xs">
                        <Bot size={18} className="animate-pulse" />
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-black text-xs text-gray-900 tracking-tight">OWN AI</span>
                          <span className="text-[9px] bg-amber-100 text-amber-800 font-extrabold px-1.5 py-0.2 rounded">استعادة فورية</span>
                        </div>
                        <p className="text-[10.5px] text-gray-500 font-medium">استعادة الحساب بالاسم ولقطة الشاشة والبريد</p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setShowCommunityStandardsModal(false);
                        setShowOwnAiRecoveryModal(true);
                      }}
                      className="px-3 py-1.5 bg-gradient-to-r from-[#1877f2] to-[#0a52c2] hover:from-[#166fe5] hover:to-[#0948ab] text-white rounded-lg text-xs font-black shadow-xs flex items-center gap-1 cursor-pointer transition-all active:scale-95 shrink-0"
                    >
                      <Sparkles size={13} className="text-yellow-300" />
                      <span>OWN AI</span>
                      <ArrowLeft size={13} />
                    </button>
                  </div>
                </div>

                <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCommunityStandardsModal(false);
                      setShowOwnAiRecoveryModal(true);
                    }}
                    className="text-[#1877f2] hover:underline text-xs font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Bot size={14} />
                    <span>طلب استعادة عبر OWN AI</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowCommunityStandardsModal(false)}
                    className="px-4 py-1.5 bg-[#4267b2] hover:bg-[#365899] text-white rounded-[3px] text-xs font-bold cursor-pointer"
                  >
                    {t.close}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: Account Integrity Details */}
      <AnimatePresence>
        {showIntegrityModal && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-[4px] border border-[#ccd0d5] max-w-md w-full shadow-xl overflow-hidden"
              dir={currentLangObj.dir}
            >
              <div className="bg-[#3b5998] text-white px-4 py-2.5 flex items-center justify-between">
                <span className="font-bold text-sm">{t.learnMoreIntegrity}</span>
                <button
                  onClick={() => setShowIntegrityModal(false)}
                  className="text-white/80 hover:text-white cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="p-4 space-y-3 text-xs sm:text-sm text-[#1c1e21] leading-relaxed">
                <p>
                  تعد نزاهة الحساب من الركائز الأساسية لدينا. عندما يتم تعطيل حساب، يتم ذلك بعد مراجعة دقيقة ومؤتمتة لضمان أمان النظام.
                </p>
                <p className="text-gray-600 text-xs">
                  القرار نهائي ولا يمكن تقديم طلبات مراجعة إضافية من خلال القنوات الاعتيادية.
                </p>
                <div className="pt-2 border-t border-gray-100 flex justify-end">
                  <button
                    type="button"
                    onClick={() => setShowIntegrityModal(false)}
                    className="px-4 py-1.5 bg-[#4267b2] hover:bg-[#365899] text-white rounded-[3px] text-xs font-bold cursor-pointer"
                  >
                    {t.close}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* FULL LANGUAGE CHOOSER MODAL (WHEN CLICKING [+]) */}
      <AnimatePresence>
        {showLanguageModal && (
          <div className="fixed inset-0 z-[200] bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-[4px] max-w-lg w-full shadow-2xl border border-gray-300 overflow-hidden flex flex-col max-h-[85vh]"
              dir={currentLangObj.dir}
            >
              {/* Modal Header */}
              <div className="p-3.5 border-b border-gray-200 flex items-center justify-between bg-[#3b5998] text-white">
                <div className="flex items-center gap-2">
                  <Globe size={18} />
                  <h3 className="font-bold text-sm">{t.chooseLanguage}</h3>
                </div>
                <button 
                  onClick={() => setShowLanguageModal(false)} 
                  className="p-1 hover:bg-white/20 rounded text-white cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Search Bar */}
              <div className="p-3 border-b border-gray-200 bg-[#f5f6f7]">
                <div className="relative flex items-center">
                  <Search size={16} className={`absolute ${currentLangObj.dir === 'rtl' ? 'right-3' : 'left-3'} text-gray-400`} />
                  <input
                    type="text"
                    value={languageSearchQuery}
                    onChange={(e) => setLanguageSearchQuery(e.target.value)}
                    placeholder={t.searchLanguagePlaceholder}
                    className={`w-full py-2 rounded border border-[#ccd0d5] bg-white text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-[#3b5998] transition-all ${
                      currentLangObj.dir === 'rtl' ? 'pr-8 pl-8 text-right' : 'pl-8 pr-8 text-left'
                    }`}
                  />
                  {languageSearchQuery && (
                    <button
                      onClick={() => setLanguageSearchQuery('')}
                      className={`absolute ${currentLangObj.dir === 'rtl' ? 'left-2' : 'right-2'} p-1 text-gray-400 hover:text-gray-600 rounded`}
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
              </div>

              {/* Language List View */}
              <div className="overflow-y-auto p-3 space-y-3 flex-1">
                {/* Popular Languages Section */}
                {!languageSearchQuery && (
                  <div>
                    <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-2 px-1">
                      {t.popularLanguages}
                    </span>
                    <div className="grid grid-cols-2 gap-1.5">
                      {ALL_LANGUAGES.filter(l => l.popular).map((lang, pIdx) => {
                        const isSelected = currentLang === lang.code;
                        return (
                          <button
                            key={`pop-lang-${lang.code}-${pIdx}`}
                            onClick={() => handleSelectLanguage(lang.code)}
                            className={`p-2.5 rounded border text-start flex items-center justify-between transition-colors cursor-pointer ${
                              isSelected
                                ? 'bg-[#e7f3ff] border-[#1877f2] text-[#1877f2] font-bold'
                                : 'bg-white hover:bg-[#f0f2f5] border-gray-200 text-gray-900'
                            }`}
                          >
                            <div className="overflow-hidden">
                              <p className="text-xs truncate">{lang.nativeName}</p>
                              <p className="text-[10px] text-gray-500 truncate">{lang.name}</p>
                            </div>
                            {isSelected && (
                              <Check size={14} className="text-[#1877f2] shrink-0" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* All Languages Section */}
                <div>
                  <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-2 px-1">
                    {t.allLanguages} ({filteredLanguages.length})
                  </span>
                  <div className="space-y-1 bg-[#f5f6f7] p-1.5 rounded border border-gray-200">
                    {filteredLanguages.length === 0 ? (
                      <div className="py-6 text-center text-xs text-gray-500">
                        لم يتم العثور على أي لغة مطابقة لبحثك.
                      </div>
                    ) : (
                      filteredLanguages.map((lang, aIdx) => {
                        const isSelected = currentLang === lang.code;
                        return (
                          <button
                            key={`all-lang-${lang.code}-${aIdx}`}
                            onClick={() => handleSelectLanguage(lang.code)}
                            className={`w-full p-2 rounded flex items-center justify-between transition-colors cursor-pointer ${
                              isSelected 
                                ? 'bg-[#e7f3ff] text-[#1877f2] font-bold' 
                                : 'hover:bg-white text-gray-800'
                            }`}
                          >
                            <div className="flex items-center gap-2 overflow-hidden text-start">
                              <span className="text-xs">{lang.nativeName}</span>
                              <span className="text-[11px] text-gray-400 truncate">
                                — {lang.name}
                              </span>
                            </div>
                            {isSelected && (
                              <Check size={14} className="text-[#1877f2] shrink-0" />
                            )}
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-2.5 border-t border-gray-200 bg-[#f5f6f7] flex items-center justify-between">
                <span className="text-[11px] text-gray-600 font-medium">
                  {currentLangObj.nativeName} ({currentLangObj.name})
                </span>
                <button
                  onClick={() => setShowLanguageModal(false)}
                  className="px-3.5 py-1.5 bg-[#4267b2] hover:bg-[#365899] text-white rounded text-xs font-bold transition-colors cursor-pointer"
                >
                  {t.close}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* OWN AI Recovery Assistant Modal */}
      <OwnAiRecoveryModal 
        isOpen={showOwnAiRecoveryModal} 
        onClose={() => setShowOwnAiRecoveryModal(false)} 
      />
    </div>
  );
}




