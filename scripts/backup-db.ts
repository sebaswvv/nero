import 'dotenv/config';
import { execSync } from 'child_process';
import { existsSync, mkdirSync } from 'fs';
import { join } from 'path';

const PRD_DATABASE_URL = process.env.PRD_DATABASE_URL;

if (!PRD_DATABASE_URL) {
  console.error('❌ PRD_DATABASE_URL not found in environment variables');
  process.exit(1);
}

// Create backups directory if it doesn't exist
const backupsDir = join(process.cwd(), 'backups');
if (!existsSync(backupsDir)) {
  mkdirSync(backupsDir);
}

// Generate filename with timestamp
const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
const filename = `prd_backup_${timestamp}.sql`;
const filepath = join(backupsDir, filename);

console.log('🔄 Starting database backup...');
console.log(`📁 Output: ${filepath}`);

try {
  execSync(`pg_dump "${PRD_DATABASE_URL}" -f "${filepath}"`, {
    stdio: 'inherit',
  });
  console.log('✅ Backup completed successfully!');
} catch (error) {
  console.error('❌ Backup failed:', error);
  process.exit(1);
}
