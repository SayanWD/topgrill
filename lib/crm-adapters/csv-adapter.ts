import { BaseCRMAdapter, CRMContact, CRMCompany, CRMDeal } from './base-adapter'

/**
 * CSV Adapter
 * Универсальный импорт из CSV/XLSX файлов
 */

export interface CSVMapping {
  // Contact mapping
  externalId?: string
  email: string
  firstName?: string
  lastName?: string
  phone?: string
  companyName?: string
  source?: string
  lifecycleStage?: string
  
  // Company mapping
  company_name?: string
  company_domain?: string
  company_industry?: string
  company_size?: string
  
  // Deal mapping
  deal_name?: string
  deal_amount?: string
  deal_stage?: string
  deal_closeDate?: string
}

interface ParsedRow {
  [key: string]: string
}

export class CSVAdapter extends BaseCRMAdapter {
  private data: ParsedRow[] = []
  private mapping: CSVMapping

  constructor(config: { data: ParsedRow[]; mapping: CSVMapping }) {
    super({})
    this.data = config.data
    this.mapping = config.mapping
  }

  async testConnection(): Promise<boolean> {
    return this.data.length > 0
  }

  async fetchContacts(): Promise<CRMContact[]> {
    return this.data
      .filter((row) => row[this.mapping.email]) // Email обязателен
      .map((row) => this.normalizeContact(row))
  }

  async fetchCompanies(): Promise<CRMCompany[]> {
    const companies = new Map<string, CRMCompany>()

    this.data.forEach((row) => {
      const companyName = this.mapping.company_name 
        ? row[this.mapping.company_name] 
        : row[this.mapping.companyName || '']

      if (companyName && !companies.has(companyName)) {
        companies.set(companyName, this.normalizeCompany(row))
      }
    })

    return Array.from(companies.values())
  }

  async fetchDeals(): Promise<CRMDeal[]> {
    return this.data
      .filter((row) => {
        const dealName = this.mapping.deal_name ? row[this.mapping.deal_name] : null
        return dealName
      })
      .map((row) => this.normalizeDeal(row))
  }

  async getTotalCount(type: 'contacts' | 'companies' | 'deals'): Promise<number> {
    if (type === 'contacts') {
      return this.data.filter((row) => row[this.mapping.email]).length
    }
    if (type === 'companies') {
      const uniqueCompanies = new Set(
        this.data
          .map((row) => row[this.mapping.company_name || this.mapping.companyName || ''])
          .filter(Boolean)
      )
      return uniqueCompanies.size
    }
    if (type === 'deals') {
      return this.data.filter((row) => row[this.mapping.deal_name || '']).length
    }
    return 0
  }

  protected normalizeContact(row: ParsedRow): CRMContact {
    return {
      externalId: this.mapping.externalId ? row[this.mapping.externalId] : `csv-${row[this.mapping.email]}`,
      email: row[this.mapping.email],
      firstName: this.mapping.firstName ? row[this.mapping.firstName] : undefined,
      lastName: this.mapping.lastName ? row[this.mapping.lastName] : undefined,
      phone: this.mapping.phone ? row[this.mapping.phone] : undefined,
      companyName: this.mapping.companyName 
        ? row[this.mapping.companyName] 
        : this.mapping.company_name 
        ? row[this.mapping.company_name] 
        : undefined,
      source: this.mapping.source ? row[this.mapping.source] : 'csv',
      lifecycleStage: this.mapping.lifecycleStage ? row[this.mapping.lifecycleStage] : undefined,
      metadata: row,
    }
  }

  protected normalizeCompany(row: ParsedRow): CRMCompany {
    const companyName = this.mapping.company_name 
      ? row[this.mapping.company_name] 
      : row[this.mapping.companyName || '']

    return {
      externalId: `csv-company-${companyName}`,
      name: companyName,
      domain: this.mapping.company_domain ? row[this.mapping.company_domain] : undefined,
      industry: this.mapping.company_industry ? row[this.mapping.company_industry] : undefined,
      size: this.mapping.company_size ? row[this.mapping.company_size] : undefined,
      metadata: row,
    }
  }

  protected normalizeDeal(row: ParsedRow): CRMDeal {
    const dealName = this.mapping.deal_name ? row[this.mapping.deal_name] : 'Untitled Deal'
    const amount = this.mapping.deal_amount 
      ? parseFloat(row[this.mapping.deal_amount].replace(/[^0-9.-]/g, ''))
      : 0

    return {
      externalId: `csv-deal-${dealName}-${Math.random()}`,
      name: dealName,
      amount,
      currency: 'USD',
      stage: this.mapping.deal_stage ? row[this.mapping.deal_stage] : 'unknown',
      closeDate: this.mapping.deal_closeDate 
        ? new Date(row[this.mapping.deal_closeDate]) 
        : undefined,
      contactEmail: row[this.mapping.email],
      companyName: this.mapping.company_name ? row[this.mapping.company_name] : undefined,
      metadata: row,
    }
  }
}

/**
 * CSV Parser utility
 */
export function parseCSV(csvText: string): ParsedRow[] {
  const lines = csvText.split('\n').filter((line) => line.trim())
  if (lines.length === 0) return []

  const headers = lines[0].split(',').map((h) => h.trim())
  const rows: ParsedRow[] = []

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map((v) => v.trim())
    const row: ParsedRow = {}
    
    headers.forEach((header, index) => {
      row[header] = values[index] || ''
    })
    
    rows.push(row)
  }

  return rows
}

/**
 * Auto-detect column mapping
 */
export function autoDetectMapping(headers: string[]): Partial<CSVMapping> {
  const mapping: Partial<CSVMapping> = {}

  const lowerHeaders = headers.map((h) => h.toLowerCase())

  // Email detection
  const emailIdx = lowerHeaders.findIndex((h) => 
    h.includes('email') || h.includes('e-mail')
  )
  if (emailIdx !== -1) mapping.email = headers[emailIdx]

  // Name detection
  const firstNameIdx = lowerHeaders.findIndex((h) => 
    h.includes('first') && h.includes('name')
  )
  if (firstNameIdx !== -1) mapping.firstName = headers[firstNameIdx]

  const lastNameIdx = lowerHeaders.findIndex((h) => 
    h.includes('last') && h.includes('name')
  )
  if (lastNameIdx !== -1) mapping.lastName = headers[lastNameIdx]

  // Phone detection
  const phoneIdx = lowerHeaders.findIndex((h) => 
    h.includes('phone') || h.includes('mobile') || h.includes('tel')
  )
  if (phoneIdx !== -1) mapping.phone = headers[phoneIdx]

  // Company detection
  const companyIdx = lowerHeaders.findIndex((h) => 
    h.includes('company') || h.includes('organization')
  )
  if (companyIdx !== -1) mapping.companyName = headers[companyIdx]

  return mapping
}

