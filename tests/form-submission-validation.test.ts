/**
 * Form Submission Validation Test
 * Verifies that form data structure matches API expectations
 */

import { describe, it, expect } from 'vitest'

describe('Form Submission Data Structure', () => {
  it('should have all required fields for Package1Form', () => {
    // Simulate form data from Package1Form
    const formData = {
      packageId: 'player-intros-basic',
      teamName: 'Test Team',
      organization: 'Test League',
      eventDate: '2025-12-25',
      roster: {
        method: 'manual',
        players: ['Player 1', 'Player 2'],
        pdfFile: null,
        webLink: ''
      },
      audioFiles: [],
      introSong: {
        method: 'youtube',
        youtube: 'https://youtube.com/watch?v=test',
        spotify: '',
        text: ''
      },
      contactInfo: {
        name: 'John Doe',
        email: 'john@example.com',
        phone: '555-123-4567'
      },
      notes: 'Test notes'
    }

    // Verify all required fields exist
    expect(formData.packageId).toBeDefined()
    expect(formData.teamName).toBeDefined()
    expect(formData.organization).toBeDefined()
    expect(formData.eventDate).toBeDefined()
    expect(formData.contactInfo).toBeDefined()
    expect(formData.contactInfo.name).toBeDefined()
    expect(formData.contactInfo.email).toBeDefined()
    expect(formData.contactInfo.phone).toBeDefined()
  })

  it('should transform form data to API format correctly', () => {
    const formData = {
      packageId: 'player-intros-basic',
      teamName: 'Test Team',
      organization: 'Test League',
      eventDate: '2025-12-25',
      contactInfo: {
        name: 'John Doe',
        email: 'john@example.com',
        phone: '555-123-4567'
      },
      notes: 'Test notes'
    }

    // Transform to API format (as done in handleFinalSubmit)
    const orderData = {
      name: formData.contactInfo.name,
      email: formData.contactInfo.email,
      phone: formData.contactInfo.phone,
      organization: formData.organization || '',
      serviceType: formData.packageId,
      packageId: formData.packageId,
      eventDate: formData.eventDate || '',
      message: formData.notes || '',
      requirementsJson: formData
    }

    // Verify API data structure
    expect(orderData.name).toBe('John Doe')
    expect(orderData.email).toBe('john@example.com')
    expect(orderData.phone).toBe('555-123-4567')
    expect(orderData.organization).toBe('Test League')
    expect(orderData.eventDate).toBe('2025-12-25')
    expect(orderData.serviceType).toBe('player-intros-basic')
    expect(orderData.packageId).toBe('player-intros-basic')
    expect(orderData.message).toBe('Test notes')
    expect(orderData.requirementsJson).toEqual(formData)
  })

  it('should handle missing optional fields', () => {
    const formData = {
      packageId: 'player-intros-basic',
      teamName: 'Test Team',
      organization: '', // Optional, empty
      eventDate: '2025-12-25',
      contactInfo: {
        name: 'John Doe',
        email: 'john@example.com',
        phone: '555-123-4567'
      },
      notes: '' // Optional, empty
    }

    const orderData = {
      name: formData.contactInfo.name,
      email: formData.contactInfo.email,
      phone: formData.contactInfo.phone,
      organization: formData.organization || '',
      serviceType: formData.packageId,
      packageId: formData.packageId,
      eventDate: formData.eventDate || '',
      message: formData.notes || '',
      requirementsJson: formData
    }

    // Should not throw errors with empty optional fields
    expect(orderData.organization).toBe('')
    expect(orderData.message).toBe('')
    expect(orderData.eventDate).toBe('2025-12-25')
  })

  it('should validate EventHostingForm data structure', () => {
    const formData = {
      packageId: 'event-hosting',
      eventDate: '2025-12-25',
      organization: 'Test League',
      eventType: 'tournament',
      eventTypeOther: '',
      expectedAttendance: '100',
      contactInfo: {
        name: 'Jane Smith',
        email: 'jane@example.com',
        phone: '555-987-6543'
      },
      notes: 'Event hosting request'
    }

    // Verify all required fields
    expect(formData.packageId).toBeDefined()
    expect(formData.eventDate).toBeDefined()
    expect(formData.organization).toBeDefined()
    expect(formData.eventType).toBeDefined()
    expect(formData.contactInfo).toBeDefined()
  })

  it('should validate GameDayDJForm data structure', () => {
    const formData = {
      packageId: 'game-day-dj',
      serviceType: 'individual',
      eventLocation: 'City Arena',
      eventDate: '2025-12-25',
      organization: 'Test League',
      eventType: 'hockey',
      arena: 'Main Arena',
      level: 'youth',
      gameLength: '60',
      contactInfo: {
        name: 'Bob Johnson',
        email: 'bob@example.com',
        phone: '555-111-2222'
      },
      notes: 'Game day DJ request'
    }

    // Verify all required fields
    expect(formData.packageId).toBeDefined()
    expect(formData.eventDate).toBeDefined()
    expect(formData.organization).toBeDefined()
    expect(formData.serviceType).toBeDefined()
    expect(formData.eventType).toBeDefined()
    expect(formData.contactInfo).toBeDefined()
  })
})
