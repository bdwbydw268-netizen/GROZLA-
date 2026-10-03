const fs = require('fs');
let code = fs.readFileSync('src/components/AccountsCenterModal.tsx', 'utf-8');

// The file seems to use CRLF or LF, we can just replace everything from 'const validateNameInput' to 'return { valid: true };\n};'
const startIndex = code.indexOf('const validateNameInput = (name: string): { valid: boolean; reason?: string } => {');
const endIndex = code.indexOf('return { valid: true };\n};', startIndex);

if (startIndex !== -1 && endIndex !== -1) {
  const replacement = `const validateNameInput = (name: string): { valid: boolean; reason?: string } => {
  if (!name.trim()) {
    return { valid: false, reason: 'الاسم مطلوب ولا يمكن تركه فارغاً' };
  }
  return { valid: true };
};`;
  code = code.substring(0, startIndex) + replacement + code.substring(endIndex + 'return { valid: true };\n};'.length);
  fs.writeFileSync('src/components/AccountsCenterModal.tsx', code);
  console.log("Successfully replaced validateNameInput in AccountsCenterModal.tsx");
} else {
  console.error("Could not find the function block.", startIndex, endIndex);
}
