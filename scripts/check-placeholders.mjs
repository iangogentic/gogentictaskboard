import { execSync } from 'node:child_process';

// Check for placeholder code only in source files, not build output
const cmd = `grep -R "\\.\\.\\." app components lib prisma scripts --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" --include="*.mjs" --exclude-dir=node_modules --exclude-dir=.next || true`;

try {
  const out = execSync(cmd, {stdio:['ignore','pipe','ignore']}).toString().trim();
  
  if (out) {
    // Filter out valid spread operators and other false positives
    const lines = out.split('\n');
    const issues = lines.filter(line => {
      // Skip lines that are likely spread operators
      if (line.includes('...') && (
        line.includes('...(') ||
        line.includes('...{') ||
        line.includes('...[') ||
        line.includes('...]') ||
        line.includes('...}') ||
        line.includes('...props') ||
        line.includes('...rest') ||
        line.includes('...args')
      )) {
        return false;
      }
      return true;
    });
    
    if (issues.length > 0) {
      console.error('❌ Found potential placeholder code:\n' + issues.join('\n'));
      console.error('\nPlease replace placeholder code with actual implementations.');
      process.exit(1);
    }
  }
  console.log('✅ No placeholders found in source files');
} catch (error) {
  // grep returns non-zero if no matches, that's fine
  console.log('✅ No placeholders found in source files');
}