import { spawn } from 'child_process';
import { platform } from 'os';

const frontend = spawn('npm', ['run', 'dev'], {
  cwd: 'frontend',
  stdio: 'pipe',
  shell: true,
  env: { ...process.env, PORT: '4200' },
});

const backend = spawn('npm', ['run', 'dev'], {
  cwd: 'backend',
  stdio: 'pipe',
  shell: true,
  env: { ...process.env, PORT: '4201' },
});

frontend.stdout.on('data', (data) => {
  process.stdout.write(`[frontend] ${data}`);
});

frontend.stderr.on('data', (data) => {
  process.stderr.write(`[frontend] ${data}`);
});

backend.stdout.on('data', (data) => {
  process.stdout.write(`[backend]  ${data}`);
});

backend.stderr.on('data', (data) => {
  process.stderr.write(`[backend]  ${data}`);
});

function cleanup() {
  frontend.kill();
  backend.kill();
  process.exit();
}

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);

frontend.on('close', (code) => {
  console.log(`[frontend] exited with code ${code}`);
});

backend.on('close', (code) => {
  console.log(`[backend]  exited with code ${code}`);
});

console.log('[dev] Starting frontend on http://localhost:4200');
console.log('[dev] Starting backend on http://localhost:4201');
