with open('src/components/SuspendedAccount.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

ui_code = """      {currentUser?.suspensionReason === 'PHOTO_REVIEW_10S' ? (
        <div className="flex flex-col items-center justify-center px-4 pt-20 text-center animate-in fade-in duration-500 min-h-[70vh]">
          <div className="w-24 h-24 mx-auto mb-6 rounded-full overflow-hidden border-4 border-blue-500 shadow-xl relative">
            <img 
              src={currentUser.tempPhotoReview || currentUser.avatar} 
              className="w-full h-full object-cover animate-pulse opacity-70"
              alt="Review Candidate"
            />
            <div className="absolute inset-0 flex items-center justify-center bg-black/20">
              <span className="text-white font-black text-2xl drop-shadow-md">{photoReviewCountdown}</span>
            </div>
          </div>
          <h2 className="text-xl sm:text-2xl font-black mb-2 text-gray-900">جاري مراجعة الصورة...</h2>
          <p className="text-sm font-bold text-gray-500 mb-8 max-w-sm leading-relaxed">
            يقوم نظام الأمان الآن بمراجعة صورتك للتأكد من مطابقتها لمعايير مجتمع OWN あ. الرجاء الانتظار.
          </p>
          <div className="flex items-center gap-2 text-blue-600 font-bold">
            <div className="w-5 h-5 rounded-full border-2 border-blue-600 border-t-transparent animate-spin"></div>
            <span>المدة المتبقية: {photoReviewCountdown} ثوانٍ</span>
          </div>
        </div>
      ) : appealStep === 'info' && ("""

text = text.replace("      {appealStep === 'info' && (", ui_code)

with open('src/components/SuspendedAccount.tsx', 'w', encoding='utf-8') as f:
    f.write(text)
