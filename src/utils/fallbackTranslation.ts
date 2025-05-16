/**
 * Simple fallback translation for when API-based translation fails
 */

// Common medical terms in different languages
const medicalDictionary: Record<string, Record<string, string>> = {
  en: {
    // English to Spanish
    es: {
      doctor: "médico",
      patient: "paciente",
      hospital: "hospital",
      medicine: "medicina",
      prescription: "receta",
      pain: "dolor",
      symptom: "síntoma",
      disease: "enfermedad",
      treatment: "tratamiento",
      health: "salud",
      sick: "enfermo",
      fever: "fiebre",
      headache: "dolor de cabeza",
      stomach: "estómago",
      heart: "corazón",
      blood: "sangre",
      test: "prueba",
      allergy: "alergia",
      vaccine: "vacuna",
      pharmacy: "farmacia",
      emergency: "emergencia",
      appointment: "cita",
      insurance: "seguro",
      hello: "hola",
      goodbye: "adiós",
      yes: "sí",
      no: "no",
      thank: "gracias",
      please: "por favor",
      help: "ayuda",
      issue: "problema",
      regarding: "con respecto a",
      prescribe: "recetar",
      can: "puede",
      you: "usted",
      me: "me",
      my: "mi",
      i: "yo",
      have: "tengo",
      an: "un",
      a: "un",
      to: "a",
    },
    // English to French
    fr: {
      doctor: "médecin",
      patient: "patient",
      hospital: "hôpital",
      medicine: "médicament",
      prescription: "ordonnance",
      pain: "douleur",
      symptom: "symptôme",
      disease: "maladie",
      treatment: "traitement",
      health: "santé",
      sick: "malade",
      fever: "fièvre",
      headache: "mal de tête",
      stomach: "estomac",
      heart: "cœur",
      blood: "sang",
      test: "test",
      allergy: "allergie",
      vaccine: "vaccin",
      pharmacy: "pharmacie",
      emergency: "urgence",
      appointment: "rendez-vous",
      insurance: "assurance",
      hello: "bonjour",
      goodbye: "au revoir",
      yes: "oui",
      no: "non",
      thank: "merci",
      please: "s'il vous plaît",
      help: "aide",
      issue: "problème",
      regarding: "concernant",
      prescribe: "prescrire",
      can: "pouvez",
      you: "vous",
      me: "moi",
      my: "mon",
      i: "je",
      have: "ai",
      an: "un",
      a: "un",
      to: "à",
    },
    // Add more languages as needed
  },
  // Add translations from other languages
}

/**
 * Detects if the speaker is likely a patient or provider
 */
export function detectSpeaker(text: string): "patient" | "provider" | "unknown" {
  const lowerText = text.toLowerCase()

  // Patient indicators
  const patientPhrases = [
    "i feel",
    "i have",
    "i am experiencing",
    "my symptoms",
    "my pain",
    "i need",
    "help me",
    "can you",
    "doctor",
    "nurse",
    "my health",
  ]

  // Provider indicators
  const providerPhrases = [
    "your condition",
    "your symptoms",
    "i recommend",
    "you should",
    "the treatment",
    "your test",
    "the diagnosis",
    "prescribe",
    "medication",
    "take this",
  ]

  let patientScore = 0
  let providerScore = 0

  patientPhrases.forEach((phrase) => {
    if (lowerText.includes(phrase)) patientScore++
  })

  providerPhrases.forEach((phrase) => {
    if (lowerText.includes(phrase)) providerScore++
  })

  if (patientScore > providerScore) return "patient"
  if (providerScore > patientScore) return "provider"
  return "unknown"
}

/**
 * Simple word-by-word translation using a dictionary
 */
export function fallbackTranslate(text: string, fromLang: string, toLang: string): string {
  // If languages are the same, return the original text
  if (fromLang === toLang) return text

  // Get the dictionary for the language pair
  const dictionary = medicalDictionary[fromLang]?.[toLang]

  // If no dictionary exists for this language pair, return the original text
  if (!dictionary) return `[No fallback translation available for ${fromLang} to ${toLang}] ${text}`

  // Split the text into words and translate each word
  const words = text.split(/\b/)
  const translatedWords = words.map((word) => {
    const lowerWord = word.toLowerCase()
    return dictionary[lowerWord] || word
  })

  return `[Fallback translation] ${translatedWords.join("")}`
}
