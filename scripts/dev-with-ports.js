#!/usr/bin/env node

/**
 * Unified development server launcher with optional port and browser control
 *
 * Usage: npm run dev:local [-- [port] [--browser]]
 *
 * Examples:
 *   npm run dev:local                    # Default ports (4200/4201), no browser
 *   npm run dev:local -- 4202            # Custom ports (4202/4203), no browser
 *   npm run dev:local -- --browser       # Default ports, open browser
 *   npm run dev:local -- 4202 --browser  # Custom ports, open browser
 *
 * Arguments:
 *   port         Optional frontend port number (backend will be port+1)
 *   --browser    Open browser automatically (default: don't open)
 *   --open       Alias for --browser
 *   --help       Show this help message
 */

import { spawn, execFileSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, '..');

// Parse command line arguments
const args = process.argv.slice(2);
let frontendPort = '4200';
let openBrowser = false;

if (args.includes('--help') || args.includes('-h')) {
  console.log(`
Unified development server launcher with optional port and browser control

Usage: npm run dev:local [-- [port] [--browser]]

Examples:
  npm run dev:local                    # Default ports (4200/4201), no browser
  npm run dev:local -- 4202            # Custom ports (4202/4203), no browser
  npm run dev:local -- --browser       # Default ports, open browser
  npm run dev:local -- 4202 --browser  # Custom ports, open browser

Arguments:
  port         Optional frontend port number (backend will be port+1)
  --browser    Open browser automatically (default: don't open)
  --open       Alias for --browser
  --help       Show this help message
`);
  process.exit(0);
}

args.forEach(arg => {
  if (arg === '--browser' || arg === '--open') {
    openBrowser = true;
  } else if (!arg.startsWith('--')) {
    const portNum = parseInt(arg, 10);
    if (!isNaN(portNum)) {
      frontendPort = arg;
    }
  }
});

// Validate port (must be 4200-4208 to keep backend within range 4201-4209)
const frontendPortNum = parseInt(frontendPort, 10);
if (isNaN(frontendPortNum) || frontendPortNum < 4200 || frontendPortNum > 4208) {
  console.error(`Error: Invalid port number "${frontendPort}"`);
  console.error('Port must be between 4200 and 4208 (backend will be port+1, max 4209)');
  console.error('Supports 5 concurrent instances (e.g., 4200/4201, 4202/4203, ..., 4208/4209)');
  console.error('\nRun "npm run dev:local -- --help" for usage information');
  process.exit(1);
}

const backendPort = frontendPortNum + 1;

const chalk = {
  blue: (text) => `\x1b[34m${text}\x1b[0m`,
  green: (text) => `\x1b[32m${text}\x1b[0m`,
  red: (text) => `\x1b[31m${text}\x1b[0m`,
  yellow: (text) => `\x1b[33m${text}\x1b[0m`,
};

console.log('='.repeat(60));
console.log('Starting development servers:');
console.log(`  Frontend: http://localhost:${frontendPort}`);
console.log(`  Backend:  http://localhost:${backendPort}`);
console.log('='.repeat(60));
console.log();

// Worktree support: auto-copy .env files from base repo
const currentDir = path.basename(path.resolve(rootDir));
const backendEnvPath = path.join(rootDir, 'backend', '.env');
const frontendEnvPath = path.join(rootDir, 'frontend', '.env.local');

if (currentDir !== 'gymli') {
  console.log(chalk.yellow('Worktree detected. Checking for .env files...\n'));

  const findBaseDirectory = () => {
    const currentPath = path.resolve(rootDir);
    for (let i = 0; i < 4; i++) {
      const testPath = path.resolve(currentPath, '../'.repeat(i), 'gymli');
      if (fs.existsSync(testPath)) {
        const testBackendEnv = path.join(testPath, 'backend', '.env');
        if (fs.existsSync(testBackendEnv)) {
          return testPath;
        }
      }
    }
    return null;
  };

  const baseDir = findBaseDirectory();

  if (baseDir) {
    console.log(`Found base directory: ${baseDir}\n`);

    if (!fs.existsSync(backendEnvPath)) {
      const source = path.join(baseDir, 'backend', '.env');
      if (fs.existsSync(source)) {
        try {
          fs.copyFileSync(source, backendEnvPath);
          console.log(chalk.green('Copied backend/.env from base directory'));
        } catch (error) {
          console.log(chalk.yellow(`Could not copy backend/.env: ${error.message}`));
        }
      }
    } else {
      console.log(chalk.green('backend/.env already exists'));
    }

    if (!fs.existsSync(frontendEnvPath)) {
      const source = path.join(baseDir, 'frontend', '.env.local');
      if (fs.existsSync(source)) {
        try {
          fs.copyFileSync(source, frontendEnvPath);
          console.log(chalk.green('Copied frontend/.env.local from base directory'));
        } catch (error) {
          console.log(chalk.yellow(`Could not copy frontend/.env.local: ${error.message}`));
        }
      }
    } else {
      console.log(chalk.green('frontend/.env.local already exists'));
    }

    console.log();
  } else {
    console.log(chalk.yellow('Could not find base gymli directory'));
    console.log(chalk.yellow('  If you need .env files, copy them manually from the main directory\n'));
  }
}

// Auto-install missing dependencies
const backendNodeModules = path.join(rootDir, 'backend', 'node_modules');
const frontendNodeModules = path.join(rootDir, 'frontend', 'node_modules');
const backendMissing = !fs.existsSync(backendNodeModules);
const frontendMissing = !fs.existsSync(frontendNodeModules);

if (backendMissing || frontendMissing) {
  console.log('Missing dependencies detected. Installing...\n');
  try {
    if (backendMissing) {
      console.log('Installing backend dependencies...');
      execFileSync('npm', ['install'], { cwd: path.join(rootDir, 'backend'), stdio: 'inherit', shell: true });
      console.log('Backend dependencies installed\n');
    }
    if (frontendMissing) {
      console.log('Installing frontend dependencies...');
      execFileSync('npm', ['install'], { cwd: path.join(rootDir, 'frontend'), stdio: 'inherit', shell: true });
      console.log('Frontend dependencies installed\n');
    }
  } catch (error) {
    console.error('Failed to install dependencies:', error.message);
    process.exit(1);
  }
}

// Spawn backend
const backendProcess = spawn('npm', ['run', 'dev'], {
  cwd: path.join(rootDir, 'backend'),
  env: { ...process.env, PORT: backendPort.toString(), FORCE_COLOR: '1' },
  shell: true,
  stdio: ['ignore', 'pipe', 'pipe'],
});

// Spawn frontend
const frontendArgs = openBrowser
  ? ['vite', '--port', frontendPort.toString(), '--open']
  : ['vite', '--port', frontendPort.toString()];
const frontendProcess = spawn('npx', frontendArgs, {
  cwd: path.join(rootDir, 'frontend'),
  env: { ...process.env, PORT: frontendPort.toString(), BACKEND_PORT: backendPort.toString(), FORCE_COLOR: '1' },
  shell: true,
  stdio: ['ignore', 'pipe', 'pipe'],
});

// Prefix output
backendProcess.stdout?.on('data', (data) => {
  data.toString().split('\n').forEach(line => {
    if (line.trim()) console.log(`${chalk.blue('[backend]')} ${line}`);
  });
});
backendProcess.stderr?.on('data', (data) => {
  data.toString().split('\n').forEach(line => {
    if (line.trim()) console.log(`${chalk.blue('[backend]')} ${line}`);
  });
});
frontendProcess.stdout?.on('data', (data) => {
  data.toString().split('\n').forEach(line => {
    if (line.trim()) console.log(`${chalk.green('[frontend]')} ${line}`);
  });
});
frontendProcess.stderr?.on('data', (data) => {
  data.toString().split('\n').forEach(line => {
    if (line.trim()) console.log(`${chalk.green('[frontend]')} ${line}`);
  });
});

// Handle exits
backendProcess.on('exit', (code) => {
  console.log(`${chalk.red('[backend]')} Process exited with code ${code}`);
  frontendProcess.kill();
  process.exit(code || 0);
});
frontendProcess.on('exit', (code) => {
  console.log(`${chalk.red('[frontend]')} Process exited with code ${code}`);
  backendProcess.kill();
  process.exit(code || 0);
});
backendProcess.on('error', (error) => {
  console.error(`${chalk.red('[backend]')} Failed to start:`, error.message);
  frontendProcess.kill();
  process.exit(1);
});
frontendProcess.on('error', (error) => {
  console.error(`${chalk.red('[frontend]')} Failed to start:`, error.message);
  backendProcess.kill();
  process.exit(1);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\nShutting down development servers...');
  backendProcess.kill('SIGINT');
  frontendProcess.kill('SIGINT');
  process.exit(0);
});
process.on('SIGTERM', () => {
  backendProcess.kill('SIGTERM');
  frontendProcess.kill('SIGTERM');
  process.exit(0);
});
