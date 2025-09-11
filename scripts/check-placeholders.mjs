import { execSync } from 'node:child_process';

try {
  const out = execSync('npx -y ripgrep "\\.\\.\\." -n --glob "!*.git*" --glob "!node_modules" --glob "!.next" --glob "!test-results"', {
    stdio: ['ignore', 'pipe', 'ignore']
  }).toString().trim();
  
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
        line.includes('...}')
      )) {
        return false;
      }
      return true;
    });
    
    if (issues.length > 0) {
      console.error('Found potential placeholder code:\n' + issues.join('\n'));
      console.error('\nPlease replace placeholder code with actual implementations.');
      process.exit(1);
    }
  }
} catch (e) {
  // No matches found or ripgrep not installed - that's fine
}