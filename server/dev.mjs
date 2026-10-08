import { spawn } from 'node:child_process';

const emailPort = Number(process.env.EMAIL_API_PORT || 3001);
const webPort = Number(process.env.PORT || 3000);
const children = new Set();

async function isResponding(url) {
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(1200) });
    return response.ok;
  } catch {
    return false;
  }
}

function run(name, command, args) {
  const child = spawn(command, args, {
    cwd: process.cwd(),
    env: process.env,
    stdio: 'inherit',
  });
  children.add(child);
  child.once('error', (error) => {
    console.error(`[${name}] failed to start: ${error.message}`);
    shutdown(1);
  });
  child.once('exit', (code) => {
    children.delete(child);
    if (code !== 0 && code !== null) {
      console.error(`[${name}] exited with code ${code}`);
      shutdown(code);
    } else if (children.size > 0) {
      shutdown(0);
    }
  });
  return child;
}

let stopping = false;
function shutdown(exitCode = 0) {
  if (stopping) return;
  stopping = true;
  for (const child of children) child.kill();
  if (children.size === 0) process.exit(exitCode);
  const timer = setTimeout(() => process.exit(exitCode), 3000);
  timer.unref();
}

process.on('SIGINT', () => shutdown(0));
process.on('SIGTERM', () => shutdown(0));

const emailRunning = await isResponding(`http://127.0.0.1:${emailPort}/api/email-health`);
const webRunning = await isResponding(`http://127.0.0.1:${webPort}/`);

if (emailRunning) console.log(`Reusing email API on port ${emailPort}.`);
else run('email', process.execPath, ['server/email-api.mjs']);

if (webRunning) console.log(`Reusing Vite frontend on port ${webPort}.`);
else run('web', process.execPath, ['node_modules/vite/bin/vite.js']);

if (children.size === 0) {
  console.log('Frontend and email API are already running.');
  process.exit(0);
}
