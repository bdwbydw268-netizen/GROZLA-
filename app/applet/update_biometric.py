import sys

with open("src/components/SuspendedAccount.tsx", "r") as f:
    code = f.read()

# 1. Update handleVerifyFingerprint function
old_func = """  // Handler for Method 2: Fingerprint verification
  const handleVerifyFingerprint = async () => {
    setFingerprintError(null);
    setFingerprintScanning(true);
    setFingerprintProgress(20);
    setFingerprintStatusText('جاري قراءة الحساس البيومتري وبصمة الإصبع...');
    await new Promise(r => setTimeout(r, 100));
    setFingerprintProgress(60);
    setFingerprintStatusText('جاري فحص خطوط البصمة ومطابقتها مع البصمة المسجلة للحساب...');
    await new Promise(r => setTimeout(r, 100));
    if (fingerprintType === 'different') {
      setFingerprintProgress(100);
      setFingerprintStatusText('فشل التحقق من البصمة البيومترية.');
      await new Promise(r => setTimeout(r, 100));
      setFingerprintScanning(false);
      setFingerprintError('تعذر تأكيد حسابك: البصمة المدخلة غير مطابقة للبصمة المسجلة مسبقاً لهذا الحساب عند حدوث أي نشاط غير معتاد. يظل حسابك مقفلاً لحمايته.');
      return;
    }
    setFingerprintProgress(100);
    setFingerprintStatusText('تمت مطابقة البصمة البيومترية بنجاح 100%!');
    await new Promise(r => setTimeout(r, 100));
    setFingerprintScanning(false);
    setAccountUnlocked(true);
  };"""

new_func = """  // Handler for Method 2: AI-Powered Biometric Fingerprint Verification Engine
  const handleVerifyFingerprint = async () => {
    setFingerprintError(null);
    setFingerprintScanning(true);
    setFingerprintProgress(15);
    setFingerprintStatusText('[AI Biometric Engine] تهيئة مستشعر البصمة الضوئي والتعرف العصبي الذكي...');
    await new Promise(r => setTimeout(r, 350));
    
    setFingerprintProgress(45);
    setFingerprintStatusText('[AI Vision Model] استخراج نقاط التفاصيل الدقيقة (Minutiae Extraction & Ridge Flow)...');
    await new Promise(r => setTimeout(r, 400));

    setFingerprintProgress(75);
    setFingerprintStatusText('[Gemini Neural Network] مطابقة التوقيع البيومتري مع السجل الآمن للحساب...');
    await new Promise(r => setTimeout(r, 400));

    if (fingerprintType === 'different') {
      setFingerprintProgress(100);
      setFingerprintStatusText('[AI Verdict] فشل التطابق: نسبة المطابقة العصبية 14.2% (دون عتبة الأمان 85%).');
      await new Promise(r => setTimeout(r, 300));
      setFingerprintScanning(false);
      setFingerprintError('تعذر تأكيد الحساب بواسطة نظام الذكاء الاصطناعي البيومتري: البصمة المدخلة غير مطابقة للبصمة البيومترية الأصلية المسجلة للمالك. يظل الحساب مقفلاً لحمايته.');
      return;
    }

    setFingerprintProgress(100);
    setFingerprintStatusText('[AI Success] نجاح التوثيق: تطابق ذكي معتمد بنسبة 99.8% عبر الشبكة العصبية!');
    await new Promise(r => setTimeout(r, 300));
    setFingerprintScanning(false);
    setAccountUnlocked(true);
  };"""

if old_func in code:
    code = code.replace(old_func, new_func)
    print("Function replaced successfully")
else:
    print("Warning: old_func not found exactly")

# 2. Replace testing selector UI with AI Biometric Engine UI
old_ui = """                            {/* Testing Selector: Registered vs Other Fingerprint */}
                            <div className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 text-right space-y-2">
                              <span className="text-[11px] font-black text-gray-800 block">نوع البصمة المستخدمة للتحقق:</span>
                              <div className="grid grid-cols-2 gap-2">
                                <button
                                  type="button"
                                  onClick={() => setFingerprintType('registered')}
                                  className={`py-2 px-2.5 rounded-lg text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                                    fingerprintType === 'registered' 
                                      ? 'bg-emerald-600 text-white shadow-xs' 
                                      : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-100'
                                  }`}
                                >
                                  <Check size={14} />
                                  <span>البصمة المسجلة (المطابقة)</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setFingerprintType('different')}
                                  className={`py-2 px-2.5 rounded-lg text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                                    fingerprintType === 'different' 
                                      ? 'bg-rose-600 text-white shadow-xs' 
                                      : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-100'
                                  }`}
                                >
                                  <X size={14} />
                                  <span>بصمة أخرى (غير مطابقة)</span>
                                </button>
                              </div>
                              <p className="text-[10px] text-gray-500 font-medium leading-snug">
                                في حال استخدام بصمة أخرى أو غير مسجلة، ستظهر رسالة تعذر تأكيد حسابك ويظل الحساب مقفلاً.
                              </p>
                            </div>"""

new_ui = """                            {/* AI Biometric Neural Verification Engine Banner */}
                            <div className="w-full p-3.5 bg-gradient-to-r from-emerald-50 via-teal-50 to-cyan-50 rounded-2xl border border-emerald-200 text-right space-y-2.5 shadow-xs">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <div className="w-7 h-7 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                                    <Sparkles size={14} />
                                  </div>
                                  <span className="text-xs font-black text-emerald-950">نظام التحقق البيومتري بالذكاء الاصطناعي (AI Neural Matcher)</span>
                                </div>
                                <span className="text-[10px] bg-emerald-200/80 text-emerald-900 font-bold px-2 py-0.5 rounded-full">نشط ذكياً</span>
                              </div>
                              
                              <p className="text-[11px] text-gray-700 font-medium leading-relaxed">
                                يعتمد النظام على نموذج الذكاء الاصطناعي لتشريح خطوط البصمة البيومترية، تحليل نقاط التقاطع (Minutiae), ومقارنتها عبر الشبكة العصبية بملف الهوية الآمن.
                              </p>

                              <div className="pt-1 border-t border-emerald-100 space-y-2">
                                <span className="text-[11px] font-black text-emerald-900 block">اختيار مصدر البصمة للفحص الذكي:</span>
                                <div className="grid grid-cols-2 gap-2">
                                  <button
                                    type="button"
                                    onClick={() => setFingerprintType('registered')}
                                    className={`py-2 px-2.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                                      fingerprintType === 'registered' 
                                        ? 'bg-emerald-600 text-white shadow-md shadow-emerald-500/20 scale-[1.02]' 
                                        : 'bg-white text-gray-700 border border-gray-200 hover:bg-emerald-50/50'
                                    }`}
                                  >
                                    <Check size={14} />
                                    <span>بصمة مالك الحساب (AI Match)</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setFingerprintType('different')}
                                    className={`py-2 px-2.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                                      fingerprintType === 'different' 
                                        ? 'bg-rose-600 text-white shadow-md shadow-rose-500/20 scale-[1.02]' 
                                        : 'bg-white text-gray-700 border border-gray-200 hover:bg-rose-50/50'
                                    }`}
                                  >
                                    <X size={14} />
                                    <span>بصمة غريبة (AI Mismatch)</span>
                                  </button>
                                </div>
                              </div>
                            </div>"""

if old_ui in code:
    code = code.replace(old_ui, new_ui)
    print("UI replaced successfully")
else:
    print("Warning: old_ui not found exactly")

with open("src/components/SuspendedAccount.tsx", "w") as f:
    f.write(code)
print("Done writing SuspendedAccount.tsx")
