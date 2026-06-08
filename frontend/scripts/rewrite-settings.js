const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../src/app/(dashboard)/settings/page.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Import useTranslation
content = content.replace("import React, { useState, useEffect } from 'react';", "import React, { useState, useEffect } from 'react';\nimport { useTranslation } from '@/i18n/TranslationContext';");

// 2. Replace locale state with useTranslation
content = content.replace(
  "const [locale, setLocale] = useState('en');",
  "const { locale, setLocale, t } = useTranslation();"
);

// 3. Remove manual initialization effect and DOM sync effect
content = content.replace(
  /  \/\/ Avoid hydration mismatch[\s\S]*?\}, \[\]\);\n/,
  ""
);

content = content.replace(
  /  \/\/ Sync RTL and lang tags physically to the DOM[\s\S]*?\}, \[locale\]\);\n/,
  ""
);

// 4. Remove the manual `t` object definition
content = content.replace(
  /  \/\/ Simple Translation Dictionary[\s\S]*?  \};\n/,
  ""
);

// 5. Replace handleLocaleChange
content = content.replace(
  /  const handleLocaleChange = \(newLocale: string\) => \{[\s\S]*?router\.refresh\(\);\n  \};\n/,
  "  const handleLocaleChange = (newLocale: string) => {\n    setLocale(newLocale);\n  };\n"
);

// 6. Replace t.something with t('settings.something')
content = content.replace(/\{t\.([a-zA-Z0-9_]+)\}/g, "{t('settings.$1')}");

fs.writeFileSync(filePath, content, 'utf8');
console.log('Rewrote settings/page.tsx');
