#!/usr/bin/env node

/**
 * Prints the current version from version.json to stdout.
 * Useful for CI/CD scripts and other tooling.
 *
 * Usage: node scripts/get-version.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const versionFilePath = path.join(__dirname, '..', 'version.json');

try {
  if (!fs.existsSync(versionFilePath)) {
    console.error('Error: version.json not found');
    process.exit(1);
  }

  const versionData = JSON.parse(fs.readFileSync(versionFilePath, 'utf8'));
  console.log(versionData.version);
} catch (error) {
  console.error('Error reading version:', error.message);
  process.exit(1);
}
