/**
 * Base CRM Adapter
 * Универсальный интерфейс для всех CRM адаптеров
 */

export interface CRMContact {
  externalId: string
  email: string
  firstName?: string
  lastName?: string
  phone?: string
  companyName?: string
  source?: string
  lifecycleStage?: string
  createdAt?: Date
  metadata?: Record<string, unknown>
}

export interface CRMCompany {
  externalId: string
  name: string
  domain?: string
  industry?: string
  size?: string
  metadata?: Record<string, unknown>
}

export interface CRMDeal {
  externalId: string
  name: string
  amount: number
  currency?: string
  stage: string
  probability?: number
  closeDate?: Date
  contactEmail?: string
  companyName?: string
  metadata?: Record<string, unknown>
}

export interface ImportResult {
  success: boolean
  imported: number
  failed: number
  skipped: number
  errors: Array<{
    row?: number
    field?: string
    message: string
    data?: unknown
  }>
}

export interface CRMAdapterConfig {
  apiKey?: string
  apiSecret?: string
  accessToken?: string
  baseUrl?: string
  rateLimit?: number
}

/**
 * Base adapter interface
 * Все CRM адаптеры должны имплементировать этот интерфейс
 */
export abstract class BaseCRMAdapter {
  protected config: CRMAdapterConfig

  constructor(config: CRMAdapterConfig) {
    this.config = config
  }

  /**
   * Test connection to CRM
   */
  abstract testConnection(): Promise<boolean>

  /**
   * Fetch contacts from CRM
   */
  abstract fetchContacts(options?: {
    limit?: number
    offset?: number
    modifiedSince?: Date
  }): Promise<CRMContact[]>

  /**
   * Fetch companies from CRM
   */
  abstract fetchCompanies(options?: {
    limit?: number
    offset?: number
    modifiedSince?: Date
  }): Promise<CRMCompany[]>

  /**
   * Fetch deals from CRM
   */
  abstract fetchDeals(options?: {
    limit?: number
    offset?: number
    modifiedSince?: Date
  }): Promise<CRMDeal[]>

  /**
   * Get total count for pagination
   */
  abstract getTotalCount(type: 'contacts' | 'companies' | 'deals'): Promise<number>

  /**
   * Normalize data to standard format
   */
  protected normalizeContact(_data: unknown): CRMContact {
    throw new Error('Must be implemented by subclass')
  }

  protected normalizeCompany(_data: unknown): CRMCompany {
    throw new Error('Must be implemented by subclass')
  }

  protected normalizeDeal(_data: unknown): CRMDeal {
    throw new Error('Must be implemented by subclass')
  }
}

/**
 * Rate limiter utility
 */
export class RateLimiter {
  private queue: Array<() => Promise<unknown>> = []
  private processing = false
  private requestsPerSecond: number

  constructor(requestsPerSecond: number = 10) {
    this.requestsPerSecond = requestsPerSecond
  }

  async add<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push(async () => {
        try {
          const result = await fn()
          resolve(result as T)
        } catch (error) {
          reject(error)
        }
      })

      if (!this.processing) {
        this.process()
      }
    })
  }

  private async process() {
    this.processing = true

    while (this.queue.length > 0) {
      const fn = this.queue.shift()
      if (fn) {
        await fn()
        await this.delay(1000 / this.requestsPerSecond)
      }
    }

    this.processing = false
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }
}

