// Set to a server endpoint that returns { description: "..." }.
// Keep provider API keys on that server, never in this file.
const AI_DESCRIPTION_URL = "";

async function generateProductDescription(product) {
  if (!AI_DESCRIPTION_URL) {
    throw new Error("Description generation is currently unavailable.");
  }

  const response = await fetch(AI_DESCRIPTION_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(product)
  });

  if (!response.ok) {
    throw new Error("Could not generate a description. Please try again.");
  }

  const result = await response.json();

  if (typeof result.description !== "string" || !result.description.trim()) {
    throw new Error("No description was returned. Please try again.");
  }

  return result.description.trim();
}
