#!/usr/bin/env node

/**
 * Automated version bump script
 *
 * Usage:
 *   node scripts/bump-version.js patch "Bug fixes"
 *   node scripts/bump-version.js minor "New feature" "Another feature"
 *   node scripts/bump-version.js major "Breaking changes"
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, '..');
const versionFilePath = path.join(rootDir, 'version.json');
const packageJsonPaths = [
  path.join(rootDir, 'package.json'),
  path.join(rootDir, 'frontend', 'package.json'),
  path.join(rootDir, 'backend', 'package.json'),
];

const args = process.argv.slice(2);
const bumpType = args[0];
const changes = args.slice(1);

if (!bumpType || !['major', 'minor', 'patch'].includes(bumpType)) {
  console.error('Error: Invalid bump type. Use "major", "minor", or "patch"');
  console.error('Usage: node scripts/bump-version.js <major|minor|patch> [changelog entries...]');
  console.error('Example: node scripts/bump-version.js patch "Fix login bug" "Update styles"');
  process.exit(1);
}

if (!fs.existsSync(versionFilePath)) {
  console.error('Error: version.json not found');
  process.exit(1);
}

function incrementVersion(version, type) {
  const parts = version.split('.').map(Number);
  switch (type) {
    case 'major': parts[0]++; parts[1] = 0; parts[2] = 0; break;
    case 'minor': parts[1]++; parts[2] = 0; break;
    case 'patch': parts[2]++; break;
  }
  return parts.join('.');
}

const versionData = JSON.parse(fs.readFileSync(versionFilePath, 'utf8'));
const currentVersion = versionData.version;
const newVersion = incrementVersion(currentVersion, bumpType);

console.log(`Bumping version: ${currentVersion} -> ${newVersion} (${bumpType})`);

if (changes.length > 0) {
  console.log('Changes:');
  changes.forEach(entry => console.log(`  - ${entry}`));
}

// Update version.json
versionData.version = newVersion;
fs.writeFileSync(versionFilePath, JSON.stringify(versionData, null, 2) + '\n');
console.log(`\nUpdated version.json to ${newVersion}`);

// Sync to package.json files
packageJsonPaths.forEach(pkgPath => {
  if (fs.existsSync(pkgPath)) {
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
    pkg.version = newVersion;
    fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');
    console.log(`Updated ${path.relative(rootDir, pkgPath)} to ${newVersion}`);
  }
});

console.log('\nVersion bump complete!');
console.log(`\nNext steps:`);
console.log(`  1. Review changes: git diff`);
console.log(`  2. Commit: git add -A && git commit -m "chore: bump version to ${newVersion}"`);
console.log(`  3. Tag: git tag v${newVersion}`);
console.log(`  4. Push: git push && git push --tags`);
