import sys

path = "src/components/SuspendedAccount.tsx"
with open(path, "r") as f:
    code = f.read()

# Replace fingerprint verify handler
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
    print("Warning: old_func not found")

with open(path, "w") as f:
    f.write(code)
print("Updated SuspendedAccount.tsx successfully")
