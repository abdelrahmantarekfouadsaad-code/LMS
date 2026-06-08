const fs = require('fs');
const path = require('path');

const walkSync = function(dir, filelist) {
  let files = fs.readdirSync(dir);
  filelist = filelist || [];
  files.forEach(function(file) {
    if (fs.statSync(path.join(dir, file)).isDirectory()) {
      filelist = walkSync(path.join(dir, file), filelist);
    }
    else {
      if (file.endsWith('.tsx')) {
        filelist.push(path.join(dir, file));
      }
    }
  });
  return filelist;
};

const files = [
  ...walkSync(path.join(__dirname, '../src/app')),
  ...walkSync(path.join(__dirname, '../src/components'))
];

let replacedCount = 0;

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  const original = content;

  if (content.includes('useLocale') || content.includes('DICTIONARY')) {
    // Replace imports
    content = content.replace(/import\s+\{\s*useLocale\s*\}\s+from\s+['"]@\/hooks\/useLocale['"];?\n?/g, '');
    content = content.replace(/import\s+\{\s*DICTIONARY\s*\}\s+from\s+['"]@\/locales\/dictionary['"];?\n?/g, '');
    
    if (!content.includes('useTranslation')) {
      // Find the last import
      const importMatches = [...content.matchAll(/^import.*$/gm)];
      if (importMatches.length > 0) {
        const lastImport = importMatches[importMatches.length - 1];
        const insertPos = lastImport.index + lastImport[0].length;
        content = content.slice(0, insertPos) + "\nimport { useTranslation } from '@/i18n/TranslationContext';" + content.slice(insertPos);
      } else {
        content = "import { useTranslation } from '@/i18n/TranslationContext';\n" + content;
      }
    }

    // Convert hooks setup
    // e.g. const locale = useLocale();
    content = content.replace(/const\s+locale\s*=\s*useLocale\(\);\n?/g, 'const { dict, t: translate } = useTranslation();\n');
    
    // Now replace the DICTIONARY access with dict
    content = content.replace(/DICTIONARY\[locale\s+as\s+['"]en['"]\s+\|\s+['"]ar['"]\](?:\?\.)?([a-zA-Z0-9_]+)\s*\|\|\s*DICTIONARY\.en\.[a-zA-Z0-9_]+/g, 'dict.$1');
    content = content.replace(/DICTIONARY\[locale\s+as\s+['"]en['"]\s+\|\s+['"]ar['"]\]\s+as\s+any\)\?\.(guest)\s*\|\|\s*\(DICTIONARY\.en\s+as\s+any\)\.guest/g, 'dict.$1');
    content = content.replace(/DICTIONARY\[locale\s+as\s+['"]en['"]\s+\|\s+['"]ar['"]\]/g, 'dict');

    if (content !== original) {
      fs.writeFileSync(file, content, 'utf8');
      replacedCount++;
      console.log(`Migrated ${file}`);
    }
  }
});

console.log(`\nFinished migrating ${replacedCount} files.`);
