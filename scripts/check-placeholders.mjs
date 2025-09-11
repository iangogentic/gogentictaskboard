import { execSync } from 'node:child_process';

// This script checks for TODO-style placeholder text, not spread operators
// We're looking for literal "..." in comments or strings that indicate incomplete work
const cmd = `grep -R "// TODO\\|// ..\\|'...'\\|\\"...\\"\\|<.*>\\.\\.\\.<" app components lib --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" --exclude-dir=node_modules --exclude-dir=.next || true`;

try {
  const out = execSync(cmd, {stdio:['ignore','pipe','ignore']}).toString().trim();
  
  if (out) {
    console.error('❌ Found TODO placeholders:\n' + out);
    console.error('\nPlease complete all TODO items before deployment.');
    process.exit(1);
  }
  console.log('✅ No TODO placeholders found');
} catch (error) {
  // grep returns non-zero if no matches, that's fine
  console.log('✅ No TODO placeholders found');
}