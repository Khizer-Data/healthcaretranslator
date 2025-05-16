type BannerProps = {
  message: string | null
  type?: "error" | "info"
}

export default function Banner({ message, type = "info" }: BannerProps) {
  if (!message) return null

  const baseClass = "p-3 rounded mb-4 text-white text-center font-medium"
  const typeClass = type === "error" ? "bg-red-500" : "bg-blue-500"

  return (
    <div
      role={type === "error" ? "alert" : "status"}
      aria-live={type === "error" ? "assertive" : "polite"}
      className={`${baseClass} ${typeClass}`}
    >
      {message}
    </div>
  )
}
