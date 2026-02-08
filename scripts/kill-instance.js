#!/usr/bin/env node

/**
 * Kills a running dev instance by port (force kill)
 *
 * Usage:
 *   npm run dev:local:kill              # Kill instance on 4200/4201
 *   npm run dev:local:kill -- 4202      # Kill instance on 4202/4203
 */

import { execFileSync } from 'child_process';
import { platform } from 'os';

const VALID_FRONTEND_PORTS = [4200, 4202, 4204, 4206, 4208];

function findAndKillPort(port) {
  const isWindows = platform() === 'win32';
  let killed = false;

  try {
    if (isWindows) {
      const output = execFileSync('netstat', ['-ano', '-p', 'TCP'], { encoding: 'utf8' });
      const lines = output.split('\n').filter(line => line.includes(`:${port} `) && line.includes('LISTENING'));
      const pids = new Set();
      for (const line of lines) {
        const parts = line.trim().split(/\s+/);
        const pid = parts[parts.length - 1];
        if (pid && pid !== '0') pids.add(pid);
      }
      for (const pid of pids) {
        try {
          execFileSync('taskkill', ['/PID', pid, '/F'], { encoding: 'utf8' });
          killed = true;
        } catch { /* process may already be gone */ }
      }
    } else {
      const output = execFileSync('lsof', ['-ti', `:${port}`], { encoding: 'utf8' });
      const pids = output.trim().split('\n').filter(Boolean);
      for (const pid of pids) {
        try {
          execFileSync('kill', ['-9', pid]);
          killed = true;
        } catch { /* process may already be gone */ }
      }
    }
  } catch {
    // No process found on port
  }

  return killed;
}

const args = process.argv.slice(2);
const portArg = args[0];
const frontendPort = portArg ? parseInt(portArg, 10) : 4200;

if (isNaN(frontendPort)) {
  console.error(`Error: Invalid port "${portArg}". Must be a number.`);
  process.exit(1);
}

if (!VALID_FRONTEND_PORTS.includes(frontendPort)) {
  console.error(`Error: Invalid port ${frontendPort}. Valid frontend ports are: ${VALID_FRONTEND_PORTS.join(', ')}`);
  process.exit(1);
}

const backendPort = frontendPort + 1;

console.log(`Killing instance on ports ${frontendPort} (frontend) and ${backendPort} (backend)...`);

const killedFrontend = findAndKillPort(frontendPort);
const killedBackend = findAndKillPort(backendPort);

if (killedFrontend || killedBackend) {
  console.log(`Successfully killed processes on ports ${frontendPort} and ${backendPort}`);
} else {
  console.log(`No processes found on ports ${frontendPort} or ${backendPort}`);
}
