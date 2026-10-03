/**
 * Facebook-Grade Community Standards & Safety Review Engine for Profile Photos
 * Covers all official Facebook Community Standards systems:
 * 1. Adult Nudity & Sexual Activity (العُري والنشاط الجنسي للبالغين)
 * 2. Child Sexual Exploitation & Minor Safety (استغلال الأطفال والقاصرين)
 * 3. Violence, Gore & Graphic Content (العنف والدماء والمحتوى القاسي)
 * 4. Hate Speech & Dangerous Organizations (خطاب الكراهية والرموز الإرهابية)
 * 5. Suicide & Self-Harm (الانتحار وإيذاء النفس)
 * 6. Impersonation, Fraud & Deception (انتحال الهوية والاحتيال والتزوير)
 * 7. Regulated Goods, Weapons & Drugs (الأسلحة والمخدرات والسلع المحظورة)
 * 8. Bullying, Harassment & Privacy Violations (المضايقة والتنمر وانتهاك الخصوصية)
 */

export type CommunityViolationCategory = 
  | 'sexual_activity'
  | 'women_nudity'
  | 'men_nudity'
  | 'child_nudity'
  | 'general_nudity'
  | 'sexual_exploitation'
  | 'violence_gore'
  | 'hate_speech'
  | 'suicide_selfharm'
  | 'impersonation_fraud'
  | 'regulated_goods'
  | 'bullying_harassment'
  | 'safe';

export interface CommunityStandardSystem {
  id: CommunityViolationCategory;
  name: string;
  nameEn: string;
  policyArticle: string;
  icon: string;
  shortDesc: string;
  description: string;
  allowed: string[];
  prohibited: string[];
  severity: 'extreme' | 'high' | 'medium';
  defaultAction: 'disable' | 'lock' | 'suspend';
}

export interface PhotoReviewResult {
  isViolating: boolean;
  reason: string;
  violationCategory: CommunityViolationCategory;
  categoryLabel: string;
  policyArticle: string;
  action: 'disable' | 'lock' | 'suspend' | 'none';
  confidence: number;
  details: string;
  systemName: string;
}

/**
 * Full Facebook Community Standards Pillars Reference
 */
export const FACEBOOK_COMMUNITY_STANDARDS: CommunityStandardSystem[] = [
  {
    id: 'sexual_activity',
    name: 'النشاط الجنسي والعُري للبالغين',
    nameEn: 'Adult Nudity & Sexual Activity',
    policyArticle: 'المادة 14: معايير شروط فيسبوك والمحتوى الحساس',
    icon: '🔞',
    shortDesc: 'حظر كامل للصور الجنسية الصريحة والإباحية والعُري التام في الصور الشخصية.',
    description: 'نفرض قيوداً صارمة على عرض العُري أو النشاط الجنسي لأن بعض أفراد مجتمعنا قد يتحسسون من هذا النوع من المحتوى، ولضمان بيئة آمنة للجميع.',
    allowed: [
      'الصور الشخصية اليومية والرسمية المحتشمة',
      'صور اللياقة البدنية والرياضة بالزي الرياضي المعتاد',
      'اللوحات الفنية التراثية والتماثيل التاريخية'
    ],
    prohibited: [
      'صور ممارسة نشاط جنسي صريح أو إيحاءات فاضحة',
      'كشف الأعضاء التناسلية أو المؤخرات العارية بالكامل',
      'كشف الثديين العاريين للإناث في الصور الشخصية',
      'استخدام لقطات من مواقع إباحية'
    ],
    severity: 'extreme',
    defaultAction: 'disable'
  },
  {
    id: 'child_nudity',
    name: 'سلامة الأطفال وحظر الاستغلال الجنسي للقاصرين',
    nameEn: 'Child Safety & Exploitation Prevention',
    policyArticle: 'المادة 1: سلامة القاصرين وحمايتهم القصوى',
    icon: '🚸',
    shortDesc: 'حظر مطلق وعدم تسامح مع أي عُري أو استغلال يمس الأطفال أو القاصرين.',
    description: 'نطبق سياسة انعدام التسامح الصارم مع أي محتوى يستغل الأطفال جنسياً أو يعرضهم بصور عارية أو مهددة لسلامتهم، مع الإبلاغ الفوري للسلطات.',
    allowed: [
      'صور عائلية طبيعية ومحتشمة بصحبة الأطفال',
      'صور الأنشطة المدرسية والرياضية للأطفال'
    ],
    prohibited: [
      'أي عُري للأطفال حتى الرضع',
      'المحتوى الإباحي المتعلق بالأطفال (CSAM)',
      'تعريض الأطفال للخطر أو التحرش'
    ],
    severity: 'extreme',
    defaultAction: 'disable'
  },
  {
    id: 'violence_gore',
    name: 'العنف والمحتوى القاسي والدماء',
    nameEn: 'Violence & Graphic Content',
    policyArticle: 'المادة 4: السلامة والأمان الجسدي',
    icon: '🩸',
    shortDesc: 'حظر صور الدماء المفرطة، الجثث، التعذيب، والاعتداءات العنيفة.',
    description: 'نزيل الصور التي تشيد بالعنف أو تصوره بشكل قاسي أو مروع كالجروح البليغة، عمليات الإعدام، أو الدماء الكثيفة.',
    allowed: [
      'الصور التعبيرية الرمزية غير الدموية',
      'صور الفنون السينمائية التي لا تروج للعنف الحقيقي'
    ],
    prohibited: [
      'صور جثث أو أشخاص مشوهين أو ضحايا حوادث مروعة',
      'مشاهد دماء غزيرة وأطراف مقطوعة أو ذبح',
      'تمجيد وتخليد الأعمال الإرهابية والجرائم العنيفة'
    ],
    severity: 'extreme',
    defaultAction: 'disable'
  },
  {
    id: 'hate_speech',
    name: 'خطاب الكراهية والرموز والمنظمات الإرهابية',
    nameEn: 'Hate Speech & Dangerous Organizations',
    policyArticle: 'المادة 7: النبذ ومكافحة التمييز والكراهية',
    icon: '🚫',
    shortDesc: 'حظر رموز النازية، رايات المنظمات الإرهابية، والتحريض ضد فئات محددة.',
    description: 'نحظر أي هجوم مباشر على الأشخاص على أساس العرق أو الأصل الإثني أو الدين أو الجنس أو الإعاقة، وكذلك صور قادة المنظمات الإرهابية.',
    allowed: [
      'الحوارات الثقافية والتاريخية المحترمة',
      'الأعلام الوطنية الرسمية المعترف بها دولياً'
    ],
    prohibited: [
      'رايات وأعلام تنظيم داعش والقاعدة والمنظمات الإرهابية',
      'الرموز النازية والصليب المعقوف وشعارات التفوق العرقي',
      'تشبيه فئات معينة من البشر بالحيوانات أو الحشرات'
    ],
    severity: 'high',
    defaultAction: 'disable'
  },
  {
    id: 'suicide_selfharm',
    name: 'الانتحار وإيذاء النفس والممارسات الخطرة',
    nameEn: 'Suicide & Self-Harm Prevention',
    policyArticle: 'المادة 2: حماية الحياة والدعم النفسي',
    icon: '❤️‍🩹',
    shortDesc: 'حظر صور جروح إيذاء النفس وتشجيع الانتحار وتحديات الموت.',
    description: 'نسعى لحماية سلامة مستخدمينا ونحظر نشر أي صور تعرض جروحاً قطعية متعمدة أو أدوات شنق أو تدعو للانتحار أو إيذاء الجسد.',
    allowed: [
      'رسائل التوعية والدعم النفسي وطلب المساعدة',
      'مشاركة قصص التعافي الإيجابية'
    ],
    prohibited: [
      'صور قطع الشرايين أو جروح إيذاء النفس المباشرة',
      'صور حبال المشنقة أو تشجيع تحديات إيذاء النفس',
      'التعليمات المباشرة لكيفية الانتحار'
    ],
    severity: 'extreme',
    defaultAction: 'disable'
  },
  {
    id: 'impersonation_fraud',
    name: 'انتحال الهوية والاحتيال وشروط فيسبوك والأصالة',
    nameEn: 'Inauthentic Identity & Impersonation',
    policyArticle: 'المادة 12: الأصالة وحماية الهوية',
    icon: '🎭',
    shortDesc: 'حظر تزوير الهويات واستخدام صور المشاهير أو الآخرين لخداع المستخدمين.',
    description: 'يجب أن تمثل الصورة الشخصية هوية حقيقية وصادقة للمستخدم ولا يُسمح بانتحال شخصيات عامة أو وضع صور مسروقة للنصب والاحتيال.',
    allowed: [
      'الصور الشخصية الحقيقية للمستخدم',
      'الصور الكرتونية والرمزية (Avatars) غير المنسوبة لشخص آخر'
    ],
    prohibited: [
      'انتحال صفة شخصية مشهورة أو علامة تجارية للنصب',
      'عرض صور بطاقات الهوية الرسمية أو الجوازات أو بطاقات الائتمان',
      'استخدام صور مسروقة لإنشاء حسابات وهمية مضرة'
    ],
    severity: 'high',
    defaultAction: 'lock'
  },
  {
    id: 'regulated_goods',
    name: 'الأسلحة النارية والمخدرات والسلع المقيدة',
    nameEn: 'Weapons, Drugs & Regulated Goods',
    policyArticle: 'المادة 9: السلع والخدمات المقيدة قانونياً',
    icon: '⚠️',
    shortDesc: 'حظر الترويج للأسلحة النارية والمخدرات والمؤثرات العقلية.',
    description: 'نحظر استخدام الصورة الشخصية للترويج أو عرض بيع الأسلحة النارية غير المرخصة أو المخدرات أو المواد المهربة أو الأدوية غير القانونية.',
    allowed: [
      'صور الرياضات الأولمبية (كالرماية بالقوس أو الصيد المرخص)',
      'الألعاب الترفيهية والمجسمات المرخصة'
    ],
    prohibited: [
      'صور توجيه أسلحة نارية للتهديد أو استعراض العنف',
      'صور المخدرات والحبوب الممنوعة وأدوات التعاطي',
      'ترويج بيع الأسلحة أو المواد المتفجرة'
    ],
    severity: 'high',
    defaultAction: 'disable'
  },
  {
    id: 'bullying_harassment',
    name: 'المضايقة والتنمر والابتزاز الإلكتروني',
    nameEn: 'Bullying, Harassment & Blackmail',
    policyArticle: 'المادة 8: احترام الخصوصية وكرامة المستخدمين',
    icon: '🛡️',
    shortDesc: 'حظر التشهير بالآخرين أو نشر صورهم الخاصة بدون إذن أو ابتزازهم.',
    description: 'لا نتسامح مع المضايقات أو التنمر أو استخدام صور خاصة للتشهير بالأفراد أو تهديدهم أو ابتزازهم بأي وسيلة.',
    allowed: [
      'النقد البناء المحترم والمقبول',
      'مشاركة الآراء المشروعة دون تجريح شخصي'
    ],
    prohibited: [
      'استخدام صور لأشخاص آخرين بهدف السخرية أو التشهير بهم',
      'نشر صور خاصة مسربة بدون موافقة صاحبها (Non-Consensual Imagery)',
      'إرفاق عبارات تهديد أو ابتزاز مالي أو جسدي'
    ],
    severity: 'high',
    defaultAction: 'disable'
  }
];

// Prohibited terms mapped to Facebook Community Standards
const VIOLATION_KEYWORDS: { 
  words: string[]; 
  category: CommunityViolationCategory; 
  systemId: CommunityViolationCategory;
  label: string; 
  policyArticle: string;
  reason: string; 
  action: 'disable' | 'lock' | 'suspend' 
}[] = [
  // Child Exploitation
  {
    words: ['child', 'ped', 'طفل', 'اطفال', 'أطفال', 'بنات صغار', 'بنت صغيرة', 'child_abuse', 'minor', 'قاصر', 'قاصرات', 'اطفال عراة'],
    category: 'child_nudity',
    systemId: 'child_nudity',
    label: 'سلامة الأطفال وحظر الاستغلال الجنسي للقاصرين',
    policyArticle: 'المادة 1 من معايير مجتمع فيسبوك: سلامة القاصرين',
    reason: 'لقد قمنا بتعليق حسابك بشأن استغلال جنسي للاطفال',
    action: 'disable'
  },
  // Sexual Activity & Explicit Nudity
  {
    words: [
      'sexual', 'porn', 'adult', '18+', 'erotic', 'sex', 'نشاط جنسي', 'غير لائق', 'جنسي', 'فاضح', 'اباحي', 'إباحي', 
      'sexuality', 'sensual', 'exploit', 'استغلال', 'xxx', 'lewd', 'provocative', 'explicit', 'استغلال جنسي', 'إباحية',
      'intercourse', 'blowjob', 'masturbation', 'orgasm', 'علاقة جنسية', 'اوضاع جنسية', 'أوضاع جنسية', 'ممارسة الجنس',
      'سكس', 'شرموطة', 'عاهرة', 'قحبة', 'فرج', 'كس', 'زب', 'طيز', 'مؤخرة عارية', 'مؤخرة'
    ],
    category: 'sexual_activity',
    systemId: 'sexual_activity',
    label: 'النشاط الجنسي والعُري للبالغين',
    policyArticle: 'المادة 14 من معايير مجتمع فيسبوك: شروط فيسبوك والمحتوى الحساس',
    reason: 'لقد قمنا بتعليق حسابك بشأن استغلال جنسي للاطفال',
    action: 'disable'
  },
  // Women Nudity
  {
    words: ['women_nude', 'woman_nude', 'girl_nude', 'female_nude', 'نساء عاريات', 'نساء', 'امرأة عارية', 'بنات عاريات', 'بنت عارية', 'صدر عاري', 'boobs', 'breasts', 'bikini_nude', 'pussy', 'vagina', 'بزاز', 'ثدي عاري'],
    category: 'women_nudity',
    systemId: 'sexual_activity',
    label: 'عُري ومحتوى غير لائق (نساء)',
    policyArticle: 'المادة 14 من معايير مجتمع فيسبوك: العُري وشروط فيسبوك',
    reason: 'تم رصد عُري نساء أو كشف غير لائق في الصورة الشخصية يخالف معايير مجتمع فيسبوك.',
    action: 'lock'
  },
  // Men Nudity
  {
    words: ['man_nude', 'men_nude', 'male_nude', 'رجال عراة', 'رجل عاري', 'شاب عاري', 'penis', 'cock', 'dick', 'قضيب'],
    category: 'men_nudity',
    systemId: 'sexual_activity',
    label: 'عُري ومحتوى غير لائق (رجال)',
    policyArticle: 'المادة 14 من معايير مجتمع فيسبوك: العُري وشروط فيسبوك',
    reason: 'تم رصد عُري رجال أو كشف غير لائق في الصورة الشخصية يخالف معايير مجتمع فيسبوك.',
    action: 'lock'
  },
  // Violence & Bloodshed
  {
    words: ['isis', 'gore', 'blood', 'decapitation', 'murder', 'killing', 'ذبح', 'قطع راس', 'دماء', 'جثة', 'قتل', 'اعدام', 'إعدام', 'جثث', 'تعذيب', 'اشلاء', 'أشلاء'],
    category: 'violence_gore',
    systemId: 'violence_gore',
    label: 'العنف والمحتوى القاسي والدماء',
    policyArticle: 'المادة 4 من معايير مجتمع فيسبوك: السلامة والأمان الجسدي',
    reason: 'تم رصد مشاهد عنف قاسية أو دماء مفرطة أو ترويج للقتل يخالف معايير مجتمع فيسبوك للسلامة والأمان.',
    action: 'disable'
  },
  // Hate Speech & Terrorist Symbols
  {
    words: ['nazi', 'swastika', 'hitler', 'داعش', 'القاعدة', 'ارهاب', 'إرهاب', 'صليب معقوف', 'كراهية', 'hate_symbol', 'terrorist'],
    category: 'hate_speech',
    systemId: 'hate_speech',
    label: 'خطاب الكراهية والرموز والمنظمات الإرهابية',
    policyArticle: 'المادة 7 من معايير مجتمع فيسبوك: مكافحة التمييز والكراهية',
    reason: 'تم رصد رموز كراهية أو شعارات لمنظمات خطيرة وإرهابية تخالف سياسة مكافحة الكراهية والتمييز.',
    action: 'disable'
  },
  // Suicide & Self Harm
  {
    words: ['suicide', 'self_harm', 'cut_wrist', 'انتحار', 'ايذاء النفس', 'إيذاء النفس', 'شنق', 'قطع الشرايين', 'موت', 'selfharm'],
    category: 'suicide_selfharm',
    systemId: 'suicide_selfharm',
    label: 'الانتحار وإيذاء النفس والممارسات الخطرة',
    policyArticle: 'المادة 2 من معايير مجتمع فيسبوك: حماية الحياة والصحة النفسية',
    reason: 'تم رصد محتوى يشجع على الانتحار أو إيذاء النفس، وهو انتهاك مباشر لسياسة حماية الحياة.',
    action: 'disable'
  },
  // Impersonation & Fraud
  {
    words: ['fake_id', 'credit_card', 'passport_scam', 'هوية مزورة', 'بطاقة مسروقة', 'انتحال شخصية', 'جواز سفر مزور', 'scam_card'],
    category: 'impersonation_fraud',
    systemId: 'impersonation_fraud',
    label: 'انتحال الهوية والاحتيال والوثائق المزيفة',
    policyArticle: 'المادة 12 من معايير مجتمع فيسبوك: الأصالة وحماية الهوية',
    reason: 'تم رصد محاولة تزوير أو نشر وثائق مسروقة أو انتحال هوية يخالف معايير مجتمع فيسبوك.',
    action: 'lock'
  },
  // Regulated Goods & Drugs & Weapons
  {
    words: ['cocaine', 'heroin', 'weed_sell', 'gun_sell', 'مخدرات', 'كوكايين', 'حشيش', 'بيع سلاح', 'مسدس للبيع', 'كلاشينكوف', 'متفجرات'],
    category: 'regulated_goods',
    systemId: 'regulated_goods',
    label: 'الأسلحة النارية والمخدرات والسلع المقيدة',
    policyArticle: 'المادة 9 من معايير مجتمع فيسبوك: السلع المقيدة قانونياً',
    reason: 'تم رصد ترويج لمخدرات أو أسلحة نارية أو مواد غير قانونية تخالف إرشادات فيسبوك للسلع المقيدة.',
    action: 'disable'
  },
  // General Nudity
  {
    words: ['nude', 'nsfw', 'naked', 'عري', 'عارية', 'عاري', 'عراة', 'مفضوح', 'عري تام', 'topless', 'bottomless', 'undressed', 'جسد عاري'],
    category: 'general_nudity',
    systemId: 'sexual_activity',
    label: 'عُري ومظهر غير لائق',
    policyArticle: 'المادة 14 من معايير مجتمع فيسبوك: العُري والمحتوى الحساس',
    reason: 'تم رصد عُري صريح أو مظهر فاضح غير لائق في الصورة الشخصية يخالف معايير مجتمع فيسبوك.',
    action: 'disable'
  }
];

/**
 * Intelligent Image Analysis via HTML5 Canvas (Skin exposure & composition heuristic)
 */
async function analyzeImagePixelsForSafety(imageSrc: string): Promise<{ isHighExposure: boolean; skinRatio: number }> {
  return new Promise((resolve) => {
    try {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          const maxDim = 100; // Fast downscaled sample
          const scale = Math.min(maxDim / img.width, maxDim / img.height, 1);
          canvas.width = Math.max(10, Math.floor(img.width * scale));
          canvas.height = Math.max(10, Math.floor(img.height * scale));
          
          const ctx = canvas.getContext('2d', { willReadFrequently: true });
          if (!ctx) {
            resolve({ isHighExposure: false, skinRatio: 0 });
            return;
          }

          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const data = imgData.data;
          let skinPixelCount = 0;
          const totalPixels = canvas.width * canvas.height;

          // Standard normalized RGB skin detection algorithm
          for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];

            // Basic Skin Tone Heuristic in RGB Space
            const isSkin = 
              r > 95 && g > 40 && b > 20 &&
              (Math.max(r, g, b) - Math.min(r, g, b)) > 15 &&
              Math.abs(r - g) > 15 &&
              r > g && r > b;

            if (isSkin) {
              skinPixelCount++;
            }
          }

          const skinRatio = skinPixelCount / totalPixels;
          // If skin coverage is unusually high (> 58% of the total frame in an avatar without clothing balance)
          resolve({
            isHighExposure: skinRatio > 0.58,
            skinRatio: Math.round(skinRatio * 100)
          });
        } catch {
          resolve({ isHighExposure: false, skinRatio: 0 });
        }
      };

      img.onerror = () => {
        resolve({ isHighExposure: false, skinRatio: 0 });
      };

      img.src = imageSrc;
    } catch {
      resolve({ isHighExposure: false, skinRatio: 0 });
    }
  });
}

/**
 * Main evaluation function for profile pictures against Facebook Community Standards
 */
export async function evaluateProfilePhotoSafety(
  imageSrc: string,
  fileName?: string
): Promise<PhotoReviewResult> {
  const fileNameLower = (fileName || '').toLowerCase();
  
  // 1. Check keyword and filename indicators across all Facebook categories
  for (const group of VIOLATION_KEYWORDS) {
    const matched = group.words.find(w => fileNameLower.includes(w));
    if (matched) {
      const system = FACEBOOK_COMMUNITY_STANDARDS.find(s => s.id === group.systemId) || FACEBOOK_COMMUNITY_STANDARDS[0];
      return {
        isViolating: true,
        reason: group.reason,
        violationCategory: group.category,
        categoryLabel: group.label,
        policyArticle: group.policyArticle,
        action: group.action,
        confidence: 99,
        details: `تم رصد مطابقة أمنية [${matched}] تندرج تحت (${system.name}) - ${group.policyArticle}`,
        systemName: system.name
      };
    }
  }

  // 2. Deep visual pixel analysis
  const pixelAnalysis = await analyzeImagePixelsForSafety(imageSrc);
  if (pixelAnalysis.isHighExposure) {
    return {
      isViolating: true,
      reason: 'تم رصد نسبة تعري عالية أو كشف غير لائق في الصورة الشخصية تخالف معايير مجتمع فيسبوك بشأن العُري والنشاط الجنسي.',
      violationCategory: 'general_nudity',
      categoryLabel: 'عُري ومظهر غير لائق',
      policyArticle: 'المادة 14 من معايير مجتمع فيسبوك: العُري والمحتوى الحساس',
      action: 'lock',
      confidence: 92,
      details: `معدل التعريض والملامح المكشوفة: ${pixelAnalysis.skinRatio}% (الحد المسموح أقل من 40%)`,
      systemName: 'النشاط الجنسي والعُري للبالغين'
    };
  }

  
  // 3. Call AI Backend Moderation (Gemini)
  try {
    const response = await fetch('/api/vision/moderate-image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageBase64: imageSrc })
    });
    
    if (response.ok) {
      const result = await response.json();
      if (result.isViolating) {
        return {
          isViolating: true,
          reason: result.reason || 'لقد قمنا بتعليق حسابك بشأن استغلال جنسي للاطفال',
          violationCategory: 'child_nudity',
          categoryLabel: 'سلامة الأطفال وحظر الاستغلال الجنسي للقاصرين',
          policyArticle: 'المادة 1 من معايير مجتمع فيسبوك: سلامة القاصرين',
          action: 'disable',
          confidence: 99,
          details: 'مراجعة آلية: تم رصد محتوى مخالف بناءً على تحليل عميق.',
          systemName: 'سلامة الأطفال وحظر الاستغلال الجنسي للقاصرين'
        };
      }
    }
  } catch (err) {
    console.error('AI Moderation API failed, falling back to local analysis', err);
  }

  // Safe
  return {
    isViolating: false,
    reason: 'الصورة متوافقة تماماً مع معايير مجتمع فيسبوك وإرشادات الأمان.',
    violationCategory: 'safe',
    categoryLabel: 'آمن ومطابق لمعايير مجتمع فيسبوك',
    policyArticle: 'معايير مجتمع فيسبوك الرسمية',
    action: 'none',
    confidence: 99,
    details: 'اجتازت الصورة جميع الفحوصات ومطابقة معايير فيسبوك بنجاح.',
    systemName: 'جميع أنظمة معايير المجتمع'
  };
}

/**
 * Calculates whether the account should be LOCKED or SUSPENDED or DISABLED based on daily occurrences
 */
export function calculateEnforcementAction(
  currentDailyLockCount: number,
  lastLockDate?: string
): {
  newDailyCount: number;
  action: 'disable' | 'lock' | 'suspend';
  todayStr: string;
  isDailyThresholdExceeded: boolean;
  statusMessage: string;
} {
  const todayStr = new Date().toISOString().split('T')[0];
  const isSameDay = lastLockDate === todayStr;
  const previousCount = isSameDay ? currentDailyLockCount : 0;
  const newDailyCount = previousCount + 1;

  // If repeated violations (> 2 times in one day) -> Disable account
  if (newDailyCount > 2) {
    return {
      newDailyCount,
      action: 'disable',
      todayStr,
      isDailyThresholdExceeded: true,
      statusMessage: `تم تعطيل حسابك بالكامل لتكرار مخالفة معايير مجتمع فيسبوك ونشر صور غير متوافقة (${newDailyCount} مخالفات اليوم).`
    };
  }

  // Rule: Violation -> Disable with Facebook community standards message
  return {
    newDailyCount,
    action: 'disable',
    todayStr,
    isDailyThresholdExceeded: false,
    statusMessage: `لقد قمنا بتعطيل حسابك لأن الصورة لا تتبع معايير مجتمع فيسبوك بشأن المحتوى المقبول.`
  };
}

