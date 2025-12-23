/**
 * Database Schema Verification Script
 * 
 * This script verifies that the availability_overrides table exists
 * and has all the required columns with correct types.
 * 
 * Run with: npx tsx scripts/verify_calendar_schema.ts
 */

import { query, closePool } from '../server/db/connection'

interface ColumnInfo {
  column_name: string
  data_type: string
  is_nullable: string
  column_default: string | null
}

async function verifySchema() {
  console.log('🔍 Verifying availability_overrides table schema...\n')
  
  try {
    // Check if table exists
    const tableCheck = await query<{ exists: boolean }>(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'availability_overrides'
      )
    `)
    
    if (!tableCheck.rows[0].exists) {
      console.error('❌ Table availability_overrides does not exist!')
      console.log('\n💡 Run the migration: database/migrations/004_add_availability_overrides.sql')
      process.exit(1)
    }
    
    console.log('✅ Table availability_overrides exists\n')
    
    // Get all columns
    const columns = await query<ColumnInfo>(`
      SELECT 
        column_name, 
        data_type, 
        is_nullable,
        column_default
      FROM information_schema.columns
      WHERE table_schema = 'public' 
      AND table_name = 'availability_overrides'
      ORDER BY ordinal_position
    `)
    
    console.log('📋 Current table structure:')
    console.log('─'.repeat(80))
    console.log('Column Name'.padEnd(25), 'Data Type'.padEnd(20), 'Nullable'.padEnd(10), 'Default')
    console.log('─'.repeat(80))
    
    columns.rows.forEach(col => {
      console.log(
        col.column_name.padEnd(25),
        col.data_type.padEnd(20),
        col.is_nullable.padEnd(10),
        col.column_default || ''
      )
    })
    
    console.log('─'.repeat(80))
    console.log()
    
    // Check for required columns
    const requiredColumns = [
      { name: 'id', type: 'integer' },
      { name: 'start_date', type: 'date' },
      { name: 'end_date', type: 'date' },
      { name: 'is_available', type: 'boolean' },
      { name: 'reason', type: 'character varying' },
      { name: 'override_type', type: 'character varying' },
      { name: 'notes', type: 'text' },
      { name: 'created_by', type: 'integer' },
      { name: 'created_at', type: 'timestamp without time zone' },
      { name: 'updated_at', type: 'timestamp without time zone' }
    ]
    
    console.log('🔍 Verifying required columns:')
    let allColumnsValid = true
    
    for (const required of requiredColumns) {
      const found = columns.rows.find(col => col.column_name === required.name)
      
      if (!found) {
        console.log(`❌ Missing column: ${required.name}`)
        allColumnsValid = false
      } else if (found.data_type !== required.type) {
        console.log(`⚠️  Column ${required.name}: expected ${required.type}, got ${found.data_type}`)
        allColumnsValid = false
      } else {
        console.log(`✅ ${required.name} (${required.type})`)
      }
    }
    
    console.log()
    
    // Check foreign key constraint
    const fkCheck = await query<{ constraint_name: string }>(`
      SELECT constraint_name
      FROM information_schema.table_constraints
      WHERE table_name = 'availability_overrides'
      AND constraint_type = 'FOREIGN KEY'
      AND constraint_name LIKE '%created_by%'
    `)
    
    if (fkCheck.rows.length > 0) {
      console.log(`✅ Foreign key constraint on created_by exists: ${fkCheck.rows[0].constraint_name}`)
    } else {
      console.log('⚠️  No foreign key constraint found on created_by column')
    }
    
    console.log()
    
    // Test a sample user ID
    console.log('🔍 Checking for admin users in users table:')
    const adminUsers = await query<{ id: number; email: string; name: string; role: string }>(`
      SELECT id, email, name, role
      FROM users
      WHERE role = 'admin'
      LIMIT 5
    `)
    
    if (adminUsers.rows.length === 0) {
      console.log('⚠️  No admin users found in users table!')
    } else {
      console.log(`✅ Found ${adminUsers.rows.length} admin user(s):`)
      adminUsers.rows.forEach(user => {
        console.log(`   - ID: ${user.id}, Email: ${user.email}, Name: ${user.name}`)
      })
    }
    
    console.log()
    
    // Check existing overrides
    const overrideCount = await query<{ count: string }>(`
      SELECT COUNT(*) as count
      FROM availability_overrides
    `)
    
    console.log(`📊 Existing overrides in table: ${overrideCount.rows[0].count}`)
    
    if (parseInt(overrideCount.rows[0].count) > 0) {
      const sampleOverrides = await query(`
        SELECT id, start_date, end_date, reason, is_available, created_by
        FROM availability_overrides
        ORDER BY created_at DESC
        LIMIT 3
      `)
      
      console.log('\n📝 Sample overrides:')
      sampleOverrides.rows.forEach(row => {
        console.log(`   - ID: ${row.id}, Dates: ${row.start_date} to ${row.end_date}, Available: ${row.is_available}, Created by: ${row.created_by}`)
      })
    }
    
    console.log()
    
    if (allColumnsValid) {
      console.log('✅ Schema verification complete - all checks passed!')
    } else {
      console.log('❌ Schema verification failed - please fix the issues above')
      process.exit(1)
    }
    
  } catch (error: any) {
    console.error('❌ Error during verification:', error.message)
    console.error('Stack:', error.stack)
    process.exit(1)
  } finally {
    await closePool()
  }
}

// Run verification
verifySchema()
