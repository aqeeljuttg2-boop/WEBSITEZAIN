import { PrismaClient } from '@prisma/client';
import path from 'path';
import fs from 'fs';

function initializeDatabaseUrl() {
  if (process.env.DATABASE_URL && !process.env.DATABASE_URL.startsWith('file:./')) {
    return;
  }

  const isServerless = (process.env.VERCEL === '1' || process.env.AWS_LAMBDA_FUNCTION_NAME) && process.platform !== 'win32';

  if (isServerless && typeof window === 'undefined') {
    const tmpDbPath = '/tmp/dev.db';
    const sourceDbPath = path.join(process.cwd(), 'prisma', 'dev.db');

    try {
      if (!fs.existsSync(tmpDbPath) && fs.existsSync(sourceDbPath)) {
        fs.copyFileSync(sourceDbPath, tmpDbPath);
        console.log(`[Database] Initialized SQLite database at ${tmpDbPath}`);
      }
    } catch (e) {
      console.error('[Database] Failed to initialize SQLite file:', e);
    }

    if (fs.existsSync(tmpDbPath)) {
      process.env.DATABASE_URL = `file:${tmpDbPath}`;
      return;
    }
  }

  if (!process.env.DATABASE_URL) {
    process.env.DATABASE_URL = 'file:./dev.db';
  }
}

initializeDatabaseUrl();

const prismaClientSingleton = () => {
  return new PrismaClient();
};

declare global {
  var prisma: undefined | ReturnType<typeof prismaClientSingleton>;
}

const db = globalThis.prisma ?? prismaClientSingleton();

export default db;

if (process.env.NODE_ENV !== 'production') {
  globalThis.prisma = db;
}
