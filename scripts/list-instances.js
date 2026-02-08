#!/usr/bin/env node

/**
 * Lists all running dev instances
 * Scans ports 4200-4209 for frontend/backend pairs
 */

import { execFileSync } from 'child_process';
import { platform } from 'os';

const FRONTEND_PORTS = [4200, 4202, 4204, 4206, 4208];

function isPortInUse(port) {
  const isWindows = platform() === 'win32';

  try {
    if (isWindows) {
      const output = execFileSync('netstat', ['-ano', '-p', 'TCP'], { encoding: 'utf8' });
      const lines = output.split('\n').filter(line => line.includes(`:${port} `) && line.includes('LISTENING'));
      if (lines.length > 0) {
        const parts = lines[0].trim().split(/\s+/);
        return { inUse: true, pid: parts[parts.length - 1] };
      }
    } else {
      const output = execFileSync('lsof', ['-ti', `:${port}`], { encoding: 'utf8' });
      const pid = output.trim().split('\n')[0];
      if (pid) return { inUse: true, pid };
    }
  } catch {
    // No process on port
  }

  return { inUse: false, pid: null };
}

console.log('Scanning for running development instances...\n');

const instances = [];

for (const frontendPort of FRONTEND_PORTS) {
  const backendPort = frontendPort + 1;
  const frontend = isPortInUse(frontendPort);
  const backend = isPortInUse(backendPort);

  if (frontend.inUse || backend.inUse) {
    instances.push({ frontendPort, backendPort, frontend, backend });
  }
}

if (instances.length === 0) {
  console.log('No running instances found.');
  console.log('\nStart a new instance with:');
  console.log('  npm run dev:local');
  console.log('  npm run dev:local -- 4202');
  process.exit(0);
}

console.log('Found running instances:\n');

instances.forEach((instance, index) => {
  const { frontendPort, backendPort, frontend, backend } = instance;

  console.log(`Instance ${index + 1}:`);
  console.log(`  Frontend: ${frontendPort} ${frontend.inUse ? `(PID: ${frontend.pid})` : '(not running)'}`);
  console.log(`  Backend:  ${backendPort} ${backend.inUse ? `(PID: ${backend.pid})` : '(not running)'}`);

  if (frontend.inUse && backend.inUse) {
    console.log('  Status:   Running');
  } else {
    console.log('  Status:   Partial (one process missing)');
  }
  console.log();
});

console.log(`Total: ${instances.length} instance${instances.length > 1 ? 's' : ''} found`);
console.log('\nKill an instance with:');
console.log(`  npm run dev:local:kill -- ${instances[0].frontendPort}`);
