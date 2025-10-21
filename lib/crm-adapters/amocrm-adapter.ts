import { BaseCRMAdapter, CRMContact, CRMCompany, CRMDeal, RateLimiter } from './base-adapter'

/**
 * amoCRM Adapter
 * Документация: https://www.amocrm.ru/developers/content/crm_platform/api-reference
 * 
 * OAuth 2.0 flow для получения access token:
 * 1. Redirect user to: https://{subdomain}.amocrm.ru/oauth?client_id={ID}
 * 2. Get code from callback
 * 3. Exchange code for access_token
 * 
 * Rate Limits: 7 requests per second
 */

interface AmoCRMContact {
  id: number
  name: string
  created_at: number
  updated_at: number
  responsible_user_id: number
  custom_fields_values?: Array<{
    field_id: number
    field_name: string
    field_code: string
    field_type: string
    values: Array<{ value: string }>
  }>
  _embedded?: {
    companies?: Array<{ id: number; name: string }>
  }
}

interface AmoCRMLead {
  id: number
  name: string
  price: number
  status_id: number
  pipeline_id: number
  created_at: number
  updated_at: number
  closed_at?: number
  responsible_user_id: number
  custom_fields_values?: any[]
  _embedded?: {
    contacts?: Array<{ id: number }>
    companies?: Array<{ id: number }>
  }
}

interface AmoCRMCompany {
  id: number
  name: string
  created_at: number
  updated_at: number
  responsible_user_id: number
  custom_fields_values?: any[]
}

export interface AmoCRMConfig {
  subdomain: string          // yourcompany.amocrm.ru
  accessToken: string        // OAuth access token
  refreshToken?: string      // For token refresh
  clientId?: string          // OAuth client ID
  clientSecret?: string      // OAuth client secret
  integrationId?: string     // Supabase integration row ID for saving tokens
  onTokenRefresh?: (tokens: { accessToken: string; refreshToken: string; expiresAt: Date }) => Promise<void>
}

export class AmoCRMAdapter extends BaseCRMAdapter {
  private rateLimiter: RateLimiter
  private subdomain: string
  private baseUrl: string
  private accessToken: string
  private refreshToken?: string
  private clientId?: string
  private clientSecret?: string
  private integrationId?: string
  private onTokenRefresh?: (tokens: { accessToken: string; refreshToken: string; expiresAt: Date }) => Promise<void>
  private expiresAt?: Date

  constructor(config: AmoCRMConfig) {
    super(config)
    this.subdomain = config.subdomain
    this.baseUrl = `https://${config.subdomain}.amocrm.ru/api/v4`
    this.accessToken = config.accessToken
    this.refreshToken = config.refreshToken
    this.clientId = config.clientId
    this.clientSecret = config.clientSecret
    this.integrationId = config.integrationId
    this.onTokenRefresh = config.onTokenRefresh
    this.rateLimiter = new RateLimiter(7) // 7 req/sec limit
  }

  /**
   * Test connection to amoCRM
   */
  async testConnection(): Promise<boolean> {
    try {
      const response = await this.request('/account')
      return response.ok
    } catch {
      return false
    }
  }

  /**
   * Fetch contacts (leads в терминологии amoCRM)
   */
  async fetchContacts(options?: {
    limit?: number
    offset?: number
    modifiedSince?: Date
  }): Promise<CRMContact[]> {
    const limit = options?.limit || 250 // amoCRM max 250 per request
    const page = Math.floor((options?.offset || 0) / limit) + 1

    let url = `/contacts?limit=${limit}&page=${page}`

    // Filter by updated_at if specified
    if (options?.modifiedSince) {
      const timestamp = Math.floor(options.modifiedSince.getTime() / 1000)
      url += `&filter[updated_at][from]=${timestamp}`
    }

    const response = await this.request(url)
    const data = await response.json()

    const contacts = data._embedded?.contacts || []
    return contacts.map((contact: AmoCRMContact) => this.normalizeContact(contact))
  }

  /**
   * Fetch companies
   */
  async fetchCompanies(options?: {
    limit?: number
    offset?: number
  }): Promise<CRMCompany[]> {
    const limit = options?.limit || 250
    const page = Math.floor((options?.offset || 0) / limit) + 1

    const url = `/companies?limit=${limit}&page=${page}`
    const response = await this.request(url)
    const data = await response.json()

    const companies = data._embedded?.companies || []
    return companies.map((company: AmoCRMCompany) => this.normalizeCompany(company))
  }

  /**
   * Fetch leads (сделки в amoCRM)
   */
  async fetchDeals(options?: {
    limit?: number
    offset?: number
  }): Promise<CRMDeal[]> {
    const limit = options?.limit || 250
    const page = Math.floor((options?.offset || 0) / limit) + 1

    const url = `/leads?limit=${limit}&page=${page}&with=contacts,companies`
    const response = await this.request(url)
    const data = await response.json()

    const leads = data._embedded?.leads || []
    return leads.map((lead: AmoCRMLead) => this.normalizeDeal(lead))
  }

  /**
   * Get total count
   */
  async getTotalCount(type: 'contacts' | 'companies' | 'deals'): Promise<number> {
    const endpoint = type === 'deals' ? 'leads' : type
    const url = `/${endpoint}?limit=1`
    
    const response = await this.request(url)
    const data = await response.json()

    return data._page?.total || 0
  }

  /**
   * Normalize amoCRM contact to standard format
   */
  protected normalizeContact(data: AmoCRMContact): CRMContact {
    // Extract email from custom fields
    const emailField = data.custom_fields_values?.find(
      (f) => f.field_code === 'EMAIL' || f.field_type === 'multitext'
    )
    const email = emailField?.values?.[0]?.value || ''

    // Extract phone
    const phoneField = data.custom_fields_values?.find(
      (f) => f.field_code === 'PHONE'
    )
    const phone = phoneField?.values?.[0]?.value

    // Split name into first/last
    const nameParts = data.name.split(' ')
    const firstName = nameParts[0]
    const lastName = nameParts.slice(1).join(' ')

    return {
      externalId: data.id.toString(),
      email,
      firstName,
      lastName: lastName || undefined,
      phone,
      companyName: data._embedded?.companies?.[0]?.name,
      source: 'amocrm',
      createdAt: new Date(data.created_at * 1000),
      metadata: {
        amo_id: data.id,
        responsible_user_id: data.responsible_user_id,
        custom_fields: data.custom_fields_values,
        raw: data,
      },
    }
  }

  /**
   * Normalize amoCRM company to standard format
   */
  protected normalizeCompany(data: AmoCRMCompany): CRMCompany {
    return {
      externalId: data.id.toString(),
      name: data.name,
      metadata: {
        amo_id: data.id,
        responsible_user_id: data.responsible_user_id,
        custom_fields: data.custom_fields_values,
        raw: data,
      },
    }
  }

  /**
   * Normalize amoCRM lead to standard deal
   */
  protected normalizeDeal(data: AmoCRMLead): CRMDeal {
    return {
      externalId: data.id.toString(),
      name: data.name,
      amount: data.price,
      currency: 'RUB', // amoCRM обычно в рублях
      stage: this.mapStageId(data.status_id),
      probability: this.calculateProbability(data.status_id),
      closeDate: data.closed_at ? new Date(data.closed_at * 1000) : undefined,
      metadata: {
        amo_id: data.id,
        pipeline_id: data.pipeline_id,
        status_id: data.status_id,
        responsible_user_id: data.responsible_user_id,
        raw: data,
      },
    }
  }

  /**
   * Map amoCRM status_id to stage name
   * TODO: Get from pipelines API and cache
   */
  private mapStageId(statusId: number): string {
    const statusMap: Record<number, string> = {
      142: 'qualified',
      143: 'presentation',
      144: 'proposal',
      145: 'negotiation',
      146: 'closed-won',
      147: 'closed-lost',
    }
    return statusMap[statusId] || `status-${statusId}`
  }

  /**
   * Calculate probability based on stage
   */
  private calculateProbability(statusId: number): number {
    const probabilityMap: Record<number, number> = {
      142: 20,  // qualified
      143: 40,  // presentation
      144: 60,  // proposal
      145: 80,  // negotiation
      146: 100, // closed-won
      147: 0,   // closed-lost
    }
    return probabilityMap[statusId] || 50
  }

  /**
   * Make API request with rate limiting and auto token refresh
   */
  private async request(path: string, options?: RequestInit): Promise<Response> {
    return this.rateLimiter.add(async () => {
      // Проактивно обновляем токен за 1 час до истечения
      if (this.expiresAt && this.refreshToken) {
        const now = new Date()
        const oneHourBeforeExpiry = new Date(this.expiresAt.getTime() - 60 * 60 * 1000)
        
        if (now > oneHourBeforeExpiry) {
          console.log('Token expiring soon, refreshing proactively...')
          await this.refreshAccessToken()
        }
      }

      const url = `${this.baseUrl}${path}`
      
      const response = await fetch(url, {
        ...options,
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
          ...options?.headers,
        },
      })

      // Handle token refresh if expired (401)
      if (response.status === 401 && this.refreshToken) {
        console.log('Token expired (401), refreshing...')
        await this.refreshAccessToken()
        // Retry request with new token
        return this.request(path, options)
      }

      if (!response.ok) {
        throw new Error(`amoCRM API error: ${response.status} ${response.statusText}`)
      }

      return response
    })
  }

  /**
   * Refresh OAuth token
   * ВАЖНО: Refresh token можно использовать только 1 раз!
   * После обновления старый refresh_token становится недействительным.
   */
  private async refreshAccessToken(): Promise<void> {
    if (!this.refreshToken || !this.clientId || !this.clientSecret) {
      throw new Error('Cannot refresh token: missing credentials')
    }

    const response = await fetch(`https://${this.subdomain}.amocrm.ru/oauth2/access_token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: this.clientId,
        client_secret: this.clientSecret,
        grant_type: 'refresh_token',
        refresh_token: this.refreshToken,
        redirect_uri: process.env.NEXT_PUBLIC_APP_URL + '/api/oauth/amocrm/callback',
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Token refresh failed:', errorText)
      throw new Error('Failed to refresh amoCRM token')
    }

    const data = await response.json()
    
    // Calculate expiry from server_time + expires_in
    const expiresAt = new Date((data.server_time + data.expires_in) * 1000)
    
    // Update instance variables
    this.accessToken = data.access_token
    this.refreshToken = data.refresh_token
    this.expiresAt = expiresAt

    // Save new tokens to database via callback
    if (this.onTokenRefresh) {
      await this.onTokenRefresh({
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        expiresAt,
      })
    }

    console.log('amoCRM token refreshed successfully, expires:', expiresAt)
  }

  /**
   * Get pipelines (для mapping статусов)
   */
  async getPipelines(): Promise<any> {
    const response = await this.request('/leads/pipelines')
    return response.json()
  }

  /**
   * Get custom fields definitions
   */
  async getCustomFields(entityType: 'contacts' | 'leads' | 'companies'): Promise<any> {
    const endpoint = entityType === 'deals' ? 'leads' : entityType
    const response = await this.request(`/${endpoint}/custom_fields`)
    return response.json()
  }
}

/**
 * Helper: Generate amoCRM OAuth URL
 */
export function getAmoCRMOAuthUrl(config: {
  clientId: string
  subdomain: string
  redirectUri: string
  state?: string
}): string {
  const params = new URLSearchParams({
    client_id: config.clientId,
    mode: 'post_message',
    state: config.state || crypto.randomUUID(),
  })

  return `https://${config.subdomain}.amocrm.ru/oauth?${params.toString()}`
}

/**
 * Helper: Exchange code for access token
 */
export async function exchangeAmoCRMCode(config: {
  code: string
  clientId: string
  clientSecret: string
  subdomain: string
  redirectUri: string
}): Promise<{
  accessToken: string
  refreshToken: string
  expiresIn: number
}> {
  const response = await fetch(`https://${config.subdomain}.amocrm.ru/oauth2/access_token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: config.clientId,
      client_secret: config.clientSecret,
      grant_type: 'authorization_code',
      code: config.code,
      redirect_uri: config.redirectUri,
    }),
  })

  if (!response.ok) {
    throw new Error('Failed to exchange amoCRM code for token')
  }

  const data = await response.json()

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresIn: data.expires_in,
  }
}

