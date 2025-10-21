import { ImportService } from '@/lib/services/import-service'
import { CSVAdapter, parseCSV } from '@/lib/crm-adapters/csv-adapter'

/**
 * Integration Tests для CRM Import
 */

describe('CRM Import Integration', () => {
  describe('CSV Import', () => {
    it('should import contacts from CSV', async () => {
      const csvData = `Email,First Name,Last Name,Company,Phone
john@test.com,John,Doe,Test Corp,+1234567890
jane@test.com,Jane,Smith,Test Inc,+0987654321`

      const rows = parseCSV(csvData)
      const adapter = new CSVAdapter({
        data: rows,
        mapping: {
          email: 'Email',
          firstName: 'First Name',
          lastName: 'Last Name',
          companyName: 'Company',
          phone: 'Phone',
        },
      })

      const contacts = await adapter.fetchContacts()

      expect(contacts).toHaveLength(2)
      expect(contacts[0].email).toBe('john@test.com')
      expect(contacts[0].firstName).toBe('John')
      expect(contacts[0].companyName).toBe('Test Corp')
    })

    it('should handle deduplication', async () => {
      const csvData = `Email,First Name
test@test.com,Test
test@test.com,Test Duplicate`

      const rows = parseCSV(csvData)
      const adapter = new CSVAdapter({
        data: rows,
        mapping: { email: 'Email', firstName: 'First Name' },
      })

      const contacts = await adapter.fetchContacts()

      // Both rows should be returned, deduplication happens in ImportService
      expect(contacts).toHaveLength(2)
    })

    it('should skip rows without email', async () => {
      const csvData = `Email,First Name
valid@test.com,Valid
,Invalid`

      const rows = parseCSV(csvData)
      const adapter = new CSVAdapter({
        data: rows,
        mapping: { email: 'Email', firstName: 'First Name' },
      })

      const contacts = await adapter.fetchContacts()

      // Only valid row with email
      expect(contacts).toHaveLength(1)
      expect(contacts[0].email).toBe('valid@test.com')
    })
  })

  describe('Auto Field Detection', () => {
    it('should detect email field', () => {
      const { autoDetectMapping } = require('@/lib/crm-adapters/csv-adapter')

      const headers = ['Name', 'Email Address', 'Phone Number']
      const mapping = autoDetectMapping(headers)

      expect(mapping.email).toBe('Email Address')
    })

    it('should detect first and last name', () => {
      const { autoDetectMapping } = require('@/lib/crm-adapters/csv-adapter')

      const headers = ['First Name', 'Last Name', 'Email']
      const mapping = autoDetectMapping(headers)

      expect(mapping.firstName).toBe('First Name')
      expect(mapping.lastName).toBe('Last Name')
    })

    it('should detect phone field variations', () => {
      const { autoDetectMapping } = require('@/lib/crm-adapters/csv-adapter')

      const testCases = [
        { headers: ['Email', 'Phone'], expected: 'Phone' },
        { headers: ['Email', 'Mobile'], expected: 'Mobile' },
        { headers: ['Email', 'Tel'], expected: 'Tel' },
      ]

      testCases.forEach(({ headers, expected }) => {
        const mapping = autoDetectMapping(headers)
        expect(mapping.phone).toBe(expected)
      })
    })
  })

  describe('Batch Processing', () => {
    it('should process in batches', async () => {
      // Create 250 contacts (1 batch)
      const rows = Array.from({ length: 250 }, (_, i) => ({
        Email: `test${i}@test.com`,
        'First Name': `Test${i}`,
      }))

      const adapter = new CSVAdapter({
        data: rows,
        mapping: { email: 'Email', firstName: 'First Name' },
      })

      const contacts = await adapter.fetchContacts({ limit: 100 })

      expect(contacts).toHaveLength(100) // First batch
    })
  })

  describe('Error Handling', () => {
    it('should continue on individual row errors', () => {
      const csvData = `Email,First Name
valid@test.com,Valid
invalid-email,Invalid
another@test.com,Another`

      const rows = parseCSV(csvData)
      const adapter = new CSVAdapter({
        data: rows,
        mapping: { email: 'Email', firstName: 'First Name' },
      })

      const contacts = adapter.fetchContacts()

      // Should not throw, returns all (validation happens in ImportService)
      expect(contacts).resolves.toHaveLength(3)
    })
  })
})

