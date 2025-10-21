'use client'

import { useState } from 'react'
import { ImportSourceSelector } from './import-source-selector'
import { CSVUpload } from './csv-upload'
import { FieldMapper } from './field-mapper'
import { ImportProgress } from './import-progress'

/**
 * Import Wizard - Client Component
 * Multi-step wizard для импорта данных
 */

type Step = 'source' | 'upload' | 'mapping' | 'progress' | 'complete'

export function ImportWizard() {
  const [step, setStep] = useState<Step>('source')
  const [_source, setSource] = useState<string>('')
  const [uploadedData, setUploadedData] = useState<any>(null)
  const [_mapping, setMapping] = useState<any>(null)
  const [importResult, setImportResult] = useState<any>(null)

  const handleSourceSelect = (selectedSource: string) => {
    setSource(selectedSource)
    
    if (selectedSource === 'csv') {
      setStep('upload')
    } else {
      // For API-based sources (HubSpot, Salesforce)
      // TODO: Show credentials form
      setStep('progress')
    }
  }

  const handleUpload = (data: any) => {
    setUploadedData(data)
    setStep('mapping')
  }

  const handleMapping = (mappingData: any) => {
    setMapping(mappingData)
    setStep('progress')
    
    // Start import
    startImport(mappingData)
  }

  const startImport = async (mappingData: any) => {
    try {
      const response = await fetch('/api/import/crm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source: 'csv',
          type: 'contacts',
          credentials: {
            csvData: uploadedData.raw,
            mapping: mappingData,
          },
          options: {
            skipDuplicates: true,
            updateExisting: false,
          },
        }),
      })

      const result = await response.json()
      setImportResult(result)
      setStep('complete')
    } catch (error) {
      console.error('Import failed:', error)
      setImportResult({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  }

  return (
    <div className="rounded-lg border bg-white p-6">
      {/* Progress Indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {['source', 'upload', 'mapping', 'progress'].map((s, idx) => (
            <div key={s} className="flex items-center">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-full ${
                  step === s
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-600'
                }`}
              >
                {idx + 1}
              </div>
              {idx < 3 && (
                <div className="mx-2 h-1 w-16 bg-gray-200 md:w-24" />
              )}
            </div>
          ))}
        </div>
        <div className="mt-2 flex justify-between text-sm text-gray-600">
          <span>Source</span>
          <span>Upload</span>
          <span>Mapping</span>
          <span>Import</span>
        </div>
      </div>

      {/* Steps */}
      {step === 'source' && <ImportSourceSelector onSelect={handleSourceSelect} />}
      {step === 'upload' && <CSVUpload onUpload={handleUpload} />}
      {step === 'mapping' && (
        <FieldMapper
          data={uploadedData}
          onComplete={handleMapping}
          onBack={() => setStep('upload')}
        />
      )}
      {step === 'progress' && <ImportProgress />}
      {step === 'complete' && (
        <div className="text-center">
          <div className="mb-4 text-6xl">✅</div>
          <h2 className="mb-2 text-2xl font-bold">Import Complete!</h2>
          {importResult && (
            <div className="mx-auto max-w-md space-y-2 text-sm">
              <p>✅ Imported: {importResult.result?.imported || 0}</p>
              <p>⏭️ Skipped: {importResult.result?.skipped || 0}</p>
              <p>❌ Failed: {importResult.result?.failed || 0}</p>
            </div>
          )}
          <button
            onClick={() => {
              setStep('source')
              setSource('')
              setUploadedData(null)
              setMapping(null)
              setImportResult(null)
            }}
            className="mt-4 rounded-md bg-blue-600 px-6 py-2 text-white hover:bg-blue-700"
          >
            Start New Import
          </button>
        </div>
      )}
    </div>
  )
}

