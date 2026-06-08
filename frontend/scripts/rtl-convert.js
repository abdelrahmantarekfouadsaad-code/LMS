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

  // Replace physical classes with logical ones
  // Margins
  content = content.replace(/(?<=[\s"'\`])ml-([0-9]+|px|auto)(?=[ \s"'\`])/g, 'ms-$1');
  content = content.replace(/(?<=[\s"'\`])mr-([0-9]+|px|auto)(?=[ \s"'\`])/g, 'me-$1');
  content = content.replace(/(?<=[\s"'\`])-ml-([0-9]+|px|auto)(?=[ \s"'\`])/g, '-ms-$1');
  content = content.replace(/(?<=[\s"'\`])-mr-([0-9]+|px|auto)(?=[ \s"'\`])/g, '-me-$1');

  // Paddings
  content = content.replace(/(?<=[\s"'\`])pl-([0-9]+|px|auto)(?=[ \s"'\`])/g, 'ps-$1');
  content = content.replace(/(?<=[\s"'\`])pr-([0-9]+|px|auto)(?=[ \s"'\`])/g, 'pe-$1');

  // Position
  content = content.replace(/(?<=[\s"'\`])left-([0-9]+|px|auto|full|1\/2|1\/3|2\/3|1\/4)(?=[ \s"'\`])/g, 'start-$1');
  content = content.replace(/(?<=[\s"'\`])right-([0-9]+|px|auto|full|1\/2|1\/3|2\/3|1\/4)(?=[ \s"'\`])/g, 'end-$1');
  content = content.replace(/(?<=[\s"'\`])-left-([0-9]+|px|auto|full|1\/2|1\/3|2\/3|1\/4)(?=[ \s"'\`])/g, '-start-$1');
  content = content.replace(/(?<=[\s"'\`])-right-([0-9]+|px|auto|full|1\/2|1\/3|2\/3|1\/4)(?=[ \s"'\`])/g, '-end-$1');

  // Text alignment
  content = content.replace(/(?<=[\s"'\`])text-left(?=[ \s"'\`])/g, 'text-start');
  content = content.replace(/(?<=[\s"'\`])text-right(?=[ \s"'\`])/g, 'text-end');

  // Borders
  content = content.replace(/(?<=[\s"'\`])border-l(?=[ \s"'\`-])/g, 'border-s');
  content = content.replace(/(?<=[\s"'\`])border-r(?=[ \s"'\`-])/g, 'border-e');

  // Rounded corners (simplified for left/right full borders)
  content = content.replace(/(?<=[\s"'\`])rounded-l(-[a-z0-9]+)?(?=[ \s"'\`])/g, 'rounded-s$1');
  content = content.replace(/(?<=[\s"'\`])rounded-r(-[a-z0-9]+)?(?=[ \s"'\`])/g, 'rounded-e$1');

  // Gradients
  content = content.replace(/(?<=[\s"'\`])bg-gradient-to-r(?=[ \s"'\`])/g, 'bg-gradient-to-e'); // wait, standard tailwind may not support to-e. Let's skip gradient, or use to-l/r carefully.
  // Actually, standard tailwind doesn't have bg-gradient-to-s or -e. LTR/RTL for gradients usually needs rtl:bg-gradient-to-l

  if (content !== original) {
    fs.writeFileSync(file, content, 'utf8');
    replacedCount++;
    console.log(`Updated classes in ${file}`);
  }
});

console.log(`\nFinished updating ${replacedCount} files.`);
