
import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import { emailVerificationTokens, passwordResetTokens } from '@shared/schema';

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql);

async function migrate() {
  console.log('Creating email verification tables...');
  
  try {
    // Create email_verification_tokens table
    await sql`
      CREATE TABLE IF NOT EXISTS email_verification_tokens (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id VARCHAR NOT NULL REFERENCES users(id),
        token TEXT NOT NULL UNIQUE,
        expires_at TIMESTAMP NOT NULL,
        used_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `;
    
    // Create password_reset_tokens table
    await sql`
      CREATE TABLE IF NOT EXISTS password_reset_tokens (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id VARCHAR NOT NULL REFERENCES users(id),
        token TEXT NOT NULL UNIQUE,
        expires_at TIMESTAMP NOT NULL,
        used_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `;
    
    // Create indexes
    await sql`CREATE INDEX IF NOT EXISTS idx_email_verification_tokens_token ON email_verification_tokens (token)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_token ON password_reset_tokens (token)`;
    
    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

migrate();
