import fs from 'fs';
import path from 'path';

function processDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      processDir(fullPath);
    } else if (/\.(tsx?|jsx?|css)$/.test(file)) {
      let content = fs.readFileSync(fullPath, 'utf8');
      const updated = content.replace(/(from\s+["']|import\s+["']|require\(["'])(@?[a-z0-9\-_]+(?:\/[a-z0-9\-_]+)?)@\d+\.\d+\.\d+([\/"'])/g, '$1$2$3');
      if (content !== updated) {
        fs.writeFileSync(fullPath, updated, 'utf8');
        console.log('Fixed imports in:', fullPath);
      }
    }
  }
}

processDir('./src');
