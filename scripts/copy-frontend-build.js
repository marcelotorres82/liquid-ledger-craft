import { cpSync, existsSync, mkdirSync, rmSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve('.');
const source = resolve(root, 'frontend/dist');
const destination = resolve(root, 'public/app');

if (!existsSync(source)) {
  throw new Error(`Frontend build not found at ${source}`);
}

mkdirSync(destination, { recursive: true });
rmSync(destination, { recursive: true, force: true });
mkdirSync(destination, { recursive: true });
cpSync(source, destination, { recursive: true });

console.log(`Copied frontend build to ${destination}`);
