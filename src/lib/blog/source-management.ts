import { randomUUID } from "node:crypto";
import { load } from "cheerio";
import { getSupabaseAdminClient } from "../supabase/server";
import {
  isPrivateOrReservedAddress,
  parsePublicHttpUrl,
  PublicFetchError,
  safePublicFetch,
  type SafePublicResponse,
} from "../security/safe-public-fetch";
import type { BlogApprovedSource } from "./types";

type Row = Record<string, any>;
const memorySources = new Map<string, Row>();
const FEED_TYPES = [
  "rss",
  "atom",
  "official_blog",
  "changelog",
  "release_notes",
  "manual_url",
  "imported",
] as const;

function clean(value: unknown, maximum: number) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maximum);
}

export function validateApprovedSourceInput(input: Record<string, unknown>) {
  const sourceUrl = parsePublicHttpUrl(
    clean(input.sourceUrl ?? input.source_url, 500),
  );
  if (sourceUrl.protocol !== "https:")
    throw new Error("Approved sources must use public HTTPS URLs.");
  if (
    sourceUrl.hostname === "localhost" ||
    isPrivateOrReservedAddress(sourceUrl.hostname)
  )
    throw new Error(
      "Approved sources cannot target private, local, reserved, or metadata networks.",
    );
  const name = clean(input.name, 160);
  const publisher = clean(input.publisher, 160);
  if (!name || !publisher)
    throw new Error("Source name and publisher are required.");
  const feedType = FEED_TYPES.includes(input.feedType as any)
    ? (input.feedType as (typeof FEED_TYPES)[number])
    : "rss";
  return {
    name,
    publisher,
    source_url: sourceUrl.toString(),
    feed_type: feedType,
    topic_clusters: Array.isArray(input.topicClusters)
      ? [
          ...new Set(
            input.topicClusters.map((item) => clean(item, 80)).filter(Boolean),
          ),
        ].slice(0, 12)
      : [],
    trust_level: ["high", "medium", "low", "unverified"].includes(
      String(input.trustLevel),
    )
      ? input.trustLevel
      : "unverified",
    source_classification:
      input.classification === "primary" ? "primary" : "secondary",
    enabled: input.enabled !== false,
    fetch_frequency_minutes: Math.max(
      15,
      Math.min(10080, Number(input.fetchFrequencyMinutes) || 360),
    ),
    notes: clean(input.notes, 1000),
  };
}

export function inspectFeedXml(body: string, finalUrl: string) {
  if (!body.trim().startsWith("<"))
    throw new Error("INVALID_XML: Source response is not XML.");
  const $ = load(body, { xmlMode: true });
  const rssItems = $("channel > item");
  const atomItems = $("feed > entry");
  const items = rssItems.length ? rssItems : atomItems;
  if (!$("rss, feed").length || !items.length)
    throw new Error("INVALID_XML: No valid RSS or Atom entries were found.");
  const links = new Set<string>();
  let duplicates = 0;
  let latestItemDate: string | null = null;
  items.slice(0, 200).each((_index, element) => {
    const node = $(element);
    const rawLink =
      node.find("link").first().attr("href") ||
      node.find("link").first().text().trim() ||
      node.find("guid").first().text().trim();
    if (rawLink) {
      try {
        const normalized = new URL(rawLink, finalUrl).toString();
        if (links.has(normalized)) duplicates += 1;
        links.add(normalized);
      } catch {
        /* Invalid item links remain excluded. */
      }
    }
    const rawDate = node
      .find("pubDate, published, updated")
      .first()
      .text()
      .trim();
    const timestamp = rawDate ? new Date(rawDate).getTime() : Number.NaN;
    if (
      !Number.isNaN(timestamp) &&
      (!latestItemDate || timestamp > new Date(latestItemDate).getTime())
    )
      latestItemDate = new Date(timestamp).toISOString();
  });
  return {
    format: rssItems.length ? ("rss" as const) : ("atom" as const),
    itemCount: items.length,
    duplicateItemCount: duplicates,
    latestItemDate,
  };
}

export async function testApprovedSourceUrl(
  sourceUrl: string,
  feedType = "rss",
  fetcher: typeof safePublicFetch = safePublicFetch,
) {
  const expectsXmlFeed = feedType === "rss" || feedType === "atom";
  try {
    const response: SafePublicResponse = await fetcher(sourceUrl, {
      timeoutMs: 8_000,
      maxRedirects: 3,
      maxBytes: 1_000_000,
      allowedContentTypes: expectsXmlFeed
        ? [
            "application/rss+xml",
            "application/atom+xml",
            "application/xml",
            "text/xml",
            "application/xhtml+xml",
          ]
        : ["text/html", "application/xhtml+xml", "text/plain"],
    });
    if (response.status < 200 || response.status >= 300)
      throw new Error(`HTTP_${response.status}`);
    const result = expectsXmlFeed
      ? inspectFeedXml(response.body, response.finalUrl)
      : {
          format: "web_page" as const,
          itemCount: 1,
          duplicateItemCount: 0,
          latestItemDate: null,
        };
    return {
      success: true as const,
      safeFailureCode: "",
      finalUrl: response.finalUrl,
      ...result,
    };
  } catch (error) {
    const code =
      error instanceof PublicFetchError
        ? error.code
        : String(error instanceof Error ? error.message : "SOURCE_TEST_FAILED")
            .split(":")[0]
            .slice(0, 80);
    return {
      success: false as const,
      safeFailureCode: code || "SOURCE_TEST_FAILED",
      finalUrl: "",
      format: null,
      itemCount: 0,
      duplicateItemCount: 0,
      latestItemDate: null,
    };
  }
}

function toSource(row: Row): BlogApprovedSource {
  return {
    id: String(row.id),
    name: String(row.name || ""),
    publisher: String(row.publisher || ""),
    sourceUrl: String(row.source_url || ""),
    feedType: row.feed_type,
    topicClusters: Array.isArray(row.topic_clusters) ? row.topic_clusters : [],
    trustLevel: row.trust_level,
    classification: row.source_classification,
    enabled: Boolean(row.enabled),
    fetchFrequencyMinutes: Number(row.fetch_frequency_minutes || 360),
    lastSuccessfulFetch: row.last_successful_fetch || null,
    lastFailedFetch: row.last_failed_fetch || null,
    safeFailureCode: String(row.safe_failure_code || ""),
    latestItemDate: row.latest_item_date || null,
    duplicateItemCount: Number(row.duplicate_item_count || 0),
    notes: String(row.notes || ""),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

export const blogSourceRepository = {
  async list() {
    const client = getSupabaseAdminClient();
    if (!client)
      return [...memorySources.values()]
        .sort((a, b) => String(a.name).localeCompare(String(b.name)))
        .map(toSource);
    const { data, error } = await client
      .from("blog_approved_sources")
      .select("*")
      .order("name");
    if (error) throw error;
    return (data || []).map(toSource);
  },
  async create(input: Record<string, unknown>, actorId: string) {
    const now = new Date().toISOString();
    const row = {
      ...validateApprovedSourceInput(input),
      created_by: actorId,
      updated_by: actorId,
    };
    const client = getSupabaseAdminClient();
    if (!client) {
      const stored = {
        ...row,
        id: randomUUID(),
        safe_failure_code: "",
        duplicate_item_count: 0,
        last_successful_fetch: null,
        last_failed_fetch: null,
        latest_item_date: null,
        created_at: now,
        updated_at: now,
      };
      memorySources.set(stored.id, stored);
      return toSource(stored);
    }
    const { data, error } = await client
      .from("blog_approved_sources")
      .insert(row)
      .select("*")
      .single();
    if (error) throw error;
    return toSource(data);
  },
  async update(id: string, input: Record<string, unknown>, actorId: string) {
    const client = getSupabaseAdminClient();
    const existing = client ? null : memorySources.get(id);
    const base = existing ? { ...existing, ...input } : input;
    const row = {
      ...validateApprovedSourceInput(base),
      updated_by: actorId,
      updated_at: new Date().toISOString(),
    };
    if (!client) {
      if (!existing) return null;
      const stored = { ...existing, ...row };
      memorySources.set(id, stored);
      return toSource(stored);
    }
    const { data, error } = await client
      .from("blog_approved_sources")
      .update(row)
      .eq("id", id)
      .select("*")
      .maybeSingle();
    if (error) throw error;
    return data ? toSource(data) : null;
  },
  async remove(id: string) {
    const client = getSupabaseAdminClient();
    if (!client) return memorySources.delete(id);
    const { error, count } = await client
      .from("blog_approved_sources")
      .delete({ count: "exact" })
      .eq("id", id);
    if (error) throw error;
    return Boolean(count);
  },
  async test(id: string) {
    const sources = await blogSourceRepository.list();
    const source = sources.find((item) => item.id === id);
    if (!source) return null;
    const result = await testApprovedSourceUrl(
      source.sourceUrl,
      source.feedType,
    );
    const timestamp = new Date().toISOString();
    const patch = result.success
      ? {
          last_successful_fetch: timestamp,
          safe_failure_code: "",
          latest_item_date: result.latestItemDate,
          duplicate_item_count: result.duplicateItemCount,
        }
      : {
          last_failed_fetch: timestamp,
          safe_failure_code: result.safeFailureCode,
        };
    const client = getSupabaseAdminClient();
    if (!client) {
      const row = memorySources.get(id);
      if (row)
        memorySources.set(id, { ...row, ...patch, updated_at: timestamp });
    } else {
      const { error } = await client
        .from("blog_approved_sources")
        .update(patch)
        .eq("id", id);
      if (error) throw error;
    }
    return {
      source: (await blogSourceRepository.list()).find(
        (item) => item.id === id,
      )!,
      result,
    };
  },
};
