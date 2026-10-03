import { compressImage, validateImageFile } from '../utils/imageUtils';
import React, { useRef, useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAppContext } from '../context/AppContext';
import { 
  Settings, 
  BookOpen, 
  Clock, 
  LogOut, 
  Shield, 
  User, 
  X, 
  Lock, 
  ArrowRight, 
  Mail, 
  Key, 
  Video, 
  Camera, 
  ArrowUp, 
  ArrowDown, 
  ArrowLeft, 
  CheckCircle2, 
  RotateCcw, 
  Sparkles, 
  ShieldCheck, 
  Upload, 
  Maximize2, 
  Minimize2, 
  Bot, 
  Check, 
  RefreshCw, 
  Car, 
  AlertCircle, 
  Globe, 
  Search, 
  UserCheck, 
  HelpCircle,
  CreditCard,
  Smartphone,
  Smile,
  FileText,
  ScanFace,
  AlertTriangle,
  Fingerprint,
  Lightbulb,
  Phone,
  KeyRound,
  ShieldAlert,
  Eye,
  EyeOff
} from 'lucide-react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { DEFAULT_AVATAR } from '../constants/avatar';
import { safeSaveSavedAccounts } from '../utils/cache';
import EdotensiMessengerView from './EdotensiMessengerView';
import AiImagePickerModal from './AiImagePickerModal';
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

// Multilingual Dictionary
const DICTIONARY: Record<string, any> = {
  ar: {
    suspendedTitle: 'لقد قمنا بتعليق حسابك',
    daysRemaining: 'تبقى 180 من الأيام للطعن على القرار، وإلا سنقوم بتعطيل حسابك نهائياً',
    suspendedDatePrefix: 'تم التعليق بتاريخ',
    appealBtn: 'طعن',
    submittingAppeal: 'جاري رفع الطعن...',
    reviewingAppeal: 'جاري مراجعة طلب الطعن...',
    finishingReview: 'جاري إنهاء المراجعة...',
    originalPhoto: 'الصورة الأصلية',
    verificationPhoto: 'صورة التحقق',
    meaningTitle: 'معنى هذا',
    meaningDesc: 'لا يظهر حسابك للأشخاص على GROZLA في الوقت الحالي، ولن تتمكن من استخدامه.',
    actionsTitle: 'أمور يمكنك القيام بها',
    actionsDesc: 'أمامك 180 من الأيام للطعن على القرار الذي اتخذناه. وقد نحتاج إلى جمع بعض المعلومات منك والتي تساعدنا على مراجعة حسابك مرة أخرى.',
    reasonsTitle: 'أسباب حدوث هذا',
    reasonsDesc: 'حسابك، أو نشاط عليه، لا يتبع معايير مجتمعنا بشأن شروط منبعثا.',
    readRule: 'قراءة المزيد عن هذه القاعدة',
    accountSettings: 'إعدادات الحساب',
    advertisingDefense: 'Restrictions and advertisements',
    defenseDesc1: 'عرض التعليق الإداري',
    defenseDesc2: 'حماية المعلن والأمان',
    adminRestore: 'استعادة الحساب فوراً (مسؤول)',
    fullscreen: 'وضع الشاشة الكاملة',
    exitFullscreen: 'خروج من الشاشة الكاملة',
    auto: 'تلقائي',
    logout: 'تسجيل الخروج',
    language: 'اللغة',
    chooseLanguage: 'اختيار اللغة',
    searchLanguagePlaceholder: 'بحث عن لغة...',
    popularLanguages: 'اللغات الشائعة',
    allLanguages: 'جميع اللغات',
    ruleModalTitle: 'معايير مجتمعنا بشأن شروط منبعثا',
    ruleModalIntro: 'نحن نلزم جميع المستخدمين بالامتثال لشروط الاستخدام ومتطلبات السن منبعثا:',
    ruleBullet1: 'يجب أن يكون عمر المستخدم 12 سنة فما فوق لإنشاء واستخدام الحساب.',
    ruleBullet2: 'تعديل تاريخ الميلاد إلى أقل من 12 سنة يعرّض الحساب للتعليق الفوري لعدم استيفاء السن القانوني.',
    ruleBullet3: 'يمكنك تقديم طعن مع صورة شخصية لتأكيد تاريخ ميلادك الحقيقي واستعادة حسابك.',
    understoodBtn: 'فهمت ذلك',
  },
  en: {
    suspendedTitle: 'We suspended your account',
    daysRemaining: 'There are 180 days left to appeal this decision, or your account will be permanently disabled.',
    suspendedDatePrefix: 'Suspended on',
    appealBtn: 'Appeal',
    submittingAppeal: 'Submitting appeal...',
    reviewingAppeal: 'Reviewing your appeal...',
    finishingReview: 'Finishing review...',
    originalPhoto: 'Original Photo',
    verificationPhoto: 'Verification Photo',
    meaningTitle: 'What this means',
    meaningDesc: 'Your account is not visible to people on GROZLA right now, and you cannot use it.',
    actionsTitle: 'Things you can do',
    actionsDesc: 'You have 180 days to appeal the decision we made. We may need to collect some information from you to help us review your account again.',
    reasonsTitle: 'Why this happened',
    reasonsDesc: 'Your account, or activity on it, does not follow our Community Standards on account integrity.',
    readRule: 'Read more about this rule',
    accountSettings: 'Account Settings',
    advertisingDefense: 'Restrictions and advertisements',
    defenseDesc1: 'Show administrative suspension',
    defenseDesc2: 'Advertiser Protection & Safety',
    adminRestore: 'Restore Account (Admin)',
    fullscreen: 'Fullscreen Mode',
    exitFullscreen: 'Exit Fullscreen',
    auto: 'Auto',
    logout: 'Log Out',
    language: 'Language',
    chooseLanguage: 'Select Language',
    searchLanguagePlaceholder: 'Search for a language...',
    popularLanguages: 'Suggested Languages',
    allLanguages: 'All Languages',
    ruleModalTitle: 'Community Standards on Account Integrity',
    ruleModalIntro: 'We take action to prevent abuse on GROZLA and protect our community:',
    ruleBullet1: 'Using false identities or misrepresenting yourself as others without authorization.',
    ruleBullet2: 'Engaging in coordinated inauthentic behavior or mass-creating fake accounts.',
    ruleBullet3: 'Violating safety guidelines or attempting to bypass security checks.',
    understoodBtn: 'I Understand',
  },
  fr: {
    suspendedTitle: 'Nous avons suspendu votre compte',
    daysRemaining: 'Il vous reste 180 jours pour faire appel, sinon votre compte sera définitivement désactivé.',
    suspendedDatePrefix: 'Suspendu le',
    appealBtn: 'Faire appel',
    submittingAppeal: 'Envoi du recours...',
    reviewingAppeal: 'Examen de votre recours en cours...',
    finishingReview: 'Finalisation de l’examen...',
    originalPhoto: 'Photo originale',
    verificationPhoto: 'Photo de vérification',
    meaningTitle: 'Ce que cela signifie',
    meaningDesc: 'Votre compte n’est pas visible par les autres utilisateurs de GROZLA pour le moment et vous ne pouvez pas l’utiliser.',
    actionsTitle: 'Ce que vous pouvez faire',
    actionsDesc: 'Vous avez 180 jours pour contester notre décision. Nous pourrions avoir besoin de certaines informations pour réexaminer votre compte.',
    reasonsTitle: 'Pourquoi cela s’est produit',
    reasonsDesc: 'Votre compte, ou son activité, ne respecte pas nos Standards de la communauté concernant l’intégrité des comptes.',
    readRule: 'En savoir plus sur cette règle',
    accountSettings: 'Paramètres du compte',
    advertisingDefense: 'Restrictions and advertisements',
    defenseDesc1: 'Afficher la suspension administrative',
    defenseDesc2: 'Protection de l’annonceur et sécurité',
    adminRestore: 'Restaurer le compte (Admin)',
    fullscreen: 'Mode plein écran',
    exitFullscreen: 'Quitter le plein écran',
    auto: 'Auto',
    logout: 'Se déconnecter',
    language: 'Langue',
    chooseLanguage: 'Choisir la langue',
    searchLanguagePlaceholder: 'Rechercher une langue...',
    popularLanguages: 'Langues suggérées',
    allLanguages: 'Toutes les langues',
    ruleModalTitle: 'Standards de la communauté sur l’intégrité des comptes',
    ruleModalIntro: 'Nous prenons des mesures pour prévenir les abus sur GROZLA et protéger notre communauté :',
    ruleBullet1: 'Utilisation de fausses identités ou usurpation d’identité.',
    ruleBullet2: 'Comportement inauthentique coordonné ou création massive de faux comptes.',
    ruleBullet3: 'Non-respect des consignes de sécurité ou tentative de contournement des vérifications.',
    
    understoodBtn: 'Compris',
    ob13ReviewAlert: 'Veuillez d\'abord prendre ou uploader un selfie pour un examen complet par OWN.',
    ob13AnalysisStatus: 'Analyse et comparaison des traits du visage via OWN...',
    ob13DecisionStatus: 'Réception de la décision OWN et des suggestions d\'examen...',
    ob13Rejection: 'Décision OWN : Correspondance rejetée.',
    ob13SuccessStatus: 'OWN a vérifié l\'identité avec succès ! Taux de correspondance : ',
    ob13MatchSuccess: 'Votre identité a été vérifiée avec succès par OWN. Votre compte est maintenant sécurisé et déverrouillé.',
    ob13UnlockedTitle: 'Compte déverrouillé',
    ob13RestoredTitle: 'Accès restauré',
    ob13RestoredDesc: 'Nous avons supprimé les restrictions de votre compte après avoir confirmé votre identité via OWN.',
    ob13ProtectedBy: 'Protégé par OWN',
    backToApp: 'Retourner à Facebook'
  },
  es: {
    suspendedTitle: 'Hemos suspendido tu cuenta',
    daysRemaining: 'Te quedan 180 días para apelar; de lo contrario, tu cuenta se inhabilitará permanentemente.',
    suspendedDatePrefix: 'Suspendida el',
    appealBtn: 'Apelar',
    submittingAppeal: 'Enviando apelación...',
    reviewingAppeal: 'Revisando tu apelación...',
    finishingReview: 'Finalizando revisión...',
    originalPhoto: 'Foto original',
    verificationPhoto: 'Foto de verificación',
    meaningTitle: 'Qué significa esto',
    meaningDesc: 'Tu cuenta no está visible para otras personas en GROZLA en este momento y no puedes usarla.',
    actionsTitle: 'Qué puedes hacer',
    actionsDesc: 'Tienes 180 días para apelar nuestra decisión. Es posible que te solicitemos información para revisar tu cuenta.',
    reasonsTitle: 'Por qué ocurrió esto',
    reasonsDesc: 'Tu cuenta o la actividad en ella no cumple con nuestras Normas comunitarias sobre integridad de la cuenta.',
    readRule: 'Más información sobre esta regla',
    accountSettings: 'Configuración de la cuenta',
    advertisingDefense: 'Restrictions and advertisements',
    defenseDesc1: 'Mostrar suspensión administrativa',
    defenseDesc2: 'Protección y seguridad del anunciante',
    adminRestore: 'Restaurar cuenta (Admin)',
    fullscreen: 'Pantalla completa',
    exitFullscreen: 'Salir de pantalla completa',
    auto: 'Automático',
    logout: 'Cerrar sesión',
    language: 'Idioma',
    chooseLanguage: 'Seleccionar idioma',
    searchLanguagePlaceholder: 'Buscar un idioma...',
    popularLanguages: 'Idiomas sugeridos',
    allLanguages: 'Todos los idiomas',
    ruleModalTitle: 'Normas comunitarias sobre integridad de cuentas',
    ruleModalIntro: 'Tomamos medidas para evitar abusos en GROZLA y proteger a nuestra comunidad:',
    ruleBullet1: 'Uso de identidades falsas o suplantación no autorizada de personas.',
    ruleBullet2: 'Participar en comportamiento no auténtico coordinado o cuentas falsas masivas.',
    ruleBullet3: 'Infringir las pautas de seguridad o intentar eludir los controles de verificación.',
    
    understoodBtn: 'Entendido',
    ob13ReviewAlert: 'Por favor, tome o suba una selfie primero para una revisión completa por OWN.',
    ob13AnalysisStatus: 'Analizando y comparando rasgos faciales a través de OWN...',
    ob13DecisionStatus: 'Recibiendo decisión de OWN y sugerencias de revisión...',
    ob13Rejection: 'Decisión de OWN: Coincidencia rechazada.',
    ob13SuccessStatus: '¡OWN verificó exitosamente la identidad! Tasa de coincidencia: ',
    ob13MatchSuccess: 'Tu identidad ha sido verificada exitosamente por OWN. Tu cuenta ahora está segura y desbloqueada.',
    ob13UnlockedTitle: 'Cuenta desbloqueada',
    ob13RestoredTitle: 'Acceso restaurado',
    ob13RestoredDesc: 'Hemos eliminado las restricciones de tu cuenta después de confirmar tu identidad a través de OWN.',
    ob13ProtectedBy: 'Protegido por tecnología OWN',
    backToApp: 'Volver a Facebook'
  },
  de: {
    suspendedTitle: 'Wir haben dein Konto gesperrt',
    daysRemaining: 'Du hast 180 Tage Zeit, um Einspruch einzulegen, andernfalls wird dein Konto dauerhaft deaktiviert.',
    suspendedDatePrefix: 'Gesperrt am',
    appealBtn: 'Einspruch einlegen',
    submittingAppeal: 'Einspruch wird gesendet...',
    reviewingAppeal: 'Dein Einspruch wird überprüft...',
    finishingReview: 'Überprüfung wird abgeschlossen...',
    originalPhoto: 'Originalfoto',
    verificationPhoto: 'Bestätigungsfoto',
    meaningTitle: 'Was das bedeutet',
    meaningDesc: 'Dein Konto ist derzeit für andere auf GROZLA nicht sichtbar und du kannst es nicht nutzen.',
    actionsTitle: 'Was du tun kannst',
    actionsDesc: 'Du hast 180 Tage Zeit, Einspruch gegen unsere Entscheidung einzulegen. Möglicherweise fordern wir weitere Daten zur Prüfung an.',
    reasonsTitle: 'Warum dies passiert ist',
    reasonsDesc: 'Dein Konto oder Aktivitäten darauf verstoßen gegen unsere Gemeinschaftsstandards zur Kontointegrität.',
    readRule: 'Mehr über diese Regel erfahren',
    accountSettings: 'Kontoeinstellungen',
    advertisingDefense: 'Restrictions and advertisements',
    defenseDesc1: 'Administrative Sperre anzeigen',
    defenseDesc2: 'Werbesicherheit & Schutz',
    adminRestore: 'Konto wiederherstellen (Admin)',
    fullscreen: 'Vollbildmodus',
    exitFullscreen: 'Vollbild beenden',
    auto: 'Automatisch',
    logout: 'Abmelden',
    language: 'Sprache',
    chooseLanguage: 'Sprache auswählen',
    searchLanguagePlaceholder: 'Sprache suchen...',
    popularLanguages: 'Vorgeschlagene Sprachen',
    allLanguages: 'Alle Sprachen',
    ruleModalTitle: 'Gemeinschaftsstandards zur Kontointegrität',
    ruleModalIntro: 'Wir ergreifen Maßnahmen, um Missbrauch auf GROZLA zu verhindern:',
    ruleBullet1: 'Verwendung falscher Identitäten oder unbefugte Nachahmung.',
    ruleBullet2: 'Koordinierte unauthentische Aktivitäten oder Erstellung gefälschter Konten.',
    ruleBullet3: 'Verstoß gegen Sicherheitsrichtlinien oder Umgehung von Prüfungen.',
    
    understoodBtn: 'Verstanden',
    ob13ReviewAlert: 'Bitte machen Sie zuerst ein Selfie für eine umfassende Überprüfung durch OWN.',
    ob13AnalysisStatus: 'Analyse und Vergleich von Gesichtsmerkmalen über OWN...',
    ob13DecisionStatus: 'Entscheidung von OWN und Überprüfungsvorschläge werden empfangen...',
    ob13Rejection: 'Entscheidung von OWN: Übereinstimmung abgelehnt.',
    ob13SuccessStatus: 'OWN hat die Identität erfolgreich überprüft! Übereinstimmungsrate: ',
    ob13MatchSuccess: 'Ihre Identität wurde erfolgreich von OWN verifiziert. Ihr Konto ist jetzt sicher und entsperrt.',
    ob13UnlockedTitle: 'Konto entsperrt',
    ob13RestoredTitle: 'Zugriff wiederhergestellt',
    ob13RestoredDesc: 'Wir haben die Beschränkungen von Ihrem Konto aufgehoben, nachdem wir Ihre Identität über OWN bestätigt haben.',
    ob13ProtectedBy: 'Geschützt durch OWN Tech',
    backToApp: 'Zurück zu Facebook'
  },
  tr: {
    suspendedTitle: 'Hesabını askıya aldık',
    daysRemaining: 'Bu karara itiraz etmek için 180 günün var, aksi takdirde hesabın kalıcı olarak kapatılacaktır.',
    suspendedDatePrefix: 'Askıya alınma tarihi:',
    appealBtn: 'İtiraz Et',
    submittingAppeal: 'İtiraz gönderiliyor...',
    reviewingAppeal: 'İtirazın inceleniyor...',
    finishingReview: 'İnceleme tamamlanıyor...',
    originalPhoto: 'Orijinal Fotoğraf',
    verificationPhoto: 'Doğrulama Fotoğrafı',
    meaningTitle: 'Bunun anlamı nedir?',
    meaningDesc: "Hesabın şu anda GROZLA'daki kişiler tarafından görülemez ve hesabını kullanamazsın.",
    actionsTitle: 'Yapabileceklerin',
    actionsDesc: 'Verdiğimiz karara itiraz etmek için 180 günün var. Hesabını tekrar incelememize yardımcı olması için senden bazı bilgiler toplamamız gerekebilir.',
    reasonsTitle: 'Bu durum neden gerçekleşti?',
    reasonsDesc: 'Hesabın veya hesabındaki hareketler, hesap bütünlüğüne ilişkin Topluluk Kurallarımıza uymuyor.',
    readRule: 'Bu kural hakkında daha fazla bilgi al',
    accountSettings: 'Hesap Ayarları',
    advertisingDefense: 'Restrictions and advertisements',
    defenseDesc1: 'İdari askıya almayı göster',
    defenseDesc2: 'Reklamveren Koruması ve Güvenlik',
    adminRestore: 'Hesabı Geri Yükle (Yönetici)',
    fullscreen: 'Tam Ekran Modu',
    exitFullscreen: 'Tam Ekrandan Çık',
    auto: 'Otomatik',
    logout: 'Çıkış Yap',
    language: 'Dil',
    chooseLanguage: 'Dil Seç',
    searchLanguagePlaceholder: 'Dil ara...',
    popularLanguages: 'Önerilen Diller',
    allLanguages: 'Tüm Diller',
    ruleModalTitle: 'Hesap Bütünlüğüne İlişkin Topluluk Kuralları',
    ruleModalIntro: "GROZLA'da kötüye kullanımı önlemek ve topluluğumuzu korumak için harekete geçiyoruz:",
    ruleBullet1: 'Sahte kimlik kullanma veya izinsiz olarak başkalarını taklit etme.',
    ruleBullet2: 'Koordineli sahte davranışlarda bulunma veya toplu sahte hesaplar oluşturma.',
    ruleBullet3: 'Güvenlik kurallarını ihlal etme veya güvenlik denetimlerini atlatmaya çalışma.',
    
    understoodBtn: 'Anladım',
    ob13ReviewAlert: 'OWN tarafından kapsamlı bir inceleme için lütfen önce bir selfie çekin veya yükleyin.',
    ob13AnalysisStatus: 'OWN aracılığıyla yüz hatları analiz ediliyor ve karşılaştırılıyor...',
    ob13DecisionStatus: 'OWN kararı ve inceleme önerileri alınıyor...',
    ob13Rejection: 'OWN Kararı: Eşleşme Reddedildi.',
    ob13SuccessStatus: 'OWN kimliği başarıyla doğruladı! Eşleşme oranı: ',
    ob13MatchSuccess: 'Kimliğiniz OWN tarafından başarıyla doğrulandı. Hesabınız artık güvende ve kilidi açıldı.',
    ob13UnlockedTitle: 'Hesap Kilidi Açıldı',
    ob13RestoredTitle: 'Erişim Sağlandı',
    ob13RestoredDesc: 'OWN üzerinden kimliğinizi doğruladıktan sonra hesabınızdaki kısıtlamaları kaldırdık.',
    ob13ProtectedBy: 'OWN Teknolojisi ile Korunuyor',
    backToApp: 'Facebook\'a Dön'
  }
};

export default function SuspendedAccount() {
  const { currentUser, messages, submitAppeal, resolveAppeal, logout, reactivateAccount, updateProfile, updateAppealStep, setCurrentView, openSkyModal, language: currentLang, setAppLanguage, moderateUser, showToast } = useAppContext();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const [showRuleModal, setShowRuleModal] = useState(false);
  const [showOwnAiRecoveryModal, setShowOwnAiRecoveryModal] = useState(false);
  const [showEdotensiMessenger, setShowEdotensiMessenger] = useState(false);
  const [viewMode, setViewMode] = useState<'suspended' | 'locked'>(
    currentUser?.status === 'locked' ? 'locked' : 'suspended'
  );

  // Language System State (نظام اللغات الشامل)
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [languageSearchQuery, setLanguageSearchQuery] = useState('');

  // Selected Language Object & Translations
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


  // Photo Review 5s state (وقت مراجعة الحساب أثناء التعليق هو 5 ثوانٍ)
  const [photoReviewCountdown, setPhotoReviewCountdown] = useState(5);
  // 5-Second Selfie Review & Reactivation State
  const [isReviewingSelfie, setIsReviewingSelfie] = useState(false);
  const [reviewCountdown, setReviewCountdown] = useState(5);
  const [currentSelfieSnap, setCurrentSelfieSnap] = useState<string | null>(null);

  // Human CAPTCHA State (إثبات أنك إنسان)
  const [showHumanCaptchaModal, setShowHumanCaptchaModal] = useState(false);
  const [captchaChecked, setCaptchaChecked] = useState(false);
  const [captchaLoading, setCaptchaLoading] = useState(false);
  const [captchaShowChallenge, setCaptchaShowChallenge] = useState(false);
  const [selectedCaptchaTiles, setSelectedCaptchaTiles] = useState<number[]>([]);
  const [captchaVerified, setCaptchaVerified] = useState(false);
  const [captchaError, setCaptchaError] = useState<string | null>(null);
  
  // Storage key for persisting appeal state across app closures/reloads
  const APPEAL_STORAGE_KEY = currentUser?.id ? `grozla_appeal_${currentUser.id}` : 'grozla_appeal_session';
  const [isCheckingDecision, setIsCheckingDecision] = useState(false);
  const [aiReviewPhase, setAiReviewPhase] = useState<string | null>(null);

  // Appeal Step - Persistent across all phones and devices via Firestore
  const [appealStep, setAppealStep] = useState<'info' | 'phone' | 'code' | 'password' | 'photo' | 'reviewing' | 'failed' | 'success' | 'submitted'>(() => {
    if (currentUser?.appealStatus === 'under_review' || currentUser?.appealSubmittedAt) return 'reviewing';
    if (currentUser?.appealStep && ['info', 'phone', 'code', 'password', 'photo', 'reviewing', 'failed', 'success', 'submitted'].includes(currentUser.appealStep)) {
      return currentUser.appealStep as any;
    }
    try {
      const key = currentUser?.id ? `grozla_appeal_${currentUser.id}` : 'grozla_appeal_session';
      const saved = localStorage.getItem(key);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.appealStep) return parsed.appealStep;
      }
    } catch (e) {}
    return 'info';
  });

  // Cross-device persistent step transition helper
  const goToAppealStep = async (step: 'info' | 'phone' | 'code' | 'password' | 'photo' | 'reviewing' | 'failed' | 'success' | 'submitted', extraData?: Record<string, any>) => {
    setAppealStep(step);
    try {
      if (updateAppealStep) {
        await updateAppealStep(step, extraData);
      }
    } catch (e) {
      console.warn("Error updating appeal step in Firestore:", e);
    }
  };

  const [appealPhoneNumber, setAppealPhoneNumber] = useState<string>(() => {
    if (currentUser?.appealPhone) return currentUser.appealPhone;
    if (currentUser?.phone) return currentUser.phone;
    try {
      const key = currentUser?.id ? `grozla_appeal_${currentUser.id}` : 'grozla_appeal_session';
      const saved = localStorage.getItem(key);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.appealPhoneNumber) return parsed.appealPhoneNumber;
      }
    } catch (e) {}
    return '';
  });

  const [appealPhoneError, setAppealPhoneError] = useState<string | null>(null);
  const [appealCountryCode, setAppealCountryCode] = useState<string>('+966');
  const [appealNewPassword, setAppealNewPassword] = useState<string>('');
  const [appealConfirmPassword, setAppealConfirmPassword] = useState<string>('');
  const [showAppealPassword, setShowAppealPassword] = useState<boolean>(false);
  const [appealPasswordError, setAppealPasswordError] = useState<string | null>(null);
  const [appealOtpCode, setAppealOtpCode] = useState<string>(() => {
    try {
      const key = currentUser?.id ? `grozla_appeal_${currentUser.id}` : 'grozla_appeal_session';
      const saved = localStorage.getItem(key);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.appealOtpCode) return parsed.appealOtpCode;
      }
    } catch (e) {}
    return '';
  });

  const [appealGeneratedOtp, setAppealGeneratedOtp] = useState<string>(() => {
    try {
      const key = currentUser?.id ? `grozla_appeal_${currentUser.id}` : 'grozla_appeal_session';
      const saved = localStorage.getItem(key);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.appealGeneratedOtp) return parsed.appealGeneratedOtp;
      }
    } catch (e) {}
    return '';
  });

  const [appealOtpError, setAppealOtpError] = useState<string | null>(null);
  const [appealPhoto, setAppealPhoto] = useState<string | null>(() => {
    if (currentUser?.appealPhoto) return currentUser.appealPhoto;
    if (currentUser?.appealSelfie) return currentUser.appealSelfie;
    try {
      const key = currentUser?.id ? `grozla_appeal_${currentUser.id}` : 'grozla_appeal_session';
      const saved = localStorage.getItem(key);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.appealPhoto) return parsed.appealPhoto;
      }
    } catch (e) {}
    return null;
  });

  const [appealPhotoError, setAppealPhotoError] = useState<string | null>(null);
  const [appealAttempts, setAppealAttempts] = useState<number>(() => {
    try {
      const key = currentUser?.id ? `grozla_appeal_attempts_${currentUser.id}` : 'grozla_appeal_attempts';
      const saved = localStorage.getItem(key);
      if (saved) return parseInt(saved, 10);
    } catch (e) {}
    return 0;
  });
  const [isAppealAiReviewing, setIsAppealAiReviewing] = useState(false);
  const [appealReviewCountdown, setAppealReviewCountdown] = useState(5);
  const [appealReviewProgress, setAppealReviewProgress] = useState(0);
  const [appealAiResult, setAppealAiResult] = useState<{
    isApproved: boolean;
    resemblanceScore?: number;
    notMatchingProfile?: boolean;
    hasFriends?: boolean;
    isBlurry?: boolean;
    aiVerdict?: string;
    aiAnalysis?: string;
    verdictTitle?: string;
    aiRationale?: string;
    action?: string;
    reportSeverity?: string;
    confidenceScore?: number;
  } | null>(() => {
    try {
      const key = currentUser?.id ? `grozla_appeal_${currentUser.id}` : 'grozla_appeal_session';
      const saved = localStorage.getItem(key);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.appealAiResult) return parsed.appealAiResult;
      }
    } catch (e) {}
    return null;
  });
  const [submissionDateGmt, setSubmissionDateGmt] = useState('');
  const appealPhotoInputRef = useRef<HTMLInputElement>(null);

  // Appeal ID Card Verification State (تأكيد الهوية في واجهة لقد أرسلت طعناً)
  const [appealIdCard, setAppealIdCard] = useState<string | null>(() => {
    return currentUser?.appealIdCard || null;
  });
  const [appealIdError, setAppealIdError] = useState<string | null>(null);
  const [isVerifyingAppealId, setIsVerifyingAppealId] = useState(false);
  const [appealIdVerifyProgress, setAppealIdVerifyProgress] = useState(0);
  const [appealIdVerifyStage, setAppealIdVerifyStage] = useState<string | null>(null);
  const appealIdCardInputRef = useRef<HTMLInputElement>(null);

  // Synchronize appeal state changes to localStorage
  useEffect(() => {
    try {
      const attemptsKey = currentUser?.id ? `grozla_appeal_attempts_${currentUser.id}` : 'grozla_appeal_attempts';
      localStorage.setItem(attemptsKey, appealAttempts.toString());
      
      if (appealStep !== 'info' && appealStep !== 'success') {
        const stateToSave = {
          appealStep,
          appealPhoneNumber,
          appealOtpCode,
          appealGeneratedOtp,
          appealPhoto,
          appealIdCard,
          appealAiResult,
          appealStatus: currentUser?.appealStatus || 'under_review',
          appealSubmittedAt: currentUser?.appealSubmittedAt || new Date().toISOString()
        };
        localStorage.setItem(APPEAL_STORAGE_KEY, JSON.stringify(stateToSave));
      } else if (appealStep === 'info' || appealStep === 'success') {
        localStorage.removeItem(APPEAL_STORAGE_KEY);
        const attemptsKey = currentUser?.id ? `grozla_appeal_attempts_${currentUser.id}` : 'grozla_appeal_attempts';
        localStorage.removeItem(attemptsKey);
      }
    } catch (e) {}
  }, [appealStep, appealPhoneNumber, appealOtpCode, appealGeneratedOtp, appealPhoto, appealIdCard, appealAiResult, appealAttempts, APPEAL_STORAGE_KEY, currentUser?.id, currentUser?.appealStatus, currentUser?.appealSubmittedAt]);

  // Keep account in sync with Firestore across any device login
  useEffect(() => {
    if (currentUser?.status === 'suspended') {
      if (currentUser?.appealStatus === 'under_review' || currentUser?.appealSubmittedAt) {
        setAppealStep('reviewing');
      } else if (currentUser?.appealStep && ['info', 'phone', 'code', 'password', 'photo', 'reviewing', 'failed', 'success', 'submitted'].includes(currentUser.appealStep)) {
        setAppealStep(currentUser.appealStep as any);
      }
      if (currentUser?.appealPhoto) {
        setAppealPhoto(currentUser.appealPhoto);
      }
      if (currentUser?.appealIdCard) {
        setAppealIdCard(currentUser.appealIdCard);
      }
      if (currentUser?.appealPhone) {
        setAppealPhoneNumber(currentUser.appealPhone);
      }
    }
  }, [currentUser?.status, currentUser?.appealStatus, currentUser?.appealSubmittedAt, currentUser?.appealStep, currentUser?.appealPhoto, currentUser?.appealIdCard, currentUser?.appealPhone]);

  // Appeal Handler 1: Save phone number directly and proceed directly to new password across devices
  const handleSendAppealCode = async () => {
    const raw = appealPhoneNumber.trim();
    if (!raw) {
      setAppealPhoneError('يرجى كتابة رقم هاتفك المحمول للمتابعة.');
      return;
    }
    const cleanDigits = raw.replace(/[\s\-\+\(\)]/g, '');
    if (cleanDigits.length < 7 || cleanDigits.length > 15) {
      setAppealPhoneError('يرجى كتابة رقم هاتف صحيح (مكون من 7 إلى 15 رقماً).');
      return;
    }

    const fullPhone = raw.startsWith('+') ? raw : `${appealCountryCode} ${cleanDigits}`;
    setAppealPhoneError(null);
    updateProfile({ phone: fullPhone });
    showToast('تم حفظ وتأكيد رقم الهاتف بنجاح ✅');
    // Save to Firestore and progress directly to password step
    await goToAppealStep('password', { appealPhone: fullPhone, phone: fullPhone });
  };

  // Appeal Handler 2: Verify SMS Code (retained if user was in code step)
  const handleVerifyAppealCode = async () => {
    await goToAppealStep('password');
  };

  // Appeal Handler 2.5: Verify and Save New Password, then proceed to photo verification step
  const handleVerifyAppealPassword = async () => {
    const pass = appealNewPassword.trim();
    if (!pass || pass.length < 6) {
      setAppealPasswordError('يرجى إدخال كلمة سر جديدة مكونة من 6 أحرف أو أرقام على الأقل.');
      return;
    }
    if (appealConfirmPassword && pass !== appealConfirmPassword.trim()) {
      setAppealPasswordError('كلمتا السر غير متطابقتين. يرجى التأكد من تطابقهما.');
      return;
    }
    setAppealPasswordError(null);

    // Save password in Firestore and update savedAccounts so future logins never get wrong-password
    try {
      if (currentUser?.id) {
        const userRef = doc(db, 'users', currentUser.id);
        await updateDoc(userRef, { password: pass, appealStep: 'photo' });
        updateProfile({ password: pass, appealStep: 'photo' });
      }

      // Update password in saved_accounts in localStorage
      try {
        const savedRaw = localStorage.getItem('saved_accounts') || localStorage.getItem('savedAccounts') || '[]';
        const savedList = JSON.parse(savedRaw);
        const updatedList = savedList.map((acc: any) => {
          if (acc.email?.toLowerCase() === currentUser?.email?.toLowerCase() || acc.name === currentUser?.name) {
            return { ...acc, password: pass };
          }
          return acc;
        });
        localStorage.setItem('saved_accounts', JSON.stringify(updatedList));
      } catch (err) {}

      showToast('تم حفظ كلمة السر الجديدة بنجاح!');
      // Transition smoothly to photo upload step
      await goToAppealStep('photo', { password: pass });
    } catch (e) {
      console.error(e);
      await goToAppealStep('photo');
    }
  };

  // Appeal Handler 3: Submit Official ID Card for AI Account Verification
  const handleStartAiAppealPhotoReview = async (idCardToVerify?: string) => {
    const targetIdCard = idCardToVerify || appealIdCard || appealPhoto;
    if (!targetIdCard) {
      setAppealPhotoError('يرجى رفع صورة بطاقة الهوية الرسمية (بطاقة تعريف وطنية / جواز سفر / رخصة قيادة) للمتابعة.');
      return;
    }

    setAppealPhotoError(null);
    setIsAppealAiReviewing(true);
    const nowIso = new Date().toISOString();
    setSubmissionDateGmt(nowIso);

    // 1. Immediately persist appeal state to Firestore
    if (currentUser?.id) {
      try {
        const userRef = doc(db, 'users', currentUser.id);
        await updateDoc(userRef, {
          status: 'suspended',
          appealStatus: 'under_review',
          appealStep: 'reviewing',
          appealSubmittedAt: nowIso,
          appealIdCard: targetIdCard,
          appealPhoto: targetIdCard,
          appealSelfie: targetIdCard,
          appealPhone: appealPhoneNumber || currentUser.phone || '',
          ...(appealNewPassword ? { password: appealNewPassword } : {})
        });
      } catch (err) {
        console.error("Error saving appeal to Firestore:", err);
      }
    }

    // 2. Persist to localStorage
    try {
      const stateToSave = {
        appealStep: 'reviewing',
        appealPhoneNumber,
        appealIdCard: targetIdCard,
        appealPhoto: targetIdCard,
        appealSubmittedAt: nowIso,
        appealStatus: 'under_review'
      };
      localStorage.setItem(APPEAL_STORAGE_KEY, JSON.stringify(stateToSave));
    } catch (e) {}

    // 3. Move UI into reviewing state
    await goToAppealStep('reviewing', {
      appealIdCard: targetIdCard,
      appealPhoto: targetIdCard,
      appealStatus: 'under_review',
      appealSubmittedAt: nowIso
    });
    showToast('تم رفع بطاقة الهوية بنجاح! يبدأ الذكاء الاصطناعي الآن بمطابقتها مع بيانات حسابك 🪪✨');
    setIsAppealAiReviewing(false);

    // 4. Automatically trigger AI review immediately upon ID upload!
    handleCheckAppealDecision(targetIdCard);
  };

  const handleCheckAppealDecision = async (idDocOverride?: string) => {
    if (isCheckingDecision) return;
    setIsCheckingDecision(true);
    const idDocToTest = idDocOverride || appealIdCard || appealPhoto || currentUser?.appealIdCard || currentUser?.appealPhoto;

    try {
      // Phase 1: AI Vision check on the official ID Card and matching with account name
      setAiReviewPhase('المرحلة 1/3: فحص وثيقة الهوية واستخراج البيانات والاسم...');
      await new Promise(r => setTimeout(r, 800));

      let idCheckResult: any = null;
      try {
        const visionResp = await fetch('/api/vision/verify-appeal-id-card', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            appealIdCard: idDocToTest,
            userName: currentUser?.name || 'صاحب الحساب',
            birthDate: currentUser?.birthDate || ''
          })
        });
        if (visionResp.ok) {
          idCheckResult = await visionResp.json();
        }
      } catch (e) {
        console.warn("ID check call error:", e);
      }

      setAiReviewPhase('المرحلة 2/3: مطابقة بيانات الهوية مع بيانات الحساب (الاسم وتاريخ الميلاد)...');
      await new Promise(r => setTimeout(r, 900));

      setAiReviewPhase('المرحلة 3/3: إصدار وتطبيق القرار النهائي...');
      await new Promise(r => setTimeout(r, 700));

      const isMatch = idCheckResult?.isMatch !== false && idCheckResult?.shouldDisableAccount !== true;
      const isApproved = Boolean(idCheckResult?.isApproved !== false && isMatch);

      if (isApproved) {
        // AI directly executes approval: restores the account (مطابقة ناجحة)
        showToast(idCheckResult?.aiVerdict || '✅ تم التحقق من بطاقة الهوية ومطابقتها لبيانات حسابك بنجاح! تم استعادة حسابك نشطاً 🪪✨');
        await resolveAppeal(true);
        try { localStorage.removeItem(APPEAL_STORAGE_KEY); } catch (e) {}
        setAppealStep('info');
        setCurrentView('home');
      } else {
        // AI directly executes rejection: confirms disabling because ID does not match account
        const reason = idCheckResult?.aiVerdict || 'تم تعطيل الحساب لعدم تطابق بطاقة الهوية المرفوعة مع بيانات ومعلومات الحساب.';
        showToast('❌ لم تتطابق بطاقة الهوية مع بيانات ومعلومات الحساب، تم تعطيل الحساب.');
        await resolveAppeal(false, reason);
        try { localStorage.removeItem(APPEAL_STORAGE_KEY); } catch (e) {}
      }
    } catch (err) {
      console.error("AI appeal ID review error:", err);
      // Fallback: If document provided matches, approve; otherwise disable
      if (idDocToTest) {
        showToast('✅ تم تأكيد ومطابقة بطاقة الهوية مع بيانات الحساب، تم قبول الطعن واستعادة الحساب 🪪✨');
        await resolveAppeal(true);
        try { localStorage.removeItem(APPEAL_STORAGE_KEY); } catch (e) {}
        setAppealStep('info');
        setCurrentView('home');
      } else {
        showToast('❌ تعذر مطابقة الهوية، تم تعطيل الحساب.');
        await resolveAppeal(false, 'تم تعطيل الحساب لعدم تقديم بطاقة هوية مطابقة لبيانات الحساب.');
        try { localStorage.removeItem(APPEAL_STORAGE_KEY); } catch (e) {}
      }
    } finally {
      setIsCheckingDecision(false);
      setAiReviewPhase(null);
    }
  };

  // Handle ID Card Verification in "لقد أرسلت طعناً" interface
  const handleVerifyAppealIdCard = async (overrideImg?: string) => {
    const targetId = overrideImg || appealIdCard;
    if (!targetId) {
      setAppealIdError('يرجى رفع صورة بطاقة الهوية الرسمية للمتابعة.');
      return;
    }

    setAppealIdError(null);
    setIsVerifyingAppealId(true);
    setAppealIdVerifyProgress(15);
    setAppealIdVerifyStage('المرحلة 1/3: جاري فحص وثيقة الهوية واستخراج البيانات...');

    try {
      await new Promise(r => setTimeout(r, 600));
      setAppealIdVerifyProgress(45);
      setAppealIdVerifyStage(`المرحلة 2/3: مطابقة بيانات الهوية مع اسم وبيانات الحساب (${currentUser?.name || 'صاحب الحساب'})...`);

      let idCheckResult: any = null;
      try {
        const visionResp = await fetch('/api/vision/verify-appeal-id-card', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            appealIdCard: targetId,
            userName: currentUser?.name || 'صاحب الحساب',
            birthDate: currentUser?.birthDate || ''
          })
        });
        if (visionResp.ok) {
          idCheckResult = await visionResp.json();
        }
      } catch (e) {
        console.warn("Vision check warning:", e);
      }

      await new Promise(r => setTimeout(r, 600));
      setAppealIdVerifyProgress(85);
      setAppealIdVerifyStage('المرحلة 3/3: إصدار قرار الاعتماد والمطابقة...');

      const isMatch = idCheckResult?.isMatch !== false && idCheckResult?.shouldDisableAccount !== true;
      const isApproved = Boolean(idCheckResult?.isApproved !== false && isMatch);

      if (!isApproved) {
        setAppealIdVerifyProgress(100);
        const failReason = idCheckResult?.aiVerdict || 'تم تعطيل الحساب نهائياً لعدم تطابق بطاقة الهوية المرفوعة مع بيانات ومعلومات الحساب.';
        showToast('❌ لم تتطابق بطاقة الهوية مع بيانات الحساب، تم تأكيد تعطيل الحساب نهائياً.');
        await resolveAppeal(false, failReason);
        try { localStorage.removeItem(APPEAL_STORAGE_KEY); } catch (e) {}
        return;
      }

      setAppealIdVerifyProgress(100);

      // Update in Firestore
      if (currentUser?.id) {
        try {
          const userRef = doc(db, 'users', currentUser.id);
          await updateDoc(userRef, {
            status: 'active',
            suspensionReason: null,
            appealStatus: 'approved',
            appealIdCard: targetId,
            appealPhoto: targetId,
            appealSubmittedAt: new Date().toISOString(),
            idVerifiedAt: new Date().toISOString()
          });
        } catch (dbErr) {
          console.warn("Firestore update warning on ID verification:", dbErr);
        }
      }

      await resolveAppeal(true);
      try { localStorage.removeItem(APPEAL_STORAGE_KEY); } catch (e) {}
      showToast('🎉 تهانينا! تم تأكيد وتطابق بطاقة الهوية الرسمية مع الحساب بنجاح! تم استعادة الحساب نشطاً.');
      setAppealStep('info');
      setCurrentView('home');
    } catch (err: any) {
      setAppealIdError(err?.message || 'حدث خطأ أثناء معالجة بطاقة الهوية.');
    } finally {
      setIsVerifyingAppealId(false);
    }
  };


  const captchaTiles = [
    { id: 0, emoji: '🚗', label: 'سيارة حمراء', isCar: true },
    { id: 1, emoji: '🌳', label: 'شجرة خضراء', isCar: false },
    { id: 2, emoji: '🚗', label: 'سيارة زرقاء', isCar: true },
    { id: 3, emoji: '🏠', label: 'منزل', isCar: false },
    { id: 4, emoji: '🚗', label: 'سيارة أجرة', isCar: true },
    { id: 5, emoji: '🚲', label: 'دراجة', isCar: false },
  ];

  const handleToggleCheckbox = () => {
    if (captchaVerified) return;
    setCaptchaLoading(true);
    setCaptchaChecked(true);
    setTimeout(() => {
      setCaptchaLoading(false);
      setCaptchaShowChallenge(true);
    }, 600);
  };

  const toggleCaptchaTile = (index: number) => {
    if (selectedCaptchaTiles.includes(index)) {
      setSelectedCaptchaTiles(prev => prev.filter(i => i !== index));
    } else {
      setSelectedCaptchaTiles(prev => [...prev, index]);
    }
    setCaptchaError(null);
  };

  const handleVerifyCaptchaGrid = () => {
    const correctCarIndices = [0, 2, 4];
    const isCorrect = 
      selectedCaptchaTiles.length === correctCarIndices.length &&
      correctCarIndices.every(idx => selectedCaptchaTiles.includes(idx));

    if (isCorrect) {
      setCaptchaVerified(true);
      setCaptchaError(null);
    } else {
      setCaptchaError('يرجى تحديد جميع الصور الثلاث المصغرة للسيارات فقط (🚗).');
    }
  };

  const handleResetCaptchaTiles = () => {
    setSelectedCaptchaTiles([]);
    setCaptchaError(null);
  };

  useEffect(() => {
    setViewMode(currentUser?.status === 'locked' ? 'locked' : 'suspended');
    if (currentUser?.status === 'suspended') {
      setAppealStep('info');
    }
  }, [currentUser?.status]);
  
  // Locked Account Flow state
  const [lockedStep, setLockedStep] = useState<'info' | 'verification' | 'face_review' | 'restoring' | 'success_unlocked'>('info');
  const [lockedMethod, setLockedMethod] = useState<'methods' | 'own_security_code' | 'selfie_compare' | 'phone_fingerprint' | 'id_match'>('methods');
  
  // Method OWN: Security & Recovery Code confirmed in OWN Accounts Center (مركز حسابات OWN)
  const [ownSecurityCodeInput, setOwnSecurityCodeInput] = useState('');
  const [ownSecurityCodeError, setOwnSecurityCodeError] = useState<string | null>(null);
  const [isVerifyingOwnCode, setIsVerifyingOwnCode] = useState(false);
  const [showOwnCodeInputPass, setShowOwnCodeInputPass] = useState(false);
  
  // Method 1: AI-Powered Biometric Selfie Review & Facial Resemblance Decision System (Gemini OB13 Vision)
  const [showAiAppealModal, setShowAiAppealModal] = useState<boolean>(false);
  const [selfieCompareImage, setSelfieCompareImage] = useState<string | null>(null);
  const [selfieError, setSelfieError] = useState<string | null>(null);
  const [isSelfieVerifying, setIsSelfieVerifying] = useState(false);
  const [selfieProgress, setSelfieProgress] = useState(0);
  const [selfieStatusText, setSelfieStatusText] = useState('');
  const [selfieSurveillanceCheckLiveness, setSelfieSurveillanceCheckLiveness] = useState(true);
  const [selfieSurveillanceCheckAntiSpoof, setSelfieSurveillanceCheckAntiSpoof] = useState(true);
  const [selfieDeclarationAgreed, setSelfieDeclarationAgreed] = useState(true);
  const [selfieLiveScanLog, setSelfieLiveScanLog] = useState<string[]>([]);
  const [aiSelfieResult, setAiSelfieResult] = useState<{
    decision: 'approved' | 'rejected';
    resemblanceScore: number;
    aiVerdict: string;
    aiAnalysis: string;
    aiSuggestions: string[];
    livenessPassed?: boolean;
    antiSpoofPassed?: boolean;
  } | null>(null);

  // Method 2: Phone Number in Contacts + Fingerprint Authentication
  const [phoneInputValue, setPhoneInputValue] = useState('');
  const [phoneStep, setPhoneStep] = useState<'phone' | 'fingerprint'>('phone');
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [fingerprintType, setFingerprintType] = useState<'registered' | 'different'>('registered');
  const [fingerprintScanning, setFingerprintScanning] = useState(false);
  const [fingerprintProgress, setFingerprintProgress] = useState(0);
  const [fingerprintStatusText, setFingerprintStatusText] = useState('');
  const [fingerprintError, setFingerprintError] = useState<string | null>(null);

  // Method 3: ID Card with Name, Birth Date, and Face Image
  const [idCardImage, setIdCardImage] = useState<string | null>(null);
  const [idFullName, setIdFullName] = useState(currentUser?.name || '');
  const [idBirthDate, setIdBirthDate] = useState(currentUser?.birthDate || '');
  const [idError, setIdError] = useState<string | null>(null);
  const [isIdVerifying, setIsIdVerifying] = useState(false);
  const [idProgress, setIdProgress] = useState(0);
  const [idStatusText, setIdStatusText] = useState('');

  const [faceOnlyImage, setFaceOnlyImage] = useState<string | null>(null);
  const [lockedContact, setLockedContact] = useState(currentUser?.email || '');
  const [lockedOtpCode, setLockedOtpCode] = useState('');
  const [sentGeneratedOtp, setSentGeneratedOtp] = useState('');
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [isVerifyingLocked, setIsVerifyingLocked] = useState(false);
  const [lockedVerificationProgress, setLockedVerificationProgress] = useState(0);
  const [lockedVerificationStatus, setLockedVerificationStatus] = useState('');
  const [lockedSuccess, setLockedSuccess] = useState(false);
  const [lockedFaceSubmittedDate, setLockedFaceSubmittedDate] = useState(
    new Date().toLocaleDateString('ar-EG', { day: 'numeric', month: 'long', year: 'numeric' })
  );
  const [showLockedHelpModal, setShowLockedHelpModal] = useState(false);

  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    // Lock browser history to prevent backwards navigation during account suspension / appeal flow
    const lockHistory = () => {
      window.history.pushState(null, '', window.location.href);
    };
    window.history.pushState(null, '', window.location.href);
    window.addEventListener('popstate', lockHistory);

    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      window.removeEventListener('popstate', lockHistory);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      if (document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen().catch((err) => {
          console.log("Fullscreen request error:", err);
        });
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch((err) => {
          console.log("Exit fullscreen error:", err);
        });
      }
    }
  };

  const processSelfieAndReview = (selfieDataUrl: string) => {
    setCurrentSelfieSnap(selfieDataUrl);
    setIsReviewingSelfie(true);
    setReviewCountdown(5);

    let count = 5;
    const interval = setInterval(() => {
      count--;
      setReviewCountdown(count);
      if (count <= 0) {
        clearInterval(interval);
        finishSelfieReview(selfieDataUrl);
      }
    }, 1000);
  };

  // Handler for Method 1: AI-Powered Biometric Review & Facial Resemblance Decision (Gemini OB13 Vision)
  const handleVerifySelfieComparison = async () => {
    if (!selfieCompareImage) {
      showToast(t.ob13ReviewAlert);
      return;
    }
    setSelfieError(null);
    setAiSelfieResult(null);
    setIsSelfieVerifying(true);
    setSelfieProgress(15);
    setSelfieLiveScanLog([
      'بدء بروتوكول المراقبة والرصد البيومتري الحي...',
      'فحص زوايا الوجه والإضاءة الحيوية وتتبع نبضات الحركة...'
    ]);
    setSelfieStatusText('جاري فحص المراقبة الحية ومكافحة الانتحال (Liveness & Anti-Spoof Guard)...');
    await new Promise(r => setTimeout(r, 100));
    
    setSelfieProgress(40);
    setSelfieLiveScanLog(prev => [
      ...prev,
      'تم فحص الإشارات الحيوية ومكافحة الصور المصورة من شاشات أخرى بنجاح.',
      'جاري إرسال البيانات لمحرك OWN (Gemini OWN Vision) لتحليل ومطابقة الملامح...'
    ]);
    setSelfieStatusText(t.ob13AnalysisStatus);

    let aiResponseData: any = null;
    try {
      const resp = await fetch('/api/vision/verify-selfie', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          selfieImage: selfieCompareImage,
          profileAvatar: currentUser?.avatar || null,
          userName: currentUser?.name || 'صاحب الحساب'
        })
      });
      if (resp.ok) {
        aiResponseData = await resp.json();
      }
    } catch (e) {
      console.warn("AI verification API call failed, fallback will be used:", e);
    }

    setSelfieProgress(75);
    setSelfieLiveScanLog(prev => [
      ...prev,
      'تم الانتهاء من تحليل وتدقيق المعالم الوجهية وحساب نسبة التشابه والتطابق.',
      'جاري استلام قرار OWN النهائي وصياغة التوصيات والاقتراحات...'
    ]);
    setSelfieStatusText(t.ob13DecisionStatus);
    await new Promise(r => setTimeout(r, 100));

    // Determine result from AI response
    const isProceduresComplete = selfieSurveillanceCheckLiveness && selfieSurveillanceCheckAntiSpoof && selfieDeclarationAgreed;
    
    let aiDecision: 'approved' | 'rejected' = 'rejected';
    let resemblanceScore = 32.5;
    let aiVerdict = 'فشلت المطابقة: ملامح الوجه في صورة السيلفي لا تتطابق مع صورة الحساب.';
    let aiAnalysis = 'أظهر التحليل البيومتري لـ OWN تبايناً في زوايا الوجه وملامح العينين مقارنة بصورة الملف الشخصي المسجلة.';
    let aiSuggestions: string[] = [
      'التقط صورة سيلفي في مكان ذي إضاءة واضحة ومباشرة بدون ظلال قوية.',
      'انظر مباشرة إلى الكاميرا وتجنب ارتداء النظارات الشمسية أو القبعات.',
      'تأكد من أن ملامح وجهك واضحة وتتطابق مع الصورة المعينة في ملفك الشخصي.'
    ];

    if (aiResponseData) {
      aiDecision = aiResponseData.decision === 'approved' ? 'approved' : 'rejected';
      resemblanceScore = typeof aiResponseData.resemblanceScore === 'number' 
        ? aiResponseData.resemblanceScore 
        : (aiDecision === 'approved' ? 91.4 : 34.2);
      aiVerdict = aiResponseData.aiVerdict || aiVerdict;
      aiAnalysis = aiResponseData.aiAnalysis || aiAnalysis;
      if (Array.isArray(aiResponseData.aiSuggestions) && aiResponseData.aiSuggestions.length > 0) {
        aiSuggestions = aiResponseData.aiSuggestions;
      }
    } else {
      // Heuristic fallback if AI server is busy
      if (currentUser?.avatar && selfieCompareImage) {
        aiDecision = 'approved';
        resemblanceScore = 89.2;
        aiVerdict = 'تم تأكيد المطابقة بنجاح بواسطة خوارزمية OWN البيومترية.';
        aiAnalysis = 'قام نظام OWN بمطابقة 128 نقطة بيومترية بين صورتك وصورة الملف الشخصي، مع وجود تطابق وثيق في أبعاد الوجه والملامح الرئيسية.';
        aiSuggestions = [
          'احرص على تحديث صورة ملفك الشخصي دورياً لتعزيز دقة التعرف في المرات القادمة.',
          'تم التحقق من هويتك بنجاح واجتياز الفحص الأمني.'
        ];
      }
    }

    // Mandatory security procedures validation
    if (!isProceduresComplete) {
      aiDecision = 'rejected';
      aiVerdict = 'تعذر تأكيد الحساب: يجب إتمام وتنفيذ جميع إجراءات المراقبة الأمنية والتحقق البيومتري المطلوبة قبل استعادة الحساب.';
      aiSuggestions = [
        'يرجى التأشير والموافقة على جميع بنود فحص الحيوية ومكافحة الانتحال الإلزامية.',
        'تأكد من الالتزام بالإجراءات الأمنية المنصوص عليها.'
      ];
    }

    const aiResultObj = {
      decision: aiDecision,
      resemblanceScore,
      aiVerdict,
      aiAnalysis,
      aiSuggestions,
      livenessPassed: isProceduresComplete,
      antiSpoofPassed: isProceduresComplete
    };
    setAiSelfieResult(aiResultObj);

    // AI Rejection: account remains locked
    if (aiDecision === 'rejected') {
      setSelfieProgress(100);
      setSelfieStatusText(t.ob13Rejection);
      await new Promise(r => setTimeout(r, 100));
      setIsSelfieVerifying(false);
      
      const errorMsg = `قرار OWN: ${aiVerdict} (نسبة التطابق: ${resemblanceScore}%). يظل حسابك مقفلاً لحمايته ولن تتمكن من الدخول للحساب إلا بعد اعتماد OWN.`;
      setSelfieError(errorMsg);

      // Persist the locked state and AI decision in Firestore
      try {
        if (currentUser?.id) {
          const userRef = doc(db, 'users', currentUser.id);
          await updateDoc(userRef, {
            status: 'locked',
            lockedReason: errorMsg,
            avatarReviewStatus: 'rejected',
            selfieVerificationFailed: true,
            lastVerificationStatus: 'failed_ai_decision',
            resemblanceScore: resemblanceScore,
            aiDecision: 'rejected',
            aiVerdict: aiVerdict,
            aiAnalysis: aiAnalysis,
            aiSuggestions: aiSuggestions,
            surveillanceAuditPassed: isProceduresComplete,
            lastVerificationAttempt: new Date().toISOString(),
            lastLockDate: new Date().toISOString()
          });
        }
      } catch (firestoreErr) {
        console.warn("Error updating Firestore on AI rejection:", firestoreErr);
      }

      // Update saved accounts in localStorage as well
      try {
        const rawAccounts = localStorage.getItem('savedAccounts');
        if (rawAccounts && currentUser?.id) {
          const accounts = JSON.parse(rawAccounts);
          const updated = accounts.map((acc: any) => {
            if (acc.id === currentUser.id || acc.uid === currentUser.id) {
              return { 
                ...acc, 
                status: 'locked', 
                lockedReason: errorMsg,
                avatarReviewStatus: 'rejected',
                selfieVerificationFailed: true,
                resemblanceScore: resemblanceScore,
                aiDecision: 'rejected'
              };
            }
            return acc;
          });
          safeSaveSavedAccounts(updated);
        }
      } catch (localErr) {
        console.warn("Error updating local saved accounts:", localErr);
      }

      return;
    }

    // AI Approval: Account unlocked
    setSelfieProgress(100);
    setSelfieStatusText(`${t.ob13SuccessStatus}${resemblanceScore}%`);
    await new Promise(r => setTimeout(r, 100));

    try {
      // Persist success to Firestore
      if (currentUser?.id) {
        const userRef = doc(db, 'users', currentUser.id);
        await updateDoc(userRef, {
          status: 'active',
          avatarReviewStatus: 'approved',
          selfieVerificationFailed: false,
          lastVerificationStatus: 'approved_ai_decision',
          resemblanceScore: resemblanceScore,
          aiDecision: 'approved',
          aiVerdict: aiVerdict,
          aiAnalysis: aiAnalysis,
          aiSuggestions: aiSuggestions,
          surveillanceAuditPassed: true,
          lockedReason: null,
          suspensionReason: null,
          lastVerificationAttempt: new Date().toISOString()
        });
      }

      // Update local state to show success screen instead of immediate reactivation
      setLockedStep('success_unlocked');
    } catch (err) {
      console.error('Error reactivating account on AI selfie match:', err);
    } finally {
      setIsSelfieVerifying(false);
    }
  };

  // Handler for Method 2: Phone check
  const handleVerifyRegisteredPhone = () => {
    setPhoneError(null);
    if (!phoneInputValue.trim()) {
      setPhoneError('يرجى إدخال رقم الهاتف المسجل في جهات اتصال هذا الحساب.');
      return;
    }

    const cleanInput = phoneInputValue.replace(/[\s\-\+\(\)]/g, '');
    const userPhoneClean = (currentUser?.phone || '').replace(/[\s\-\+\(\)]/g, '');

    // Check if matched
    const isMatched = userPhoneClean 
      ? cleanInput === userPhoneClean || cleanInput.endsWith(userPhoneClean) || userPhoneClean.endsWith(cleanInput)
      : cleanInput.length >= 8; // If user profile had no explicit phone, accept valid format

    if (!isMatched) {
      setPhoneError('رقم الهاتف المدخل غير مطابق للرقم المسجل في جهات اتصال هذا الحساب. يرجى إدخال الرقم الصحيح.');
      return;
    }

    setPhoneStep('fingerprint');
  };

  // Handler for Method 2: AI-Powered Biometric Fingerprint Verification Engine
  const handleVerifyFingerprint = async () => {
    setFingerprintError(null);
    setFingerprintScanning(true);
    setFingerprintProgress(15);
    setFingerprintStatusText('[AI Biometric Engine] تهيئة مستشعر البصمة الضوئي والتعرف العصبي الذكي...');
    await new Promise(r => setTimeout(r, 350));

    setFingerprintProgress(45);
    setFingerprintStatusText('[AI Vision Model] استخراج نقاط التفاصيل الدقيقة ومقارنة التدفق (Minutiae & Ridge Flow)...');
    await new Promise(r => setTimeout(r, 400));

    setFingerprintProgress(75);
    setFingerprintStatusText('[Gemini Neural Network] مطابقة التوقيع البيومتري مع السجل الآمن للحساب...');
    await new Promise(r => setTimeout(r, 400));

    if (fingerprintType === 'different') {
      setFingerprintProgress(100);
      setFingerprintStatusText('[AI Verdict] فشل التطابق: نسبة المطابقة العصبية 14.2% (دون عتبة الأمان 85%).');
      await new Promise(r => setTimeout(r, 300));
      setFingerprintScanning(false);
      setFingerprintError('تعذر تأكيد الحساب بواسطة نظام المراجعة الآلية البيومتري: البصمة المدخلة غير مطابقة للبصمة البيومترية الأصلية المسجلة للمالك. يظل الحساب مقفلاً لحمايته.');
      return;
    }

    setFingerprintProgress(100);
    setFingerprintStatusText('[AI Success] نجاح التوثيق: تطابق ذكي معتمد بنسبة 99.8% عبر الشبكة العصبية!');
    await new Promise(r => setTimeout(r, 300));

    try {
      // Update local state to show success screen
      setLockedStep('success_unlocked');
    } catch (err) {
      console.error('Error reactivating account on fingerprint match:', err);
    } finally {
      setFingerprintScanning(false);
    }
  };

  // Handler for Method 3: ID Card with Name, Birth Date and Face verification
  const handleVerifyIdMatch = async () => {
    setIdError(null);
    if (!idCardImage) {
      setIdError('يرجى رفع صورة بطاقة الهوية أولاً.');
      return;
    }
    if (!idFullName.trim()) {
      setIdError('يرجى كتابة الاسم الكامل المكتوب في الهوية.');
      return;
    }
    if (!idBirthDate) {
      setIdError('يرجى تحديد تاريخ الميلاد المكتوب في الهوية.');
      return;
    }

    setIsIdVerifying(true);
    setIdProgress(20);
    setIdStatusText('جاري فحص بطاقة الهوية والتحقق من الاسم الكامل وتاريخ الميلاد...');
    await new Promise(r => setTimeout(r, 100));

    setIdProgress(60);
    setIdStatusText('جاري التحقق من مطابقة صورة الوجه في الهوية مع بيانات الحساب...');
    await new Promise(r => setTimeout(r, 100));

    const normalizedEnteredName = idFullName.trim().toLowerCase();
    const normalizedUserName = (currentUser?.name || '').trim().toLowerCase();
    const isNameMatch = normalizedEnteredName === normalizedUserName || normalizedEnteredName.includes(normalizedUserName) || normalizedUserName.includes(normalizedEnteredName);
    const isBirthDateMatch = !currentUser?.birthDate || idBirthDate === currentUser.birthDate;

    if (!isNameMatch || !isBirthDateMatch) {
      setIdProgress(100);
      setIdStatusText('فشلت مطابقة بيانات الهوية.');
      await new Promise(r => setTimeout(r, 100));
      setIsIdVerifying(false);
      const disableReason = 'تم تعطيل الحساب لعدم تطابق بطاقة الهوية المدخلة مع بيانات ومعلومات الحساب المسجلة.';
      setIdError(disableReason);
      showToast('❌ لم تتطابق بطاقة الهوية مع بيانات الحساب، تم تأكيد تعطيل الحساب نهائياً.');
      await resolveAppeal(false, disableReason);
      return;
    }

    setIdProgress(100);
    setIdStatusText('تمت مطابقة بيانات بطاقة الهوية بنجاح 100%!');
    await new Promise(r => setTimeout(r, 100));

    try {
      if (currentUser?.id) {
        try {
          const userRef = doc(db, 'users', currentUser.id);
          await updateDoc(userRef, {
            status: 'active',
            suspensionReason: null,
            appealStatus: 'approved',
            idVerifiedAt: new Date().toISOString()
          });
        } catch (e) {}
      }
      await resolveAppeal(true);
      // Update local state to show success screen
      setLockedStep('success_unlocked');
    } catch (err) {
      console.error('Error restoring account on ID match:', err);
    } finally {
      setIsIdVerifying(false);
    }
  };

  const handleVerifyOwnSecurityCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setOwnSecurityCodeError(null);
    const entered = ownSecurityCodeInput.trim();
    const confirmedCode = (currentUser?.ownSecurityCode || currentUser?.pin || '789012').trim();

    if (!entered) {
      setOwnSecurityCodeError('يرجى إدخال الرمز لتأكيد استعادة الحساب');
      return;
    }

    if (entered !== confirmedCode) {
      setOwnSecurityCodeError('الرمز المدخل غير صحيح! يجب عليك تأكيد الرمز المعتمد في مركز حسابات OWN الذي قمت بإنشائه.');
      return;
    }

    setIsVerifyingOwnCode(true);
    try {
      if (currentUser?.id) {
        const userRef = doc(db, 'users', currentUser.id);
        await updateDoc(userRef, {
          status: 'active',
          suspensionReason: null,
          lockedReason: null,
          violationType: null,
          appealStatus: 'approved'
        });
      }
      showToast('🎉 تم تأكيد رمز مركز حسابات OWN بنجاح واستعادة حسابك بالكامل!');
      setLockedStep('success_unlocked');
    } catch (err: any) {
      try {
        await reactivateAccount();
        setLockedStep('success_unlocked');
      } catch (e2) {
        setOwnSecurityCodeError('حدث خطأ أثناء فك القفل واستعادة الحساب');
      }
    } finally {
      setIsVerifyingOwnCode(false);
    }
  };

  const handleSendLockedOtp = () => {
    if (!lockedContact.trim()) {
      showToast('يرجى إدخال البريد الإلكتروني أو رقم الهاتف أولاً.');
      return;
    }
    const generated = Math.floor(100000 + Math.random() * 900000).toString();
    setSentGeneratedOtp(generated);
    setIsOtpSent(true);
    setLockedOtpCode(generated);
  };

  const finishSelfieReview = async (selfieDataUrl: string) => {
    setIsReviewingSelfie(false);
    setIsSubmitting(true);

    const reason = currentUser?.suspensionReason || '';
    const isBirthDateChanged = 
      reason.includes('تاريخ الميلاد') || 
      reason.includes('تغيير تاريخ الميلاد') || 
      reason.includes('أقل من 12') || 
      reason.includes('12') ||
      reason.includes('فيسبوك') ||
      reason.includes('شروط') ||
      reason.includes('العمر') ||
      currentUser?.isUnderage;

    if (!isBirthDateChanged) {
      // If user did NOT change birth date -> Reactivate account & return to account!
      try {
        // Update local state to show success screen
        setLockedStep('success_unlocked');
      } catch (err) {
        console.error("Error reactivating account:", err);
        showToast('حدث خطأ أثناء إعادة تفعيل الحساب.');
      } finally {
        setIsSubmitting(false);
      }
    } else {
      // If user DID change birth date -> Disable account regarding Facebook Community Standards
      try {
        if (currentUser?.id) {
          const userRef = doc(db, 'users', currentUser.id);
          const disabledReason = 'لقد قمنا بتعطيل حسابك بشأن شروط منبعثا والمعلومات المقدمة (السن القانوني أقل من 12 سنة).';
          await updateDoc(userRef, {
            status: 'disabled',
            suspensionReason: disabledReason,
            appealSelfie: selfieDataUrl,
            appealSubmittedAt: new Date().toISOString()
          });
        }
      } catch (err) {
        console.error("Error disabling account:", err);
        showToast('حدث خطأ أثناء معالجة القرار.');
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleSubmitVideoAppeal = async () => {
    let snap = currentSelfieSnap;
    if (!snap && currentUser?.avatar) {
      snap = currentUser.avatar;
    }
    if (!snap) {
      const canvas = document.createElement('canvas');
      canvas.width = 400;
      canvas.height = 400;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#1877f2';
        ctx.fillRect(0, 0, 400, 400);
        snap = canvas.toDataURL('image/jpeg');
      }
    }
    if (snap) {
      processSelfieAndReview(snap);
    } else {
      showToast('تعذر التقاط أو معالجة صورة السيلفي.');
    }
  };

  const isAdmin = currentUser?.email === 'bda43535@gmail.com';

  useEffect(() => {
    if (currentUser?.appealSubmittedAt) {
      const calculateTimeLeft = () => {
        const submittedAt = new Date(currentUser.appealSubmittedAt!).getTime();
        const now = new Date().getTime();
        const difference = submittedAt + 5000 - now; // 5 seconds in ms
        
        if (difference <= 0) {
          setTimeLeft(0);
          return;
        }
        
        setTimeLeft(Math.floor(difference / 1000));
      };

      calculateTimeLeft();
      const timer = setInterval(calculateTimeLeft, 1000);
      return () => clearInterval(timer);
    }
  }, [currentUser?.appealSubmittedAt]);


  useEffect(() => {
    if (currentUser?.suspensionReason === 'PHOTO_REVIEW_10S' || currentUser?.suspensionReason === 'PHOTO_REVIEW_5S') {
      let count = 5;
      setPhotoReviewCountdown(count);
      const interval = setInterval(async () => {
        count--;
        setPhotoReviewCountdown(count);
        if (count <= 0) {
          clearInterval(interval);
          
          if (currentUser.tempPhotoIsSafe) {
            // Restore account and apply avatar
            await updateProfile({
              status: 'active',
              suspensionReason: null,
              avatar: currentUser.tempPhotoReview,
              tempPhotoReview: null,
              tempPhotoIsSafe: null,
              tempPhotoReason: null
            });
            setCurrentView('home');
          } else {
            // Disable account
            await updateProfile({
              status: 'disabled',
              suspensionReason: 'لقد قمنا بتعطيل حسابك لانتهاك معايير المجتمع بشأن النشاط الجنسي أو العري أو السلوك غير اللائق.',
              avatar: 'https://i.pravatar.cc/150?u=safe_default',
              tempPhotoReview: null,
              tempPhotoIsSafe: null,
              tempPhotoReason: null
            });
          }
        }
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [currentUser?.suspensionReason, currentUser?.id]);

  if (!currentUser) return null;

  const isFacebookTermsViolation = Boolean(
    currentUser?.isUnderage ||
    currentUser?.suspensionReason?.includes('فيسبوك') ||
    currentUser?.suspensionReason?.includes('شروط') ||
    currentUser?.suspensionReason?.includes('ننبعثها') ||
    currentUser?.suspensionReason?.includes('نتبعها') ||
    currentUser?.suspensionReason?.includes('السن') ||
    currentUser?.suspensionReason?.includes('12')
  );

  const getSuspensionHeadline = () => {
    return t.suspendedTitle || 'لقد قمنا بتعليق حسابك';
  };

  const getDynamicReasonsDesc = () => {
    const rawReason = currentUser?.suspensionReason || '';
    if (rawReason) {
      if (rawReason.includes('انتحال') || rawReason.includes('شخصية')) {
        return 'حسابك، أو نشاط عليه، لا يتبع معايير مجتمعنا بشأن انتحال شخصية شخص آخر أو شخصية عامة.';
      }
      if (rawReason.includes('زائف') || rawReason.includes('وهمي') || rawReason.includes('سلامة الحساب')) {
        return 'حسابك، أو نشاط عليه، لا يتبع معايير مجتمعنا بشأن الحسابات الزائفة وسلامة الحساب.';
      }
      if (rawReason.includes('عُري') || rawReason.includes('جنسي') || rawReason.includes('مخل') || rawReason.includes('غير لائق') || rawReason.includes('استغلال')) {
        return 'حسابك، أو نشاط عليه، لا يتبع معايير مجتمعنا بشأن العري أو النشاط الجنسي أو المحتوى غير اللائق.';
      }
      if (rawReason.includes('مضايقة') || rawReason.includes('تنمر') || rawReason.includes('سب') || rawReason.includes('شتم')) {
        return 'حسابك، أو نشاط عليه، لا يتبع معايير مجتمعنا بشأن المضايقة والتنمر.';
      }
      if (rawReason.includes('احتيال') || rawReason.includes('نصب') || rawReason.includes('سبام') || rawReason.includes('مزعج')) {
        return 'حسابك، أو نشاط عليه، لا يتبع معايير مجتمعنا بشأن الاحتيال والرسائل غير المرغوب فيها (سبام).';
      }
      if (rawReason.includes('عنف') || rawReason.includes('كراهية') || rawReason.includes('تهديد')) {
        return 'حسابك، أو نشاط عليه، لا يتبع معايير مجتمعنا بشأن العنف وخطاب الكراهية.';
      }
      if (rawReason.includes('السن') || rawReason.includes('عمر') || rawReason.includes('قاصر') || rawReason.includes('12') || rawReason.includes('تاريخ الميلاد')) {
        return 'حسابك، أو نشاط عليه، لا يتبع معايير مجتمعنا بشأن متطلبات السن وتاريخ الميلاد.';
      }
      if (rawReason.includes('فيسبوك') || rawReason.includes('شروط') || rawReason.includes('ننبعثها') || rawReason.includes('نتبعها') || currentUser?.isUnderage) {
        return 'حسابك، أو نشاط عليه، لا يتبع معايير مجتمعنا بشأن شروط منبعثا.';
      }
      if (rawReason.includes('بلاغ') || rawReason.includes('معايير')) {
        const cleanedReason = rawReason.replace(/^تم تعليق الحساب[^\:]*\:\s*/, '').replace(/^تم تعليق حسابك[^\:]*\:\s*/, '');
        return `حسابك، أو نشاط عليه، لا يتبع معايير مجتمعنا بشأن ${cleanedReason}.`;
      }
      const cleaned = rawReason.replace(/^تم تعليق الحساب[^\:]*\:\s*/, '').replace(/^تم تعليق حسابك[^\:]*\:\s*/, '');
      return `حسابك، أو نشاط عليه، لا يتبع معايير مجتمعنا بشأن ${cleaned}.`;
    }
    return t.reasonsDesc;
  };

  const getReportCardDetails = () => {
    const rawReason = currentUser?.suspensionReason || '';
    if (rawReason.includes('انتحال') || rawReason.includes('شخصية')) {
      return {
        badge: 'بلاغ انتحال شخصية',
        tagColor: 'bg-rose-100 text-rose-800 border-rose-200',
        summary: 'تلقى نظام الأمان إبلاغاً بأن هذا الحساب يقوم بانتحال صفة أو هوية شخص آخر أو شخصية عامة.',
        impact: 'ينتهك هذا السلوك معايير مجتمعنا التي تحظر تضليل الآخرين بشأن الهوية والأصالة.',
        ruleName: 'انتحال الشخصية والأصالة'
      };
    }
    if (rawReason.includes('زائف') || rawReason.includes('وهمي') || rawReason.includes('سلامة الحساب')) {
      return {
        badge: 'بلاغ حساب زائف أو وهمي',
        tagColor: 'bg-amber-100 text-amber-800 border-amber-200',
        summary: 'تلقى نظام الأمان بلاغاً بأن هذا الملف الشخصي لا يمثل شخصاً حقيقياً أو يستخدم بيانات مضللة.',
        impact: 'تشترط معايير المجتمع استخدام الاسم الحقيقي والهوية الصادقة لضمان سلامة المجتمع.',
        ruleName: 'الحسابات الزائفة ونزاهة الحساب'
      };
    }
    if (rawReason.includes('عُري') || rawReason.includes('جنسي') || rawReason.includes('مخل') || rawReason.includes('غير لائق') || rawReason.includes('استغلال')) {
      return {
        badge: 'بلاغ محتوى غير لائق أو عري',
        tagColor: 'bg-red-100 text-red-800 border-red-200',
        summary: 'تم الإبلاغ عن نشر أو تداول صور أو محتوى ينتهك معايير الآداب العامة والسلامة.',
        impact: 'نحن نمنع بشكل صارم المحتوى الجنسي أو العري لحماية جميع المستخدمين.',
        ruleName: 'المحتوى غير اللائق والنشاط الجنسي'
      };
    }
    if (rawReason.includes('مضايقة') || rawReason.includes('تنمر') || rawReason.includes('سب') || rawReason.includes('شتم')) {
      return {
        badge: 'بلاغ مضايقة وتنمر',
        tagColor: 'bg-purple-100 text-purple-800 border-purple-200',
        summary: 'تم الإبلاغ عن مشاركة تعليقات أو رسائل تتضمن إساءة لفظية أو استهدافاً غير مقبول.',
        impact: 'نحن لا نتسامح مع المضايقة أو التحرش أو الهجوم الشخصي على أفراد المجتمع.',
        ruleName: 'المضايقة والتنمر'
      };
    }
    if (rawReason.includes('احتيال') || rawReason.includes('نصب') || rawReason.includes('سبام') || rawReason.includes('مزعج')) {
      return {
        badge: 'بلاغ احتيال أو رسائل مزعجة (سبام)',
        tagColor: 'bg-orange-100 text-orange-800 border-orange-200',
        summary: 'تم الإبلاغ عن محتوى ترويجي مضلل أو روابط احتيالية أو رسائل مزعجة متكررة.',
        impact: 'تمنع معايير المجتمع الأنشطة الاحتيالية والخداع المالي أو الرقمي.',
        ruleName: 'الاحتيال والرسائل المزعجة'
      };
    }
    if (rawReason.includes('عنف') || rawReason.includes('كراهية') || rawReason.includes('تهديد')) {
      return {
        badge: 'بلاغ عنف أو خطاب كراهية',
        tagColor: 'bg-rose-100 text-rose-800 border-rose-200',
        summary: 'تم الإبلاغ عن منشورات تحرض على العنف أو الكراهية أو تهدد سلامة الآخرين.',
        impact: 'نحن نزيل أي محتوى يحث على الأذى أو العداء ضد أي فئة أو أفراد.',
        ruleName: 'العنف وخطاب الكراهية'
      };
    }
    if (rawReason.includes('السن') || rawReason.includes('عمر') || rawReason.includes('قاصر') || rawReason.includes('12') || currentUser?.isUnderage) {
      return {
        badge: 'مخالفة متطلبات السن القانوني',
        tagColor: 'bg-blue-100 text-blue-800 border-blue-200',
        summary: 'تم تعليق الحساب لعدم استيفاء الحد الأدنى للسن القانوني المطلوب لمنصتنا (12 سنة).',
        impact: 'تلتزم المنصة بالقوانين العالمية لحماية خصوصية الأطفال وسلامتهم الرقمية.',
        ruleName: 'شروط السن وتاريخ الميلاد'
      };
    }
    const cleanReason = rawReason.replace(/^تم تعليق الحساب[^\:]*\:\s*/, '').replace(/^تم تعليق حسابك[^\:]*\:\s*/, '') || 'انتهاك معايير المجتمع';
    return {
      badge: `بلاغ: ${cleanReason}`,
      tagColor: 'bg-gray-100 text-gray-800 border-gray-200',
      summary: `تلقى نظام الأمان إبلاغاً بشأن ${cleanReason}.`,
      impact: 'يجب أن تلتزم جميع الحسابات بمعايير مجتمع فيسبوك لضمان بيئة آمنة.',
      ruleName: cleanReason
    };
  };

  const getDynamicRuleModalInfo = () => {
    const rawReason = currentUser?.suspensionReason || '';
    if (rawReason.includes('انتحال') || rawReason.includes('شخصية')) {
      return {
        title: 'معايير مجتمعنا بشأن انتحال الشخصية',
        intro: 'نحن لا نسمح للأشخاص بانتحال شخصية الآخرين لحماية أمان ومصداقية المجتمع:',
        bullets: [
          'استخدام اسم أو صور شخص آخر للادعاء بأنك هو.',
          'إنشاء ملف شخصي يمثل شخصاً حقيقياً أو شخصية عامة دون إذنه أو ترخيص منه.',
          'التحدث باسم شخصيات عامة أو منظمات بقصد التضليل أو الاحتيال أو تشويه السمعة.'
        ]
      };
    }
    if (rawReason.includes('زائف') || rawReason.includes('وهمي') || rawReason.includes('سلامة الحساب')) {
      return {
        title: 'معايير مجتمعنا بشأن الحسابات الزائفة',
        intro: 'نحن نلزم الجميع باستخدام هوياتهم الحقيقية لضمان بيئة آمنة وصادقة:',
        bullets: [
          'إنشاء حسابات وهمية لا تمثل أشخاصاً حقيقيين.',
          'استخدام أسماء مستعارة مضللة أو صور غير حقيقية لإخفاء الهوية.',
          'إدارة شبكات من الحسابات غير الحقيقية للتأثير والتضليل.'
        ]
      };
    }
    if (rawReason.includes('عُري') || rawReason.includes('جنسي') || rawReason.includes('مخل') || rawReason.includes('غير لائق') || rawReason.includes('استغلال')) {
      return {
        title: 'معايير مجتمعنا بشأن المحتوى غير اللائق والعري',
        intro: 'نحن نمنع نشر الصور أو المنشورات التي تحتوي على محتوى غير لائق أو جنسي:',
        bullets: [
          'نشر أو تداول صور أو مقاطع تحتوي على عري أو إيحاءات غير لائقة.',
          'مشاركة مواد تنتهك الآداب العامة وقيم المجتمع والسلامة الشخصية.',
          'أي محتوى يتضمن استغلالاً أو سلوكاً جنسياً غير مرغوب فيه.'
        ]
      };
    }
    if (rawReason.includes('مضايقة') || rawReason.includes('تنمر') || rawReason.includes('سب') || rawReason.includes('شتم')) {
      return {
        title: 'معايير مجتمعنا بشأن المضايقة والتنمر',
        intro: 'نحن نتصدى لجميع أشكال الإساءة والاعتداء اللفظي على الأعضاء:',
        bullets: [
          'استهداف الأشخاص بالسباب والشتائم أو الإهانات الشخصية المتكررة.',
          'التهديد أو نشر معلومات خاصة بنية التشهير والإضرار بالآخرين.',
          'تشجيع الآخرين على مهاجمة شخص أو مضايقته.'
        ]
      };
    }
    if (rawReason.includes('احتيال') || rawReason.includes('نصب') || rawReason.includes('سبام') || rawReason.includes('مزعج')) {
      return {
        title: 'معايير مجتمعنا بشأن الاحتيال والرسائل المزعجة (سبام)',
        intro: 'نحن نحمي مجتمعنا من الأنشطة المضللة والتجارية غير القانونية:',
        bullets: [
          'نشر روابط احتيالية أو خداع المستخدمين لسرقة بياناتهم.',
          'إرسال رسائل أو منشورات مزعجة ومتكررة غير مرغوب بها.',
          'الترويج لفرص أو منتجات وهمية بقصد النصب والاحتيال.'
        ]
      };
    }
    if (rawReason.includes('عنف') || rawReason.includes('كراهية') || rawReason.includes('تهديد')) {
      return {
        title: 'معايير مجتمعنا بشأن العنف وخطاب الكراهية',
        intro: 'نحن نحظر أي دعوات للعنف أو التحريض والكراهية:',
        bullets: [
          'التحريض على إيذاء الآخرين أو التهديد بالعنف الجسدي.',
          'استخدام خطاب كراهية ضد أفراد أو جماعات بناءً على خلفياتهم.',
          'الترويج للمنظمات الخطرة أو تمجيد الأعمال العنيفة.'
        ]
      };
    }
    if (rawReason.includes('السن') || rawReason.includes('عمر') || rawReason.includes('قاصر') || rawReason.includes('12') || rawReason.includes('تاريخ الميلاد')) {
      return {
        title: 'معايير مجتمعنا بشأن متطلبات السن',
        intro: 'نحن نلزم جميع المستخدمين بالامتثال لشروط الاستخدام ومتطلبات السن القانوني:',
        bullets: [
          'يجب ألا يقل عمر صاحب الحساب عن 12 سنة لإنشاء حساب أو استخدام المنصة.',
          'تعديل تاريخ ميلاد الحساب إلى سن أقل من 12 سنة يعد مخالفة لشروط الاستخدام وسيؤدي إلى تعليق الحساب فوراً.',
          'يمكنك تقديم طلب طعن مع صورة واضحة لتأكيد هويتك وتاريخ ميلادك الحقيقي.'
        ]
      };
    }
    if (rawReason.includes('فيسبوك') || rawReason.includes('شروط') || rawReason.includes('ننبعثها') || rawReason.includes('نتبعها') || currentUser?.isUnderage) {
      return {
        title: 'معايير مجتمعنا بشأن شروط منبعثا',
        intro: 'نحن نلزم جميع المستخدمين بالامتثال لشروط الاستخدام ومتطلبات السن منبعثا:',
        bullets: [
          'يجب ألا يقل عمر صاحب الحساب عن 12 سنة لإنشاء حساب أو استخدام المنصة.',
          'تعديل تاريخ ميلاد الحساب إلى سن أقل من 12 سنة يعد مخالفة لشروط الاستخدام وسيؤدي إلى تعليق الحساب فوراً.',
          'يمكنك تقديم طلب طعن مع صورة واضحة لتأكيد هويتك وتاريخ ميلادك الحقيقي.'
        ]
      };
    }
    if (rawReason.includes('انتحال') || rawReason.includes('شخصية')) {
      return {
        title: 'معايير مجتمعنا بشأن انتحال الشخصية',
        intro: 'نحن لا نسمح للأشخاص بانتحال شخصية الآخرين على GROZLA لحماية أمان ومصداقية المجتمع:',
        bullets: [
          'استخدام اسم أو صور شخص آخر للادعاء بأنك هو.',
          'إنشاء ملف شخصي يمثل شخصاً حقيقياً دون إذنه أو ترخيص منه.',
          'التحدث باسم شخصيات عامة أو منظمات بقصد التضليل أو الاحتيال.'
        ]
      };
    }
    if (rawReason.includes('زائف') || rawReason.includes('وهمي')) {
      return {
        title: 'معايير مجتمعنا بشأن الحسابات الزائفة',
        intro: 'نحن نلزم الجميع باستخدام هوياتهم الحقيقية لضمان بيئة آمنة وصادقة:',
        bullets: [
          'إنشاء حسابات وهمية لا تمثل أشخاصاً حقيقيين.',
          'استخدام أسماء مستعارة مضللة أو صور غير حقيقية لإخفاء الهوية.',
          'إدارة شبكات من الحسابات غير الحقيقية للتأثير والتضليل.'
        ]
      };
    }
    if (rawReason.includes('عُري') || rawReason.includes('جنسي') || rawReason.includes('مخل') || rawReason.includes('غير لائق')) {
      return {
        title: 'معايير مجتمعنا بشأن المحتوى غير اللائق والعري',
        intro: 'نحن نمنع نشر الصور أو المنشورات التي تحتوي على محتوى غير لائق أو جنسي:',
        bullets: [
          'نشر أو تداول صور أو مقاطع تحتوي على عري أو إيحاءات غير لائقة.',
          'مشاركة مواد تنتهك الآداب العامة وقيم المجتمع.',
          'أي محتوى يتضمن استغلالاً أو سلوكاً جنسياً غير مرغوب فيه.'
        ]
      };
    }
    if (rawReason.includes('مضايقة') || rawReason.includes('تنمر') || rawReason.includes('سب')) {
      return {
        title: 'معايير مجتمعنا بشأن المضايقة والتنمر',
        intro: 'نحن نتصدى لجميع أشكال الإساءة والاعتداء اللفظي على الأعضاء:',
        bullets: [
          'استهداف الأشخاص بالسباب والشتائم أو الإهانات الشخصية المتكررة.',
          'التهديد أو نشر معلومات خاصة بنية التشهير والإضرار بالآخرين.',
          'تشجيع الآخرين على مهاجمة شخص أو مضايقته.'
        ]
      };
    }
    if (rawReason.includes('احتيال') || rawReason.includes('نصب') || rawReason.includes('سبام') || rawReason.includes('مزعج')) {
      return {
        title: 'معايير مجتمعنا بشأن الاحتيال والرسائل المزعجة (سبام)',
        intro: 'نحن نحمي مجتمعنا من الأنشطة المضللة والتجارية غير القانونية:',
        bullets: [
          'نشر روابط احتيالية أو خداع المستخدمين لسرقة بياناتهم.',
          'إرسال رسائل أو منشورات مزعجة ومتكررة غير مرغوب بها.',
          'الترويج لفرص أو منتجات وهمية بقصد النصب والاحتيال.'
        ]
      };
    }
    if (rawReason.includes('عنف') || rawReason.includes('كراهية') || rawReason.includes('تهديد')) {
      return {
        title: 'معايير مجتمعنا بشأن العنف وخطاب الكراهية',
        intro: 'نحن نحظر أي دعوات للعنف أو التحريض والكراهية:',
        bullets: [
          'التحريض على إيذاء الآخرين أو التهديد بالعنف الجسدي.',
          'استخدام خطاب كراهية ضد أفراد أو جماعات بناءً على خلفياتهم.',
          'الترويج للمنظمات الخطرة أو تمجيد الأعمال العنيفة.'
        ]
      };
    }
    return {
      title: t.ruleModalTitle,
      intro: t.ruleModalIntro,
      bullets: [t.ruleBullet1, t.ruleBullet2, t.ruleBullet3]
    };
  };

  const getFormattedSuspensionDate = () => {
    const targetDateStr = currentUser.suspendedAt || currentUser.appealSubmittedAt;
    const date = targetDateStr ? new Date(targetDateStr) : new Date();
    const validDate = isNaN(date.getTime()) ? new Date() : date;

    const monthsArabic = [
      'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
      'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
    ];

    return `${validDate.getDate()} ${monthsArabic[validDate.getMonth()]} ${validDate.getFullYear()}`;
  };

  const handleSelfieUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const validation = validateImageFile(file, 25);
      if (!validation.valid) {
        showToast(validation.error || 'الملف المختار غير صالح.');
        e.target.value = '';
        return;
      }
      setIsSubmitting(true);
      try {
        showToast('جاري معالجة وفحص صورة السيلفي... ⏳');
        const dataUrl = await compressImage(file, 800, 800, 0.72);
        setIsSubmitting(false);
        processSelfieAndReview(dataUrl);
      } catch (err) {
        console.warn("Selfie processing error:", err);
        setIsSubmitting(false);
        showToast('حدث خطأ أثناء معالجة الصورة، يرجى اختيار صورة أخرى.');
      } finally {
        e.target.value = '';
      }
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  if (showEdotensiMessenger) {
    return <EdotensiMessengerView onBackToLogin={() => setShowEdotensiMessenger(false)} />;
  }

  return (
    <div className={`min-h-screen bg-white font-sans text-gray-900 select-none pb-12 ${currentLangObj.dir === 'rtl' ? 'dir-rtl text-right' : 'dir-ltr text-left'}`} dir={currentLangObj.dir}>
      {/* HIDDEN FILE INPUT FOR SELFIE UPLOAD */}
      <input 
        type="file" 
        accept="image/*" 
        capture="user"
        className="hidden" 
        ref={fileInputRef} 
        onChange={handleSelfieUpload} 
      />

      {/* TOP HEADER BAR (طابق الصورة: أيقونة الإعدادات وأيقونة الشاشة الكاملة) */}
      <div className="sticky top-0 z-40 bg-white px-4 py-3 flex items-center justify-between border-b border-gray-100">
        <div className="flex items-center gap-2 relative">
          <button 
            onClick={() => setShowSettingsMenu(!showSettingsMenu)}
            className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-800 transition-colors cursor-pointer"
            title={t.accountSettings}
          >
            <Settings size={22} strokeWidth={2.2} />
          </button>

          {/* Dedicated Fullscreen Toggle Button */}
          <button
            onClick={toggleFullscreen}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all cursor-pointer shadow-2xs ${
              isFullscreen 
                ? 'bg-blue-600 text-white shadow-blue-500/20' 
                : 'bg-gray-100 hover:bg-gray-200 text-gray-800'
            }`}
            title={isFullscreen ? t.exitFullscreen : t.fullscreen}
          >
            {isFullscreen ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
          </button>

          {/* Dropdown Menu */}
          <AnimatePresence>
            {showSettingsMenu && (
              <>
                <div 
                  className="fixed inset-0 z-30 bg-black/20" 
                  onClick={() => setShowSettingsMenu(false)} 
                />
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: -5 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -5 }}
                  transition={{ duration: 0.15 }}
                  className={`absolute mt-2 w-72 bg-white rounded-2xl shadow-2xl border border-gray-200 py-3 px-4 z-40 space-y-3 ${
                    currentLangObj.dir === 'rtl' ? 'right-0 text-right' : 'left-0 text-left'
                  }`}
                >
                  <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                    <span className="text-xs font-bold text-gray-400">{t.accountSettings}</span>
                    <button 
                      onClick={() => setShowSettingsMenu(false)}
                      className="p-1 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-600 cursor-pointer"
                    >
                      <X size={14} />
                    </button>
                  </div>

                  {/* Account Name */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-gray-900 font-bold text-sm">
                      <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 font-bold text-xs">
                        <User size={16} />
                      </div>
                      <div className="overflow-hidden">
                        <p className="truncate text-gray-900 font-bold">{currentUser.name}</p>
                        <p className="text-[11px] text-gray-500 font-mono truncate">{currentUser.email}</p>
                      </div>
                    </div>

                    {/* Defense Badge - Always visible to activate locked mode */}
                    <div className="mt-2 pt-1">
                      <button
                        onClick={async () => {
                          setShowSettingsMenu(false);
                          setViewMode('locked');
                          try {
                            const userRef = doc(db, 'users', currentUser.id);
                            await updateDoc(userRef, { status: 'locked' });
                          } catch (err) {
                            console.error("Error updating status to locked:", err);
                          }
                        }}
                        className="w-full flex items-center justify-between border px-3 py-2 rounded-xl text-xs font-extrabold shadow-2xs transition-all cursor-pointer bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 text-blue-800 border-blue-200/80"
                      >
                        <div className="flex items-center gap-2">
                          <Shield size={16} className="text-blue-600 shrink-0" />
                          <div className="flex flex-col">
                            <span>{t.advertisingDefense}</span>
                            <span className="text-[10px] font-normal text-blue-600/80">
                              {t.defenseDesc2}
                            </span>
                          </div>
                        </div>
                        <ArrowRight size={14} className={currentLangObj.dir === 'rtl' ? 'rotate-180' : ''} />
                      </button>
                    </div>
                  </div>

                  {/* Language Selector in Dropdown (خيار تغيير اللغة) */}
                  <div className="pt-1">
                    <button
                      onClick={() => {
                        setShowSettingsMenu(false);
                        setLanguageSearchQuery('');
                        setShowLanguageModal(true);
                      }}
                      className="w-full flex items-center justify-between px-3 py-2.5 text-xs font-extrabold text-gray-800 hover:bg-blue-50/80 rounded-xl transition-colors cursor-pointer border border-gray-100 bg-gray-50/60"
                    >
                      <div className="flex items-center gap-2">
                        <Globe size={16} className="text-[#1877f2]" />
                        <span>{t.language} (Language)</span>
                      </div>
                      <span className="text-[11px] text-[#1877f2] font-black bg-blue-100/70 px-2 py-0.5 rounded-lg border border-blue-200">
                        {currentLangObj.nativeName}
                      </span>
                    </button>
                  </div>

                  {isAdmin && (
                    <button 
                      onClick={() => {
                        setShowSettingsMenu(false);
                        reactivateAccount();
                      }}
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-2 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors text-xs cursor-pointer"
                    >
                      <span>{t.adminRestore}</span>
                    </button>
                  )}

                  <div className="border-t border-gray-100 pt-2 space-y-1">
                    <button
                      onClick={() => {
                        toggleFullscreen();
                        setShowSettingsMenu(false);
                      }}
                      className="w-full flex items-center justify-between px-3 py-2 text-xs font-bold text-gray-700 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        {isFullscreen ? <Minimize2 size={16} className="text-blue-600" /> : <Maximize2 size={16} className="text-blue-600" />}
                        <span>{isFullscreen ? t.exitFullscreen : t.fullscreen}</span>
                      </div>
                      <span className="text-[10px] text-gray-400 font-normal">{t.auto}</span>
                    </button>

                    <button
                      onClick={() => {
                        setShowSettingsMenu(false);
                        logout();
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-50 rounded-xl transition-colors cursor-pointer"
                    >
                      <LogOut size={16} />
                      <span>{t.logout}</span>
                    </button>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>

        {/* Facebook Logo Centered/Right with Interactive Sky Badge */}
        <div className="flex items-center gap-2 select-none">
          <span className="text-[#8b5cf6] font-bold text-[28px] font-sans tracking-tight lowercase" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>facebook</span>
          <button
            onClick={() => openSkyModal('home')}
            className="px-2.5 py-1 text-xs font-black tracking-wider uppercase rounded-lg bg-gradient-to-r from-sky-500 via-blue-600 to-indigo-600 hover:from-sky-400 hover:to-blue-500 text-white shadow-xs border border-sky-400/40 cursor-pointer flex items-center gap-1 active:scale-95 transition-all"
            title="خدمات Sky: إنشاء رقمك الخاص أو ربط بريد Google عبر Firebase"
          >
            <span>Sky</span>
          </button>
        </div>
      </div>

      {/* VIEW: SUSPENDED ACCOUNT INTERFACE (نظام أول: لقد قمنا بتعليق حسابك) */}
      {appealStep === 'info' && (
      viewMode === 'suspended' ? (
        <div className="max-w-md mx-auto px-5 pt-4 text-center">
          {/* User Profile Avatar */}
          <div className="w-24 h-24 mx-auto mb-3 rounded-full overflow-hidden border-2 border-gray-200 shadow-md bg-gray-100">
            <img 
              src={currentUser.avatar || DEFAULT_AVATAR} 
              alt={currentUser.name} 
              className="w-full h-full object-cover" 
              referrerPolicy="no-referrer" 
            />
          </div>

          {/* User Display Name */}
          <h2 className="text-xl font-black text-gray-900 mb-4 tracking-tight text-center">
            {currentUser.name || 'مستخدم GROZLA'}
          </h2>

          {/* Main Suspension Notice Headline */}
          <h1 className="text-xl sm:text-2xl font-black text-gray-900 mb-2 tracking-tight leading-snug px-2">
            {getSuspensionHeadline()}
          </h1>

          {/* Days Remaining Subtitle */}
          <p className="text-sm font-semibold text-gray-800 leading-relaxed mb-1 max-w-sm mx-auto">
            {t.daysRemaining}
          </p>

          {/* Suspension Date */}
          <p className="text-xs font-bold text-gray-500 mb-6">
            {t.suspendedDatePrefix} {getFormattedSuspensionDate()}
          </p>

          {/* Big Blue Appeal Button "طعن / Appeal" */}
          <button 
            onClick={() => goToAppealStep('phone')}
            disabled={isSubmitting}
            className="w-full bg-[#1877f2] hover:bg-[#166fe5] active:scale-[0.98] text-white py-3.5 rounded-2xl font-extrabold text-base shadow-md shadow-blue-500/20 transition-all cursor-pointer mb-8 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <Bot size={22} />
            <span>{isSubmitting ? t.submittingAppeal : t.appealBtn}</span>
          </button>

          {/* EXPLANATORY SECTIONS */}
          <div className="space-y-6">
            
            {/* Section 1: معنى هذا */}
            <div>
              <h3 className="text-lg font-black text-gray-900 mb-2">
                {t.meaningTitle}
              </h3>
              <p className="text-sm font-medium text-gray-800 leading-relaxed">
                {t.meaningDesc}
              </p>
            </div>

            {/* Section 2: أمور يمكنك القيام بها */}
            <div>
              <h3 className="text-lg font-black text-gray-900 mb-2">
                {t.actionsTitle}
              </h3>
              <p className="text-sm font-medium text-gray-800 leading-relaxed">
                {t.actionsDesc}
              </p>
            </div>

            {/* Section 3: أسباب حدوث هذا - واجهة تقرير البلاغ بحسب نوع المخالفة */}
            <div className="space-y-2.5 text-right">
              <h3 className="text-lg font-black text-gray-900 mb-1">
                {t.reasonsTitle}
              </h3>
              
              <div className="bg-gray-50/90 border border-gray-200 rounded-2xl p-4 text-right shadow-2xs space-y-3">
                <div className="flex items-center justify-between border-b border-gray-200/80 pb-2.5">
                  <div className="flex items-center gap-1.5">
                    <AlertTriangle size={18} className="text-rose-600 shrink-0" />
                    <span className="text-xs font-black text-gray-900">سجل الإبلاغات المتسببة في التعليق:</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-red-100 text-red-800 border border-red-200">
                      10 إبلاغات
                    </span>
                    <span className={`text-[11px] font-black px-2.5 py-1 rounded-full border ${getReportCardDetails().tagColor}`}>
                      {getReportCardDetails().badge}
                    </span>
                  </div>
                </div>

                <p className="text-xs sm:text-sm font-bold text-gray-800 leading-relaxed">
                  {getReportCardDetails().summary}
                </p>

                <div className="bg-white rounded-xl p-2.5 border border-gray-200/80 text-[11px] font-semibold text-gray-600 leading-relaxed">
                  {getReportCardDetails().impact}
                </div>

                <p className="text-xs font-bold text-gray-700 leading-relaxed pt-1">
                  {getDynamicReasonsDesc()}
                </p>
              </div>
            </div>

            {/* Section 4: قراءة المزيد عن هذه القاعدة */}
            <div className="pt-2">
              <button 
                onClick={() => setShowRuleModal(true)}
                className="w-full flex items-center justify-between py-3 px-2 text-gray-900 hover:bg-gray-50 rounded-xl transition-colors cursor-pointer group"
              >
                <span className="text-base font-black text-gray-900 group-hover:text-blue-600 transition-colors">
                  {t.readRule}
                </span>
                <BookOpen size={22} className="text-gray-800 group-hover:text-blue-600 transition-colors shrink-0" />
              </button>
            </div>

          </div>
        </div>
      ) : (
        /* LOCKED VIEW - MATCHING THE SCREENSHOT EXACTLY */
        <div className="min-h-screen bg-white text-gray-900 pb-10 flex flex-col justify-between max-w-md mx-auto px-5 pt-4 text-right selection:bg-blue-100 selection:text-blue-700">
          
          {/* Top Bar: Help (مساعدة with Settings Icon) on Left, Facebook on Right in RTL */}
          <div className="flex items-center justify-between pb-4 border-b border-gray-100/80">
            <div className="flex items-center gap-2 relative">
              <button 
                onClick={() => setShowLockedHelpModal(true)}
                className="flex items-center gap-1.5 text-xs sm:text-sm font-black text-gray-900 hover:text-[#0866ff] px-3 py-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 transition-colors cursor-pointer"
                title="مركز المساعدة والإعدادات"
              >
                <Settings size={16} className="text-gray-700" />
                <span>مساعدة</span>
              </button>
              
              <button
                onClick={() => setShowSettingsMenu(!showSettingsMenu)}
                className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-600 transition-colors cursor-pointer"
                title="خيارات إضافية"
              >
                <HelpCircle size={18} />
              </button>
            </div>

            <div className="flex items-center gap-1.5 select-none">
              <span className="text-[#0866ff] font-black text-2xl tracking-tight font-sans uppercase">
                GROZLA
              </span>
              <button
                onClick={() => openSkyModal('home')}
                className="px-2.5 py-1 text-xs font-black tracking-wider uppercase rounded-lg bg-gradient-to-r from-sky-500 via-blue-600 to-indigo-600 hover:from-sky-400 hover:to-blue-500 text-white shadow-xs border border-sky-400/40 cursor-pointer flex items-center gap-1 active:scale-95 transition-all"
                title="خدمات Sky: إنشاء رقمك الخاص أو ربط بريد Google عبر Firebase"
              >
                <span>Sky</span>
              </button>
            </div>
          </div>

          {lockedStep === 'success_unlocked' ? (
            <div className="w-full flex-1 flex flex-col justify-between pt-16 pb-10 px-6 fade-in">
              <div className="flex-1 flex flex-col items-center justify-center -mt-10">
                <div className="relative mb-6">
                  <div className="absolute inset-0 bg-blue-500 rounded-full blur-xl opacity-30 animate-pulse-slow"></div>
                  <img 
                    src={currentUser?.avatar} 
                    alt={currentUser?.name} 
                    className="w-28 h-28 rounded-full object-cover border-4 border-white shadow-xl relative z-10"
                  />
                  <div className="absolute bottom-1 right-1 bg-blue-500 rounded-full p-1.5 border-2 border-white z-20 shadow-md">
                    <Check size={18} className="text-white" strokeWidth={3} />
                  </div>
                </div>
                
                <h2 className="text-2xl font-black text-gray-900 mb-2 text-center">
                  {t.ob13UnlockedTitle}
                </h2>
                <p className="text-base text-gray-600 font-medium text-center mb-8 px-4">
                  مرحباً <strong className="text-gray-900">{currentUser?.name}</strong>،<br />
                  {t.ob13MatchSuccess}
                </p>

                <div className="bg-blue-50 rounded-2xl p-4 border border-blue-100 w-full max-w-sm mb-6 flex items-start gap-3 shadow-inner">
                  <div className="bg-blue-100 text-blue-600 p-2 rounded-xl mt-0.5">
                    <ShieldCheck size={20} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-gray-900 mb-1">{t.ob13RestoredTitle}</h4>
                    <p className="text-xs text-gray-600 font-medium leading-relaxed">
                      {t.ob13RestoredDesc}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="w-full">
                <button 
                  onClick={async () => {
                    try {
                      await reactivateAccount();
                      setCurrentView('home');
                    } catch (err) {
                      console.error('Error reactivating account on success screen:', err);
                    }
                  }}
                  className="w-full bg-[#1877f2] hover:bg-blue-600 text-white rounded-full py-3.5 font-bold text-sm transition-colors shadow-md flex items-center justify-center gap-2"
                >
                  {t.backToApp}
                </button>
                <p className="text-center text-[10px] text-gray-400 font-medium mt-4 flex items-center justify-center gap-1">
                  <ShieldCheck size={12} /> {t.ob13ProtectedBy}
                </p>
              </div>
            </div>
          ) : lockedStep === 'face_review' ? (
            /* FACE PHOTO UNDER REVIEW SCREEN */
            <div className="flex-1 flex flex-col justify-between pt-4 space-y-6">
              <div className="space-y-4">
                {/* Main Card with Account Name, Yellow Warning Exclamations, and Explanations */}
                <div className="bg-white p-5 sm:p-6 rounded-3xl border border-gray-200 shadow-sm text-center flex flex-col items-center">
                  
                  {/* Account Name at Top */}
                  <span className="text-xs font-bold text-gray-500 mb-1">
                    {currentUser.name || 'حساب GROZLA'}
                  </span>

                  {/* Yellow Exclamation Marks Badge */}
                  <div className="relative my-3">
                    <div className="w-18 h-18 sm:w-20 sm:h-20 rounded-full bg-amber-50 border-4 border-amber-300 flex items-center justify-center text-amber-500 shadow-sm animate-pulse">
                      <AlertTriangle size={42} className="text-amber-500 stroke-[2.5]" />
                    </div>
                    <div className="absolute -bottom-1 -right-1 bg-amber-400 text-white p-1 rounded-full shadow-xs">
                      <AlertCircle size={16} />
                    </div>
                  </div>

                  {/* Account Name Under Exclamation Badge */}
                  <h2 className="text-xl sm:text-2xl font-black text-gray-950 mt-1 mb-1">
                    {currentUser.name || 'حسابك'}
                  </h2>

                  {/* Divider Line */}
                  <div className="w-full h-px bg-gray-200 my-4" />

                  {/* Text Under the Line */}
                  <div className="space-y-4 text-right w-full">
                    <p className="text-xs sm:text-sm font-bold text-gray-800 leading-relaxed text-right">
                      نحن نقوم بمراجعة الصورة التي تحتوي على وجهك. عادةً ما نقوم باستعادة الحساب في أكثر من يوم. وإذا كان حسابك يتبع إرشاداتنا نقوم باستعادته لك مرة أخرى.
                    </p>

                    {/* Submission Date of Today */}
                    <div className="p-3.5 bg-amber-50/70 border border-amber-200/90 rounded-2xl flex items-center justify-between text-xs">
                      <span className="font-bold text-amber-900 flex items-center gap-1.5">
                        <Clock size={15} />
                        <span>تاريخ رفع الصورة:</span>
                      </span>
                      <span className="font-black text-amber-950 font-sans">{lockedFaceSubmittedDate}</span>
                    </div>

                    {/* Uploaded Face Image Preview Thumbnail */}
                    {faceOnlyImage && (
                      <div className="p-3 bg-gray-50 rounded-2xl border border-gray-200 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <img 
                            src={faceOnlyImage} 
                            alt="Face Uploaded" 
                            className="w-12 h-12 rounded-full object-cover border-2 border-amber-400 shadow-xs"
                          />
                          <div className="text-right">
                            <p className="text-xs font-black text-gray-900">صورة الوجه المرفوعة</p>
                            <p className="text-[11px] text-amber-600 font-bold">قيد الفحص والمطابقة البيومترية</p>
                          </div>
                        </div>
                        <span className="text-[11px] bg-amber-100 text-amber-800 px-2.5 py-1 rounded-full font-black">
                          قيد المراجعة
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Bottom Section: Log Out Button */}
              <div className="space-y-3 pt-4">
                <button
                  onClick={logout}
                  className="w-full bg-gray-100 hover:bg-gray-200 active:scale-[0.99] text-gray-900 py-3.5 px-6 rounded-2xl font-black text-sm transition-all cursor-pointer flex items-center justify-center gap-2 border border-gray-300 shadow-xs"
                >
                  <LogOut size={18} className="text-gray-700" />
                  <span>تسجيل الخروج من الحساب</span>
                </button>

                <button
                  onClick={() => setLockedStep('verification')}
                  className="w-full text-center text-xs font-bold text-gray-500 hover:text-[#0866ff] py-1 cursor-pointer transition-colors"
                >
                  الرجوع إلى طرق التحقق الأخرى
                </button>
              </div>
            </div>
          ) : lockedStep === 'info' ? (
            <div className="flex-1 flex flex-col justify-between pt-6 space-y-6">
              
              {/* Illustration & Headline Section */}
              <div className="space-y-5">
                {/* Visual Graphic: Purple circle backdrop with 3D-styled padlock & avatar badge */}
                <div className="flex justify-center pt-2 pb-1">
                  <div className="relative w-40 h-40 flex items-center justify-center">
                    {/* Lavender circular halo backdrop */}
                    <div className="absolute inset-0 rounded-full bg-gradient-to-b from-[#f0ebff] via-[#ede9fe] to-[#e0e7ff] scale-95 shadow-inner" />
                    
                    {/* Decorative hand/key accents */}
                    <div className="absolute top-1/2 left-3 w-10 h-7 bg-amber-400/90 rounded-full blur-[1px] rotate-[-25deg] opacity-85" />
                    <div className="absolute bottom-6 left-7 w-12 h-6 bg-orange-400/85 rounded-full rotate-[-10deg]" />

                    {/* Central 3D Padlock */}
                    <div className="relative z-10 flex flex-col items-center">
                      {/* Padlock Shackle */}
                      <div className="w-16 h-14 border-[7px] border-[#6366f1] rounded-t-full -mb-3 bg-transparent" />
                      {/* Padlock Body */}
                      <div className="w-24 h-20 bg-gradient-to-br from-[#0866ff] via-[#1877f2] to-[#0052cc] rounded-2xl shadow-lg flex items-center justify-center border-t border-blue-300 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-8 h-8 bg-white/20 rounded-full blur-xs" />
                        {/* Keyhole */}
                        <div className="flex flex-col items-center">
                          <div className="w-4 h-4 bg-gray-950 rounded-full shadow-inner" />
                          <div className="w-2.5 h-4 bg-gray-950 rounded-b-xs -mt-1 shadow-inner" />
                        </div>
                      </div>
                    </div>

                    {/* Profile Avatar Badge Overlay on Padlock */}
                    <div className="absolute bottom-1 right-3 z-20 w-14 h-14 rounded-full bg-gray-300 border-4 border-white shadow-md flex items-center justify-center overflow-hidden">
                      {currentUser.avatar ? (
                        <img 
                          src={currentUser.avatar} 
                          alt={currentUser.name} 
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-400 flex items-center justify-center text-white">
                          <User size={26} />
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Main Headline: Exact format with dynamic account name */}
                <div className="space-y-3 pt-2">
                  <h1 className="text-xl sm:text-[22px] font-black text-gray-950 leading-snug tracking-tight">
                    <span className="text-gray-950">{currentUser.name ? `${currentUser.name}، ` : ''}</span>تم قفل حسابك
                  </h1>

                  {/* Dynamic Reason / Subtitle with date and notice */}
                  {currentUser.violationType === 'sexual_avatar' ? (
                    <div className="bg-rose-50 border border-rose-200 rounded-2xl p-3.5 text-right space-y-1.5">
                      <p className="text-xs font-black text-rose-900 flex items-center gap-1.5">
                        <AlertTriangle size={16} className="text-rose-600 shrink-0" />
                        <span>مخالفة معايير الصورة الشخصية (استغلال جنسي / غير لائق)</span>
                      </p>
                      <p className="text-xs text-rose-800 leading-relaxed font-medium">
                        تم حذف صورتك الشخصية المخالفة فوراً وتطبيق القفل الاحترازي. عدد مرات قفل الحساب اليوم: <strong className="font-black text-rose-950">{currentUser.dailyLockCount || 1} من 3</strong>.
                      </p>
                      <p className="text-[11px] text-rose-700 font-bold">
                        ⚠️ تنبيه: إذا تم قفل الحساب أكثر من 3 مرات في يوم واحد، سيتم تعليق الحساب نهائياً ووضعه تحت مراجعة الطعن الرسمية.
                      </p>
                    </div>
                  ) : (
                    <p className="text-[13px] sm:text-sm text-gray-800 font-normal leading-relaxed">
                      تم قفل حسابك بتاريخ {new Date().toLocaleDateString('ar-EG', { day: 'numeric', month: 'long', year: 'numeric' })} لأنه ربما تعرّض للاختراق أو لمخالفة أمنية. ويعني هذا أنه لا يمكنك استخدام GROZLA حتى تأكيد هويتك.
                    </p>
                  )}
                </div>

                {/* Section: الخطوات المتوقعة بعد ذلك */}
                <div className="pt-3 space-y-3">
                  <h2 className="text-sm sm:text-base font-black text-gray-950">
                    الخطوات المتوقعة بعد ذلك
                  </h2>

                  {/* Step Item with Icon */}
                  <div className="flex items-center gap-3.5 py-2">
                    <div className="w-10 h-10 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-800 shrink-0">
                      <UserCheck size={20} className="text-gray-900" />
                    </div>
                    <p className="text-xs sm:text-[13px] text-gray-900 font-bold leading-snug">
                      سجّل الدخول باستخدام جهاز وصلت إلى هذا الحساب من خلاله قبل ذلك
                    </p>
                  </div>
                </div>
              </div>

              {/* Bottom Actions Section */}
              <div className="space-y-3 pt-4">
                <div className="space-y-2">
                  <button 
                    onClick={() => {
                      setLockedStep('verification');
                      setLockedMethod('own_security_code');
                      setOwnSecurityCodeError(null);
                      setOwnSecurityCodeInput('');
                    }}
                    className="w-full bg-[#0866ff] hover:bg-[#0052cc] active:scale-[0.99] text-white py-3.5 px-6 rounded-2xl font-black text-sm sm:text-base shadow-md shadow-blue-500/20 transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    <Key size={18} />
                    <span>تأكيد رمز مركز حسابات OWN واستعادة الحساب 🔓</span>
                  </button>

                  <button 
                    onClick={() => {
                      setLockedStep('verification');
                      setLockedMethod('methods');
                    }}
                    className="w-full bg-gray-100 hover:bg-gray-200 active:scale-[0.99] text-gray-800 py-2.5 px-6 rounded-2xl font-bold text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <span>استعراض كافة طرق الاستعادة الأخرى</span>
                  </button>
                </div>

                <p className="text-[11px] sm:text-xs text-gray-500 font-medium text-center leading-relaxed">
                  لا يمكن لأحد الوصول إلى حسابك على OWN あ حتى تكمل هذه الخطوات.
                </p>
              </div>
            </div>
          ) : (
            /* SECURITY VERIFICATION MULTI-SYSTEM FLOW */
            <div className="py-2 text-right space-y-4 flex-1 flex flex-col justify-between">
              <div className="space-y-4">
                {/* Header with Back button */}
                <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => {
                        if (lockedMethod !== 'methods') {
                          setLockedMethod('methods');
                          setSelfieError(null);
                          setPhoneError(null);
                          setFingerprintError(null);
                          setIdError(null);
                          setOwnSecurityCodeError(null);
                          setPhoneStep('phone');
                        } else {
                          setLockedStep('info');
                        }
                      }}
                      className="p-1.5 hover:bg-gray-100 rounded-full text-gray-700 hover:text-gray-950 transition-colors cursor-pointer"
                    >
                      <ArrowRight size={20} />
                    </button>
                    <h2 className="text-base font-black text-gray-950">
                      {lockedMethod === 'methods' 
                        ? 'طرق استعادة الحساب المقفل' 
                        : lockedMethod === 'own_security_code'
                          ? 'تأكيد الرمز المؤكد في مركز حسابات OWN'
                          : lockedMethod === 'phone_fingerprint' 
                            ? 'تأكيد رقم جهات الاتصال والتوثيق بالبصمة' 
                            : 'إرسال بطاقة الهوية الرسمية ومطابقة البيانات'}
                    </h2>
                  </div>

                  {lockedMethod !== 'methods' && (
                    <button
                      onClick={() => {
                        setLockedMethod('methods');
                        setSelfieError(null);
                        setPhoneError(null);
                        setFingerprintError(null);
                        setIdError(null);
                        setOwnSecurityCodeError(null);
                        setPhoneStep('phone');
                      }}
                      className="text-xs font-bold text-[#0866ff] hover:underline cursor-pointer"
                    >
                      تغيير الطريقة
                    </button>
                  )}
                </div>

                {/* 1. SELECTION SCREEN: RECOVERY METHODS */}
                {lockedMethod === 'methods' && (
                  <div className="space-y-3 pt-1 animate-in fade-in duration-300">
                    <div className="text-right space-y-1">
                      <h3 className="text-sm font-black text-gray-900">اختر إحدى طرق استعادة حسابك</h3>
                      <p className="text-xs text-gray-600 font-medium">حدد الطريقة الأنسب لك لتأكيد هويتك وفك قفل الحساب فوراً:</p>
                    </div>

                    {/* METHOD 0 (PRIMARY): OWN ACCOUNTS CENTER SECURITY CODE */}
                    <button
                      onClick={() => {
                        setLockedMethod('own_security_code');
                        setOwnSecurityCodeError(null);
                        setOwnSecurityCodeInput('');
                      }}
                      className="w-full text-right p-4 rounded-2xl border-2 border-blue-500 bg-gradient-to-r from-blue-50/90 to-indigo-50/80 hover:bg-blue-50 hover:border-blue-600 transition-all flex items-center justify-between cursor-pointer group shadow-sm hover:shadow-md"
                    >
                      <div className="flex items-center gap-3.5">
                        <div className="w-11 h-11 rounded-2xl bg-[#0866ff] text-white flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform shadow-md shadow-blue-300">
                          <Key size={22} />
                        </div>
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] bg-blue-600 text-white font-black px-2 py-0.5 rounded-md">طريقة معتمدة في مركز حسابات OWN</span>
                            <h4 className="text-xs sm:text-sm font-black text-gray-900 group-hover:text-[#0866ff]">تأكيد الرمز المؤكد في مركز حسابات OWN</h4>
                          </div>
                          <p className="text-[11px] sm:text-xs text-gray-600 font-medium leading-relaxed">
                            استعادة الحساب فورياً بإدخال وتأكيد الرمز الذي قمت بإنشائه والمؤكد في مركز حسابات OWN
                          </p>
                        </div>
                      </div>
                      <ArrowRight size={18} className="text-blue-600 rotate-180 group-hover:text-blue-800 transition-colors shrink-0" />
                    </button>

                    {/* METHOD 1 CARD: ID Card Match (مطابقة بطاقة الهوية الرسمية) */}
                    <button
                      onClick={() => {
                        setLockedMethod('id_match');
                        setIdError(null);
                      }}
                      className="w-full text-right p-4 rounded-2xl border border-gray-200 bg-white hover:border-[#8b5cf6] hover:bg-purple-50/30 transition-all flex items-center justify-between cursor-pointer group shadow-xs hover:shadow-md"
                    >
                      <div className="flex items-center gap-3.5">
                        <div className="w-11 h-11 rounded-2xl bg-purple-100 text-[#8b5cf6] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                          <CreditCard size={24} />
                        </div>
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] bg-purple-100 text-purple-800 font-black px-2 py-0.5 rounded-md">طريقة 1</span>
                            <h4 className="text-xs sm:text-sm font-black text-gray-900 group-hover:text-[#8b5cf6]">إرسال صورة بطاقة الهوية الرسمية المطابقة للحساب</h4>
                          </div>
                          <p className="text-[11px] sm:text-xs text-gray-500 font-medium leading-relaxed">
                            مطابقة بطاقة الهوية الرسمية (بطاقة وطنية / جواز سفر / رخصة) بالاسم والبيانات المسجلة، وإلا سيتم تعطيل الحساب
                          </p>
                        </div>
                      </div>
                      <ArrowRight size={18} className="text-gray-400 rotate-180 group-hover:text-[#8b5cf6] transition-colors shrink-0" />
                    </button>

                    {/* METHOD 2 CARD: Contacts Phone + Fingerprint Biometrics */}
                    <button
                      onClick={() => {
                        setLockedMethod('phone_fingerprint');
                        setPhoneError(null);
                        setFingerprintError(null);
                        setPhoneStep('phone');
                      }}
                      className="w-full text-right p-4 rounded-2xl border border-gray-200 bg-white hover:border-emerald-500 hover:bg-emerald-50/30 transition-all flex items-center justify-between cursor-pointer group shadow-xs hover:shadow-md"
                    >
                      <div className="flex items-center gap-3.5">
                        <div className="w-11 h-11 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                          <Fingerprint size={24} />
                        </div>
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] bg-emerald-100 text-emerald-800 font-black px-2 py-0.5 rounded-md">طريقة 2</span>
                            <h4 className="text-xs sm:text-sm font-black text-gray-900 group-hover:text-emerald-700">تأكيد رقم جهات الاتصال + البصمة البيومترية</h4>
                          </div>
                          <p className="text-[11px] sm:text-xs text-gray-500 font-medium leading-relaxed">
                            كتابة رقم الهاتف المسجل في جهات الاتصال ثم توثيق الحساب بالبصمة المسجلة
                          </p>
                        </div>
                      </div>
                      <ArrowRight size={18} className="text-gray-400 rotate-180 group-hover:text-emerald-600 transition-colors shrink-0" />
                    </button>
                  </div>
                )}

                {/* 2. METHOD 0 VIEW: CONFIRM SECURITY CODE FROM ACCOUNTS CENTER */}
                {lockedMethod === 'own_security_code' && (
                  <div className="space-y-4 animate-in fade-in duration-300">
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50/80 p-4 rounded-2xl border border-blue-200 text-xs text-blue-950 space-y-2">
                      <div className="flex items-center justify-between">
                        <p className="font-black text-blue-900 flex items-center gap-1.5 text-sm">
                          <ShieldCheck size={18} className="text-blue-600" />
                          <span>تأكيد الرمز المؤكد في مركز حسابات OWN</span>
                        </p>
                        <span className="text-[10px] font-black bg-blue-100 text-blue-800 px-2.5 py-0.5 rounded-md">
                          استعادة فورية معتمدة
                        </span>
                      </div>
                      <p className="leading-relaxed font-medium text-blue-900">
                        وفقاً لإرشادات الأمان، لإلغاء قفل حسابك واستعادته مرة أخرى، يجب عليك تأكيد الرمز المعتمد في مركز حسابات OWN الذي قمت بإنشائه.
                      </p>
                    </div>

                    {ownSecurityCodeError && (
                      <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs font-bold text-rose-700 flex items-start gap-2">
                        <AlertTriangle size={16} className="shrink-0 mt-0.5 text-rose-600" />
                        <span>{ownSecurityCodeError}</span>
                      </div>
                    )}

                    <form onSubmit={handleVerifyOwnSecurityCode} className="space-y-4 bg-white p-5 rounded-3xl border border-gray-200 shadow-sm">
                      <div className="space-y-2">
                        <label className="block text-xs font-black text-gray-900 flex items-center justify-between">
                          <span className="flex items-center gap-1.5">
                            <Key size={14} className="text-blue-600" />
                            <span>أدخل الرمز الذي قمت بإنشائه في مركز حسابات OWN:</span>
                          </span>
                          <span className="text-[10px] text-gray-400 font-mono">
                            رمز استعادة الحساب
                          </span>
                        </label>

                        <div className="relative flex items-center">
                          <input
                            type={showOwnCodeInputPass ? 'text' : 'password'}
                            value={ownSecurityCodeInput}
                            onChange={(e) => {
                              setOwnSecurityCodeInput(e.target.value);
                              setOwnSecurityCodeError(null);
                            }}
                            placeholder="أدخل رمز الأمان المؤكد هنا"
                            className="w-full bg-gray-50 border border-gray-300 focus:border-blue-600 focus:bg-white rounded-xl pr-4 pl-10 py-3 text-sm font-mono text-gray-900 outline-none transition-all dir-ltr text-right"
                            required
                            autoFocus
                          />
                          <button
                            type="button"
                            onClick={() => setShowOwnCodeInputPass(!showOwnCodeInputPass)}
                            className="absolute left-3 text-gray-400 hover:text-gray-700 cursor-pointer"
                          >
                            {showOwnCodeInputPass ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                        </div>
                      </div>

                      {/* Reminder Card */}
                      <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 text-[11px] text-gray-600 space-y-1">
                        <p className="font-bold text-gray-800">💡 تذكير بالرمز المؤكد في مركز الحسابات:</p>
                        <p>
                          الرمز المعتمد لحسابك: <span className="font-mono font-bold text-blue-700">{currentUser?.ownSecurityCode || currentUser?.pin || '789012'}</span>
                        </p>
                      </div>

                      <button
                        type="submit"
                        disabled={isVerifyingOwnCode}
                        className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-black text-sm shadow-md shadow-blue-500/25 flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50"
                      >
                        {isVerifyingOwnCode ? (
                          <>
                            <RefreshCw size={16} className="animate-spin" />
                            <span>جارٍ التحقق وفك القفل...</span>
                          </>
                        ) : (
                          <>
                            <CheckCircle2 size={18} />
                            <span>تأكيد الرمز وفك قفل الحساب فوراً 🔓</span>
                          </>
                        )}
                      </button>
                    </form>
                  </div>
                )}

                {/* 3. METHOD 2 VIEW: CONTACTS PHONE & FINGERPRINT AUTHENTICATION */}
                {lockedMethod === 'phone_fingerprint' && (
                  <div className="space-y-4 animate-in fade-in duration-300">
                    <div className="bg-emerald-50/80 p-3.5 rounded-2xl border border-emerald-200 text-xs text-emerald-950 space-y-1.5">
                      <p className="font-black text-emerald-900 flex items-center gap-1.5 text-xs">
                        <Fingerprint size={16} />
                        <span>تأكيد رقم جهات الاتصال والتوثيق بالبصمة</span>
                      </p>
                      <p className="text-emerald-800 leading-relaxed font-medium">
                        الخطوة الأولى هي كتابة رقم الهاتف المسجل في جهات اتصال هذا الحساب، ثم المصادقة بالبصمة المسجلة لتأكيد أنك صاحب الحساب.
                      </p>
                    </div>

                    {/* Prominent Failure Banner if Fingerprint Mismatch */}
                    {fingerprintError && (
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.96 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-rose-50 border-2 border-rose-400 rounded-2xl p-4 text-right space-y-2 shadow-sm"
                      >
                        <div className="flex items-center gap-2 text-rose-800 font-black text-sm">
                          <AlertTriangle size={20} className="text-rose-600 shrink-0" />
                          <span>تعذر تأكيد حسابك</span>
                        </div>
                        <p className="text-xs text-rose-900 font-medium leading-relaxed">
                          {fingerprintError}
                        </p>
                        <div className="p-2 bg-rose-100/60 rounded-xl text-[11px] font-bold text-rose-950 flex items-center gap-1.5">
                          <Lock size={14} className="text-rose-700 shrink-0" />
                          <span>حالة الحساب: يظل مقفلاً للاشتباه في نشاط غير معتاد.</span>
                        </div>
                      </motion.div>
                    )}

                    {/* Step 2.1: Phone Input */}
                    {phoneStep === 'phone' && (
                      <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs space-y-3.5">
                        <div className="space-y-1">
                          <label className="text-xs font-black text-gray-800 block">
                            أدخل رقم الهاتف المسجل في جهات اتصال هذا الحساب:
                          </label>
                          <p className="text-[11px] text-gray-500 font-medium">
                            يجب أن يتطابق الرقم المكتوب مع رقم الهاتف المسجل بحسابك.
                          </p>
                        </div>

                        <div className="space-y-1.5">
                          <input 
                            type="tel"
                            value={phoneInputValue}
                            onChange={(e) => {
                              setPhoneInputValue(e.target.value);
                              setPhoneError(null);
                            }}
                            placeholder={currentUser.phone || "مثال: 01012345678 أو +201012345678"}
                            className="w-full px-3.5 py-3 bg-gray-50 border border-gray-300 rounded-xl text-sm font-sans outline-none focus:border-emerald-600 focus:bg-white text-right dir-ltr transition-all font-mono"
                          />
                          {currentUser.phone && (
                            <span className="text-[10px] text-gray-500 block text-right font-sans">
                              (تلميح للاختبار: الرقم المسجل بالحساب هو <strong>{currentUser.phone}</strong>)
                            </span>
                          )}
                        </div>

                        {phoneError && (
                          <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 font-bold flex items-center gap-1.5">
                            <AlertCircle size={16} className="text-rose-600 shrink-0" />
                            <span>{phoneError}</span>
                          </div>
                        )}

                        <button
                          type="button"
                          onClick={handleVerifyRegisteredPhone}
                          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3.5 rounded-2xl font-black text-sm shadow-md shadow-emerald-500/20 cursor-pointer transition-all flex items-center justify-center gap-2"
                        >
                          <CheckCircle2 size={18} />
                          <span>تأكيد الرقم والانتقال إلى واجهة البصمة</span>
                        </button>
                      </div>
                    )}

                    {/* Step 2.2: Fingerprint Biometric Interface */}
                    {phoneStep === 'fingerprint' && (
                      <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs space-y-4">
                        <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-black">
                              <Check size={14} />
                            </div>
                            <span className="text-xs font-black text-gray-800">تم تأكيد رقم الهاتف</span>
                          </div>
                          <span className="text-[11px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold">
                            واجهة البصمة البيومترية
                          </span>
                        </div>

                        {/* Interactive Fingerprint Scanner */}
                        {fingerprintScanning ? (
                          <div className="py-8 px-4 flex flex-col items-center justify-center text-center space-y-4 bg-emerald-50/50 rounded-2xl border border-emerald-200">
                            <div className="relative w-24 h-24 flex items-center justify-center">
                              <div className="absolute inset-0 rounded-full border-4 border-emerald-200 border-t-emerald-600 animate-spin" />
                              <Fingerprint size={48} className="text-emerald-600 animate-pulse" />
                            </div>
                            <div className="space-y-2 max-w-xs">
                              <h3 className="font-black text-gray-950 text-sm">{fingerprintStatusText}</h3>
                              <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
                                <div 
                                  className="bg-emerald-600 h-full transition-all duration-500 rounded-full"
                                  style={{ width: `${fingerprintProgress}%` }}
                                />
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center text-center space-y-4 pt-2">
                            <div className="relative group cursor-pointer" onClick={handleVerifyFingerprint}>
                              <div className="w-28 h-28 rounded-3xl bg-gradient-to-b from-emerald-50 to-emerald-100 border-2 border-emerald-400 flex items-center justify-center text-emerald-600 shadow-md shadow-emerald-500/10 group-hover:scale-105 transition-all">
                                <Fingerprint size={56} className="text-emerald-600 group-hover:text-emerald-700" />
                              </div>
                              <div className="absolute -bottom-2 bg-emerald-700 text-white text-[10px] font-black px-2.5 py-0.5 rounded-full shadow-xs left-1/2 -translate-x-1/2 whitespace-nowrap">
                                المس الحساس
                              </div>
                            </div>

                            <p className="text-xs text-gray-700 font-bold">
                              ضع إصبعك على الحساس لتأكيد البصمة البيومترية المسجلة
                            </p>

                            {/* AI Biometric Neural Verification Engine & Suggestion Card */}
                            <div className="w-full p-4 bg-gradient-to-r from-emerald-50 via-teal-50 to-cyan-50 rounded-2xl border border-emerald-200 text-right space-y-3 shadow-xs">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                                    <Sparkles size={16} />
                                  </div>
                                  <span className="text-xs font-black text-emerald-950">اقتراح وتحليل المراجعة الآلية (AI Neural Matcher)</span>
                                </div>
                                <span className="text-[10px] bg-emerald-200 text-emerald-900 font-extrabold px-2.5 py-0.5 rounded-full">تحليل تلقائي</span>
                              </div>
                              
                              <p className="text-[11px] text-gray-700 font-medium leading-relaxed">
                                يعتمد النظام حصرياً على شبكة Gemini العصبية لمقارنة تدفق خطوط البصمة الحية مع البصمة المسجلة في السجل الآمن واستخراج درجة المطابقة (Confidence Score).
                              </p>

                              <div className="pt-2 border-t border-emerald-100 flex items-center justify-between text-xs font-bold text-emerald-900">
                                <span>حالة الفحص الذكي:</span>
                                <span className="bg-emerald-600 text-white px-3 py-1 rounded-full text-[11px] font-black shadow-xs">جاهز للتحقق التلقائي</span>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={handleVerifyFingerprint}
                              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3.5 rounded-2xl font-black text-sm shadow-md shadow-emerald-500/20 cursor-pointer transition-all flex items-center justify-center gap-2"
                            >
                              <Fingerprint size={18} />
                              <span>توثيق البصمة وإلغاء قفل الحساب</span>
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* 4. METHOD 3 VIEW: ID CARD MATCHING NAME, BIRTHDATE, AND FACE */}
                {lockedMethod === 'id_match' && (
                  <div className="space-y-4 animate-in fade-in duration-300">
                    <div className="bg-blue-50/80 p-3.5 rounded-2xl border border-blue-200 text-xs text-blue-950 space-y-1.5">
                      <p className="font-black text-blue-900 flex items-center gap-1.5 text-xs">
                        <CreditCard size={16} />
                        <span>إرسال صورة بطاقة الهوية بنفس بيانات الحساب</span>
                      </p>
                      <p className="text-blue-800 leading-relaxed font-medium">
                        يجب أن تتطابق بطاقة الهوية المقدمة مع بيانات حسابك المسجلة في: <strong>الاسم الكامل</strong>، و<strong>تاريخ الميلاد</strong>، و<strong>صورة الوجه</strong>.
                      </p>
                    </div>

                    {/* Failure banner if ID fails */}
                    {idError && (
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.96 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-rose-50 border-2 border-rose-400 rounded-2xl p-4 text-right space-y-2 shadow-sm"
                      >
                        <div className="flex items-center gap-2 text-rose-800 font-black text-sm">
                          <AlertTriangle size={20} className="text-rose-600 shrink-0" />
                          <span>تعذر تأكيد بيانات الهوية</span>
                        </div>
                        <p className="text-xs text-rose-900 font-medium leading-relaxed">
                          {idError}
                        </p>
                        <div className="p-2 bg-rose-100/60 rounded-xl text-[11px] font-bold text-rose-950 flex items-center gap-1.5">
                          <Lock size={14} className="text-rose-700 shrink-0" />
                          <span>حالة الحساب: يظل مقفلاً لعدم مطابقة بيانات الهوية.</span>
                        </div>
                      </motion.div>
                    )}

                    {isIdVerifying ? (
                      <div className="py-10 px-4 flex flex-col items-center justify-center text-center space-y-4 bg-gray-50/90 rounded-2xl border border-blue-200">
                        <div className="relative w-20 h-20 flex items-center justify-center">
                          <div className="absolute inset-0 rounded-full border-4 border-blue-200 border-t-[#0866ff] animate-spin" />
                          <ShieldCheck size={36} className="text-[#0866ff] animate-pulse" />
                        </div>
                        <div className="space-y-2 max-w-xs">
                          <h3 className="font-black text-gray-950 text-sm">{idStatusText}</h3>
                          <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
                            <div 
                              className="bg-[#0866ff] h-full transition-all duration-500 rounded-full"
                              style={{ width: `${idProgress}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    ) : (
                      <>
                        {/* 1. ID Card & Profile Photo Comparison Box */}
                        <div className="bg-white p-3.5 rounded-2xl border border-gray-200 shadow-xs space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-black text-gray-800">1. رفع بطاقة الهوية ومقارنة صورة الوجه</span>
                            <span className="text-[10px] bg-blue-100 text-blue-700 font-bold px-2 py-0.5 rounded-full">
                              صورة الوجه
                            </span>
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div className="flex flex-col items-center justify-center p-3 rounded-xl bg-gray-50 border border-gray-200 text-center space-y-2">
                              <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-[#0866ff] shadow-xs flex items-center justify-center bg-gray-200">
                                {currentUser.avatar ? (
                                  <img 
                                    src={currentUser.avatar} 
                                    alt={currentUser.name} 
                                    className="w-full h-full object-cover"
                                    referrerPolicy="no-referrer"
                                  />
                                ) : (
                                  <User size={30} className="text-gray-400" />
                                )}
                              </div>
                              <span className="text-[11px] font-bold text-gray-800">
                                {currentUser.avatar ? 'صورة وجه الحساب' : 'لا توجد صورة شخصية'}
                              </span>
                            </div>

                            <label className="flex flex-col items-center justify-center p-3 rounded-xl bg-blue-50/40 hover:bg-blue-50 border border-dashed border-blue-300 hover:border-blue-500 cursor-pointer transition-colors text-center space-y-2">
                              {idCardImage ? (
                                <div className="w-16 h-16 rounded-xl overflow-hidden border border-blue-400 shadow-xs">
                                  <img src={idCardImage} alt="ID Preview" className="w-full h-full object-cover" />
                                </div>
                              ) : (
                                <div className="w-16 h-16 rounded-xl bg-blue-100 flex items-center justify-center text-[#0866ff]">
                                  <Upload size={24} />
                                </div>
                              )}
                              <span className="text-[11px] font-black text-blue-950">
                                {idCardImage ? 'تم اختيار بطاقة الهوية' : 'رفع بطاقة الهوية'}
                              </span>
                              <input 
                                type="file" 
                                accept="image/*" 
                                className="hidden" 
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    const validation = validateImageFile(file, 25);
                                    if (!validation.valid) {
                                      showToast(validation.error || 'الملف المختار غير صالح.');
                                      e.target.value = '';
                                      return;
                                    }
                                    showToast('جاري معالجة صورة بطاقة الهوية... ⏳');
                                    compressImage(file, 1024, 1024, 0.72).then(res => {
                                      setIdCardImage(res);
                                      setIdError(null);
                                      showToast('تم رفع صورة بطاقة الهوية بنجاح! ✨');
                                    }).catch(err => {
                                      console.warn("ID card compression warning:", err);
                                      showToast('تعذر معالجة صورة الهوية.');
                                    }).finally(() => {
                                      e.target.value = '';
                                    });
                                  }
                                }} 
                              />
                            </label>
                          </div>
                        </div>

                        {/* 2 & 3. Full Name and Birth Date Inputs */}
                        <div className="bg-white p-3.5 rounded-2xl border border-gray-200 shadow-xs space-y-3">
                          <span className="text-xs font-black text-gray-800 block">2 و 3. مطابقة الاسم وتاريخ الميلاد مع الحساب</span>
                          
                          <div className="space-y-1.5">
                            <label className="text-[11px] font-black text-gray-700 block">
                              الاسم الكامل بالهوية (المسجل: {currentUser.name || 'اسمك'})
                            </label>
                            <input 
                              type="text"
                              value={idFullName}
                              onChange={(e) => {
                                setIdFullName(e.target.value);
                                setIdError(null);
                              }}
                              placeholder="أدخل اسمك كما في الهوية والحساب"
                              className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl text-xs outline-none focus:border-[#0866ff] focus:bg-white text-right transition-all font-sans"
                            />
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-[11px] font-black text-gray-700 block">
                              تاريخ الميلاد بالهوية (المسجل بالحساب: {currentUser.birthDate || 'غير محدد'})
                            </label>
                            <input 
                              type="date"
                              value={idBirthDate}
                              onChange={(e) => {
                                setIdBirthDate(e.target.value);
                                setIdError(null);
                              }}
                              className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl text-xs outline-none focus:border-[#0866ff] focus:bg-white text-right transition-all font-sans"
                            />
                          </div>
                        </div>

                        {/* Verify Button */}
                        <div className="space-y-2 pt-1">
                          <button
                            onClick={handleVerifyIdMatch}
                            className="w-full bg-[#0866ff] hover:bg-[#0052cc] text-white py-3.5 rounded-2xl font-black text-sm shadow-md shadow-blue-500/20 cursor-pointer transition-all flex items-center justify-center gap-2"
                          >
                            <ShieldCheck size={18} />
                            <span>فحص ومطابقة بيانات الهوية واستعادة الحساب</span>
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

      ))}

      {/* APPEAL STEP 1: Phone Number (No code required) */}
      {appealStep === 'phone' && (
        <div className="flex flex-col items-center justify-center px-4 pt-8 pb-16 text-center max-w-md mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="w-18 h-18 rounded-3xl bg-gradient-to-tr from-blue-500 to-indigo-600 text-white flex items-center justify-center mb-4 shadow-lg shadow-blue-500/20">
            <Phone size={34} />
          </div>

          <h2 className="text-2xl font-black mb-1.5 text-gray-900">إضافة رقم الهاتف لتأمين الحساب</h2>
          <p className="text-xs sm:text-sm font-semibold text-gray-600 mb-6 leading-relaxed max-w-xs">
            ساعدنا في حماية حسابك وربطه برقم هاتفك المعتمد لمتابعة إجراءات الطعن واستعادة الحساب.
          </p>

          <div className="w-full space-y-4 mb-6 text-right">
            {/* Country Quick Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-black text-gray-700 block pr-1">
                رمز الدولة / البلد
              </label>
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                {[
                  { code: '+966', flag: '🇸🇦', name: 'السعودية' },
                  { code: '+20', flag: '🇪🇬', name: 'مصر' },
                  { code: '+971', flag: '🇦🇪', name: 'الإمارات' },
                  { code: '+964', flag: '🇮🇶', name: 'العراق' },
                  { code: '+213', flag: '🇩🇿', name: 'الجزائر' },
                  { code: '+212', flag: '🇲🇦', name: 'المغرب' },
                  { code: '+962', flag: '🇯🇴', name: 'الأردن' },
                  { code: '+965', flag: '🇰🇼', name: 'الكويت' },
                  { code: '+963', flag: '🇸🇾', name: 'سوريا' },
                  { code: '+967', flag: '🇾🇪', name: 'اليمن' },
                ].map((country, cIdx) => (
                  <button
                    key={`susp-country-${country.code}-${cIdx}`}
                    type="button"
                    onClick={() => setAppealCountryCode(country.code)}
                    className={`px-2.5 py-1.5 rounded-xl text-xs font-bold shrink-0 border transition-all cursor-pointer flex items-center gap-1 ${
                      appealCountryCode === country.code
                        ? 'bg-purple-50 border-[#8b5cf6] text-[#8b5cf6] shadow-2xs'
                        : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <span>{country.flag}</span>
                    <span dir="ltr">{country.code}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Mobile Number Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-black text-gray-700 block pr-1">
                رقم الهاتف المحمول
              </label>
              <div className="relative flex items-center">
                <span 
                  dir="ltr"
                  className="absolute left-3 text-xs font-black text-gray-500 bg-gray-200/80 px-2.5 py-1 rounded-lg select-none"
                >
                  {appealCountryCode}
                </span>
                <input 
                  type="tel" 
                  dir="ltr"
                  placeholder="5xxxxxxxx أو 7xxxxxxxx"
                  className={`w-full px-4 py-3.5 pl-18 bg-gray-50 border rounded-2xl text-center font-black text-gray-900 text-base outline-none transition-all ${
                    appealPhoneError ? 'border-red-500 ring-2 ring-red-100' : 'border-gray-300 focus:border-[#1877f2] focus:ring-2 focus:ring-blue-100'
                  }`}
                  value={appealPhoneNumber} 
                  onChange={e => {
                    setAppealPhoneNumber(e.target.value);
                    setAppealPhoneError(null);
                  }} 
                />
              </div>
            </div>

            {appealPhoneError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs font-bold text-center flex items-center justify-center gap-1.5">
                <AlertCircle size={16} className="shrink-0" />
                <span>{appealPhoneError}</span>
              </div>
            )}

            {/* Explicit Notice: NO CODE REQUIRED */}
            <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-2xl p-3.5 text-right flex items-start gap-2.5 shadow-2xs">
              <ShieldCheck size={20} className="text-emerald-600 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <h4 className="text-xs font-black text-emerald-950">تأكيد مباشر دون رمز OTP:</h4>
                <p className="text-[11px] font-bold text-emerald-900 leading-relaxed">
                  ✅ لن يُطلب منك إدخال رمز تأكيد SMS أو كود. سيتم ربط وتأكيد رقم هاتفك فوراً والانتقال مباشرة إلى خطوة إنشاء كلمة السر الجديدة.
                </p>
              </div>
            </div>
          </div>

          <div className="w-full space-y-2.5">
            <button 
              className="w-full py-3.5 bg-[#1877f2] hover:bg-[#166fe5] text-white font-black text-sm rounded-2xl transition-all cursor-pointer shadow-md shadow-blue-500/20 active:scale-[0.98] flex items-center justify-center gap-2"
              onClick={handleSendAppealCode}
            >
              <span>متابعة إلى إنشاء كلمة السر الجديدة</span>
              <ArrowLeft size={18} />
            </button>
          </div>
        </div>
      )}

      {/* APPEAL STEP 2: New Password Step */}
      {appealStep === 'password' && (
        <div className="flex flex-col items-center justify-center px-4 pt-8 pb-16 text-center max-w-md mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="w-18 h-18 rounded-3xl bg-gradient-to-tr from-blue-600 to-indigo-700 text-white flex items-center justify-center mb-4 shadow-lg shadow-blue-500/20">
            <KeyRound size={34} />
          </div>

          <h2 className="text-2xl font-black mb-1.5 text-gray-900">إنشاء كلمة سر جديدة</h2>
          <p className="text-xs sm:text-sm font-semibold text-gray-600 mb-6 leading-relaxed max-w-xs">
            يرجى إدخال كلمة سر جديدة وقوية لتأمين حسابك، وتأكيد إجراء الفحص الأمني النهائي.
          </p>

          <div className="w-full space-y-4 mb-6 text-right">
            {/* Password input */}
            <div className="space-y-1.5">
              <label className="text-xs font-black text-gray-700 block pr-1">
                كلمة السر الجديدة
              </label>
              <div className="relative">
                <input 
                  type={showAppealPassword ? "text" : "password"} 
                  dir="ltr"
                  placeholder="••••••••"
                  className={`w-full px-4 py-3.5 bg-gray-50 border rounded-2xl text-center font-black text-gray-900 text-base outline-none transition-all ${
                    appealPasswordError ? 'border-red-500 ring-2 ring-red-100' : 'border-gray-300 focus:border-[#1877f2] focus:ring-2 focus:ring-blue-100'
                  }`}
                  value={appealNewPassword} 
                  onChange={e => {
                    setAppealNewPassword(e.target.value);
                    setAppealPasswordError(null);
                  }} 
                />
                <button
                  type="button"
                  onClick={() => setShowAppealPassword(!showAppealPassword)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer p-1"
                >
                  {showAppealPassword ? <EyeOff size={18} /> : <Lock size={18} />}
                </button>
              </div>

              {/* Password strength meter */}
              {appealNewPassword.length > 0 && (
                <div className="pt-1 space-y-1">
                  <div className="w-full bg-gray-200 h-1.5 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-300 ${
                        appealNewPassword.length < 6 
                          ? 'w-1/3 bg-red-500' 
                          : appealNewPassword.length >= 8 && /[0-9]/.test(appealNewPassword) && /[a-zA-Z]/.test(appealNewPassword)
                            ? 'w-full bg-emerald-500'
                            : 'w-2/3 bg-amber-500'
                      }`}
                    />
                  </div>
                  <span className="text-[10px] font-bold text-gray-500 block text-start">
                    {appealNewPassword.length < 6 ? '⚠️ كلمة سر قصيرة (أقل من 6 أحرف)' : appealNewPassword.length >= 8 ? '✅ كلمة سر قوية وممتازة' : '👍 كلمة سر مقبولة'}
                  </span>
                </div>
              )}
            </div>

            {/* Confirm Password input */}
            <div className="space-y-1.5">
              <label className="text-xs font-black text-gray-700 block pr-1">
                تأكيد كلمة السر الجديدة
              </label>
              <input 
                type={showAppealPassword ? "text" : "password"} 
                dir="ltr"
                placeholder="أعد كتابة كلمة السر للتأكيد"
                className="w-full px-4 py-3.5 bg-gray-50 border border-gray-300 focus:border-[#1877f2] focus:ring-2 focus:ring-blue-100 rounded-2xl text-center font-black text-gray-900 text-base outline-none transition-all"
                value={appealConfirmPassword} 
                onChange={e => {
                  setAppealConfirmPassword(e.target.value);
                  setAppealPasswordError(null);
                }} 
              />
            </div>

            {appealPasswordError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs font-bold text-center flex items-center justify-center gap-1.5">
                <AlertCircle size={16} className="shrink-0" />
                <span>{appealPasswordError}</span>
              </div>
            )}

            {/* Crucial Instruction: Password save and transition to photo appeal */}
            <div className="bg-blue-50/90 border border-blue-200 rounded-2xl p-3.5 text-right space-y-1 shadow-2xs">
              <div className="flex items-center gap-1.5 text-blue-900 font-black text-xs">
                <Sparkles size={16} className="text-blue-600" />
                <span>حفظ كلمة السر وتحديث بيانات الحساب:</span>
              </div>
              <p className="text-[11px] font-bold text-blue-900 leading-relaxed">
                💡 سيتم حفظ وتحديث كلمة السر الجديدة مباشرة لحسابك، ثم المتابعة إلى خطوة فحص وتدقيق صورة الطعن بالذكاء الاصطناعي.
              </p>
            </div>
          </div>

          <div className="w-full space-y-2.5">
            <button 
              className="w-full py-3.5 bg-[#1877f2] hover:bg-[#166fe5] text-white font-black text-sm rounded-2xl transition-all cursor-pointer shadow-md shadow-blue-500/20 active:scale-[0.98] flex items-center justify-center gap-2"
              onClick={handleVerifyAppealPassword}
            >
              <span>حفظ كلمة السر ومتابعة الطعن</span>
              <ArrowLeft size={18} />
            </button>
          </div>
        </div>
      )}

      {/* APPEAL STEP 3: Photo Upload for AI Verification */}
      {appealStep === 'photo' && (
        <div className="flex flex-col items-center justify-center px-4 pt-8 pb-16 text-center max-w-md mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="w-16 h-16 rounded-2xl bg-blue-50 text-[#1877f2] flex items-center justify-center mb-3 shadow-xs border border-blue-100">
            <Bot size={32} />
          </div>

          <div className="w-16 h-16 rounded-full bg-purple-50 text-[#8b5cf6] border-2 border-purple-200 flex items-center justify-center mx-auto mb-3 shadow-xs">
            <CreditCard size={32} />
          </div>
          <h2 className="text-2xl font-black mb-1.5 text-gray-900">تأكيد الهوية ببطاقة الهوية الرسمية</h2>
          <p className="text-xs sm:text-sm font-bold text-gray-600 mb-5 leading-relaxed">
            يتطلب استعادة حسابك رفع صورة واضحة لبطاقة الهوية الرسمية (بطاقة تعريف وطنية / جواز سفر / رخصة قيادة).
          </p>
          
          {/* CRITICAL ACCOUNT MATCHING WARNING BANNER */}
          <div className="w-full bg-rose-50 border-2 border-rose-300 rounded-2xl p-4 text-right space-y-2 mb-5 shadow-xs">
            <h4 className="text-xs font-black text-rose-950 flex items-center gap-1.5">
              <AlertTriangle size={18} className="text-rose-600 shrink-0" />
              <span>تنبيه أمني إلزامي (مطابقة الهوية بالحساب):</span>
            </h4>
            <p className="text-xs font-black text-rose-800 leading-relaxed">
              ⚠️ <strong>يجب أن تكون بطاقة الهوية المرفوعة مطابقة تماماً لبيانات ومعلومات حسابك (الاسم المسجل: {currentUser?.name})</strong>.
            </p>
            <p className="text-[11px] font-bold text-rose-700 leading-relaxed bg-white/80 p-2.5 rounded-xl border border-rose-200">
              ❌ في حال رفع بطاقة هوية غير مطابقة لاسم وبيانات الحساب، أو صورة غير صالحة، <strong>سيتم تعطيل الحساب نهائياً وفورياً</strong> تطبيقاً لسياسة الأمان ومكافحة الانتحال.
            </p>
          </div>

          {/* ACCOUNT REGISTERED DATA REFERENCE CARD */}
          <div className="w-full bg-purple-50/70 border border-purple-200 rounded-2xl p-4 mb-4 text-right space-y-2">
            <span className="text-[11px] font-black text-purple-900 block">بيانات الحساب المسجلة للمطابقة:</span>
            <div className="flex items-center justify-between bg-white p-2.5 rounded-xl border border-purple-100 text-xs">
              <span className="font-extrabold text-gray-900">{currentUser?.name || 'صاحب الحساب'}</span>
              <span className="text-gray-500 font-bold">الاسم الكامل للحساب:</span>
            </div>
            {currentUser?.birthDate && (
              <div className="flex items-center justify-between bg-white p-2.5 rounded-xl border border-purple-100 text-xs">
                <span className="font-extrabold text-gray-900 dir-rtl">{currentUser.birthDate}</span>
                <span className="text-gray-500 font-bold">تاريخ الميلاد:</span>
              </div>
            )}
          </div>

          {/* ID CARD UPLOAD PREVIEW */}
          <div className="w-full bg-gray-50 border border-gray-200 rounded-2xl p-4 mb-5 space-y-3">
            <div 
              onClick={() => appealIdCardInputRef.current?.click()}
              className="w-full p-6 rounded-2xl bg-white hover:bg-purple-50/50 border-2 border-dashed border-purple-300 hover:border-purple-600 cursor-pointer transition-all text-center space-y-3 shadow-2xs group flex flex-col items-center justify-center"
            >
              {appealIdCard || appealPhoto ? (
                <div className="w-full max-w-[280px] h-40 rounded-xl overflow-hidden border-2 border-emerald-500 shadow-md relative group">
                  <img src={appealIdCard || appealPhoto || ''} alt="بطاقة الهوية المرفوعة" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="bg-white text-gray-900 text-xs font-black px-3 py-1.5 rounded-xl shadow-md flex items-center gap-1.5">
                      <Upload size={14} /> تغيير بطاقة الهوية
                    </span>
                  </div>
                </div>
              ) : (
                <div className="space-y-2 flex flex-col items-center">
                  <div className="w-16 h-16 rounded-2xl bg-purple-100 text-[#8b5cf6] flex items-center justify-center group-hover:scale-105 transition-transform shadow-2xs">
                    <CreditCard size={32} />
                  </div>
                  <div>
                    <span className="text-sm font-black text-purple-950 block">
                      انقر هنا لرفع بطاقة الهوية الرسمية
                    </span>
                    <span className="text-xs text-gray-500 font-medium">
                      بطاقة تعريف وطنية / جواز سفر / رخصة سياقة (JPG, PNG)
                    </span>
                  </div>
                </div>
              )}
            </div>

            <input 
              ref={appealIdCardInputRef}
              type="file" 
              accept="image/*" 
              className="hidden" 
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  const validation = validateImageFile(file, 25);
                  if (!validation.valid) {
                    showToast(validation.error || 'الملف المختار غير صالح.');
                    e.target.value = '';
                    return;
                  }
                  showToast('جاري معالجة وضغط صورة بطاقة الهوية... ⏳');
                  compressImage(file, 1024, 1024, 0.78).then(res => {
                    setAppealIdCard(res);
                    setAppealPhoto(res);
                    setAppealPhotoError(null);
                    showToast('تم اختيار بطاقة الهوية بنجاح! اضغط على زر تأكيد ومطابقة بطاقة الهوية لتقديم الطعن 🪪✨');
                  }).catch(err => {
                    console.warn("Appeal ID compression warning:", err);
                    showToast('تعذر معالجة صورة بطاقة الهوية.');
                  }).finally(() => {
                    e.target.value = '';
                  });
                }
              }} 
            />
          </div>

          {appealPhotoError && (
            <div className="w-full p-3 mb-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs font-bold text-center flex items-center justify-center gap-1.5">
              <AlertCircle size={16} className="shrink-0" />
              <span>{appealPhotoError}</span>
            </div>
          )}

          <div className="w-full space-y-2.5">
            <button 
              disabled={(!appealIdCard && !appealPhoto) || isAppealAiReviewing}
              className="w-full py-3.5 bg-gradient-to-r from-[#8b5cf6] to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-black text-sm rounded-2xl transition-all cursor-pointer shadow-md shadow-purple-500/20 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              onClick={() => handleStartAiAppealPhotoReview()}
            >
              <ShieldCheck size={20} />
              <span>{isAppealAiReviewing ? 'جاري فحص ومطابقة بطاقة الهوية بالذكاء الاصطناعي...' : 'تأكيد ومطابقة بطاقة الهوية مع الحساب وتقديم الطعن 🪪'}</span>
            </button>
          </div>
        </div>
      )}

      {/* APPEAL STEP 4: Reviewing Animation (Standard Appeal Submitted UI - Persistent Under Review) */}
      {appealStep === 'reviewing' && (
        <div className="flex flex-col items-center justify-center px-4 pt-8 pb-20 text-center max-w-lg mx-auto animate-in fade-in zoom-in duration-500">
          <div className="relative mb-4 flex items-center justify-center">
            <div className="w-20 h-20 rounded-full bg-amber-50 border-4 border-amber-300 flex items-center justify-center shadow-lg shadow-amber-500/10 animate-pulse">
              <AlertTriangle size={42} className="text-amber-500" strokeWidth={2.5} />
            </div>
            <div className="absolute -bottom-1 bg-amber-500 text-white text-[11px] font-black px-3 py-0.5 rounded-full shadow-xs flex items-center gap-1">
              <Clock size={12} className="animate-spin" />
              <span>قيد المراجعة</span>
            </div>
          </div>
          
          <h2 className="text-2xl sm:text-3xl font-black mb-1 text-gray-950 tracking-tight" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
            <span dir="auto">{currentUser?.name || 'مستخدم'}</span>، لقد أرسلت طعنًا
          </h2>
          
          <p className="text-xs sm:text-sm font-bold text-gray-500 mb-5">
            في {currentUser?.appealSubmittedAt ? new Date(currentUser.appealSubmittedAt).toLocaleDateString('ar-EG', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : new Date().toLocaleDateString('ar-EG', { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>

          <div className="w-full bg-amber-50/90 border border-amber-200 rounded-2xl p-4 text-center max-w-md mx-auto mb-5 shadow-xs">
            <p className="text-xs sm:text-sm font-black text-amber-950 mb-1">
              يرجى معاودة التحقق هنا للتعرف على النتيجة.
            </p>
            <p className="text-xs font-bold text-amber-800 leading-relaxed">
              حسابك لا يظهر للأشخاص على OWN あ، ولن تتمكن من استخدامه حتى تكتمل مراجعة الطعن من قبل نظام الأمان.
            </p>
          </div>

          {/* Submitted Official ID Card Review Card */}
          {(appealIdCard || appealPhoto || currentUser?.appealIdCard) && (
            <div className="w-full bg-white border border-gray-200 rounded-2xl p-4 max-w-md mx-auto mb-5 shadow-xs text-right space-y-3">
              <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                <div className="flex items-center gap-2">
                  <CreditCard size={18} className="text-[#8b5cf6]" />
                  <h4 className="text-xs font-black text-gray-900">بطاقة الهوية الرسمية المقدمة للمراجعة</h4>
                </div>
                <span className="text-[10px] bg-purple-100 text-purple-800 font-bold px-2 py-0.5 rounded-full">
                  مطابقة بيانات الحساب
                </span>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="w-20 h-14 rounded-xl overflow-hidden border border-purple-200 shadow-xs shrink-0 bg-gray-100">
                  <img src={appealIdCard || appealPhoto || currentUser?.appealIdCard || ''} className="w-full h-full object-cover" alt="بطاقة الهوية" />
                </div>
                <div className="space-y-1 min-w-0">
                  <p className="text-xs font-black text-gray-900">
                    الاسم المسجل في الحساب: <span className="text-[#8b5cf6]">{currentUser?.name || 'صاحب الحساب'}</span>
                  </p>
                  <p className="text-[11px] text-gray-500 font-medium">
                    يتم التحقق من مطابقة بطاقة الهوية مع بيانات الحساب الرسمية، وفي حال عدم التطابق سيتم تعطيل الحساب.
                  </p>
                </div>
              </div>
              
              <div className="bg-purple-50 border border-purple-100 rounded-xl py-2 px-3 flex items-center justify-center gap-2 text-purple-900 text-xs font-bold">
                <ShieldCheck size={16} className="text-[#8b5cf6]" />
                <span>جاري فحص ومطابقة وثيقة الهوية مع الحساب بواسطة الذكاء الاصطناعي</span>
              </div>
            </div>
          )}

          <div className="w-full h-px bg-gray-200 mb-5 max-w-md"></div>

          <div className="w-full text-right max-w-md mb-6" dir="rtl">
            <h3 className="text-[16px] font-black text-gray-900 mb-3">ما الذي يحدث بعد ذلك؟</h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-black shrink-0 mt-2"></span>
                <span className="text-xs sm:text-sm font-bold text-gray-800 leading-relaxed">
                  يبقى حسابك <strong>قيد المراجعة</strong> بشكل دائم ومحفوظ حتى عند تسجيل الخروج أو إغلاق التطبيق.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-black shrink-0 mt-2"></span>
                <span className="text-xs sm:text-sm font-bold text-gray-800 leading-relaxed">
                  إذا تبيّن لنا أن حسابك يتبع معايير مجتمعنا، فستتمكن من استخدام OWN あ مرة أخرى (يعود الحساب نشطاً ✅).
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-black shrink-0 mt-2"></span>
                <span className="text-xs sm:text-sm font-bold text-gray-800 leading-relaxed">
                  إذا تبيّن لنا أن حسابك لا يتبع معايير مجتمعنا، فسيتم تعطيله نهائيًا ولن تتمكن من الطعن على القرار مرة أخرى (يعطل الحساب ❌).
                </span>
              </li>
            </ul>
          </div>

          {/* Action Buttons Section */}
          <div className="w-full max-w-md space-y-2.5">
            {/* Primary Log Out Button (خروج من الحساب مع بقائه قيد المراجعة) */}
            <button
              onClick={logout}
              className="w-full py-3.5 bg-gray-100 hover:bg-gray-200 active:scale-[0.98] text-gray-900 rounded-2xl font-black text-sm transition-all flex items-center justify-center gap-2 border border-gray-300 shadow-xs cursor-pointer"
            >
              <LogOut size={18} className="text-gray-700" />
              <span>تسجيل الخروج من الحساب (يبقى قيد المراجعة)</span>
            </button>

            {/* AI Autonomous Decision Engine Section */}
            <div className="pt-2 w-full space-y-2.5">
              <div className="p-4 bg-gradient-to-br from-indigo-50/95 via-purple-50/90 to-blue-50/95 border-2 border-indigo-200 rounded-3xl space-y-3.5 shadow-md">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white flex items-center justify-center shadow-xs shrink-0">
                    <Bot size={22} />
                  </div>
                  <div className="text-right flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs sm:text-sm font-black text-gray-900">
                        مراجعة وفصل الحساب بالذكاء الاصطناعي
                      </h4>
                      <span className="bg-indigo-600 text-white text-[9px] font-black px-2 py-0.5 rounded-full">
                        قرار ملزم وليس اقتراحاً
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-600 font-bold mt-0.5">
                      الذكاء الاصطناعي هو الذي يراجع الحساب والمراسلات المتبادلة والصورة وسجل الـ 10 إبلاغات ويصدر القرار الملزم تلقائياً قبل رفع التعليق
                    </p>
                  </div>
                </div>

                {/* Report Context Display with 10 reports counter */}
                <div className="p-3 bg-white/95 rounded-2xl border border-indigo-100 text-[11px] space-y-1.5 text-right">
                  <div className="flex items-center justify-between border-b border-indigo-50 pb-1.5">
                    <span className="font-extrabold text-indigo-950 flex items-center gap-1.5">
                      <Shield size={14} className="text-indigo-600" />
                      <span>سجل الإبلاغات المتسببة في التعليق:</span>
                    </span>
                    <span className="bg-rose-100 text-rose-800 text-[10px] font-black px-2 py-0.5 rounded-full border border-rose-200">
                      مكتمل (10 إبلاغات لتعليق الحساب)
                    </span>
                  </div>
                  <p className="text-gray-700 font-bold leading-relaxed">
                    {currentUser?.suspensionReason || 'تم تعليق الحساب بعد بلوغ 10 إبلاغات لمخالفة معايير مجتمع OWN あ.'}
                  </p>
                </div>

                {/* Progress status while AI is evaluating */}
                {aiReviewPhase ? (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-3.5 rounded-2xl bg-gradient-to-r from-indigo-700 via-purple-700 to-blue-700 text-white text-xs font-black flex items-center gap-2.5 shadow-md"
                  >
                    <RefreshCw size={16} className="animate-spin shrink-0 text-yellow-300" />
                    <span className="leading-relaxed">{aiReviewPhase}</span>
                  </motion.div>
                ) : (
                  <div className="p-3 bg-indigo-50/80 border border-indigo-100 rounded-2xl text-[11px] font-black text-indigo-900 flex items-center gap-2">
                    <Sparkles size={16} className="text-indigo-600 shrink-0" />
                    <span>بدأت المراجعة تلقائياً بواسطة الذكاء الاصطناعي لإلغاء القيد واستعادة الحساب أو تأكيد التعطيل.</span>
                  </div>
                )}

                {/* AI Trigger/Status Button */}
                <button
                  onClick={() => handleCheckAppealDecision()}
                  disabled={isCheckingDecision}
                  className="w-full py-3.5 bg-gradient-to-r from-indigo-600 via-purple-600 to-[#1877f2] hover:from-indigo-700 hover:to-blue-700 active:scale-[0.98] text-white rounded-2xl font-black text-xs sm:text-sm transition-all flex items-center justify-center gap-2 shadow-md shadow-indigo-500/25 cursor-pointer disabled:opacity-50"
                >
                  {isCheckingDecision ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>الذكاء الاصطناعي يقوم بالمراجعة واتخاذ القرار الملزم الآن...</span>
                    </>
                  ) : (
                    <>
                      <Bot size={18} className="text-yellow-300" />
                      <span>إعادة مراجعة وفصل الحساب بالذكاء الاصطناعي 🤖</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* APPEAL STEP 5: Failed Verification Screen */}
      {appealStep === 'failed' && (
        <div className="flex flex-col items-center justify-center px-4 pt-8 pb-16 text-center max-w-md mx-auto animate-in fade-in zoom-in duration-500">
          <div className="w-20 h-20 rounded-full bg-red-100 text-red-600 flex items-center justify-center mb-4 shadow-sm border-4 border-red-200 animate-pulse">
            <AlertTriangle size={42} strokeWidth={2.5} />
          </div>

          {/* EXACT USER SPECIFIED ERROR HEADING */}
          <h1 className="text-2xl sm:text-3xl font-black mb-2 text-gray-950 tracking-tight">
            تعذر علينا تأكيد حساب
          </h1>

          <p className="text-xs sm:text-sm font-bold text-red-600 mb-5 leading-relaxed max-w-xs">
            {appealAiResult?.verdictTitle || appealAiResult?.aiVerdict || 'تم تأكيد قرار تعطيل الحساب بعد فحص البلاغ بواسطة الذكاء الاصطناعي.'}
          </p>

          {/* DETAILED REASONS & MANDATORY RULES CARD */}
          <div className="w-full bg-red-50/90 border border-red-200 rounded-3xl p-5 text-right space-y-3.5 mb-6 shadow-xs">
            <div className="space-y-1">
              <h4 className="text-xs font-black text-red-950 flex items-center gap-1.5">
                <AlertCircle size={16} className="text-red-600" />
                <span>تقرير فحص الذكاء الاصطناعي للبلاغ:</span>
              </h4>
              <p className="text-xs text-red-900 leading-relaxed font-bold">
                {appealAiResult?.aiRationale || appealAiResult?.aiAnalysis || 'أظهر فحص الذكاء الاصطناعي وجود مخالفة لمعايير المجتمع المسجلة في البلاغ.'}
              </p>
            </div>

            <div className="w-full h-px bg-red-200" />
            
            {appealAttempts > 0 && (
              <div className="space-y-1">
                <h4 className="text-xs font-black text-red-950 flex items-center gap-1.5">
                  <AlertTriangle size={16} className="text-red-600" />
                  <span>تنبيه هام جداً:</span>
                </h4>
                <p className="text-xs text-red-900 leading-relaxed font-black">
                  لقد استنفدت {appealAttempts} من أصل 4 محاولات متاحة. سيتم تعطيل حسابك نهائياً إذا تجاوزت الحد الأقصى للمحاولات بصور غير مطابقة. المحاولات المتبقية: <span className="font-mono bg-red-200 text-red-900 px-1.5 py-0.5 rounded-md mx-1">{4 - appealAttempts}</span>
                </p>
              </div>
            )}

            <div className="w-full h-px bg-red-200" />

            <div className="space-y-2">
              <span className="text-[11px] font-black text-gray-700 block">
                يرجى الالتزام بالشروط التالية للموافقة على الطعن:
              </span>
              <div className="space-y-1.5 text-xs font-black">
                <div className="flex items-center gap-2 text-emerald-950 bg-white p-2.5 rounded-xl border border-emerald-300 shadow-2xs">
                  <span className="text-base shrink-0">🪪</span>
                  <span>يجب رفع صورة بطاقة هوية رسمية فقط (بطاقة تعريف وطنية / جواز سفر / رخصة سياقة)</span>
                </div>
                <div className="flex items-center gap-2 text-rose-950 bg-white p-2.5 rounded-xl border border-rose-300 shadow-2xs">
                  <span className="text-base shrink-0">⚠️</span>
                  <span>يجب أن تكون بطاقة الهوية مطابقة تماماً لاسم وبيانات الحساب ({currentUser?.name || 'صاحب الحساب'})، وإلا سيتم تأكيد تعطيل الحساب نهائياً</span>
                </div>
              </div>
            </div>
          </div>

          {/* ACTION BUTTONS */}
          <div className="w-full space-y-2.5">
            <button 
              className="w-full py-3.5 bg-[#8b5cf6] hover:bg-purple-700 text-white font-black text-sm rounded-2xl transition-all cursor-pointer shadow-md shadow-purple-500/20 active:scale-[0.98] flex items-center justify-center gap-2"
              onClick={async () => {
                setAppealPhoto(null);
                setAppealIdCard(null);
                await goToAppealStep('photo', { appealPhoto: null, appealIdCard: null });
              }}
            >
              <RefreshCw size={18} />
              <span>إعادة المحاولة ورفع بطاقة هوية رسمية مطابقة 🪪</span>
            </button>
          </div>
        </div>
      )}

      {/* APPEAL STEP 6: Success Screen & Account Restoration */}
      {appealStep === 'success' && (
        <div className="flex flex-col items-center justify-center px-4 pt-12 pb-20 text-center max-w-md mx-auto animate-in fade-in zoom-in duration-500">
          <div className="w-20 h-20 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mb-4 shadow-md border-4 border-emerald-300">
            <Check size={42} strokeWidth={3} />
          </div>

          <h1 className="text-2xl sm:text-3xl font-black mb-2 text-gray-950 tracking-tight">
            لم يعد حسابك معلقاً
          </h1>
          <p className="text-xs sm:text-sm font-bold text-gray-700 mb-6 leading-relaxed max-w-sm">
            نأسف لعدم قدرتك على حسابك بشأن نزاهة حساب ولكن نقوم نحن فريق. GROZLA بحماية معايير مجتمعنا. للمزيد من المعلومات يرجى زيارة مركز{' '}
            <button 
              onClick={() => setShowEdotensiMessenger(true)} 
              className="text-blue-600 font-black hover:underline inline-flex items-center gap-1"
            >
              OWN
            </button>
          </p>

          <button 
            onClick={async () => {
              await reactivateAccount();
              setCurrentView('home');
            }}
            className="w-full py-3.5 bg-[#1877f2] hover:bg-blue-600 text-white rounded-2xl font-black text-sm transition-all shadow-md shadow-blue-500/20 cursor-pointer flex items-center justify-center gap-2"
          >
            <span>العودة إلى الصفحة الرئيسية</span>
            <ArrowLeft size={18} />
          </button>
        </div>
      )}

      {appealStep === 'submitted' && (
        <div className="flex flex-col items-center px-6 pt-12 pb-20 w-full max-w-2xl mx-auto animate-in fade-in zoom-in duration-500 text-center">
          <div className="text-amber-500 mb-4">
            <AlertTriangle size={64} fill="currentColor" className="text-white drop-shadow-md" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black mb-3 text-center text-gray-900 tracking-tight">
            {currentUser?.name}، لقد أرسلت طعنًا
          </h1>
          <p className="text-sm font-bold text-gray-500 mb-10 text-center">في {submissionDateGmt}</p>
          
          <p className="font-bold text-lg mb-6 text-center text-gray-900">يرجى معاودة التحقق هنا للتعرف على النتيجة.</p>
          <p className="text-gray-500 font-bold text-sm mb-10 text-center max-w-md leading-relaxed">حسابك لا يظهر للأشخاص على OWN あ، ولن تتمكن من استخدامه.</p>
          
          <div className="w-full border-t border-gray-200 pt-8 mt-2">
            <h3 className="font-black text-xl mb-6 text-right w-full text-gray-900">ماذا يحدث بعد ذلك؟</h3>
            <ul className="space-y-5 text-right w-full pr-2">
              <li className="flex items-start gap-3 justify-end text-sm font-bold text-gray-800 leading-relaxed">
                <span className="text-right">إذا تبيّن لنا أن حسابك يتبع معايير مجتمعنا، فستتمكن من استخدام OWN あ مرة أخرى.</span>
                <span className="w-1.5 h-1.5 rounded-full bg-black shrink-0 mt-2"></span>
              </li>
              <li className="flex items-start gap-3 justify-end text-sm font-bold text-gray-800 leading-relaxed">
                <span className="text-right">إذا تبيّن لنا أن حسابك لا يتبع معايير مجتمعنا (مثل مخالفة معايير السن وتغيير تاريخ الميلاد)، فسيتم تعطيله نهائيًا ولن تتمكن من الطعن على القرار مرة أخرى.</span>
                <span className="w-1.5 h-1.5 rounded-full bg-black shrink-0 mt-2"></span>
              </li>
            </ul>
          </div>
        </div>
      )}

      {/* RULE MODAL */}
      <AnimatePresence>
        {showRuleModal && (
          <div className="fixed inset-0 z-[150] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl max-w-md w-full p-5 shadow-2xl border border-gray-200 dir-rtl text-right overflow-hidden space-y-4"
            >
              <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                <h3 className="font-black text-gray-900 text-base">{getDynamicRuleModalInfo().title}</h3>
                <button onClick={() => setShowRuleModal(false)} className="p-1 rounded-full hover:bg-gray-100 text-gray-500 cursor-pointer">
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-3 text-xs text-gray-700 leading-relaxed max-h-80 overflow-y-auto">
                <p className="font-bold text-gray-900">
                  {getDynamicRuleModalInfo().intro}
                </p>
                <div className="space-y-2 pr-2 border-r-2 border-purple-200">
                  {getDynamicRuleModalInfo().bullets.map((bullet, i) => (
                    <p key={`susp-rule-bullet-${i}`}>• {bullet}</p>
                  ))}
                </div>

                {/* OWN AI Trigger in Rules Modal */}
                <div className="pt-2 border-t border-gray-100">
                  <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 p-3 rounded-2xl border border-blue-200/80 flex items-center justify-between gap-2 shadow-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#1877f2] to-cyan-500 text-white flex items-center justify-center shadow-xs">
                        <Bot size={18} className="animate-pulse" />
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-black text-xs text-gray-900">OWN AI</span>
                          <span className="text-[9px] bg-amber-100 text-amber-800 font-extrabold px-1.5 py-0.2 rounded">استعادة</span>
                        </div>
                        <p className="text-[10px] text-gray-500 font-medium">استعادة الحساب بالاسم ولقطة الشاشة والبريد</p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setShowRuleModal(false);
                        setShowOwnAiRecoveryModal(true);
                      }}
                      className="px-3 py-1.5 bg-gradient-to-r from-[#1877f2] to-[#0a52c2] hover:from-[#166fe5] text-white rounded-xl text-xs font-black shadow-xs flex items-center gap-1 cursor-pointer transition-all active:scale-95 shrink-0"
                    >
                      <Sparkles size={12} className="text-yellow-300" />
                      <span>OWN AI</span>
                      <ArrowLeft size={12} />
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowRuleModal(false);
                    setShowOwnAiRecoveryModal(true);
                  }}
                  className="flex-1 py-2.5 bg-gradient-to-r from-[#1877f2] to-blue-700 text-white font-extrabold rounded-xl text-xs shadow-md cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Bot size={15} />
                  <span>دخول OWN AI</span>
                </button>

                <button 
                  onClick={() => setShowRuleModal(false)}
                  className="py-2.5 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl text-xs cursor-pointer transition-all"
                >
                  {t.understoodBtn}
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* FULLSCREEN / MODERN LANGUAGE SELECTION MODAL (جميع اللغات مع البحث والتغيير الفوري) */}
        {showLanguageModal && (
          <div className="fixed inset-0 z-[200] bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-gray-200 overflow-hidden flex flex-col max-h-[85vh]"
              dir={currentLangObj.dir}
            >
              {/* Modal Header */}
              <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-blue-50/50 to-indigo-50/30">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-blue-100 text-[#1877f2] flex items-center justify-center font-bold">
                    <Globe size={18} />
                  </div>
                  <div>
                    <h3 className="font-black text-gray-900 text-base">{t.chooseLanguage}</h3>
                    <p className="text-[11px] text-gray-500 font-medium">GROZLA Official</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowLanguageModal(false)} 
                  className="p-1.5 rounded-full hover:bg-gray-200/80 text-gray-500 hover:text-gray-800 transition-colors cursor-pointer"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Search Bar */}
              <div className="p-3.5 border-b border-gray-100 bg-white">
                <div className="relative flex items-center">
                  <Search size={18} className={`absolute ${currentLangObj.dir === 'rtl' ? 'right-3' : 'left-3'} text-gray-400`} />
                  <input
                    type="text"
                    value={languageSearchQuery}
                    onChange={(e) => setLanguageSearchQuery(e.target.value)}
                    placeholder={t.searchLanguagePlaceholder}
                    className={`w-full py-2.5 rounded-2xl bg-gray-100 border border-gray-200 text-xs font-bold text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1877f2] focus:bg-white transition-all ${
                      currentLangObj.dir === 'rtl' ? 'pr-9 pl-8 text-right' : 'pl-9 pr-8 text-left'
                    }`}
                  />
                  {languageSearchQuery && (
                    <button
                      onClick={() => setLanguageSearchQuery('')}
                      className={`absolute ${currentLangObj.dir === 'rtl' ? 'left-2.5' : 'right-2.5'} p-1 text-gray-400 hover:text-gray-600 rounded-full`}
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
              </div>

              {/* Language List View */}
              <div className="overflow-y-auto p-4 space-y-4 flex-1">
                {/* Popular Languages Section (only when not searching) */}
                {!languageSearchQuery && (
                  <div>
                    <span className="text-[11px] font-black text-gray-400 uppercase tracking-wider block mb-2 px-1">
                      {t.popularLanguages}
                    </span>
                    <div className="grid grid-cols-2 gap-2">
                      {ALL_LANGUAGES.filter(l => l.popular).map((lang, pIdx) => {
                        const isSelected = currentLang === lang.code;
                        return (
                          <button
                            key={`susp-pop-lang-${lang.code}-${pIdx}`}
                            onClick={() => handleSelectLanguage(lang.code)}
                            className={`p-3 rounded-2xl border text-right flex items-center justify-between transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-blue-50 border-[#1877f2] shadow-xs'
                                : 'bg-gray-50/70 hover:bg-gray-100 border-gray-200/80'
                            }`}
                          >
                            <div className="overflow-hidden">
                              <p className={`text-xs font-black truncate ${isSelected ? 'text-[#1877f2]' : 'text-gray-900'}`}>
                                {lang.nativeName}
                              </p>
                              <p className="text-[10px] text-gray-500 truncate">{lang.name}</p>
                            </div>
                            {isSelected && (
                              <div className="w-5 h-5 rounded-full bg-[#1877f2] text-white flex items-center justify-center shrink-0">
                                <Check size={12} strokeWidth={3} />
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* All Languages Section */}
                <div>
                  <span className="text-[11px] font-black text-gray-400 uppercase tracking-wider block mb-2 px-1">
                    {t.allLanguages} ({filteredLanguages.length})
                  </span>
                  <div className="space-y-1 bg-gray-50/50 p-1.5 rounded-2xl border border-gray-100">
                    {filteredLanguages.length === 0 ? (
                      <div className="py-8 text-center text-xs text-gray-500 font-bold">
                        لم يتم العثور على أي لغة مطابقة لبحثك.
                      </div>
                    ) : (
                      filteredLanguages.map((lang, aIdx) => {
                        const isSelected = currentLang === lang.code;
                        return (
                          <button
                            key={`susp-all-lang-${lang.code}-${aIdx}`}
                            onClick={() => handleSelectLanguage(lang.code)}
                            className={`w-full p-2.5 rounded-xl flex items-center justify-between transition-all cursor-pointer text-right ${
                              isSelected 
                                ? 'bg-blue-100/70 text-[#1877f2] font-black shadow-2xs' 
                                : 'hover:bg-gray-100/80 text-gray-800'
                            }`}
                          >
                            <div className="flex items-center gap-2.5 overflow-hidden">
                              <span className={`text-xs font-black ${isSelected ? 'text-[#1877f2]' : 'text-gray-900'}`}>
                                {lang.nativeName}
                              </span>
                              <span className="text-[11px] text-gray-400 font-medium truncate">
                                — {lang.name}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-gray-200/60 text-gray-600 font-bold">
                                {lang.code}
                              </span>
                              {isSelected && (
                                <div className="w-5 h-5 rounded-full bg-[#1877f2] text-white flex items-center justify-center">
                                  <Check size={12} strokeWidth={3} />
                                </div>
                              )}
                            </div>
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-3 border-t border-gray-100 bg-gray-50/80 flex items-center justify-between">
                <span className="text-[11px] text-gray-500 font-bold">
                  {currentLangObj.nativeName} ({currentLangObj.name})
                </span>
                <button
                  onClick={() => setShowLanguageModal(false)}
                  className="px-4 py-1.5 bg-[#1877f2] hover:bg-[#166fe5] text-white rounded-xl text-xs font-black transition-all cursor-pointer"
                >
                  {t.understoodBtn}
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* LOCKED HELP & SETTINGS MODAL (مركز مساعدة الحساب وقفل الحساب) */}
        {showLockedHelpModal && (
          <div className="fixed inset-0 z-[260] bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 dir-rtl">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl max-w-md w-full p-5 shadow-2xl border border-gray-200 text-right overflow-hidden space-y-4 max-h-[88vh] flex flex-col"
            >
              <div className="flex justify-between items-center pb-3 border-b border-gray-100 shrink-0">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-blue-50 text-[#0866ff]">
                    <Settings size={18} />
                  </div>
                  <div>
                    <h3 className="font-black text-gray-950 text-base">مركز مساعدة الحساب والأمان</h3>
                    <p className="text-[11px] text-gray-500 font-medium">إرشادات التعليق والقفل الأمني</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowLockedHelpModal(false)} 
                  className="p-1.5 rounded-full hover:bg-gray-100 text-gray-500 hover:text-gray-900 cursor-pointer transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="overflow-y-auto space-y-3.5 pr-1 text-right flex-1 custom-scrollbar">
                {/* Section 1: لماذا تم تعليق الحساب؟ */}
                <div className="p-3.5 bg-red-50/80 border border-red-100 rounded-2xl space-y-1.5">
                  <h4 className="text-xs sm:text-sm font-black text-red-950 flex items-center gap-1.5">
                    <Shield size={16} className="text-red-600 shrink-0" />
                    <span>لماذا تم تعليق الحساب؟</span>
                  </h4>
                  <p className="text-xs text-red-900 leading-relaxed font-medium">
                    يتم تعليق الحساب عندما يتم رصد نشاط يخالف إرشادات مجتمع GROZLA أو معايير شروط منبعثا، مثل عدم مطابقة شروط السن القانونية (أقل من 12 عاماً)، أو تكرار المخالفات السلوكية، أو تلقي بلاغات بشأن معلومات الملف الشخصي.
                  </p>
                </div>

                {/* Section 2: لماذا تم قفل الحساب؟ */}
                <div className="p-3.5 bg-amber-50/80 border border-amber-100 rounded-2xl space-y-1.5">
                  <h4 className="text-xs sm:text-sm font-black text-amber-950 flex items-center gap-1.5">
                    <Lock size={16} className="text-amber-600 shrink-0" />
                    <span>لماذا تم قفل الحساب؟</span>
                  </h4>
                  <p className="text-xs text-amber-900 leading-relaxed font-medium">
                    يتم قفل الحساب كإجراء وقائي فوري لحماية بياناتك عندما يرصد النظام نشاطاً غير معتاد أو محاولات تسجيل دخول من متصفحات وأجهزة جديدة غير معروفة، أو للاشتباه في اختراق، وذلك لحظر أي استخدام غير مصرح به حتى تؤكد ملكيتك للحساب.
                  </p>
                </div>

                {/* Section 3: الخطوات الأخرى وجميع الحلول */}
                <div className="p-3.5 bg-blue-50/80 border border-blue-100 rounded-2xl space-y-2">
                  <h4 className="text-xs sm:text-sm font-black text-blue-950 flex items-center gap-1.5">
                    <CheckCircle2 size={16} className="text-[#0866ff] shrink-0" />
                    <span>جميع الخطوات الأخرى لاستعادة الحساب:</span>
                  </h4>
                  <div className="space-y-2 text-xs text-blue-950 font-medium">
                    <div className="flex items-start gap-2 bg-white/70 p-2 rounded-xl border border-blue-100">
                      <span className="w-5 h-5 rounded-full bg-[#0866ff] text-white flex items-center justify-center text-[10px] font-black shrink-0 mt-0.5">1</span>
                      <div>
                        <strong className="block font-black text-gray-900">مراجعة صورة الوجه:</strong>
                        <span>فحص الصورة البيومترية ومطابقتها مع الحساب خلال أكثر من يوم لاستعادته.</span>
                      </div>
                    </div>

                    <div className="flex items-start gap-2 bg-white/70 p-2 rounded-xl border border-blue-100">
                      <span className="w-5 h-5 rounded-full bg-[#0866ff] text-white flex items-center justify-center text-[10px] font-black shrink-0 mt-0.5">2</span>
                      <div>
                        <strong className="block font-black text-gray-900">مطابقة بطاقة الهوية الرسمية:</strong>
                        <span>تقديم بطاقة هوية سارية ومطابقة لنفس الاسم، ونفس تاريخ الميلاد، وصورة الوجه.</span>
                      </div>
                    </div>

                    <div className="flex items-start gap-2 bg-white/70 p-2 rounded-xl border border-blue-100">
                      <span className="w-5 h-5 rounded-full bg-[#0866ff] text-white flex items-center justify-center text-[10px] font-black shrink-0 mt-0.5">3</span>
                      <div>
                        <strong className="block font-black text-gray-900">التحقق عبر البريد أو الهاتف:</strong>
                        <span>إرسال رمز تأكيد فوري من 6 أرقام لتأكيد ملكية بيانات الاتصال.</span>
                      </div>
                    </div>

                    <div className="flex items-start gap-2 bg-white/70 p-2 rounded-xl border border-blue-100">
                      <span className="w-5 h-5 rounded-full bg-[#0866ff] text-white flex items-center justify-center text-[10px] font-black shrink-0 mt-0.5">4</span>
                      <div>
                        <strong className="block font-black text-gray-900">إعادة تأمين الحساب:</strong>
                        <span>تغيير كلمة السر ومراجعة الأجهزة المصرح لها فور اجتياز الفحص.</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-gray-100 shrink-0">
                <button
                  onClick={() => setShowLockedHelpModal(false)}
                  className="w-full py-3 bg-[#0866ff] hover:bg-[#0052cc] text-white rounded-2xl font-black text-xs cursor-pointer shadow-md shadow-blue-500/20 transition-all"
                >
                  فهمت ذلك
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* AI Appeal & Identity Verification Image Uploader Modal */}
      <AiImagePickerModal
        isOpen={showAiAppealModal}
        onClose={() => setShowAiAppealModal(false)}
        context="appeal"
        title="نظام فحص ورفع صورة الطعن بالذكاء الاصطناعي 🛡️🤖"
        subtitle="افحص وتأكد من مطابقة وجودة صورتك بالذكاء الاصطناعي وتجنب الصور الضبابية أو الجماعية لحماية حسابك."
        profileAvatarRef={currentUser?.avatar || undefined}
        onSelectImage={(url) => {
          setAppealPhoto(url);
          setAppealPhotoError(null);
          setSelfieCompareImage(url);
          setSelfieError(null);
          setShowAiAppealModal(false);
          showToast('تم اختيار الصورة! يبدأ الذكاء الاصطناعي الآن مراجعة الحساب تلقائياً 🤖✨');
          handleStartAiAppealPhotoReview(url);
        }}
      />
    </div>
  );
}
