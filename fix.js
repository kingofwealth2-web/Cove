import fs from 'fs';
let content = fs.readFileSync('c:\\Users\\kofiw\\Desktop\\cove\\src\\screens\\AddTransactionPanel.jsx', 'utf8');
content = content.replace(/\u201C/g, '"').replace(/\u201D/g, '"').replace(/\u2026/g, '...');
fs.writeFileSync('c:\\Users\\kofiw\\Desktop\\cove\\src\\screens\\AddTransactionPanel.jsx', content);