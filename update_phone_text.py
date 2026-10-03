with open('src/components/SuspendedAccount.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

text = text.replace(
    "ساعدنا على تأكيد هوية حسابك استمرار حسابك مرة اخرى لنتأكد ان هذا حساب ملكك",
    "ساعدنا على تأكيد هوية حسابك استمرار حسابك مرة اخرى لنتأكد ان هذا حساب ملكك ولن تحتاج الي رمز رقم هاتف لايحتاج الي رمز ولكن يحفظ في جهات اتصال في اعدادات وخصوصية"
)

with open('src/components/SuspendedAccount.tsx', 'w', encoding='utf-8') as f:
    f.write(text)
