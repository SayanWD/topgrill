import { BaseCRMAdapter, CRMContact, CRMCompany, CRMDeal, RateLimiter } from './base-adapter'

/**
 * HubSpot CRM Adapter
 * Документация: https://developers.hubspot.com/docs/api/overview
 */

interface HubSpotContact {
  id: string
  properties: {
    email: string
    firstname?: string
    lastname?: string
    phone?: string
    company?: string
    lifecyclestage?: string
    createdate?: string
    [key: string]: unknown
  }
}

interface HubSpotCompany {
  id: string
  properties: {
    name: string
    domain?: string
    industry?: string
    numberofemployees?: string
    [key: string]: unknown
  }
}

interface HubSpotDeal {
  id: string
  properties: {
    dealname: string
    amount?: string
    dealstage?: string
    closedate?: string
    pipeline?: string
    [key: string]: unknown
  }
}

export class HubSpotAdapter extends BaseCRMAdapter {
  private rateLimiter: RateLimiter
  private baseUrl = 'https://api.hubapi.com'

  constructor(config: { accessToken: string }) {
    super(config)
    this.rateLimiter = new RateLimiter(10) // HubSpot limit: 10 req/sec
  }

  async testConnection(): Promise<boolean> {
    try {
      const response = await this.request('/crm/v3/objects/contacts?limit=1')
      return response.ok
    } catch {
      return false
    }
  }

  async fetchContacts(options?: {
    limit?: number
    offset?: number
    modifiedSince?: Date
  }): Promise<CRMContact[]> {
    const limit = options?.limit || 100
    const after = options?.offset || 0

    const url = `/crm/v3/objects/contacts?limit=${limit}&after=${after}`
    const response = await this.request(url)
    const data = await response.json()

    return data.results.map((contact: HubSpotContact) => 
      this.normalizeContact(contact)
    )
  }

  async fetchCompanies(options?: {
    limit?: number
    offset?: number
  }): Promise<CRMCompany[]> {
    const limit = options?.limit || 100
    const after = options?.offset || 0

    const url = `/crm/v3/objects/companies?limit=${limit}&after=${after}`
    const response = await this.request(url)
    const data = await response.json()

    return data.results.map((company: HubSpotCompany) => 
      this.normalizeCompany(company)
    )
  }

  async fetchDeals(options?: {
    limit?: number
    offset?: number
  }): Promise<CRMDeal[]> {
    const limit = options?.limit || 100
    const after = options?.offset || 0

    const url = `/crm/v3/objects/deals?limit=${limit}&after=${after}`
    const response = await this.request(url)
    const data = await response.json()

    return data.results.map((deal: HubSpotDeal) => 
      this.normalizeDeal(deal)
    )
  }

  async getTotalCount(type: 'contacts' | 'companies' | 'deals'): Promise<number> {
    const url = `/crm/v3/objects/${type}?limit=1`
    const response = await this.request(url)
    const data = await response.json()
    return data.total || 0
  }

  protected normalizeContact(data: HubSpotContact): CRMContact {
    return {
      externalId: data.id,
      email: data.properties.email,
      firstName: data.properties.firstname,
      lastName: data.properties.lastname,
      phone: data.properties.phone,
      companyName: data.properties.company,
      lifecycleStage: data.properties.lifecyclestage,
      createdAt: data.properties.createdate 
        ? new Date(data.properties.createdate) 
        : undefined,
      source: 'hubspot',
      metadata: data.properties,
    }
  }

  protected normalizeCompany(data: HubSpotCompany): CRMCompany {
    return {
      externalId: data.id,
      name: data.properties.name,
      domain: data.properties.domain,
      industry: data.properties.industry,
      size: data.properties.numberofemployees,
      metadata: data.properties,
    }
  }

  protected normalizeDeal(data: HubSpotDeal): CRMDeal {
    return {
      externalId: data.id,
      name: data.properties.dealname,
      amount: parseFloat(data.properties.amount || '0'),
      currency: 'USD',
      stage: data.properties.dealstage || 'unknown',
      closeDate: data.properties.closedate 
        ? new Date(data.properties.closedate) 
        : undefined,
      metadata: data.properties,
    }
  }

  private async request(path: string): Promise<Response> {
    return this.rateLimiter.add(async () => {
      const response = await fetch(`${this.baseUrl}${path}`, {
        headers: {
          'Authorization': `Bearer ${this.config.accessToken}`,
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error(`HubSpot API error: ${response.statusText}`)
      }

      return response
    })
  }
}

