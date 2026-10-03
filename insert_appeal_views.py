import sys

with open('src/components/SuspendedAccount.tsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

view_mode_start_idx = -1
rule_modal_start_idx = -1

for i, line in enumerate(lines):
    if "{viewMode === 'suspended' ? (" in line:
        view_mode_start_idx = i
    if "{/* RULE MODAL */}" in line:
        rule_modal_start_idx = i

if view_mode_start_idx != -1 and rule_modal_start_idx != -1:
    # Insert closing brace and new views before the RULE MODAL
    # RULE MODAL is at 1717. The closing of viewMode is around 1715.
    
    # Let's find the exact closing `)}` before RULE MODAL
    close_idx = rule_modal_start_idx - 1
    while close_idx > view_mode_start_idx and not lines[close_idx].strip().startswith(")}"):
        close_idx -= 1
        
    if not lines[close_idx].strip().startswith(")}"):
        print("Could not find closing brace for viewMode ternary.")
        sys.exit(1)
        
    new_views = """
      {/* END OF INFO VIEW */}
      )}

      {appealStep === 'phone' && (
        <div className="flex flex-col items-center justify-center px-4 pt-20 text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
          <h2 className="text-2xl sm:text-3xl font-black mb-2 text-gray-900">يرجى اضافة رقمك خاص</h2>
          <p className="text-xs sm:text-sm font-bold text-gray-500 mb-8 max-w-sm leading-relaxed">
            ساعدنا على تأكيد هوية حسابك استمرار حسابك مرة اخرى لنتأكد ان هذا حساب ملكك
          </p>
          <input 
            type="tel" 
            dir="ltr"
            placeholder="+1 234 567 8900"
            className="w-full max-w-sm px-4 py-3 mb-6 bg-gray-50 border border-gray-300 rounded-xl text-center font-bold text-gray-900 outline-none focus:border-[#1877f2] focus:ring-2 focus:ring-blue-100 transition-all"
            value={phoneNumber} 
            onChange={e => setPhoneNumber(e.target.value)} 
          />
          <button 
            disabled={!phoneNumber.trim()}
            className="w-full max-w-sm py-3 bg-[#1877f2] hover:bg-[#166fe5] text-white font-extrabold rounded-xl transition-all cursor-pointer disabled:opacity-50"
            onClick={() => {
              updateProfile({ phone: phoneNumber });
              const now = new Date();
              const options = { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'GMT' };
              const dateStr = now.toLocaleDateString('ar-EG', options as any) + ' بتوقيت غرينتش';
              setSubmissionDateGmt(dateStr);
              setAppealStep('submitted');
              setTimeout(() => {
                  reactivateAccount();
                  setCurrentView('home');
              }, 3000);
            }}
          >
            متابعة
          </button>
        </div>
      )}

      {appealStep === 'submitted' && (
        <div className="flex flex-col items-center px-6 pt-12 pb-20 w-full max-w-2xl mx-auto animate-in fade-in zoom-in duration-500">
          <div className="text-amber-500 mb-4">
            <AlertTriangle size={64} fill="currentColor" className="text-white drop-shadow-md" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black mb-3 text-center text-gray-900 tracking-tight">
            {currentUser?.name}، لقد أرسلت طعنًا
          </h1>
          <p className="text-sm font-bold text-gray-500 mb-10 text-center">في {submissionDateGmt}</p>
          
          <p className="font-bold text-lg mb-6 text-center text-gray-900">يرجى معاودة التحقق هنا للتعرف على النتيجة.</p>
          <p className="text-gray-500 font-bold text-sm mb-10 text-center max-w-md leading-relaxed">حسابك لا يظهر للأشخاص على فيسبوك، ولن تتمكن من استخدامه.</p>
          
          <div className="w-full border-t border-gray-200 pt-8 mt-2">
            <h3 className="font-black text-xl mb-6 text-right w-full text-gray-900">ماذا يحدث بعد ذلك؟</h3>
            <ul className="space-y-5 text-right w-full pr-2">
              <li className="flex items-start gap-3 justify-end text-sm font-bold text-gray-800 leading-relaxed">
                <span className="text-right">إذا تبيّن لنا أن حسابك يتبع معايير مجتمعنا، فستتمكن من استخدام فيسبوك مرة أخرى.</span>
                <span className="w-1.5 h-1.5 rounded-full bg-black shrink-0 mt-2"></span>
              </li>
              <li className="flex items-start gap-3 justify-end text-sm font-bold text-gray-800 leading-relaxed">
                <span className="text-right">إذا تبيّن لنا أن حسابك لا يتبع معايير مجتمعنا، فسيتم تعطيله نهائيًا ولن تتمكن من الطعن على القرار مرة أخرى.</span>
                <span className="w-1.5 h-1.5 rounded-full bg-black shrink-0 mt-2"></span>
              </li>
            </ul>
          </div>
        </div>
      )}
"""
    # Replace the `)}` at close_idx with the new views.
    lines[close_idx] = new_views

    # Insert `{appealStep === 'info' && (` before viewMode check
    lines.insert(view_mode_start_idx, "      {appealStep === 'info' && (\n")
    
    with open('src/components/SuspendedAccount.tsx', 'w', encoding='utf-8') as fw:
        fw.writelines(lines)
    print("Successfully injected views!")
else:
    print("Could not find insertion points.")
    
