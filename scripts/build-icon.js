const fs = require('fs');
const path = require('path');
const pngToIco = require('png-to-ico');

async function main() {
  const root = path.join(__dirname, '..');
  const pngPath = path.join(root, 'public', 'wordtycoon-logo.png');
  const icoPath = path.join(root, 'public', 'wordtycoon-logo.ico');

  if (!fs.existsSync(pngPath)) {
    throw new Error(`Missing logo PNG at ${pngPath}`);
  }

  const icoBuffer = await pngToIco(pngPath);
  fs.writeFileSync(icoPath, icoBuffer);
  console.log(`[build-icon] Wrote ${icoPath}`);
}

main().catch((error) => {
  console.error(`[build-icon] ${error.message}`);
  process.exit(1);
});
