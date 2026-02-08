import { readFileSync, writeFileSync } from 'fs';
import { execFileSync } from 'child_process';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { platform } from 'os';

const __dirname = dirname(fileURLToPath(import.meta.url));
const frontendDir = join(__dirname, '..');
const configPath = join(frontendDir, 'capacitor.config.json');

const flavors = {
  local: {
    appId: 'io.gimli.app.local',
    appName: 'Gimli (Local)',
    apiUrl: 'http://10.0.2.2:4001/api',
  },
  dev: {
    appId: 'io.gimli.app.dev',
    appName: 'Gimli (Dev)',
    apiUrl: null,
  },
  prod: {
    appId: 'io.gimli.app',
    appName: 'Gimli',
    apiUrl: null,
  },
};

const flavor = process.argv[2] || 'dev';
const config = flavors[flavor];

if (!config) {
  console.error(`Unknown flavor: ${flavor}. Use: local, dev, prod`);
  process.exit(1);
}

console.log(`Building for flavor: ${flavor}`);
console.log(`  App ID: ${config.appId}`);
console.log(`  App Name: ${config.appName}`);

// Update capacitor.config.json
const capConfig = JSON.parse(readFileSync(configPath, 'utf-8'));
capConfig.appId = config.appId;
capConfig.appName = config.appName;
writeFileSync(configPath, JSON.stringify(capConfig, null, 2) + '\n');

// Set env for build if needed
if (config.apiUrl) {
  process.env.VITE_API_URL = config.apiUrl;
}

const npm = platform() === 'win32' ? 'npm.cmd' : 'npm';
const npx = platform() === 'win32' ? 'npx.cmd' : 'npx';

// Build
console.log('\nBuilding frontend...');
execFileSync(npm, ['run', 'build'], { cwd: frontendDir, stdio: 'inherit' });

// Sync with Capacitor
console.log('\nSyncing with Capacitor...');
execFileSync(npx, ['cap', 'sync', 'android'], { cwd: frontendDir, stdio: 'inherit' });

console.log(`\nDone! Open Android Studio with: npx cap open android`);
