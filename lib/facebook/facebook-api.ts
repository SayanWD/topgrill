import axios from 'axios'

export interface FacebookLeadData {
  email?: string
  phone?: string
  firstName?: string
  lastName?: string
  leadId?: string
  status?: string
  value?: number
  customData?: Record<string, unknown>
}

export interface FacebookConversionEvent {
  event_name: string
  event_time: number
  user_data: {
    em?: string[] // email (hashed)
    ph?: string[] // phone (hashed)
    fn?: string[] // first name (hashed)
    ln?: string[] // last name (hashed)
  }
  custom_data?: {
    content_name?: string
    content_category?: string
    value?: number
    currency?: string
    lead_id?: string
    lead_status?: string
  }
}

export class FacebookAPI {
  private accessToken: string
  private pixelId: string
  private baseUrl = 'https://graph.facebook.com/v18.0'

  constructor(accessToken: string, pixelId: string) {
    this.accessToken = accessToken
    this.pixelId = pixelId
  }

  /**
   * Test Facebook API connection
   */
  async testConnection(): Promise<boolean> {
    try {
      const response = await axios.get(`${this.baseUrl}/me`, {
        params: {
          access_token: this.accessToken,
          fields: 'id,name'
        }
      })
      
      console.log('Facebook API connection successful:', response.data)
      return true
    } catch (error) {
      console.error('Facebook API connection failed:', error)
      return false
    }
  }

  /**
   * Send conversion event to Facebook
   */
  async sendConversionEvent(event: FacebookConversionEvent): Promise<boolean> {
    try {
      const response = await axios.post(
        `${this.baseUrl}/${this.pixelId}/events`,
        {
          data: [event],
          test_event_code: process.env.NODE_ENV === 'development' ? 'TEST12345' : undefined
        },
        {
          params: {
            access_token: this.accessToken
          }
        }
      )

      console.log('Facebook conversion event sent:', response.data)
      return true
    } catch (error) {
      console.error('Facebook conversion event failed:', error)
      return false
    }
  }

  /**
   * Update lead status in Facebook
   */
  async updateLeadStatus(leadData: FacebookLeadData): Promise<boolean> {
    try {
      // Hash user data for privacy
      const hashedData = await this.hashUserData(leadData)
      
      const event: FacebookConversionEvent = {
        event_name: 'Lead',
        event_time: Math.floor(Date.now() / 1000),
        user_data: hashedData,
        custom_data: {
          content_name: 'CRM Lead Update',
          content_category: 'Lead Management',
          value: leadData.value || 0,
          currency: 'USD',
          lead_id: leadData.leadId,
          lead_status: leadData.status
        }
      }

      return await this.sendConversionEvent(event)
    } catch (error) {
      console.error('Facebook lead status update failed:', error)
      return false
    }
  }

  /**
   * Hash user data for Facebook API
   */
  private async hashUserData(data: FacebookLeadData): Promise<Record<string, string[]>> {
    const hashedData: Record<string, string[]> = {}
    
    if (data.email) {
      hashedData.em = [await this.hashString(data.email.toLowerCase())]
    }
    
    if (data.phone) {
      // Remove all non-digits and add country code if needed
      const cleanPhone = data.phone.replace(/\D/g, '')
      hashedData.ph = [await this.hashString(cleanPhone)]
    }
    
    if (data.firstName) {
      hashedData.fn = [await this.hashString(data.firstName.toLowerCase())]
    }
    
    if (data.lastName) {
      hashedData.ln = [await this.hashString(data.lastName.toLowerCase())]
    }
    
    return hashedData
  }

  private async hashString(input: string): Promise<string> {
    const encoder = new TextEncoder()
    const data = encoder.encode(input)
    const hashBuffer = await crypto.subtle.digest('SHA-256', data)
    return Array.from(new Uint8Array(hashBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')
  }

  /**
   * Send lead conversion event
   */
  async sendLeadConversion(leadData: FacebookLeadData): Promise<boolean> {
    try {
      const hashedData = await this.hashUserData(leadData)
      
      const event: FacebookConversionEvent = {
        event_name: 'Lead',
        event_time: Math.floor(Date.now() / 1000),
        user_data: hashedData,
        custom_data: {
          content_name: 'New Lead',
          content_category: 'Lead Generation',
          value: leadData.value || 0,
          currency: 'USD',
          lead_id: leadData.leadId,
          lead_status: 'new'
        }
      }

      return await this.sendConversionEvent(event)
    } catch (error) {
      console.error('Facebook lead conversion failed:', error)
      return false
    }
  }

  /**
   * Send purchase conversion event
   */
  async sendPurchaseConversion(leadData: FacebookLeadData): Promise<boolean> {
    try {
      const hashedData = await this.hashUserData(leadData)
      
      const event: FacebookConversionEvent = {
        event_name: 'Purchase',
        event_time: Math.floor(Date.now() / 1000),
        user_data: hashedData,
        custom_data: {
          content_name: 'Lead Converted to Customer',
          content_category: 'Conversion',
          value: leadData.value || 0,
          currency: 'USD',
          lead_id: leadData.leadId,
          lead_status: 'converted'
        }
      }

      return await this.sendConversionEvent(event)
    } catch (error) {
      console.error('Facebook purchase conversion failed:', error)
      return false
    }
  }
}
