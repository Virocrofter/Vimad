const fs = require('fs');
const path = require('path');

function getAllFiles(dir, extensions) {
  let files = [];
  const items = fs.readdirSync(dir);
  
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory() && !item.includes('node_modules') && !item.startsWith('.')) {
      files = files.concat(getAllFiles(fullPath, extensions));
    } else if (extensions.some(ext => item.endsWith(ext))) {
      files.push(fullPath);
    }
  }
  
  return files;
}

const files = getAllFiles('./src', ['.jsx', '.tsx']);

files.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  
  if (content.includes('navigate(') && !content.includes('const navigate =')) {
    console.log('Needs navigate variable: ' + file);
  }
});