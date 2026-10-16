const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models";

// Analyzes collected repository source code using Google Gemini AI
async function analyzeRepositoryWithGemini(repositoryName, files) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("Gemini API key is not configured on the server");
  }

  if (!files || files.length === 0) {
    throw new Error("No source code files were collected for analysis");
  }

  const requestedModel = process.env.GEMINI_MODEL || "gemini-3.8-flash";
  const candidateModels = [
    requestedModel,
    "gemini-3.5-flash-lite",
    "gemini-3.1-flash-lite",
    "gemini-3.6-flash",
  ].filter((m, i, arr) => arr.indexOf(m) === i);

  // Formats collected file contents into an aggregated code review context
  const fileContexts = files.map((f) => `--- FILE: ${f.path} ---\n${f.content}\n`).join("\n");

  const prompt = `You are a principal software engineer and code reviewer for CodePulse, an engineering intelligence platform.
Analyze the following repository source code for "${repositoryName}".

Source files (${files.length} files):
${fileContexts}

Provide a comprehensive, objective technical analysis. Respond ONLY with a valid JSON object matching this exact schema:
{
  "summary": "Clear, concise high-level summary of what this repository does, its purpose, and its primary technology stack.",
  "architecture": "Structured analysis of the project layout, architecture patterns, modularity, and component separation.",
  "codeQuality": "Evaluation of code quality, readability, style consistency, error handling, and maintainability.",
  "issues": [
    "Specific issue or potential bug observed in the code",
    "Maintainability, security, or robustness concern supported by the code"
  ],
  "recommendations": [
    "Concrete, actionable recommendation for improvement",
    "Specific architectural or best-practice suggestion"
  ]
}

Strict requirements:
1. Base all findings strictly on the code provided. Do not invent unmentioned files, libraries, or behaviors.
2. Distinguish concrete observations from assumptions.
3. Keep descriptions professional, clear, and direct without unnecessary filler prose.
4. Output raw JSON only. Do not wrap in markdown code blocks.`;

  const payload = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: {
      responseMimeType: "application/json",
      temperature: 0.2,
    },
  };

  let response;
  let lastErrorMessage = "";

  // Queries candidate models sequentially with automatic fallback on quota limits or service unavailability
  for (let i = 0; i < candidateModels.length; i++) {
    const model = candidateModels[i];
    const isLast = i === candidateModels.length - 1;
    try {
      const url = `${GEMINI_API_URL}/${model}:generateContent?key=${apiKey}`;
      const timeoutMs = isLast ? 40000 : 25000;
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(timeoutMs),
      });

      if (res.ok) {
        response = res;
        break;
      }

      const errorData = await res.json().catch(() => ({}));
      lastErrorMessage = errorData.error?.message || `Gemini API error (${res.status})`;

      if (res.status === 503 || res.status === 429 || res.status === 404) {
        console.warn(`Gemini model ${model} unavailable (${res.status}): ${lastErrorMessage}. Trying next candidate model.`);
        continue;
      }

      throw new Error(lastErrorMessage);
    } catch (err) {
      const isTimeout = err.name === "TimeoutError";
      lastErrorMessage = isTimeout ? `Request timed out on ${model}` : err.message;
      if (!isLast && (isTimeout || lastErrorMessage.includes("high demand") || lastErrorMessage.includes("quota") || lastErrorMessage.includes("503") || lastErrorMessage.includes("429"))) {
        console.warn(`Gemini model ${model} failed (${lastErrorMessage}). Trying fallback model.`);
        continue;
      }
      if (err.message === lastErrorMessage && !isTimeout) throw err;
    }
  }

  if (!response || !response.ok) {
    throw new Error(lastErrorMessage || "Unable to complete Gemini analysis across candidate models");
  }

  const result = await response.json();
  const rawText = result.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!rawText) {
    throw new Error("Gemini returned an empty analysis response");
  }

  // Parses raw Gemini JSON output with markdown stripping and validation
  let parsed;
  try {
    const cleaned = rawText
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/```\s*$/i, "")
      .trim();
    parsed = JSON.parse(cleaned);
  } catch (err) {
    throw new Error("Unable to parse structured analysis from Gemini response");
  }

  return {
    summary: typeof parsed.summary === "string" ? parsed.summary.trim() : "No summary provided.",
    architecture: typeof parsed.architecture === "string" ? parsed.architecture.trim() : "Architecture details unavailable.",
    codeQuality: typeof parsed.codeQuality === "string" ? parsed.codeQuality.trim() : "Code quality details unavailable.",
    issues: Array.isArray(parsed.issues) ? parsed.issues.filter((i) => typeof i === "string" && i.trim().length > 0) : [],
    recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations.filter((r) => typeof r === "string" && r.trim().length > 0) : [],
  };
}

module.exports = {
  analyzeRepositoryWithGemini,
};
