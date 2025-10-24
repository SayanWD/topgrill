'use client'

import { useState } from 'react'

interface FieldMapperProps {
  data: Record<string, unknown>[]
  onComplete: (mapping: Record<string, string>) => void
  onBack: () => void
}

const standardFields = [
  { key: 'email', label: 'Email', required: true },
  { key: 'firstName', label: 'First Name', required: false },
  { key: 'lastName', label: 'Last Name', required: false },
  { key: 'phone', label: 'Phone', required: false },
  { key: 'companyName', label: 'Company', required: false },
  { key: 'source', label: 'Source', required: false },
  { key: 'lifecycleStage', label: 'Lifecycle Stage', required: false },
]

export function FieldMapper({ data, onComplete, onBack }: FieldMapperProps) {
  const [mapping, setMapping] = useState<Record<string, string>>({})

  const handleFieldSelect = (standardField: string, csvColumn: string) => {
    setMapping({
      ...mapping,
      [standardField]: csvColumn,
    })
  }

  const handleComplete = () => {
    // Validate required fields
    if (!mapping.email) {
      alert('Email field is required')
      return
    }

    onComplete(mapping)
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold">Map Your Fields</h2>
        <p className="text-sm text-gray-600">
          Match your CSV columns to our standard fields
        </p>
      </div>

      {/* Statistics */}
      <div className="rounded-lg bg-blue-50 p-4">
        <p className="text-sm text-blue-900">
          📊 Found {data.length} rows with {data[0] ? Object.keys(data[0]).length : 0} columns
        </p>
      </div>

      {/* Field Mapping */}
      <div className="space-y-3">
        {standardFields.map((field) => (
          <div key={field.key} className="flex items-center gap-4">
            <div className="w-40">
              <label className="text-sm font-medium">
                {field.label}
                {field.required && <span className="text-red-500">*</span>}
              </label>
            </div>
            
            <div className="flex-1">
              <select
                value={mapping[field.key] || ''}
                onChange={(e) => handleFieldSelect(field.key, e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              >
                <option value="">-- Select column --</option>
                {data[0] ? Object.keys(data[0]).map((header: string) => (
                  <option key={header} value={header}>
                    {header}
                  </option>
                )) : null}
              </select>
            </div>

            {mapping[field.key] && (
              <div className="text-xs text-green-600">✓</div>
            )}
          </div>
        ))}
      </div>

      {/* Sample Data Preview */}
      <div>
        <h3 className="mb-2 text-sm font-medium">Preview (first 3 rows)</h3>
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                {standardFields
                  .filter((f) => mapping[f.key])
                  .map((field) => (
                    <th key={field.key} className="border-b px-4 py-2 text-left">
                      {field.label}
                    </th>
                  ))}
              </tr>
            </thead>
            <tbody>
              {data.slice(0, 3).map((row: Record<string, unknown>, idx: number) => (
                <tr key={idx} className="border-b">
                  {standardFields
                    .filter((f) => mapping[f.key])
                    .map((field) => (
                      <td key={field.key} className="px-4 py-2">
                        {String(row[mapping[field.key]] || '-')}
                      </td>
                    ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-4">
        <button
          onClick={onBack}
          className="rounded-md border px-6 py-2 hover:bg-gray-50"
        >
          Back
        </button>
        <button
          onClick={handleComplete}
          disabled={!mapping.email}
          className="rounded-md bg-blue-600 px-6 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
        >
          Start Import
        </button>
      </div>
    </div>
  )
}

