import { readFile } from 'fs/promises'
import { join } from 'path'
import { query } from './connection'

/**
 * Seed the database with initial data
 */
export async function seedDatabase() {
  console.log('🌱 Seeding database...')

  try {
    // Read packages from JSON file
    const packagesPath = join(process.cwd(), 'content', 'packages.json')
    const packagesContent = await readFile(packagesPath, 'utf-8')
    const packagesData = JSON.parse(packagesContent)
    
    // Extract packages array from the content structure
    const packages = packagesData.body || packagesData

    if (!Array.isArray(packages)) {
      throw new Error('Packages data is not an array')
    }

    console.log(`📦 Found ${packages.length} packages to seed`)

    // Insert packages
    for (const pkg of packages) {
      const { id, name, description, price, price_cents, popular, features, icon, display_order, badge_text, is_visible, price_suffix } = pkg
      
      // Handle both price and price_cents fields for backward compatibility
      // price_cents takes precedence if both are present
      const priceCents = typeof price_cents === 'number' 
        ? price_cents 
        : (typeof price === 'number' ? price : 0)

      await query(
        `INSERT INTO packages (slug, name, description, price_cents, is_popular, features, icon,
                               display_order, badge_text, is_visible, price_suffix)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
         ON CONFLICT (slug) DO UPDATE SET
           name = EXCLUDED.name,
           description = EXCLUDED.description,
           price_cents = EXCLUDED.price_cents,
           is_popular = EXCLUDED.is_popular,
           features = EXCLUDED.features,
           icon = EXCLUDED.icon,
           display_order = EXCLUDED.display_order,
           badge_text = EXCLUDED.badge_text,
           is_visible = EXCLUDED.is_visible,
           price_suffix = EXCLUDED.price_suffix,
           updated_at = NOW()`,
        [
          id,
          name,
          description,
          priceCents,
          popular || false,
          JSON.stringify(features || []),
          icon || null,
          display_order ?? 0,
          badge_text || null,
          is_visible !== false,
          price_suffix || '/game'
        ]
      )

      console.log(`  ✅ Seeded package: ${name} (${priceCents} cents)`)
    }

    console.log('✅ Database seeding completed successfully')
  } catch (error) {
    console.error('❌ Error seeding database:', error)
    throw error
  }
}

// Run seed if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedDatabase()
    .then(() => {
      console.log('Seed completed')
      process.exit(0)
    })
    .catch((error) => {
      console.error('Seed failed:', error)
      process.exit(1)
    })
}
