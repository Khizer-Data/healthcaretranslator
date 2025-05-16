import ApiKeyTester from "@/components/ApiKeyTester"

export default function ApiVerificationPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold text-center mb-8">API Key Verification</h1>
      <ApiKeyTester />
    </div>
  )
}
