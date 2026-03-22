const { PostgreSqlContainer } = require('@testcontainers/postgresql');
const { execSync } = require('child_process');
const path = require('path');

module.exports = async function globalSetup() {
  console.log('\n🐳 Starting PostgreSQL test container...');

  const container = await new PostgreSqlContainer('postgres:16-alpine')
    .withDatabase('test_db')
    .withUsername('test')
    .withPassword('test')
    .start();

  const databaseUrl = container.getConnectionUri();
  console.log(`✅ PostgreSQL ready`);

  // Set env vars — workers are forked after globalSetup completes,
  // so they inherit these values from the parent process.
  process.env.DATABASE_URL = databaseUrl;
  process.env.JWT_SECRET = 'test-jwt-secret-for-tests-minimum-32-chars';
  process.env.JWT_EXPIRES_IN = '15m';
  process.env.BCRYPT_ROUNDS = '1';
  process.env.NODE_ENV = 'test';

  // Push the Prisma schema to the test DB (no migration files needed).
  // Use `pnpm prisma` so pnpm resolves the binary from packages/db's
  // own node_modules — avoids relying on hoisting to the workspace root.
  console.log('🔄 Pushing schema to test database...');
  const dbPackageDir = path.resolve(__dirname, '../../packages/db');

  execSync('pnpm prisma db push --skip-generate --accept-data-loss', {
    cwd: dbPackageDir,
    env: { ...process.env, DATABASE_URL: databaseUrl },
    stdio: 'inherit',
  });
  console.log('✅ Schema ready\n');

  // Store on global — globalSetup and globalTeardown run in the same
  // Jest CLI process, so this reference is accessible in teardown.
  global.__POSTGRES_CONTAINER__ = container;
};
