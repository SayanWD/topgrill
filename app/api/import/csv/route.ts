import { NextRequest, NextResponse } from 'next/server'
import { parseCSV, autoDetectMapping } from '@/lib/crm-adapters/csv-adapter'
import { requireRole } from '@/lib/auth/rbac'

/**
 * CSV Upload & Analysis API
 * POST /api/import/csv
 * 
 * Analyzes CSV file and returns:
 * - Column headers
 * - Auto-detected mapping
 * - Sample rows
 * - Statistics
 */

export async function POST(request: NextRequest) {
  try {
    await requireRole(['analyst', 'admin'])

    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    // Read file content
    const text = await file.text()
    const rows = parseCSV(text)

    if (rows.length === 0) {
      return NextResponse.json(
        { error: 'Empty CSV file' },
        { status: 400 }
      )
    }

    // Get headers
    const headers = Object.keys(rows[0])

    // Auto-detect mapping
    const suggestedMapping = autoDetectMapping(headers)

    // Statistics
    const stats = {
      totalRows: rows.length,
      headers: headers.length,
      hasEmail: headers.some((h) => h.toLowerCase().includes('email')),
      hasPhone: headers.some((h) => h.toLowerCase().includes('phone')),
      hasCompany: headers.some((h) => h.toLowerCase().includes('company')),
    }

    // Sample rows (first 5)
    const samples = rows.slice(0, 5)

    return NextResponse.json({
      success: true,
      headers,
      suggestedMapping,
      stats,
      samples,
      message: `Analyzed ${rows.length} rows`,
    })
  } catch (error) {
    console.error('CSV analysis error:', error)
    return NextResponse.json(
      {
        error: 'Failed to analyze CSV',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

