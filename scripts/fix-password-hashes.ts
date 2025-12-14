/**
 * Fix Password Hashes Migration
 * 
 * This script fixes the critical security issue where passwords were stored as plain text
 * instead of being properly hashed with bcrypt.
 * 
 * ISSUE: Users table contains plain text passwords in the password_hash column
 * SOLUTION: Hash all plain text passwords using bcrypt
 * 
 * Run this script ONCE to fix existing users, then ensure all future user creation
 * properly hashes passwords.
 */

import { query, queryOne, executeQuery } from '../server/utils/database'
import { hashPassword } from '../server/utils/auth'

interface User {
  id: number
  email: string
  password_hash: string
}

async function fixPasswordHashes() {
  console.log('🔧 Starting password hash fix migration...\n')
  
  try {
    // Get all users
    console.log('📊 Fetching all users from database...')
    const users = await query<User>('SELECT id, email, password_hash FROM users ORDER BY id')
    
    console.log(`Found ${users.length} users\n`)
    
    if (users.length === 0) {
      console.log('⚠️  No users found in database')
      return
    }
    
    let fixedCount = 0
    let skippedCount = 0
    
    for (const user of users) {
      console.log(`\n👤 Processing user ID ${user.id}: ${user.email}`)
      console.log(`   Current password_hash: ${user.password_hash.substring(0, 20)}...`)
      
      // Check if password is already hashed (bcrypt hashes start with $2a$, $2b$, or $2y$)
      const isBcryptHash = /^\$2[aby]\$\d{2}\$/.test(user.password_hash)
      
      if (isBcryptHash) {
        console.log('   ✅ Already hashed - skipping')
        skippedCount++
        continue
      }
      
      console.log('   ⚠️  Plain text password detected!')
      console.log('   🔐 Hashing password...')
      
      // Hash the plain text password
      const hashedPassword = await hashPassword(user.password_hash)
      
      console.log(`   New hash: ${hashedPassword.substring(0, 30)}...`)
      
      // Update the database
      await executeQuery(
        'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2',
        [hashedPassword, user.id]
      )
      
      console.log('   ✅ Password hash updated successfully')
      fixedCount++
    }
    
    console.log('\n' + '='.repeat(60))
    console.log('📊 Migration Summary:')
    console.log('='.repeat(60))
    console.log(`Total users processed: ${users.length}`)
    console.log(`Passwords fixed: ${fixedCount}`)
    console.log(`Already hashed (skipped): ${skippedCount}`)
    console.log('='.repeat(60))
    
    if (fixedCount > 0) {
      console.log('\n✅ Migration completed successfully!')
      console.log('\n🔑 You can now log in with:')
      for (const user of users) {
        console.log(`   - Email: ${user.email}`)
        console.log(`     Password: (the plain text value that was in the database)`)
      }
    } else {
      console.log('\n✅ No changes needed - all passwords already hashed')
    }
    
  } catch (error: any) {
    console.error('\n❌ Error during migration:', error.message)
    console.error('Stack:', error.stack)
    process.exit(1)
  }
}

// Run the migration
fixPasswordHashes()
  .then(() => {
    console.log('\n✨ Script completed')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n💥 Fatal error:', error)
    process.exit(1)
  })
