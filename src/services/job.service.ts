// src/services/job.service.ts
import axios from "axios";

type RemoteJob = {
  title?: string;
  location?: string;
  snippet?: string;
  salary?: string;
  source?: string;
  type?: string;
  link?: string;
  company?: string;
  updated?: string;
  id?: number | string;
  [k: string]: any;
};

const JOOBLE_API_KEY = process.env.JOOBLE_API_KEY;
const JOOBLE_BASE_URL = process.env.JOOBLE_BASE_URL ?? "https://jooble.org/api";

// Basic guard
if (!JOOBLE_API_KEY) {
  console.warn(
    "[job.service] JOOBLE_API_KEY is not set. Job search will fail without it."
  );
}

const searchJobs = async (
  keywords: string = "Software developer",
  location: string = "India",
  page: number = 1
): Promise<{ totalCount: number; jobs: RemoteJob[] }> => {
  if (!JOOBLE_API_KEY) {
    throw new Error("Jooble API key missing on server (JOOBLE_API_KEY).");
  }

  const url = `${JOOBLE_BASE_URL}/${JOOBLE_API_KEY}`;

  try {
    const resp = await axios.post(
      url,
      { keywords, location: "India", page },
      { headers: { "Content-Type": "application/json" }, timeout: 10000 }
    );

    // Jooble returns { totalCount, jobs: [...] } per your sample
    const data = resp.data;
    if (!data || !Array.isArray(data.jobs)) {
      console.warn("[job.service] Unexpected Jooble response shape:", data);
      return { totalCount: 0, jobs: [] };
    }

    // We trust Jooble's job shape — but we ensure types and defaults
    const jobs = (data.jobs as RemoteJob[]).map((j, idx) => ({
      title: j.title ?? "",
      location: j.location ?? "",
      snippet: j.snippet ?? "",
      salary: j.salary ?? "",
      source: j.source ?? "",
      type: j.type ?? "",
      link: j.link ?? "",
      company: j.company ?? "",
      updated: j.updated ?? new Date().toISOString(),
      id: typeof j.id === "number" ? j.id : Number(j.id) || idx,
      ...j, // keep any extra fields (safe)
    }));

    return {
      totalCount: Number(data.totalCount ?? jobs.length),
      jobs,
    };
  } catch (err: any) {
    console.error(
      "[job.service] request failed:",
      err?.response?.data ?? err?.message ?? err
    );
    throw new Error("Failed to fetch jobs from Jooble.");
  }
};

export const jobService = {
  searchJobs,
};
