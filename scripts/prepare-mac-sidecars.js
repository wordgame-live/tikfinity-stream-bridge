const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const distDir = path.join(rootDir, 'dist');
const tauriBinariesDir = path.join(rootDir, 'mac-app', 'src-tauri', 'binaries');

const targets = [
  {
    source: path.join(distDir, 'mac-aarch64', 'TycoonStreamBridge'),
    dest: path.join(tauriBinariesDir, 'TycoonStreamBridge-aarch64-apple-darwin')
  },
  {
    source: path.join(distDir, 'mac-x64', 'TycoonStreamBridge'),
    dest: path.join(tauriBinariesDir, 'TycoonStreamBridge-x86_64-apple-darwin')
  }
];

fs.mkdirSync(tauriBinariesDir, { recursive: true });

let copied = 0;
for (const target of targets) {
  if (!fs.existsSync(target.source)) {
    console.warn(`[prepare-mac-sidecars] Missing source: ${target.source}`);
    continue;
  }
  fs.copyFileSync(target.source, target.dest);
  fs.chmodSync(target.dest, 0o755);
  copied += 1;
  console.log(`[prepare-mac-sidecars] Copied ${target.source} -> ${target.dest}`);
}

if (copied === 0) {
  console.error('[prepare-mac-sidecars] No Mac sidecars were copied.');
  process.exitCode = 1;
}
