import 'dotenv/config';
import { execSync } from 'child_process';
import { existsSync, mkdirSync } from 'fs';
import { join, isAbsolute } from 'path';

const PRD_DATABASE_URL = process.env.PRD_DATABASE_URL;

if (!PRD_DATABASE_URL) {
  console.error('❌ PRD_DATABASE_URL not found in environment variables');
  process.exit(1);
}

// get backup directory from command line argument or use default
const customBackupDir = process.argv[2];
const backupsDir = customBackupDir 
  ? (isAbsolute(customBackupDir) ? customBackupDir : join(process.cwd(), customBackupDir))
  : join(process.cwd(), 'backups');

// create backups directory if it doesn't exist
if (!existsSync(backupsDir)) {
  mkdirSync(backupsDir, { recursive: true });
}

// generate filename with timestamp
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
