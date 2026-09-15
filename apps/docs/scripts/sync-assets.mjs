import { access, copyFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const iconSource = fileURLToPath(new URL('../../../public/openfolk.png', import.meta.url));
const iconTarget = fileURLToPath(new URL('../public/openfolk.png', import.meta.url));

await mkdir(fileURLToPath(new URL('../public/', import.meta.url)), { recursive: true });

try {
  await access(iconSource);
  await copyFile(iconSource, iconTarget);
} catch {
  // Icon is optional for docs preview when the root public asset is missing.
}
