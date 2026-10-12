import { readFileSync } from 'node:fs';
import { join } from 'node:path';

/** The app version, read from the repository's package.json at build time. */
export function appVersion(): string {
  try {
    const pkg = JSON.parse(readFileSync(join(process.cwd(), '..', '..', 'package.json'), 'utf8'));
    return typeof pkg.version === 'string' ? pkg.version : '';
  } catch {
    return '';
  }
}
