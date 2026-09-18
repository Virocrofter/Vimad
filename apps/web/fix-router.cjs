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

function fixFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Check if file uses useRouter or navigate
  const usesRouter = content.includes('useRouter') || content.includes('navigate(');
  const hasImport = content.includes('useNavigate') || content.includes('useRouter');
  
  if (!usesRouter || hasImport) {
    return false;
  }
  
  // Add import at the top
  const importLine = 'import { useNavigate } from "react-router-dom";\n';
  content = importLine + content;
  
  fs.writeFileSync(filePath, content, 'utf8');
  return true;
}

const files = getAllFiles('./src', ['.jsx', '.tsx']);
let fixed = 0;

files.forEach(file => {
  if (fixFile(file)) {
    console.log('Fixed: ' + file);
    fixed++;
  }
});

console.log('\nDone! Fixed ' + fixed + ' files.');
console.log('Now manually add: const navigate = useNavigate(); inside each component.');