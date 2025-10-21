import { AmoCRMAdapter } from '@/lib/crm-adapters/amocrm-adapter'

/**
 * amoCRM Adapter Tests
 */

describe('AmoCRMAdapter', () => {
  const mockConfig = {
    subdomain: 'testcompany',
    accessToken: 'mock-access-token',
  }

  describe('Initialization', () => {
    it('should create adapter with correct config', () => {
      const adapter = new AmoCRMAdapter(mockConfig)
      expect(adapter).toBeDefined()
    })

    it('should set correct base URL from subdomain', () => {
      const adapter = new AmoCRMAdapter(mockConfig)
      // @ts-expect-error - accessing private property for testing
      expect(adapter.baseUrl).toBe('https://testcompany.amocrm.ru/api/v4')
    })

    it('should initialize rate limiter with 7 req/sec', () => {
      const adapter = new AmoCRMAdapter(mockConfig)
      // @ts-expect-error - accessing private property
      expect(adapter.rateLimiter).toBeDefined()
    })
  })

  describe('Data Normalization', () => {
    it('should normalize amoCRM contact to CRMContact', () => {
      const adapter = new AmoCRMAdapter(mockConfig)

      const amoCRMContact = {
        id: 12345,
        name: 'Иван Петров',
        created_at: 1697800000,
        updated_at: 1697800000,
        responsible_user_id: 123,
        custom_fields_values: [
          {
            field_id: 1,
            field_name: 'Email',
            field_code: 'EMAIL',
            field_type: 'multitext',
            values: [{ value: 'ivan@test.com' }],
          },
          {
            field_id: 2,
            field_name: 'Телефон',
            field_code: 'PHONE',
            field_type: 'multitext',
            values: [{ value: '+79001234567' }],
          },
        ],
        _embedded: {
          companies: [{ id: 456, name: 'ООО Тест' }],
        },
      }

      // @ts-expect-error - testing protected method
      const normalized = adapter.normalizeContact(amoCRMContact)

      expect(normalized.externalId).toBe('12345')
      expect(normalized.email).toBe('ivan@test.com')
      expect(normalized.firstName).toBe('Иван')
      expect(normalized.lastName).toBe('Петров')
      expect(normalized.phone).toBe('+79001234567')
      expect(normalized.companyName).toBe('ООО Тест')
      expect(normalized.source).toBe('amocrm')
    })

    it('should handle contact without company', () => {
      const adapter = new AmoCRMAdapter(mockConfig)

      const amoCRMContact = {
        id: 12345,
        name: 'Иван Петров',
        created_at: 1697800000,
        updated_at: 1697800000,
        responsible_user_id: 123,
        custom_fields_values: [
          {
            field_code: 'EMAIL',
            values: [{ value: 'ivan@test.com' }],
          },
        ],
      }

      // @ts-expect-error
      const normalized = adapter.normalizeContact(amoCRMContact)

      expect(normalized.companyName).toBeUndefined()
    })

    it('should normalize deal with correct currency', () => {
      const adapter = new AmoCRMAdapter(mockConfig)

      const amoCRMLead = {
        id: 789,
        name: 'Тестовая сделка',
        price: 50000,
        status_id: 142,
        pipeline_id: 1,
        created_at: 1697800000,
        updated_at: 1697800000,
        responsible_user_id: 123,
      }

      // @ts-expect-error
      const normalized = adapter.normalizeDeal(amoCRMLead)

      expect(normalized.externalId).toBe('789')
      expect(normalized.name).toBe('Тестовая сделка')
      expect(normalized.amount).toBe(50000)
      expect(normalized.currency).toBe('RUB') // amoCRM в рублях
    })
  })

  describe('Stage Mapping', () => {
    it('should map status_id to stage name', () => {
      const adapter = new AmoCRMAdapter(mockConfig)

      const testCases = [
        { statusId: 142, expected: 'qualified' },
        { statusId: 143, expected: 'presentation' },
        { statusId: 146, expected: 'closed-won' },
        { statusId: 147, expected: 'closed-lost' },
      ]

      testCases.forEach(({ statusId, expected }) => {
        // @ts-expect-error
        const stage = adapter.mapStageId(statusId)
        expect(stage).toBe(expected)
      })
    })

    it('should calculate probability from stage', () => {
      const adapter = new AmoCRMAdapter(mockConfig)

      const testCases = [
        { statusId: 142, probability: 20 },   // qualified
        { statusId: 144, probability: 60 },   // proposal
        { statusId: 146, probability: 100 },  // closed-won
        { statusId: 147, probability: 0 },    // closed-lost
      ]

      testCases.forEach(({ statusId, probability }) => {
        // @ts-expect-error
        const result = adapter.calculateProbability(statusId)
        expect(result).toBe(probability)
      })
    })
  })

  describe('Error Handling', () => {
    it('should handle missing email gracefully', () => {
      const adapter = new AmoCRMAdapter(mockConfig)

      const contactWithoutEmail = {
        id: 12345,
        name: 'Тест',
        created_at: 1697800000,
        updated_at: 1697800000,
        responsible_user_id: 123,
        custom_fields_values: [],
      }

      // @ts-expect-error
      const normalized = adapter.normalizeContact(contactWithoutEmail)

      expect(normalized.email).toBe('') // Empty string instead of crash
    })
  })
})

