#!/usr/bin/env node

/**
 * Environment validation script for Gymli
 * Checks that required environment variables are properly configured
 *
 * Usage: npm run validate-env
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, '..');

console.log('Validating environment configuration...\n');

let hasErrors = false;

// Frontend validation
console.log('Frontend Configuration:');
const frontendEnvPath = path.join(rootDir, 'frontend', '.env.local');

if (fs.existsSync(frontendEnvPath)) {
  try {
    const frontendEnv = fs.readFileSync(frontendEnvPath, 'utf8');

    if (frontendEnv.includes('VITE_FIREBASE_CONFIG=')) {
      const configMatch = frontendEnv.match(/VITE_FIREBASE_CONFIG=(.+)/);
      if (configMatch && configMatch[1] && !configMatch[1].includes('...')) {
        try {
          JSON.parse(configMatch[1]);
          console.log('  VITE_FIREBASE_CONFIG: Valid JSON format');
        } catch {
          console.log('  VITE_FIREBASE_CONFIG: Invalid JSON format');
          hasErrors = true;
        }
      } else {
        console.log('  VITE_FIREBASE_CONFIG: Not configured (using template value)');
        hasErrors = true;
      }
    } else {
      console.log('  VITE_FIREBASE_CONFIG: Missing');
      hasErrors = true;
    }

    if (frontendEnv.includes('VITE_API_URL=')) {
      console.log('  VITE_API_URL: Configured');
    } else {
      console.log('  VITE_API_URL: Missing');
      hasErrors = true;
    }
  } catch {
    console.log('  Error reading frontend .env.local file');
    hasErrors = true;
  }
} else {
  console.log('  frontend/.env.local not found');
  console.log('  Copy frontend/.env.local.template to frontend/.env.local');
  hasErrors = true;
}

// Backend validation
console.log('\nBackend Configuration:');
const backendEnvPath = path.join(rootDir, 'backend', '.env');

if (fs.existsSync(backendEnvPath)) {
  try {
    const backendEnv = fs.readFileSync(backendEnvPath, 'utf8');

    const requiredVars = ['FIREBASE_SERVICE_ACCOUNT', 'GEMINI_API_KEY', 'PORT'];

    requiredVars.forEach(varName => {
      if (backendEnv.includes(`${varName}=`)) {
        const match = backendEnv.match(new RegExp(`${varName}=(.+)`));
        if (match && match[1] && !match[1].includes('your-') && !match[1].includes('...')) {
          if (varName === 'FIREBASE_SERVICE_ACCOUNT') {
            try {
              JSON.parse(match[1]);
              console.log(`  ${varName}: Valid JSON format`);
            } catch {
              console.log(`  ${varName}: Invalid JSON format`);
              hasErrors = true;
            }
          } else {
            console.log(`  ${varName}: Configured`);
          }
        } else {
          console.log(`  ${varName}: Not configured (using template value)`);
          hasErrors = true;
        }
      } else {
        console.log(`  ${varName}: Missing`);
        hasErrors = true;
      }
    });
  } catch {
    console.log('  Error reading backend .env file');
    hasErrors = true;
  }
} else {
  console.log('  backend/.env not found');
  console.log('  Copy backend/.env.example to backend/.env');
  hasErrors = true;
}

console.log();
if (hasErrors) {
  console.log('Some configuration issues found. Run "npm run setup:env" to configure.\n');
  process.exit(1);
} else {
  console.log('All environment variables configured correctly.');
  console.log('Run: npm run dev:local\n');
}
