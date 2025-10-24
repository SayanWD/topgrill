'use client'

import { useState, useRef } from 'react'
import { ArrowUpTrayIcon } from '@heroicons/react/24/outline'

interface CSVUploadProps {
  onUpload: (data: Record<string, unknown>[]) => void
}

export function CSVUpload({ onUpload }: CSVUploadProps) {
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      // Validate file type
      if (!selectedFile.name.match(/\.(csv|xlsx|xls)$/i)) {
        setError('Please upload a CSV or Excel file')
        return
      }

      // Validate file size (max 10MB)
      if (selectedFile.size > 10 * 1024 * 1024) {
        setError('File too large. Maximum size is 10MB')
        return
      }

      setFile(selectedFile)
      setError(null)
    }
  }

  const handleUpload = async () => {
    if (!file) return

    setUploading(true)
    setError(null)

    try {
      // Read file as text
      const text = await file.text()

      // Analyze with API
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/import/csv', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error('Failed to analyze file')
      }

      const result = await response.json()
      
      // Pass data to parent with raw CSV text
      onUpload({
        ...result,
        raw: text,
        filename: file.name,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Upload CSV File</h2>
      <p className="text-sm text-gray-600">
        Upload your contacts, companies, or deals data
      </p>

      {/* Drop Zone */}
      <div
        onClick={() => fileInputRef.current?.click()}
        className="cursor-pointer rounded-lg border-2 border-dashed border-gray-300 p-12 text-center transition-colors hover:border-blue-500 hover:bg-blue-50"
      >
        <ArrowUpTrayIcon className="mx-auto mb-4 h-12 w-12 text-gray-400" />
        <p className="mb-2 text-sm font-medium">
          {file ? file.name : 'Click to upload or drag and drop'}
        </p>
        <p className="text-xs text-gray-500">
          CSV or XLSX (max 10MB)
        </p>
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,.xlsx,.xls"
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 p-4 text-sm text-red-800">
          {error}
        </div>
      )}

      {file && (
        <div className="rounded-lg bg-green-50 p-4">
          <p className="text-sm font-medium text-green-800">
            ✓ {file.name} ({(file.size / 1024).toFixed(1)} KB)
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-4">
        <button
          onClick={handleUpload}
          disabled={!file || uploading}
          className="rounded-md bg-blue-600 px-6 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {uploading ? 'Analyzing...' : 'Continue'}
        </button>
      </div>

      {/* Template */}
      <div className="rounded-lg bg-gray-50 p-4">
        <p className="mb-2 text-sm font-medium">Need a template?</p>
        <p className="mb-3 text-xs text-gray-600">
          Download our sample CSV with the correct format
        </p>
        <a
          href="/templates/contacts-template.csv"
          download
          className="text-sm text-blue-600 hover:underline"
        >
          Download Template →
        </a>
      </div>
    </div>
  )
}

