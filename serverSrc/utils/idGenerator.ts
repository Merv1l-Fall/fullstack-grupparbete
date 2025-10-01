import { randomBytes } from 'crypto';

function cryptoId(length = 8): string {
  return randomBytes(length).toString('base64url').substring(0, length);
}

export { cryptoId };