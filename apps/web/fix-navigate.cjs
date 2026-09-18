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
  
  // Skip if already has navigate variable
  if (content.includes('const navigate =')) {
    return false;
  }
  
  // Skip if doesn't use navigate
  if (!content.includes('navigate(')) {
    return false;
  }
  
  // Find the first exported function component and add navigate inside
  // Match patterns like: export default function Name( or export function Name(
  const functionRegex = /(export\s+(?:default\s+)?function\s+\w+\s*\([^)]*\)\s*\{)/;
  const match = content.match(functionRegex);
  
  if (match) {
    const insertPos = match.index + match[1].length;
    const navigateLine = '\n  const navigate = useNavigate();';
    content = content.slice(0, insertPos) + navigateLine + content.slice(insertPos);
    fs.writeFileSync(filePath, content, 'utf8');
    return true;
  }
  
  // Try arrow function pattern: const Name = () => {
  const arrowRegex = /(const\s+\w+\s*=\s*\([^)]*\)\s*=>\s*\{)/;
  const arrowMatch = content.match(arrowRegex);
  
  if (arrowMatch) {
    const insertPos = arrowMatch.index + arrowMatch[1].length;
    const navigateLine = '\n  const navigate = useNavigate();';
    content = content.slice(0, insertPos) + navigateLine + content.slice(insertPos);
    fs.writeFileSync(filePath, content, 'utf8');
    return true;
  }
  
  return false;
}

const files = getAllFiles('./src', ['.jsx', '.tsx']);
let fixed = 0;
let failed = [];

files.forEach(file => {
  if (fixFile(file)) {
    console.log('✅ Fixed: ' + file);
    fixed++;
  } else if (fs.readFileSync(file, 'utf8').includes('navigate(') && !fs.readFileSync(file, 'utf8').includes('const navigate =')) {
    failed.push(file);
  }
});

console.log('\n✅ Successfully fixed: ' + fixed + ' files');

if (failed.length > 0) {
  console.log('\n⚠️  Could not auto-fix (manual intervention needed):');
  failed.forEach(f => console.log('   - ' + f));
}