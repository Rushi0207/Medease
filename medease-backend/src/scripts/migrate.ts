#!/usr/bin/env ts-node

import dotenv from 'dotenv';
import { pool } from '../config/database';
import { MigrationManager } from '../config/migrations';
import { logger } from '../utils/logger';

// Load environment variables
dotenv.config();

const runMigrations = async () => {
  try {
    logger.info('Starting database migrations...');
    
    const migrationManager = new MigrationManager(pool);
    await migrationManager.runMigrations();
    
    logger.info('✅ All migrations completed successfully');
    process.exit(0);
  } catch (error) {
    logger.error('❌ Migration failed:', error);
    process.exit(1);
  }
};

const rollbackLastMigration = async () => {
  try {
    logger.info('Rolling back last migration...');
    
    const migrationManager = new MigrationManager(pool);
    await migrationManager.rollbackLastMigration();
    
    logger.info('✅ Rollback completed successfully');
    process.exit(0);
  } catch (error) {
    logger.error('❌ Rollback failed:', error);
    process.exit(1);
  }
};

// Parse command line arguments
const command = process.argv[2];

switch (command) {
  case 'up':
    runMigrations();
    break;
  case 'down':
    rollbackLastMigration();
    break;
  default:
    console.log('Usage: npm run migrate [up|down]');
    console.log('  up   - Run all pending migrations');
    console.log('  down - Rollback the last migration');
    process.exit(1);
}