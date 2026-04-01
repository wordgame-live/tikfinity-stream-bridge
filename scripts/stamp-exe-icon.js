const fs = require('fs');
const path = require('path');
const rcedit = require('rcedit');

async function main() {
  const root = path.join(__dirname, '..');
  const exePath = path.join(root, 'dist', 'TycoonStreamBridge.exe');
  const icoPath = path.join(root, 'public', 'wordtycoon-logo.ico');

  if (process.platform !== 'win32') {
    console.log('[stamp-icon] Skipping icon stamp on non-Windows platform');
    return;
  }
  if (!fs.existsSync(exePath)) {
    throw new Error(`Missing EXE at ${exePath}`);
  }
  if (!fs.existsSync(icoPath)) {
    throw new Error(`Missing ICO at ${icoPath}`);
  }

  await rcedit(exePath, {
    icon: icoPath
  });
  console.log(`[stamp-icon] Applied ${icoPath} to ${exePath}`);
}

main().catch((error) => {
  console.error(`[stamp-icon] ${error.message}`);
  process.exit(1);
});
