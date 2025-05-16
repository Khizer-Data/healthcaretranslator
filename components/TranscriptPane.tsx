type TranscriptSegment = {
  text: string
  speaker?: "patient" | "provider" | "unknown"
}

type TranscriptPaneProps = {
  title: string
  segments: TranscriptSegment[]
  colorClass: string
  ariaLabel: string
}

export default function TranscriptPane({ title, segments, colorClass, ariaLabel }: TranscriptPaneProps) {
  return (
    <section
      aria-label={ariaLabel}
      className="flex-1 bg-white dark:bg-gray-800 p-4 rounded shadow overflow-auto max-h-[70vh]"
    >
      <h2 className="mb-2 font-semibold">{title}</h2>

      {segments.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-32 text-gray-500">
          <p>No transcript available yet</p>
          <p className="text-sm mt-1">Start speaking to see content here</p>
        </div>
      ) : (
        <div className="space-y-2 text-sm">
          {segments.map((seg, i) => (
            <p key={i} className="whitespace-pre-wrap">
              <span className={`font-bold ${colorClass}`}>[{seg.speaker ?? "unknown"}]:</span> {seg.text}
            </p>
          ))}
        </div>
      )}
    </section>
  )
}
