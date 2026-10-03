const fs = require('fs');
let code = fs.readFileSync('src/components/Navbar.tsx', 'utf-8');

code = code.replace(/Tv, /, '');

fs.writeFileSync('src/components/Navbar.tsx', code);
