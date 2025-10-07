import { randomBytes } from 'crypto';

function cryptoId(length: number): string {
  return randomBytes(length).toString('base64url').substring(0, length);
}

export { cryptoId };