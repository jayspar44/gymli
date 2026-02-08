#!/usr/bin/env node

/**
 * Environment Setup Script
 * Creates .env files for local development
 *
 * Portable across projects — GCP project is selected at runtime.
 *
 * Usage:
 *   npm run setup:env
 *   or
 *   node scripts/setup-env.js
 *
 * Modes:
 *   - GCP: Automatically fetch secrets from Google Cloud Secret Manager
 *   - Interactive: Manual entry with prompts
 *   - Templates: Copy templates for manual editing
 */

import fs from 'fs';
import path from 'path';
import readline from 'readline';
import { execFile } from 'child_process';
import { promisify } from 'util';
import { fileURLToPath } from 'url';

const execFileAsync = promisify(execFile);

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, '..');

const backendEnvPath = path.join(rootDir, 'backend', '.env');
const frontendEnvPath = path.join(rootDir, 'frontend', '.env.local');

// Derive project display name from root package.json or directory name
const projectName = (() => {
  try {
    const pkg = JSON.parse(fs.readFileSync(path.join(rootDir, 'package.json'), 'utf8'));
    return pkg.name || path.basename(rootDir);
  } catch {
    return path.basename(rootDir);
  }
})();

// Read default ports from .env.example if available
const defaultPorts = (() => {
  try {
    const example = fs.readFileSync(path.join(rootDir, 'backend', '.env.example'), 'utf8');
    const portMatch = example.match(/^PORT=(\d+)/m);
    const backendPort = portMatch ? parseInt(portMatch[1], 10) : 4201;
    return { backend: backendPort, frontend: backendPort - 1 };
  } catch {
    return { backend: 4201, frontend: 4200 };
  }
})();

// Secret names in GCP Secret Manager (standard across projects)
const SECRETS = {
  FIREBASE_SERVICE_ACCOUNT: 'FIREBASE_SERVICE_ACCOUNT',
  GEMINI_API_KEY: 'GEMINI_API_KEY',
  FIREBASE_CLIENT_CONFIG: 'FIREBASE_CLIENT_CONFIG',
};

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

function isValidJSON(str) {
  try {
    JSON.parse(str);
    return true;
  } catch {
    return false;
  }
}

// ─── gcloud helpers ──────────────────────────────────────────

async function gcloud(args) {
  const { stdout } = await execFileAsync('gcloud', args, { shell: true });
  return stdout.trim();
}

async function checkGcloudAvailable() {
  try {
    await gcloud(['--version']);
    return true;
  } catch {
    return false;
  }
}

async function checkGcloudAuth() {
  try {
    const account = await gcloud([
      'auth', 'list', '--filter=status:ACTIVE', '--format=value(account)',
    ]);
    return account.length > 0;
  } catch {
    return false;
  }
}

async function getDefaultProject() {
  try {
    return await gcloud(['config', 'get-value', 'project']);
  } catch {
    return '';
  }
}

async function listProjects() {
  try {
    const output = await gcloud([
      'projects', 'list',
      '--format=value(projectId)',
      '--sort-by=projectId',
      '--limit=20',
    ]);
    return output.split('\n').filter(Boolean);
  } catch {
    return [];
  }
}

async function getGCPSecret(projectId, secretName) {
  try {
    const raw = await gcloud([
      'secrets', 'versions', 'access', 'latest',
      `--secret=${secretName}`,
      `--project=${projectId}`,
    ]);
    // Collapse multi-line JSON to single line for .env compatibility
    try {
      return JSON.stringify(JSON.parse(raw));
    } catch {
      return raw;
    }
  } catch (error) {
    throw new Error(`Failed to fetch secret "${secretName}": ${error.message}`);
  }
}

// ─── Project selection ───────────────────────────────────────

async function selectProject() {
  const defaultProject = await getDefaultProject();

  console.log('Fetching available projects...');
  const projects = await listProjects();

  if (projects.length === 0) {
    console.log('No projects found. Enter a project ID manually.\n');
    while (true) {
      const input = await question('GCP Project ID: ');
      if (input.trim()) return input.trim();
      console.log('Project ID is required.');
    }
  }

  console.log('\nAvailable GCP projects:\n');
  projects.forEach((p, i) => {
    const marker = p === defaultProject ? ' (current)' : '';
    console.log(`  ${i + 1}) ${p}${marker}`);
  });

  const defaultLabel = defaultProject ? ` [${defaultProject}]` : '';
  console.log();
  const input = await question(`Select project (number) or type ID${defaultLabel}: `);
  const trimmed = input.trim();

  // Empty = use default
  if (!trimmed && defaultProject) return defaultProject;

  // Number = index into list
  const num = parseInt(trimmed, 10);
  if (!isNaN(num) && num >= 1 && num <= projects.length) {
    return projects[num - 1];
  }

  // Otherwise treat as a project ID
  return trimmed || defaultProject;
}

// ─── GCP Secret Manager setup ────────────────────────────────

async function setupFromGCP() {
  console.log('\nGCP Secret Manager Setup');
  console.log('================================\n');

  console.log('Checking gcloud CLI...');
  if (!await checkGcloudAvailable()) {
    console.log('\ngcloud CLI not found!');
    console.log('\nTo install: https://cloud.google.com/sdk/docs/install');
    console.log('Then run: gcloud auth login\n');
    return;
  }
  console.log('gcloud CLI found');

  console.log('Checking authentication...');
  if (!await checkGcloudAuth()) {
    console.log('\nNot authenticated with gcloud!');
    console.log('Run: gcloud auth login\n');
    return;
  }
  console.log('Authenticated\n');

  // Select project
  const projectId = await selectProject();
  console.log(`\nUsing project: ${projectId}\n`);

  // Check existing files
  if (fs.existsSync(backendEnvPath)) {
    const overwrite = await question('backend/.env already exists. Overwrite? (y/N): ');
    if (overwrite.toLowerCase() !== 'y') {
      console.log('Skipping backend/.env');
      return;
    }
  }

  if (fs.existsSync(frontendEnvPath)) {
    const overwrite = await question('frontend/.env.local already exists. Overwrite? (y/N): ');
    if (overwrite.toLowerCase() !== 'y') {
      console.log('Skipping frontend/.env.local');
      return;
    }
  }

  console.log('\nFetching secrets from GCP Secret Manager...\n');

  try {
    console.log(`Fetching ${SECRETS.FIREBASE_SERVICE_ACCOUNT}...`);
    const firebaseServiceAccount = await getGCPSecret(projectId, SECRETS.FIREBASE_SERVICE_ACCOUNT);

    console.log(`Fetching ${SECRETS.GEMINI_API_KEY}...`);
    const geminiApiKey = await getGCPSecret(projectId, SECRETS.GEMINI_API_KEY);

    const backendEnvContent = `PORT=${defaultPorts.backend}
FIREBASE_SERVICE_ACCOUNT=${firebaseServiceAccount}
GEMINI_API_KEY=${geminiApiKey}
NODE_ENV=development
ALLOWED_ORIGINS=http://localhost:${defaultPorts.frontend},http://localhost:${defaultPorts.backend},capacitor://localhost
`;

    fs.writeFileSync(backendEnvPath, backendEnvContent);
    console.log('Created backend/.env');

    // Frontend config
    let firebaseClientConfig = '';

    try {
      console.log(`\nFetching ${SECRETS.FIREBASE_CLIENT_CONFIG}...`);
      firebaseClientConfig = await getGCPSecret(projectId, SECRETS.FIREBASE_CLIENT_CONFIG);

      if (!isValidJSON(firebaseClientConfig)) {
        throw new Error('Invalid JSON in Firebase client config');
      }
    } catch {
      console.log(`Could not fetch ${SECRETS.FIREBASE_CLIENT_CONFIG} from GCP`);
      console.log('  You may need to add this secret to Secret Manager or enter it manually.\n');
      console.log('Enter Firebase Client Config JSON:');
      console.log('Get from: Firebase Console > Project Settings > General > Your apps > Web app config\n');

      while (!firebaseClientConfig) {
        const input = await question('VITE_FIREBASE_CONFIG: ');
        if (!input.trim()) {
          console.log('Firebase config is required');
          continue;
        }
        if (!isValidJSON(input)) {
          console.log('Invalid JSON. Please paste the entire config object on one line.');
          continue;
        }
        firebaseClientConfig = input.trim();
      }
    }

    const frontendEnvContent = `VITE_API_URL=/api
VITE_FIREBASE_CONFIG=${firebaseClientConfig}
`;

    fs.writeFileSync(frontendEnvPath, frontendEnvContent);
    console.log('Created frontend/.env.local');

    console.log('\nEnvironment setup from GCP complete!');
    console.log('\nNext steps:');
    console.log('  1. Run: npm run dev:local');
    console.log(`  2. Open: http://localhost:${defaultPorts.frontend}\n`);
  } catch (error) {
    console.error('\nError fetching secrets from GCP:');
    console.error(`  ${error.message}\n`);
    console.log('Make sure:');
    console.log(`  1. You have access to the ${projectId} project`);
    console.log('  2. Secret Manager API is enabled');
    console.log('  3. Secrets exist in Secret Manager');
    console.log('  4. You have permission to access secrets\n');
    console.log('Try manual setup instead (option 2).\n');
  }
}

// ─── Interactive setup ───────────────────────────────────────

async function setupBackendEnv() {
  console.log('\nBackend Environment Setup');
  console.log('================================\n');

  let firebaseServiceAccount = '';
  let geminiApiKey = '';
  let port = String(defaultPorts.backend);
  let nodeEnv = 'development';

  if (fs.existsSync(backendEnvPath)) {
    const overwrite = await question('backend/.env already exists. Overwrite? (y/N): ');
    if (overwrite.toLowerCase() !== 'y') {
      console.log('Skipping backend/.env');
      return;
    }
  }

  console.log('\n1. Firebase Service Account JSON');
  console.log('   Get from: Firebase Console > Project Settings > Service Accounts > Generate New Private Key');
  console.log('   Paste the entire JSON on one line:\n');

  while (!firebaseServiceAccount) {
    const input = await question('FIREBASE_SERVICE_ACCOUNT: ');
    if (!input.trim()) {
      console.log('Firebase service account is required');
      continue;
    }
    if (!isValidJSON(input)) {
      console.log('Invalid JSON. Please paste the entire JSON on one line.');
      continue;
    }
    firebaseServiceAccount = input.trim();
  }

  console.log('\n2. Google Gemini API Key');
  console.log('   Get from: https://aistudio.google.com/app/apikey\n');

  while (!geminiApiKey) {
    const input = await question('GEMINI_API_KEY: ');
    if (!input.trim()) {
      console.log('Gemini API key is required');
      continue;
    }
    geminiApiKey = input.trim();
  }

  const portInput = await question(`\n3. Backend port (default: ${defaultPorts.backend}): `);
  if (portInput.trim()) port = portInput.trim();

  const envInput = await question('4. Node environment (default: development): ');
  if (envInput.trim()) nodeEnv = envInput.trim();

  const frontendPort = parseInt(port, 10) - 1;
  const envContent = `PORT=${port}
FIREBASE_SERVICE_ACCOUNT=${firebaseServiceAccount}
GEMINI_API_KEY=${geminiApiKey}
NODE_ENV=${nodeEnv}
ALLOWED_ORIGINS=http://localhost:${frontendPort},http://localhost:${port},capacitor://localhost
`;

  fs.writeFileSync(backendEnvPath, envContent);
  console.log('\nCreated backend/.env');
}

async function setupFrontendEnv() {
  console.log('\nFrontend Environment Setup');
  console.log('================================\n');

  let firebaseConfig = '';
  let apiUrl = '/api';

  if (fs.existsSync(frontendEnvPath)) {
    const overwrite = await question('frontend/.env.local already exists. Overwrite? (y/N): ');
    if (overwrite.toLowerCase() !== 'y') {
      console.log('Skipping frontend/.env.local');
      return;
    }
  }

  console.log('1. Firebase Client Config JSON');
  console.log('   Get from: Firebase Console > Project Settings > General > Your apps > Web app config');
  console.log('   Paste the firebaseConfig object on one line:\n');

  while (!firebaseConfig) {
    const input = await question('VITE_FIREBASE_CONFIG: ');
    if (!input.trim()) {
      console.log('Firebase config is required');
      continue;
    }
    if (!isValidJSON(input)) {
      console.log('Invalid JSON. Please paste the entire config object on one line.');
      continue;
    }
    firebaseConfig = input.trim();
  }

  const apiUrlInput = await question('\n2. Backend API URL (default: /api for local proxy): ');
  if (apiUrlInput.trim()) apiUrl = apiUrlInput.trim();

  const envContent = `VITE_API_URL=${apiUrl}
VITE_FIREBASE_CONFIG=${firebaseConfig}
`;

  fs.writeFileSync(frontendEnvPath, envContent);
  console.log('\nCreated frontend/.env.local');
}

// ─── Template setup ──────────────────────────────────────────

async function setupFromTemplates() {
  console.log('\nQuick Setup from Templates');
  console.log('================================\n');

  const backendTemplate = path.join(rootDir, 'backend', '.env.example');
  const frontendTemplate = path.join(rootDir, 'frontend', '.env.local.template');

  // Backend
  const shouldWriteBackend = !fs.existsSync(backendEnvPath) ||
    (await question('backend/.env already exists. Overwrite? (y/N): ')).toLowerCase() === 'y';

  if (shouldWriteBackend && fs.existsSync(backendTemplate)) {
    fs.copyFileSync(backendTemplate, backendEnvPath);
    console.log('Created backend/.env from template');
    console.log('  Edit backend/.env and add your credentials!');
  } else if (shouldWriteBackend) {
    console.log('backend/.env.example not found');
  }

  // Frontend
  const shouldWriteFrontend = !fs.existsSync(frontendEnvPath) ||
    (await question('frontend/.env.local already exists. Overwrite? (y/N): ')).toLowerCase() === 'y';

  if (shouldWriteFrontend && fs.existsSync(frontendTemplate)) {
    fs.copyFileSync(frontendTemplate, frontendEnvPath);
    console.log('Created frontend/.env.local from template');
    console.log('  Edit frontend/.env.local and add your Firebase config!');
  } else if (shouldWriteFrontend) {
    console.log('frontend/.env.local.template not found');
  }
}

// ─── Main ────────────────────────────────────────────────────

async function main() {
  const title = `${projectName.charAt(0).toUpperCase() + projectName.slice(1)} Environment Setup`;
  console.log(title);
  console.log('='.repeat(title.length) + '\n');

  console.log('Choose setup method:');
  console.log('1) GCP Secret Manager (automatic - requires gcloud CLI)');
  console.log('2) Interactive (guided setup with prompts)');
  console.log('3) From templates (copy templates, edit manually)');
  console.log('4) Cancel\n');

  const choice = await question('Enter choice [1-4]: ');

  switch (choice.trim()) {
    case '1':
      await setupFromGCP();
      break;

    case '2':
      await setupBackendEnv();
      await setupFrontendEnv();
      console.log('\nEnvironment setup complete!');
      console.log('\nNext steps:');
      console.log('  1. Verify your .env files have correct values');
      console.log('  2. Run: npm run dev:local');
      console.log(`  3. Open: http://localhost:${defaultPorts.frontend}\n`);
      break;

    case '3':
      await setupFromTemplates();
      console.log('\nTemplate files created!');
      console.log('\nNext steps:');
      console.log('  1. Edit backend/.env - add Firebase service account & Gemini API key');
      console.log('  2. Edit frontend/.env.local - add Firebase client config');
      console.log('  3. Run: npm run dev:local');
      console.log(`  4. Open: http://localhost:${defaultPorts.frontend}\n`);
      break;

    case '4':
      console.log('Setup cancelled.');
      break;

    default:
      console.log('Invalid choice. Exiting.');
      break;
  }

  rl.close();
}

// Verify .env files are in .gitignore
const gitignorePath = path.join(rootDir, '.gitignore');
if (fs.existsSync(gitignorePath)) {
  const gitignoreContent = fs.readFileSync(gitignorePath, 'utf8');
  if (!gitignoreContent.includes('.env')) {
    console.warn('\nWARNING: .env files may not be in .gitignore!');
    console.warn('Make sure to add .env files to .gitignore to prevent committing secrets.\n');
  }
}

main().catch((error) => {
  console.error('Error:', error.message);
  rl.close();
  process.exit(1);
});
