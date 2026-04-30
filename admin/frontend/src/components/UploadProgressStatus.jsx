export function stageMessage(stage, progress, itemLabel) {
  if (stage === 'signing') return 'מכין העלאה מאובטחת…'
  if (stage === 'uploading') return `מעלה ${itemLabel} ל-Cloudinary… ${progress}%`
  if (stage === 'saving') return 'שומר נתוני קובץ במערכת…'
  return 'מעלה…'
}

export function buttonText(stage, idle) {
  if (stage === 'signing') return 'מכין…'
  if (stage === 'uploading') return 'מעלה…'
  if (stage === 'saving') return 'שומר…'
  return idle
}

export default function UploadProgressStatus({ active, stage, progress, itemLabel }) {
  const safeProgress = Math.max(0, Math.min(100, Number(progress) || 0))
  if (!active) return null
  return (
    <div className="space-y-2" aria-live="polite">
      <div className="h-2.5 w-full rounded-full bg-neutral-200 overflow-hidden">
        <div
          className="h-full bg-primary-500 transition-[width] duration-150 ease-out rounded-full"
          style={{ width: `${safeProgress}%` }}
        />
      </div>
      <p className="text-xs text-neutral-600">{stageMessage(stage, safeProgress, itemLabel)}</p>
    </div>
  )
}
