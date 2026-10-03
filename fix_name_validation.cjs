const fs = require('fs');
let code = fs.readFileSync('src/components/AccountsCenterModal.tsx', 'utf-8');

const targetFunction = `const validateNameInput = (name: string): { valid: boolean; reason?: string } => {
  if (!name.trim()) {
    return { valid: false, reason: 'الاسم مطلوب ولا يمكن تركه فارغاً' };
  }
  // 1. Check for Emojis
  const emojiRegex = /(\\p{Extended_Pictographic}|[\\u{1F600}-\\u{1F64F}]|[\\u{1F300}-\\u{1F5FF}]|[\\u{1F680}-\\u{1F6FF}]|[\\u{1F700}-\\u{1F77F}]|[\\u{1F780}-\\u{1F7FF}]|[\\u{1F800}-\\u{1F8FF}]|[\\u{1F900}-\\u{1F9FF}]|[\\u{1FA00}-\\u{1FA6F}]|[\\u{1FA70}-\\u{1FAFF}]|[\\u{2600}-\\u{26FF}]|[\\u{2700}-\\u{27BF}])/u;
  if (emojiRegex.test(name)) {
    return { 
      valid: false, 
      reason: '🚫 غير مسموح بوضع الإيموجيات أو الرموز التعبيرية في الاسم.' 
    };
  }

  // 2. Check for Decorative symbols / Ornaments (e.g. 亗, ☬, 么, ꧁, ꧂, ꕥ, ★, ⚡, 𖤍, 𓆩, 𓆪)
  const decorativeRegex = /[亗☬么꧁꧂ꕥ★⚡✦✧𖤍𓆩𓆪۞۩۝௸⁂※†‡§¶•¶]/u;
  if (decorativeRegex.test(name)) {
    return {
      valid: false,
      reason: '🚫 غير مسموح بالزخرفات أو الرموز التشكيلية على الحساب.'
    };
  }

  // 3. Allowed characters:
  // Arabic: \\u0600-\\u06FF, \\u0750-\\u077F
  // Japanese Kanji: \\u4E00-\\u9FAF
  // Japanese Hiragana: \\u3040-\\u309F
  // Japanese Katakana: \\u30A0-\\u30FF
  // Latin / English: a-zA-Z
  // Whitespace and common punctuation: spaces, dashes, dots
  const allowedPattern = /^[\\u0600-\\u06FF\\u0750-\\u077F\\u4E00-\\u9FAF\\u3040-\\u309F\\u30A0-\\u30FFa-zA-Z\\s\\-\\.]+$/;
  if (!allowedPattern.test(name)) {
    return {
      valid: false,
      reason: '🚫 يحتوي الاسم على رموز غير مسموحة. يُسمح فقط بالأحرف العربية والإنجليزية والأسماء اليابانية بدون زخارف.'
    };
  }

  return { valid: true };
};`;

const replaceFunction = `const validateNameInput = (name: string): { valid: boolean; reason?: string } => {
  if (!name.trim()) {
    return { valid: false, reason: 'الاسم مطلوب ولا يمكن تركه فارغاً' };
  }
  // User requested to allow all types of names including emojis and symbols.
  return { valid: true };
};`;

if(code.includes(targetFunction)) {
  code = code.replace(targetFunction, replaceFunction);
  fs.writeFileSync('src/components/AccountsCenterModal.tsx', code);
  console.log("Validation replaced in AccountsCenterModal.tsx");
} else {
  console.error("Function not found exactly in AccountsCenterModal.tsx");
}
