#!/usr/bin/env tsx
/**
 * Seed Packages Script
 * Populates the packages table from content markdown files
 */

import { readFileSync, readdirSync } from 'fs'
import { join } from 'path'
import { Pool } from 'pg'

// Parse frontmatter from markdown
function parseFrontmatter(content: string): any {
  const match = content.match(/^---\n([\s\S]*?)\n---/)
  if (!match) return {}
  
  const frontmatter: any = {}
  const lines = match[1].split('\n')
  
  let currentKey = ''
  let inArray = false
  let arrayItems: string[] = []
  
  for (const line of lines) {
    if (line.trim().startsWith('-')) {
      // Array item
      const item = line.trim().substring(1).trim().replace(/^['"]|['"]$/g, '')
      arrayItems.push(item)
    } else if (line.includes(':')) {
      // Save previous array if exists
      if (inArray && currentKey) {
        frontmatter[currentKey] = arrayItems
        arrayItems = []
        inArray = false
      }
      
      // New key-value pair
      const [key, ...valueParts] = line.split(':')
      const value = valueParts.join(':').trim()
      currentKey = key.trim()
      
      if (value === '') {
        // Start of array
        inArray = true
      } else {
        // Simple value
        const cleanValue = value.replace(/^['"]|['"]$/g, '')
        
        // Try to parse as number or boolean
        if (cleanValue === 'true') {
          frontmatter[currentKey] = true
        } else if (cleanValue === 'false') {
          frontmatter[currentKey] = false
        } else if (!isNaN(Number(cleanValue)) && cleanValue !== '') {
          frontmatter[currentKey] = Number(cleanValue)
        } else {
          frontmatter[currentKey] = cleanValue
        }
      }
    }
  }
  
  // Save last array if exists
  if (inArray && currentKey) {
    frontmatter[currentKey] = arrayItems
  }
  
  return frontmatter
}

async function seedPackages() {
  const databaseUrl = process.env.DATABASE_URL
  
  if (!databaseUrl) {
    console.error('❌ DATABASE_URL environment variable is not set')
    process.exit(1)
  }
  
  console.log('🌱 Seeding packages from content files...')
  
  const pool = new Pool({
    connectionString: databaseUrl,
    ssl: databaseUrl.includes('localhost') ? false : { rejectUnauthorized: false }
  })
  
  try {
    // Read all markdown files from content/packages
    const contentDir = join(process.cwd(), 'content', 'packages')
    const files = readdirSync(contentDir).filter(f => f.endsWith('.md'))
    
    console.log(`📦 Found ${files.length} package files`)
    
    for (const file of files) {
      const filePath = join(contentDir, file)
      const content = readFileSync(filePath, 'utf-8')
      const data = parseFrontmatter(content)
      
      if (!data.id || !data.name) {
        console.warn(`⚠️  Skipping ${file}: missing id or name`)
        continue
      }
      
      const slug = data.id
      const name = data.name
      const description = data.description || ''
      const priceCents = data.price_cents || data.price * 100 || 0
      const currency = data.currency || 'usd'
      const isPopular = data.popular || data.featured || false
      const features = data.features || []
      const icon = data.icon || '📦'
      
      // Insert or update package
      await pool.query(
        `INSERT INTO packages (slug, name, description, price_cents, currency, is_popular, features, icon)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT (slug) 
         DO UPDATE SET
           name = EXCLUDED.name,
           description = EXCLUDED.description,
           price_cents = EXCLUDED.price_cents,
           currency = EXCLUDED.currency,
           is_popular = EXCLUDED.is_popular,
           features = EXCLUDED.features,
           icon = EXCLUDED.icon,
           updated_at = NOW()`,
        [slug, name, description, priceCents, currency, isPopular, JSON.stringify(features), icon]
      )
      
      console.log(`✅ Seeded package: ${name} (${slug})`)
    }
    
    // Display summary
    const result = await pool.query('SELECT COUNT(*) as count FROM packages')
    const count = parseInt(result.rows[0].count)
    
    console.log(`\n✨ Successfully seeded ${files.length} packages`)
    console.log(`📊 Total packages in database: ${count}`)
    
  } catch (error) {
    console.error('❌ Error seeding packages:', error)
    process.exit(1)
  } finally {
    await pool.end()
  }
}

// Run the seed function
seedPackages()
