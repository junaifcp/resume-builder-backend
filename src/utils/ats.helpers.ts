// src/utils/ats.helpers.ts
import { IResume } from "../models/Resume";
import crypto from "crypto";

/** Build a plain-text resume from your structured Resume document.
 * Keep headings so the text model can see sections.
 */
export function resumeToPlainText(resume: IResume): string {
  const lines: string[] = [];
  lines.push(`${resume.name} — ${resume.title || ""}`.trim());
  if (resume.summary) lines.push("\nSUMMARY\n" + resume.summary);
  if (resume.experiences?.length) {
    lines.push("\nEXPERIENCE");
    resume.experiences.forEach((e) => {
      lines.push(
        `${e.position} — ${e.company} (${e.startDate || ""} - ${
          e.endDate || ""
        })`
      );
      if (e.description) lines.push(e.description);
      if (e.bulletPoints?.length) {
        e.bulletPoints.forEach((bp) => lines.push(`- ${bp}`));
      }
    });
  }
  if (resume.projects?.length) {
    lines.push("\nPROJECTS");
    resume.projects.forEach((p) => {
      lines.push(
        `${p.name} — ${p.role} (${p.startDate || ""} - ${p.endDate || ""})`
      );
      if (p.bulletPoints?.length)
        p.bulletPoints.forEach((bp) => lines.push(`- ${bp}`));
    });
  }
  if (resume.education?.length) {
    lines.push("\nEDUCATION");
    resume.education.forEach((ed) => {
      lines.push(
        `${ed.degree || ""} — ${ed.institution} (${ed.startDate || ""} - ${
          ed.endDate || ""
        })`
      );
      if (ed.description) lines.push(ed.description);
    });
  }
  if (resume.skills?.length) {
    lines.push("\nSKILLS");
    lines.push(resume.skills.map((s) => s.name).join(", "));
  }
  // certifications / languages / awards
  if (resume.certifications?.length)
    lines.push(
      "\nCERTIFICATIONS\n" + resume.certifications.map((c) => c.name).join("; ")
    );
  if (resume.languages?.length)
    lines.push(
      "\nLANGUAGES\n" +
        resume.languages
          .map((l) => `${l.language} (${l.proficiency})`)
          .join(", ")
    );
  return lines.join("\n");
}

/** Basic cosine similarity */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (!a || !b || a.length !== b.length) return 0;
  let dot = 0,
    na = 0,
    nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  if (na === 0 || nb === 0) return 0;
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

/** Parse keywords from JD with a naive regex (you can replace with model-based extraction) */
export function extractKeywordsFromJD(jd: string, topN = 20): string[] {
  // naive approach: take words, remove stopwords, return top frequent.
  const stop = new Set([
    "the",
    "and",
    "a",
    "to",
    "of",
    "in",
    "with",
    "for",
    "on",
    "is",
    "are",
    "you",
    "your",
    "that",
  ]);
  const words = jd.toLowerCase().match(/[a-z\+\#\.\-]+/g) || [];
  const freq = new Map<string, number>();
  for (const w of words) {
    if (w.length < 2 || stop.has(w)) continue;
    freq.set(w, (freq.get(w) || 0) + 1);
  }
  return Array.from(freq.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, topN)
    .map((x) => x[0]);
}

/** small helper to generate a deterministic id for caching embedding results */
export function hashKey(...parts: string[]) {
  return crypto.createHash("sha256").update(parts.join("|")).digest("hex");
}
