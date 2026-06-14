import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { client } from './db/index.js';

// Usage: node server/reset-password.js <username> <new-password>
const [, , username, newPassword] = process.argv;

if (!username || !newPassword) {
  console.error('Usage: node server/reset-password.js <username> <new-password>');
  process.exit(1);
}

const hash = bcrypt.hashSync(newPassword, 10);

const result = await client.execute({
  sql: 'UPDATE users SET password_hash = ? WHERE username = ?',
  args: [hash, username],
});

if (result.rowsAffected === 0) {
  console.error(`No user found with username "${username}".`);
  process.exit(1);
}

console.log(`Password updated for "${username}". You can log in with the new password now.`);
process.exit(0);
