import { BaseCRMAdapter, CRMContact, CRMCompany, CRMDeal, RateLimiter } from './base-adapter'

/**
 * Salesforce CRM Adapter
 * Документация: https://developer.salesforce.com/docs/atlas.en-us.api_rest.meta/api_rest/
 */

export class SalesforceAdapter extends BaseCRMAdapter {
  private rateLimiter: RateLimiter
  private instanceUrl: string

  constructor(config: {
    accessToken: string
    instanceUrl: string // e.g., https://your-instance.salesforce.com
  }) {
    super(config)
    this.instanceUrl = config.instanceUrl || ''
    this.rateLimiter = new RateLimiter(20) // Salesforce limit varies by license
  }

  async testConnection(): Promise<boolean> {
    try {
      const response = await this.query('SELECT Id FROM Contact LIMIT 1')
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
    const limit = options?.limit || 200
    const offset = options?.offset || 0

    let query = `
      SELECT Id, Email, FirstName, LastName, Phone, 
             Account.Name, LeadSource, CreatedDate
      FROM Contact
      WHERE Email != null
      ORDER BY CreatedDate DESC
      LIMIT ${limit}
      OFFSET ${offset}
    `

    if (options?.modifiedSince) {
      const isoDate = options.modifiedSince.toISOString()
      query = query.replace('WHERE', `WHERE LastModifiedDate >= ${isoDate} AND`)
    }

    const response = await this.query(query)
    const data = await response.json()

    return data.records.map((record: Record<string, unknown>) => this.normalizeContact(record))
  }

  async fetchCompanies(options?: {
    limit?: number
    offset?: number
  }): Promise<CRMCompany[]> {
    const limit = options?.limit || 200
    const offset = options?.offset || 0

    const query = `
      SELECT Id, Name, Website, Industry, NumberOfEmployees
      FROM Account
      ORDER BY CreatedDate DESC
      LIMIT ${limit}
      OFFSET ${offset}
    `

    const response = await this.query(query)
    const data = await response.json()

    return data.records.map((record: Record<string, unknown>) => this.normalizeCompany(record))
  }

  async fetchDeals(options?: {
    limit?: number
    offset?: number
  }): Promise<CRMDeal[]> {
    const limit = options?.limit || 200
    const offset = options?.offset || 0

    const query = `
      SELECT Id, Name, Amount, StageName, Probability, CloseDate,
             Account.Name, Contact.Email
      FROM Opportunity
      ORDER BY CreatedDate DESC
      LIMIT ${limit}
      OFFSET ${offset}
    `

    const response = await this.query(query)
    const data = await response.json()

    return data.records.map((record: Record<string, unknown>) => this.normalizeDeal(record))
  }

  async getTotalCount(type: 'contacts' | 'companies' | 'deals'): Promise<number> {
    const objectMap = {
      contacts: 'Contact',
      companies: 'Account',
      deals: 'Opportunity',
    }

    const query = `SELECT COUNT() FROM ${objectMap[type]}`
    const response = await this.query(query)
    const data = await response.json()

    return data.totalSize || 0
  }

  protected normalizeContact(data: Record<string, unknown>): CRMContact {
    return {
      externalId: data.Id as string,
      email: data.Email as string,
      firstName: data.FirstName as string,
      lastName: data.LastName as string,
      phone: data.Phone as string,
      companyName: (data.Account as { Name: string })?.Name,
      source: (data.LeadSource as string) || 'salesforce',
      createdAt: data.CreatedDate ? new Date(data.CreatedDate as string) : undefined,
      metadata: data,
    }
  }

  protected normalizeCompany(data: Record<string, unknown>): CRMCompany {
    return {
      externalId: data.Id as string,
      name: data.Name as string,
      domain: data.Website as string,
      industry: data.Industry as string,
      size: (data.NumberOfEmployees as number)?.toString(),
      metadata: data,
    }
  }

  protected normalizeDeal(data: Record<string, unknown>): CRMDeal {
    return {
      externalId: data.Id as string,
      name: data.Name as string,
      amount: parseFloat((data.Amount as string) || '0'),
      currency: 'USD',
      stage: data.StageName as string,
      probability: parseInt((data.Probability as string) || '0'),
      closeDate: data.CloseDate ? new Date(data.CloseDate as string) : undefined,
      companyName: (data.Account as { Name: string })?.Name,
      contactEmail: (data.Contact as { Email: string })?.Email,
      metadata: data,
    }
  }

  private async query(soql: string): Promise<Response> {
    return this.rateLimiter.add(async () => {
      const url = `${this.instanceUrl}/services/data/v59.0/query?q=${encodeURIComponent(soql)}`
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${this.config.accessToken}`,
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error(`Salesforce API error: ${response.statusText}`)
      }

      return response
    })
  }
}

