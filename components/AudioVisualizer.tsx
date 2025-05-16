type AudioVisualizerProps = {
  level: number // 0 to 1
}

export default function AudioVisualizer({ level }: AudioVisualizerProps) {
  const bars = Array(5)
    .fill(0)
    .map((_, i) => i)

  return (
    <div className="flex space-x-1 items-end h-8 w-24" aria-hidden="true">
      {bars.map((i) => {
        const height = (i + 1) / bars.length
        const threshold = height * 0.7 // Lower threshold to make visualization more sensitive
        const active = level >= threshold

        return (
          <div
            key={i}
            className={`w-3 rounded-t-sm transition-all duration-150 ${
              active ? "bg-green-500 dark:bg-green-400 animate-pulse" : "bg-gray-300 dark:bg-gray-600"
            }`}
            style={{
              height: `${(active ? height * 1.2 : height) * 100}%`,
            }}
          />
        )
      })}
    </div>
  )
}
