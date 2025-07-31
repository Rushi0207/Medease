import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';
import { logger } from '../utils/logger';

export class MigrationManager {
  private pool: Pool;
  private migrationsDir: string;

  constructor(pool: Pool) {
    this.pool = pool;
    this.migrationsDir = path.join(__dirname, '../migrations');
  }

  async createMigrationsTable(): Promise<void> {
    const query = `
      CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        filename VARCHAR(255) NOT NULL UNIQUE,
        executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;
    
    try {
      await this.pool.query(query);
      logger.info('Migrations table created or already exists');
    } catch (error) {
      logger.error('Failed to create migrations table:', error);
      throw error;
    }
  }

  async getExecutedMigrations(): Promise<string[]> {
    try {
      const result = await this.pool.query('SELECT filename FROM migrations ORDER BY id');
      return result.rows.map(row => row.filename);
    } catch (error) {
      logger.error('Failed to get executed migrations:', error);
      throw error;
    }
  }

  async getMigrationFiles(): Promise<string[]> {
    try {
      if (!fs.existsSync(this.migrationsDir)) {
        fs.mkdirSync(this.migrationsDir, { recursive: true });
        return [];
      }
      
      const files = fs.readdirSync(this.migrationsDir)
        .filter(file => file.endsWith('.sql'))
        .sort();
      
      return files;
    } catch (error) {
      logger.error('Failed to read migration files:', error);
      throw error;
    }
  }

  async executeMigration(filename: string): Promise<void> {
    const filePath = path.join(this.migrationsDir, filename);
    
    try {
      const sql = fs.readFileSync(filePath, 'utf8');
      
      // Execute migration in a transaction
      const client = await this.pool.connect();
      
      try {
        await client.query('BEGIN');
        
        // Execute the migration SQL
        await client.query(sql);
        
        // Record the migration as executed
        await client.query(
          'INSERT INTO migrations (filename) VALUES ($1)',
          [filename]
        );
        
        await client.query('COMMIT');
        logger.info(`Migration executed successfully: ${filename}`);
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    } catch (error) {
      logger.error(`Failed to execute migration ${filename}:`, error);
      throw error;
    }
  }

  async runMigrations(): Promise<void> {
    try {
      // Create migrations table if it doesn't exist
      await this.createMigrationsTable();
      
      // Get list of executed migrations
      const executedMigrations = await this.getExecutedMigrations();
      
      // Get list of migration files
      const migrationFiles = await this.getMigrationFiles();
      
      // Find pending migrations
      const pendingMigrations = migrationFiles.filter(
        file => !executedMigrations.includes(file)
      );
      
      if (pendingMigrations.length === 0) {
        logger.info('No pending migrations');
        return;
      }
      
      logger.info(`Found ${pendingMigrations.length} pending migrations`);
      
      // Execute pending migrations
      for (const migration of pendingMigrations) {
        await this.executeMigration(migration);
      }
      
      logger.info('All migrations executed successfully');
    } catch (error) {
      logger.error('Migration failed:', error);
      throw error;
    }
  }

  async rollbackLastMigration(): Promise<void> {
    try {
      const result = await this.pool.query(
        'SELECT filename FROM migrations ORDER BY id DESC LIMIT 1'
      );
      
      if (result.rows.length === 0) {
        logger.info('No migrations to rollback');
        return;
      }
      
      const lastMigration = result.rows[0].filename;
      const rollbackFile = lastMigration.replace('.sql', '.rollback.sql');
      const rollbackPath = path.join(this.migrationsDir, rollbackFile);
      
      if (!fs.existsSync(rollbackPath)) {
        throw new Error(`Rollback file not found: ${rollbackFile}`);
      }
      
      const rollbackSql = fs.readFileSync(rollbackPath, 'utf8');
      
      const client = await this.pool.connect();
      
      try {
        await client.query('BEGIN');
        
        // Execute rollback SQL
        await client.query(rollbackSql);
        
        // Remove migration record
        await client.query(
          'DELETE FROM migrations WHERE filename = $1',
          [lastMigration]
        );
        
        await client.query('COMMIT');
        logger.info(`Migration rolled back successfully: ${lastMigration}`);
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    } catch (error) {
      logger.error('Rollback failed:', error);
      throw error;
    }
  }
}