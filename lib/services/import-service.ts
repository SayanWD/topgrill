import { createServiceRoleClient } from '@/lib/supabase/server'
import type { BaseCRMAdapter, ImportResult, CRMContact, CRMCompany, CRMDeal } from '@/lib/crm-adapters/base-adapter'

/**
 * Import Service
 * Orchestrates CRM data import with deduplication and error handling
 */

export interface ImportOptions {
  batchSize?: number
  skipDuplicates?: boolean
  updateExisting?: boolean
  dryRun?: boolean
}

export interface ImportProgress {
  id: string
  status: 'pending' | 'running' | 'completed' | 'failed'
  totalRecords: number
  processedRecords: number
  importedRecords: number
  failedRecords: number
  skippedRecords: number
  startedAt?: Date
  completedAt?: Date
  errors: Array<{ row?: number; message: string }>
}

export class ImportService {
  private supabase = createServiceRoleClient()

  /**
   * Import contacts from CRM adapter
   */
  async importContacts(
    adapter: BaseCRMAdapter,
    options: ImportOptions = {}
  ): Promise<ImportResult> {
    const {
      batchSize = 100,
      skipDuplicates = true,
      updateExisting = false,
      dryRun = false,
    } = options

    const result: ImportResult = {
      success: true,
      imported: 0,
      failed: 0,
      skipped: 0,
      errors: [],
    }

    try {
      // Fetch all contacts
      let offset = 0
      let hasMore = true

      while (hasMore) {
        const contacts = await adapter.fetchContacts({
          limit: batchSize,
          offset,
        })

        if (contacts.length === 0) {
          hasMore = false
          break
        }

        // Process batch
        for (const contact of contacts) {
          try {
            if (dryRun) {
              // Validation only
              this.validateContact(contact)
              result.imported++
              continue
            }

            // Check for duplicates
            if (skipDuplicates) {
              const existing = await this.findContactByEmail(contact.email)
              
              if (existing) {
                if (updateExisting) {
                  await this.updateContact(existing.id, contact)
                  result.imported++
                } else {
                  result.skipped++
                }
                continue
              }
            }

            // Find or create company
            let companyId: string | undefined
            if (contact.companyName) {
              companyId = await this.findOrCreateCompany({
                externalId: `${contact.source}-company-${contact.companyName}`,
                name: contact.companyName,
              })
            }

            // Insert contact
            await this.insertContact(contact, companyId)
            result.imported++
          } catch (error) {
            result.failed++
            result.errors.push({
              message: error instanceof Error ? error.message : 'Unknown error',
              data: contact,
            })
          }
        }

        offset += batchSize
      }
    } catch (error) {
      result.success = false
      result.errors.push({
        message: error instanceof Error ? error.message : 'Import failed',
      })
    }

    return result
  }

  /**
   * Import companies from CRM adapter
   */
  async importCompanies(
    adapter: BaseCRMAdapter,
    options: ImportOptions = {}
  ): Promise<ImportResult> {
    const { batchSize = 100, skipDuplicates = true, dryRun = false } = options

    const result: ImportResult = {
      success: true,
      imported: 0,
      failed: 0,
      skipped: 0,
      errors: [],
    }

    try {
      let offset = 0
      let hasMore = true

      while (hasMore) {
        const companies = await adapter.fetchCompanies({
          limit: batchSize,
          offset,
        })

        if (companies.length === 0) {
          hasMore = false
          break
        }

        for (const company of companies) {
          try {
            if (dryRun) {
              this.validateCompany(company)
              result.imported++
              continue
            }

            if (skipDuplicates) {
              const existing = await this.findCompanyByExternalId(company.externalId)
              if (existing) {
                result.skipped++
                continue
              }
            }

            await this.insertCompany(company)
            result.imported++
          } catch (error) {
            result.failed++
            result.errors.push({
              message: error instanceof Error ? error.message : 'Unknown error',
              data: company,
            })
          }
        }

        offset += batchSize
      }
    } catch (error) {
      result.success = false
      result.errors.push({
        message: error instanceof Error ? error.message : 'Import failed',
      })
    }

    return result
  }

  /**
   * Import deals from CRM adapter
   */
  async importDeals(
    adapter: BaseCRMAdapter,
    options: ImportOptions = {}
  ): Promise<ImportResult> {
    const { batchSize = 100, skipDuplicates = true, dryRun = false } = options

    const result: ImportResult = {
      success: true,
      imported: 0,
      failed: 0,
      skipped: 0,
      errors: [],
    }

    try {
      let offset = 0
      let hasMore = true

      while (hasMore) {
        const deals = await adapter.fetchDeals({
          limit: batchSize,
          offset,
        })

        if (deals.length === 0) {
          hasMore = false
          break
        }

        for (const deal of deals) {
          try {
            if (dryRun) {
              this.validateDeal(deal)
              result.imported++
              continue
            }

            if (skipDuplicates) {
              const existing = await this.findDealByExternalId(deal.externalId)
              if (existing) {
                result.skipped++
                continue
              }
            }

            // Find contact and company
            let contactId: string | undefined
            let companyId: string | undefined

            if (deal.contactEmail) {
              const contact = await this.findContactByEmail(deal.contactEmail)
              contactId = contact?.id
            }

            if (deal.companyName) {
              const company = await this.findCompanyByName(deal.companyName)
              companyId = company?.id
            }

            await this.insertDeal(deal, contactId, companyId)
            result.imported++
          } catch (error) {
            result.failed++
            result.errors.push({
              message: error instanceof Error ? error.message : 'Unknown error',
              data: deal,
            })
          }
        }

        offset += batchSize
      }
    } catch (error) {
      result.success = false
      result.errors.push({
        message: error instanceof Error ? error.message : 'Import failed',
      })
    }

    return result
  }

  // ==================== Private helpers ====================

  private validateContact(contact: CRMContact): void {
    if (!contact.email || !contact.email.includes('@')) {
      throw new Error('Invalid email')
    }
  }

  private validateCompany(company: CRMCompany): void {
    if (!company.name) {
      throw new Error('Company name is required')
    }
  }

  private validateDeal(deal: CRMDeal): void {
    if (!deal.name) {
      throw new Error('Deal name is required')
    }
    if (deal.amount < 0) {
      throw new Error('Deal amount cannot be negative')
    }
  }

  private async findContactByEmail(email: string) {
    const { data } = await this.supabase
      .from('contacts')
      .select('id')
      .eq('email', email)
      .single()
    return data
  }

  private async findCompanyByExternalId(externalId: string) {
    const { data } = await this.supabase
      .from('companies')
      .select('id')
      .eq('external_id', externalId)
      .single()
    return data
  }

  private async findCompanyByName(name: string) {
    const { data } = await this.supabase
      .from('companies')
      .select('id')
      .ilike('name', name)
      .single()
    return data
  }

  private async findDealByExternalId(externalId: string) {
    const { data } = await this.supabase
      .from('deals')
      .select('id')
      .eq('external_id', externalId)
      .single()
    return data
  }

  private async findOrCreateCompany(company: Pick<CRMCompany, 'externalId' | 'name'>): Promise<string> {
    // Try to find existing
    const existing = await this.findCompanyByExternalId(company.externalId)
    if (existing) return existing.id

    // Create new
    const { data, error } = await this.supabase
      .from('companies')
      .insert({
        external_id: company.externalId,
        name: company.name,
      })
      .select('id')
      .single()

    if (error) throw error
    return data.id
  }

  private async insertContact(contact: CRMContact, companyId?: string) {
    const { error } = await this.supabase.from('contacts').insert({
      external_id: contact.externalId,
      email: contact.email,
      first_name: contact.firstName,
      last_name: contact.lastName,
      phone: contact.phone,
      company_id: companyId,
      source: contact.source,
      lifecycle_stage: contact.lifecycleStage,
      metadata: contact.metadata,
    })

    if (error) throw error
  }

  private async updateContact(id: string, contact: CRMContact) {
    const { error } = await this.supabase
      .from('contacts')
      .update({
        first_name: contact.firstName,
        last_name: contact.lastName,
        phone: contact.phone,
        lifecycle_stage: contact.lifecycleStage,
        metadata: contact.metadata,
      })
      .eq('id', id)

    if (error) throw error
  }

  private async insertCompany(company: CRMCompany) {
    const { error } = await this.supabase.from('companies').insert({
      external_id: company.externalId,
      name: company.name,
      domain: company.domain,
      industry: company.industry,
      size: company.size,
      metadata: company.metadata,
    })

    if (error) throw error
  }

  private async insertDeal(deal: CRMDeal, contactId?: string, companyId?: string) {
    const { error } = await this.supabase.from('deals').insert({
      external_id: deal.externalId,
      name: deal.name,
      amount: deal.amount,
      currency: deal.currency || 'USD',
      stage: deal.stage,
      probability: deal.probability,
      close_date: deal.closeDate?.toISOString(),
      contact_id: contactId,
      company_id: companyId,
      metadata: deal.metadata,
    })

    if (error) throw error
  }
}

