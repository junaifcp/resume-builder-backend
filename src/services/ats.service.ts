// src/services/ats.service.ts
import Resume, { IResume } from "../models/Resume";
import {
  resumeToPlainText,
  extractKeywordsFromJD,
  cosineSimilarity,
  hashKey,
} from "../utils/ats.helpers";
import { invokeBedrockModel } from "../lib/bedrock.client";
import mongoose from "mongoose";
import { getCachedEmbedding, cacheEmbedding } from "../utils/embeddingCache";

/** Configurable model IDs (env or defaults) */
const EMBED_MODEL =
  process.env.BEDROCK_EMBED_MODEL_ID || "amazon.titan-embed-text-v2:0";
const TEXT_MODEL =
  process.env.BEDROCK_TEXT_MODEL_ID || "amazon.titan-text-lite-v1";

/** Robust extractor for embedding arrays returned by various Bedrock shapes */
function extractEmbedding(resp: any): number[] | null {
  if (!resp) return null;

  // If the response itself is an array of numbers
  if (Array.isArray(resp) && typeof resp[0] === "number")
    return resp as number[];

  // Common shapes:
  // { embeddings: [ { embedding: [...] } ] }
  if (Array.isArray(resp.embeddings)) {
    const first = resp.embeddings[0];
    if (Array.isArray(first?.embedding)) return first.embedding;
    // sometimes embedding directly is an array
    if (Array.isArray(first)) return first;
  }

  // { embedding: [...] }
  if (Array.isArray(resp.embedding)) return resp.embedding;

  // { results: [ { embedding: [...] } ] } or { results: [ { outputText: "...", embedding: [...] } ] }
  if (Array.isArray(resp.results) && resp.results.length > 0) {
    const r0 = resp.results[0];
    if (Array.isArray(r0.embedding)) return r0.embedding;
    // some providers nest differently
    if (Array.isArray(r0?.output?.embedding)) return r0.output.embedding;
  }

  // try to find the first numeric array in the object keys
  for (const k of Object.keys(resp)) {
    const v = resp[k];
    if (Array.isArray(v) && typeof v[0] === "number") return v;
    if (Array.isArray(v) && Array.isArray(v[0]) && typeof v[0][0] === "number")
      return v[0];
  }

  return null;
}

/** Simple embedding call */
// async function getEmbedding(text: string): Promise<number[]> {
//   const body = { inputText: text };
//   const result = await invokeBedrockModel(
//     EMBED_MODEL,
//     body,
//     "application/json",
//     "application/json"
//   );

//   // result may be object or string; ensure object
//   let obj = result;
//   if (typeof result === "string") {
//     // try parse (sometimes model returns string)
//     try {
//       obj = JSON.parse(result);
//     } catch {
//       obj = result;
//     }
//   }

//   const embedding = extractEmbedding(obj);
//   if (embedding && embedding.length > 0) return embedding;

//   throw new Error("Unable to parse embedding from Bedrock response.");
// }

// inside src/services/ats.service.ts — replace getEmbedding(...

async function getEmbedding(text: string): Promise<number[]> {
  const key = hashKey(text); // deterministic key
  // 1) try cache
  const cached = await getCachedEmbedding(key);
  if (cached && Array.isArray(cached) && cached.length > 0) {
    return cached;
  }

  // 2) call bedrock
  const body = { inputText: text };
  const result = await invokeBedrockModel(
    EMBED_MODEL,
    body,
    "application/json",
    "application/json"
  );

  // parse result robustly (reuse extractEmbedding from previous code)
  let obj = result;
  if (typeof result === "string") {
    try {
      obj = JSON.parse(result);
    } catch {
      obj = result;
    }
  }

  // attempt to find embedding array
  let embedding: number[] | null = null;
  // (reuse existing extractEmbedding logic inline or import a helper)
  if (Array.isArray(obj) && typeof obj[0] === "number")
    embedding = obj as number[];
  if (!embedding && obj?.embeddings) {
    const first = obj.embeddings[0];
    if (Array.isArray(first?.embedding)) embedding = first.embedding;
    else if (Array.isArray(first)) embedding = first;
  }
  if (!embedding && Array.isArray(obj.embedding)) embedding = obj.embedding;
  if (!embedding && Array.isArray(obj.results) && obj.results[0]?.embedding)
    embedding = obj.results[0].embedding;
  // fallback search
  if (!embedding) {
    for (const k of Object.keys(obj || {})) {
      const v = obj[k];
      if (Array.isArray(v) && typeof v[0] === "number") {
        embedding = v;
        break;
      }
      if (
        Array.isArray(v) &&
        Array.isArray(v[0]) &&
        typeof v[0][0] === "number"
      ) {
        embedding = v[0];
        break;
      }
    }
  }

  if (!embedding || embedding.length === 0)
    throw new Error("Unable to parse embedding from Bedrock response.");

  // 3) cache embedding (best-effort)
  try {
    await cacheEmbedding(key, embedding);
  } catch (e) {
    console.warn("Failed to cache embedding:", e);
  }

  return embedding;
}

/** Use text model to produce rubric and structured scores */
async function getModelRubricEvaluation(resumeText: string, jd?: string) {
  const prompt = [
    "You are an ATS expert. Given the resume text and (optional) job description, return a JSON object with numeric scores (0-1) for: format, readability, experience_relevance, and an overall short suggestions array. Be concise and ONLY return valid JSON.",
    "ResumeText:",
    resumeText.slice(0, 4000),
  ];
  if (jd) {
    prompt.push("\nJobDescription:");
    prompt.push(jd.slice(0, 4000));
  }
  const body = { inputText: prompt.join("\n\n") };

  const raw = await invokeBedrockModel(
    TEXT_MODEL,
    body,
    "application/json",
    "application/json"
  );

  // raw might already be object or string
  let parsed: any = raw;
  if (typeof raw === "string") {
    // If model returns trailing text + JSON, attempt to extract JSON block
    const match = raw.match(/\{[\s\S]*\}$/);
    try {
      parsed = match ? JSON.parse(match[0]) : JSON.parse(raw);
    } catch (e) {
      // If parsing fails, try a looser approach: look for first { ... } block
      const firstBrace = raw.indexOf("{");
      const lastBrace = raw.lastIndexOf("}");
      if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        try {
          parsed = JSON.parse(raw.slice(firstBrace, lastBrace + 1));
        } catch {
          parsed = null;
        }
      } else parsed = null;
    }
  }

  return (
    parsed || {
      format: 0.7,
      readability: 0.7,
      experience_relevance: 0.7,
      suggestions: [
        "Model did not return structured JSON. Consider increasing model token limit.",
      ],
    }
  );
}

/** Main API: compute ATS score */
export async function computeATSSoreForResume(
  resumeId: string,
  jd?: string,
  options?: any
) {
  const resume = await Resume.findById(resumeId).lean();
  if (!resume) throw new Error("Resume not found");

  const resumeText = resumeToPlainText(resume as IResume);

  // 1) Embeddings — resume and jd
  const resumeEmb = await getEmbedding(resumeText);
  let embeddingScore = 0;
  if (jd && jd.trim().length > 10) {
    const jdEmb = await getEmbedding(jd);
    embeddingScore = cosineSimilarity(resumeEmb, jdEmb); // [-1,1]
    // normalize to [0,1]
    embeddingScore = Math.max(0, (embeddingScore + 1) / 2);
  } else {
    embeddingScore = 0.75;
  }

  // 2) keyword match
  let keywordScore = 0;
  if (jd) {
    const keywords = extractKeywordsFromJD(jd, options?.topKeywords || 20);
    const resumeLower = resumeText.toLowerCase();
    const matches = keywords.filter((k) => resumeLower.includes(k));
    keywordScore = keywords.length ? matches.length / keywords.length : 0;
  } else keywordScore = 0.5;

  // 3) model rubric
  const rubric = await getModelRubricEvaluation(resumeText, jd);
  // ensure numeric defaults
  const modelRubricScore =
    ((rubric.format || 0) +
      (rubric.readability || 0) +
      (rubric.experience_relevance || 0)) /
    3;

  // 4) combine
  const weights = {
    embedding: options?.weights?.embedding ?? 0.5,
    keyword: options?.weights?.keyword ?? 0.2,
    modelRubric: options?.weights?.modelRubric ?? 0.3,
  };
  const totalScore =
    embeddingScore * weights.embedding +
    keywordScore * weights.keyword +
    modelRubricScore * weights.modelRubric;
  const normalized = Math.round(totalScore * 1000) / 10; // 0.1 precision

  // Suggestions: combine model suggestions and auto-generated rule-based tips
  const suggestions = (rubric.suggestions || []).slice(0, 5);
  if (keywordScore < 0.5 && jd)
    suggestions.push(
      "Add top job keywords into the Summary / Skills / Experience bullets."
    );

  return {
    score: normalized,
    breakdown: {
      embeddingScore,
      keywordScore,
      modelRubricScore,
      weights,
    },
    recommendations: suggestions,
    modelAnalysis: rubric,
  };
}

export const atsService = {
  computeATSSoreForResume,
};
