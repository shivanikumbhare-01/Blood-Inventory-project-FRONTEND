import { spawn } from 'node:child_process';

const npmCommand = process.platform === 'win32' ? 'cmd.exe' : 'npm';
const npmArgs = process.platform === 'win32'
  ? ['/d', '/s', '/c', 'npm.cmd', 'run', 'dev:frontend']
  : ['run', 'dev:frontend'];
const children = [];

const run = (name, command, args, options = {}) => {
  const child = spawn(command, args, {
    stdio: 'inherit',
    shell: false,
    env: { ...process.env, ...options.env },
  });

  children.push(child);

  child.on('exit', (code) => {
    if (code && code !== 0) {
      console.error(`${name} exited with code ${code}`);
    }
  });

  return child;
};

const stopAll = () => {
  for (const child of children) {
    if (!child.killed) child.kill();
  }
};

process.on('SIGINT', () => {
  stopAll();
  process.exit(0);
});

process.on('SIGTERM', () => {
  stopAll();
  process.exit(0);
});

run('backend', 'node', ['server/server.js'], { env: { PORT: process.env.PORT || '8001' } });
run('frontend', npmCommand, npmArgs);
