const fs = require('fs');
const path = require('path');

// Read dictionary.ts
const content = fs.readFileSync(path.join(__dirname, '../src/locales/dictionary.ts'), 'utf8');

// We can execute it or parse it. Since it's TS, it's easiest to strip export const DICTIONARY = and parse it using eval.
// Or we can just import it since it has no dependencies. We need to compile it or use require on JS.
// Actually, I'll just write a quick regex/eval script.

const jsContent = content.replace('export const DICTIONARY = ', 'module.exports = ');
fs.writeFileSync(path.join(__dirname, 'dict.js'), jsContent);

const dict = require('./dict.js');

fs.writeFileSync(path.join(__dirname, '../src/i18n/dictionaries/en.json'), JSON.stringify(dict.en, null, 2));
fs.writeFileSync(path.join(__dirname, '../src/i18n/dictionaries/ar.json'), JSON.stringify(dict.ar, null, 2));

console.log('Dictionaries extracted successfully!');
