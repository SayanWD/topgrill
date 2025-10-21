'use client'

export function ImportProgress() {
  return (
    <div className="space-y-4">
      <div className="text-center">
        <div className="mb-4 text-6xl">⏳</div>
        <h2 className="mb-2 text-xl font-semibold">Importing Data...</h2>
        <p className="text-sm text-gray-600">
          Please wait while we import your data
        </p>
      </div>

      {/* Progress Bar */}
      <div className="h-2 overflow-hidden rounded-full bg-gray-200">
        <div className="h-full animate-pulse bg-blue-600" style={{ width: '60%' }} />
      </div>

      {/* Status */}
      <div className="space-y-2 text-sm">
        <p>✓ Validating data...</p>
        <p>✓ Checking for duplicates...</p>
        <p className="text-gray-500">⏳ Importing contacts...</p>
        <p className="text-gray-400">⏳ Finalizing...</p>
      </div>
    </div>
  )
}

