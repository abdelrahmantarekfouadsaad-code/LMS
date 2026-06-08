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

  // Add locale
  content = content.replace(/const\s+\{\s*dict\s*,\s*t\s*:\s*translate\s*\}\s*=\s*useTranslation\(\);/g, 'const { locale, dict, t: translate } = useTranslation();');

  // Fix settings/page.tsx
  if (file.includes('settings')) {
    content = content.replace(/t\.studentRole/g, "t('settings.studentRole')");
  }

  if (content !== original) {
    fs.writeFileSync(file, content, 'utf8');
    replacedCount++;
  }
});

console.log(`\nFinished fixing ${replacedCount} files.`);
