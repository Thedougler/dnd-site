#!/usr/bin/env node

import fs from "node:fs/promises"
import path from "node:path"
import process from "node:process"
import { createRequire } from "node:module"

const require = createRequire(import.meta.url)
const YAML = require("yaml")

const ROOT = process.cwd()
const CONTENT_DIR = path.resolve(ROOT, process.env.LLM_CONTENT_DIR ?? "content")
const OUTPUT_DIR = path.resolve(ROOT, process.env.LLM_OUTPUT_DIR ?? "public")
const CONFIG_PATH = path.resolve(ROOT, process.env.LLM_QUARTZ_CONFIG ?? "quartz.config.yaml")

const EXCLUDED_VISIBILITIES = new Set(["private", "dm_only"])
const EXCLUDED_AUDIENCES = new Set(["dm"])
const COLLECTIONS = {
  characters: new Set(["character", "npc", "person"]),
  factions: new Set(["faction", "organization", "guild", "crew"]),
  locations: new Set(["location", "region", "settlement", "port", "island", "sea"]),
}
const GENERATED_PAGE_DIR = "data/pages"

const errors = []

async function main() {
  const cfg = await readQuartzConfig()
  const files = await listMarkdownFiles(CONTENT_DIR, cfg.ignorePatterns)
  const pages = []

  for (const file of files) {
    const raw = await fs.readFile(file, "utf8")
    const { frontmatter, body } = parseMarkdown(raw)
    if (!frontmatter || !isPublishEnabled(frontmatter.publish)) continue
    if (isPrivate(frontmatter)) continue
    const relative = path.relative(CONTENT_DIR, file)
    pages.push(buildPageRecord(frontmatter, body, relative, cfg))
  }

  pages.sort((a, b) => a.title.localeCompare(b.title))
  validateUniquePageIds(pages)

  if (errors.length > 0) {
    for (const error of errors) console.error(`Error: ${error}`)
    process.exit(1)
  }

  await fs.mkdir(path.join(OUTPUT_DIR, "data"), { recursive: true })
  await writeJsonl(
    "entities.jsonl",
    pages.map(({ content, wikilinks, ...p }) => p),
  )
  await writeJsonl(
    "data/pages.jsonl",
    pages.map(({ content, wikilinks, ...p }) => p),
  )
  await writePageTextFiles(pages)
  await writeCollectionFiles(pages)
  await writeJson("graph.json", buildGraph(pages))
  await writeText("llms.txt", buildLlmsTxt(cfg, pages))
  await writeText("llms-full.txt", buildFullText(cfg, pages))
  await writeJson("llms.json", buildManifest(cfg, pages))
  await writeText("player-ai-prompt.txt", buildPlayerPrompt(cfg))
  await writeText("sitemap.xml", buildSitemap(cfg, pages))
  await writeText("robots.txt", buildRobots(cfg))

  console.log(
    `Generated LLM artifacts for ${pages.length} pages in ${path.relative(ROOT, OUTPUT_DIR)}`,
  )
}

async function listMarkdownFiles(dir, ignorePatterns) {
  const ignored = new Set((ignorePatterns ?? []).map((p) => p.replace(/^\/+|\/+$/g, "")))
  const results = []
  async function walk(current) {
    const entries = await fs.readdir(current, { withFileTypes: true })
    for (const entry of entries) {
      const full = path.join(current, entry.name)
      const relative = path.relative(dir, full).replaceAll(path.sep, "/")
      if ([...ignored].some((pat) => relative === pat || relative.startsWith(`${pat}/`))) continue
      if (entry.isDirectory()) await walk(full)
      else if (entry.name.endsWith(".md")) results.push(full)
    }
  }
  await walk(dir)
  return results.sort()
}

function parseMarkdown(raw) {
  const match = raw.match(/^\uFEFF?---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/)
  if (!match) return { frontmatter: null, body: raw }
  try {
    return { frontmatter: YAML.parse(match[1]) ?? {}, body: match[2] ?? "" }
  } catch {
    return { frontmatter: null, body: match[2] ?? "" }
  }
}

function isPublishEnabled(value) {
  return value === true || String(value).toLowerCase() === "true"
}

function isPrivate(fm) {
  return (
    EXCLUDED_VISIBILITIES.has(String(fm.visibility ?? "").toLowerCase()) ||
    EXCLUDED_AUDIENCES.has(String(fm.audience ?? "").toLowerCase())
  )
}

function buildPageRecord(fm, rawBody, relative, cfg) {
  const fileSlug = relative.replace(/\.md$/, "")
  const id = slugify(fileSlug === "index" ? cfg.site : fileSlug)
  const title = String(fm.title ?? fileSlug.split("/").at(-1))
  const body = stripPrivateMarkdown(rawBody)
  const content = normalizeMarkdownBody(body)
  const url = publicUrl(cfg, fileSlug === "index" ? "/" : `/${encodeURI(fileSlug)}/`)
  const contentUrl = publicUrl(cfg, `/${GENERATED_PAGE_DIR}/${id}.md`)
  const type = String(fm.type ?? inferPageType(relative, fm.tags))
  const tags = arrayOfStrings(fm.tags)
  const aliases = arrayOfStrings(fm.aliases)
  const relationships = relationshipsFromFrontmatter(fm.relationships)

  const wikilinks = extractWikilinks(body)

  return {
    id,
    type,
    title,
    aliases,
    url,
    content_url: contentUrl,
    visibility: String(fm.visibility ?? "public").toLowerCase(),
    audience: fm.audience ?? "players",
    canonical: fm.canonical ?? true,
    status: fm.status ?? "known",
    summary: getSummary(fm, body, title),
    tags,
    relationships,
    wikilinks,
    source_path: `content/${relative}`,
    content,
  }
}

function validateUniquePageIds(pages) {
  const seen = new Map()
  for (const page of pages) {
    const existing = seen.get(page.id)
    if (existing) {
      errors.push(`${page.source_path}: page id "${page.id}" collides with ${existing.source_path}`)
    } else {
      seen.set(page.id, page)
    }
  }
}

function inferPageType(relative, tags) {
  const [topLevel] = relative.split("/")
  const tagSet = new Set(arrayOfStrings(tags).map((t) => t.toLowerCase()))
  if (relative === "index.md") return "index"
  if (tagSet.has("species") || topLevel === "species") return "species"
  if (tagSet.has("rules") || tagSet.has("mechanics") || topLevel === "rules") return "rules"
  if (topLevel === "lore") return "lore"
  return topLevel || "page"
}

function getSummary(fm, body, title) {
  if (fm.summary) return String(fm.summary).trim()
  const section = extractSection(body, "Summary")
  if (section) return firstProseBlock(section) || firstProseBlock(body) || title
  return firstProseBlock(body) || title
}

function firstProseBlock(markdown) {
  const block = normalizeMarkdownBody(markdown)
    .split(/\n{2,}/)
    .map((b) => b.trim())
    .find(
      (b) =>
        b &&
        !b.startsWith("#") &&
        !b.startsWith("|") &&
        !b.startsWith("---") &&
        !b.startsWith("```"),
    )
  if (!block) return ""
  return block
    .replace(/^>\s?/gm, "")
    .replace(/^[-*]\s+/gm, "")
    .replace(/\s+/g, " ")
    .trim()
}

function extractSection(body, heading) {
  const match = new RegExp(`^##\\s+${heading}\\s*$`, "im").exec(body)
  if (!match) return ""
  const rest = body.slice(match.index + match[0].length)
  const next = rest.search(/^##\s+/m)
  return (next === -1 ? rest : rest.slice(0, next)).trim()
}

function stripPrivateMarkdown(markdown) {
  return markdown
    .replace(/%%[\s\S]*?%%/g, "")
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/^> \[!(?:secret|dm|private)\][\s\S]*?(?=^\s*##\s+|\s*$)/gim, "")
}

function normalizeMarkdownBody(markdown) {
  return markdown
    .replace(/!\[\[([^\]]+)\]\]/g, "")
    .replace(/\[\[([^\]|]+)\|([^\]]+)\]\]/g, "$2")
    .replace(/\[\[([^\]]+)\]\]/g, "$1")
    .replace(/[ \t]+\n/g, "\n")
    .trim()
}

function extractWikilinks(markdown) {
  const seen = new Set()
  const results = []
  const regex = /\[\[([^\]|]+)(?:\|[^\]]+)?\]\]/g
  let match
  while ((match = regex.exec(markdown)) !== null) {
    const target = match[1].trim().split("/").at(-1)
    if (target && !seen.has(target)) {
      seen.add(target)
      results.push(target)
    }
  }
  return results
}

function relationshipsFromFrontmatter(relationships) {
  if (!Array.isArray(relationships)) return []
  return relationships
    .filter((r) => r?.relation && r?.target)
    .map((r) => ({ relation: String(r.relation), target: String(r.target) }))
}

function buildGraph(pages) {
  const lookup = new Map()
  for (const page of pages) {
    for (const key of [page.id, page.title, ...page.aliases]) {
      lookup.set(slugify(key), page.id)
    }
    // Also index by the last segment of the source path slug
    const lastSegment = page.source_path
      .replace(/^content\//, "")
      .replace(/\.md$/, "")
      .split("/")
      .at(-1)
    if (lastSegment) lookup.set(slugify(lastSegment), page.id)
  }
  const edges = []
  const edgeSeen = new Set()
  function addEdge(source, relation, target) {
    const key = `${source}||${relation}||${target}`
    if (!edgeSeen.has(key) && source !== target) {
      edgeSeen.add(key)
      edges.push({ source, relation, target })
    }
  }
  for (const page of pages) {
    for (const rel of page.relationships) {
      const target = lookup.get(slugify(rel.target))
      if (!target) {
        errors.push(
          `${page.source_path}: relationship "${rel.relation}" -> unknown target "${rel.target}"`,
        )
        continue
      }
      addEdge(page.id, slugify(rel.relation), target)
    }
    // Add edges from wikilinks in content
    for (const link of page.wikilinks ?? []) {
      const target = lookup.get(slugify(link))
      if (target) addEdge(page.id, "mentions", target)
    }
  }
  return { nodes: pages.map(({ content, wikilinks, ...p }) => p), edges }
}

async function writeCollectionFiles(pages) {
  const collections = { characters: [], factions: [], locations: [], lore: [] }
  for (const { content, wikilinks, ...page } of pages) {
    const type = page.type.toLowerCase()
    const tagSet = new Set(page.tags.map((t) => t.toLowerCase()))
    if (
      COLLECTIONS.characters.has(type) ||
      tagSet.has("character") ||
      tagSet.has("npc") ||
      tagSet.has("person")
    ) {
      collections.characters.push(page)
    } else if (COLLECTIONS.factions.has(type) || type === "factions" || tagSet.has("faction")) {
      collections.factions.push(page)
    } else if (
      COLLECTIONS.locations.has(type) ||
      type === "places" ||
      tagSet.has("location") ||
      tagSet.has("port") ||
      tagSet.has("island") ||
      tagSet.has("sea") ||
      tagSet.has("waterway")
    ) {
      collections.locations.push(page)
    } else {
      collections.lore.push(page)
    }
  }
  for (const [name, collection] of Object.entries(collections)) {
    await writeJson(`data/${name}.json`, collection)
  }
}

async function writePageTextFiles(pages) {
  await fs.mkdir(path.join(OUTPUT_DIR, GENERATED_PAGE_DIR), { recursive: true })
  for (const page of pages) {
    await writeText(`${GENERATED_PAGE_DIR}/${page.id}.md`, buildPageText(page))
  }
}

function buildPageText(page) {
  const relationships = page.relationships.length
    ? page.relationships
        .map((relationship) => `- ${relationship.relation} -> ${relationship.target}`)
        .join("\n")
    : "- None declared"

  return `# ${page.title}

URL: ${page.url}
Content URL: ${page.content_url}
Type: ${page.type}
Aliases: ${page.aliases.join(", ") || "None"}
Tags: ${page.tags.join(", ") || "None"}
Status: ${page.status}
Canonical: ${page.canonical}
Audience: ${page.audience}
Visibility: ${page.visibility}
Source: ${page.source_path}

Summary:
${page.summary}

Relationships:
${relationships}

Content:
${page.content}
`
}

async function readQuartzConfig() {
  const raw = await fs.readFile(CONFIG_PATH, "utf8")
  const parsed = YAML.parse(raw)
  const configuration = parsed?.configuration ?? {}
  return {
    site: configuration.pageTitle ?? "Public Wiki",
    baseUrl: normalizeBaseUrl(configuration.baseUrl),
    basePath: basePathFromBaseUrl(configuration.baseUrl),
    ignorePatterns: configuration.ignorePatterns ?? [],
  }
}

function normalizeBaseUrl(baseUrl) {
  if (!baseUrl) return ""
  return baseUrl.replace(/^https?:\/\//, "").replace(/\/$/, "")
}

function basePathFromBaseUrl(baseUrl) {
  if (!baseUrl) return ""
  const parsed = new URL(`https://${normalizeBaseUrl(baseUrl)}`)
  return parsed.pathname === "/" ? "" : parsed.pathname.replace(/\/$/, "")
}

function buildLlmsTxt(cfg, pages) {
  const start = selectStartPages(pages)
  const fullTextUrl = publicUrl(cfg, "/llms-full.txt")
  const playerPromptUrl = publicUrl(cfg, "/player-ai-prompt.txt")
  return `# ${cfg.site}

> Public player-facing campaign wiki for ${cfg.site}, optimized for both human Quartz browsing and agent retrieval.

## Quick Start for LLMs
Load the full wiki in one request: ${fullTextUrl}

## Player Setup Prompt
Players can copy a chatbot setup prompt from ${playerPromptUrl}

## Scope
- Public player-facing content only.
- DM-only secrets are intentionally excluded.
- Rumors, myths, and legends must not be treated as confirmed fact unless marked canonical.

## Start Here
${start.map((page) => `- [${page.title}](${page.url}) — ${page.summary.replace(/\n/g, " ").slice(0, 120)}`).join("\n")}

## Major Collections
- [Characters](${publicUrl(cfg, "/data/characters.json")})
- [Factions](${publicUrl(cfg, "/data/factions.json")})
- [Locations](${publicUrl(cfg, "/data/locations.json")})
- [Lore](${publicUrl(cfg, "/data/lore.json")})

## Machine-Readable Resources
- [Full Context Bundle](${fullTextUrl})
- [Structured Index](${publicUrl(cfg, "/llms.json")})
- [Entity Graph](${publicUrl(cfg, "/graph.json")})
- [Entity Records](${publicUrl(cfg, "/entities.jsonl")})
- [Page Records](${publicUrl(cfg, "/data/pages.jsonl")})
- [Player AI Prompt](${playerPromptUrl})
- [Sitemap](${publicUrl(cfg, "/sitemap.xml")})

## Navigation Tips
- Start with the Player Primer for full campaign onboarding.
- Use the Campaign Overview for a dense geography and factions reference.
- Browse by category using the index pages: Factions, Places, Species, Rules, Lore.
- For targeted retrieval, read Page Records first, then fetch the matching page's content_url.
- The Full Context Bundle contains every page in one file — load it if you need comprehensive coverage.
- The Entity Graph (graph.json) includes a mentions-edge for every wikilink, enabling relationship traversal.

## LLM Instructions
- Prefer explicit summaries, aliases, tags, and relationships over inference.
- Do not invent hidden lore.
- Treat uncertain content as uncertain.
- Cite or link the page used when answering.
- When asked about a place, faction, or species, prefer the dedicated page over index summaries.
`
}

function buildPlayerPrompt(cfg) {
  return `You are assisting a player in ${cfg.site}, a D&D campaign.

Use this public campaign wiki as your authoritative source:
${publicUrl(cfg, "/")}

When I ask a campaign question, look up the relevant details before answering.

Best retrieval order:
1. Start with the LLM index:
${publicUrl(cfg, "/llms.txt")}
2. For targeted lookup, use the structured page index and fetch the relevant content_url:
${publicUrl(cfg, "/data/pages.jsonl")}
3. For broad questions or session setup, fetch the full public context bundle:
${publicUrl(cfg, "/llms-full.txt")}

Rules:
- The wiki is the only canonical source. Do not invent lore not found there.
- Rumors and myths in the wiki are in-world and may not be true; only content marked canonical should be treated as fact.
- When answering about a place, faction, species, rule, or historical event, cite or link the page you used.
- DM secrets are intentionally excluded from the wiki. Do not speculate about hidden content.
- If the wiki does not cover something, say so rather than guessing.
- Keep answers player-facing unless I explicitly ask for a rules summary or source list.
`
}

function selectStartPages(pages) {
  const rootIndex = pages.find((p) => p.source_path === "content/index.md")
  const preferredIds = [
    rootIndex?.id,
    slugify("player-ai-guide"),
    "player-primer",
    "campaign-overview",
    slugify("factions/index"),
    slugify("places/index"),
    slugify("species/index"),
    slugify("rules/index"),
    slugify("lore/index"),
  ].filter(Boolean)
  const selected = preferredIds.map((id) => pages.find((page) => page.id === id)).filter(Boolean)
  return selected
}

function buildFullText(cfg, pages) {
  const toc = pages
    .map((page) => `- [${page.title}](${page.url}) — ${page.summary.split("\n")[0].slice(0, 100)}`)
    .join("\n")

  const sections = pages.map((page) => {
    const relationships = page.relationships.length
      ? page.relationships
          .map((relationship) => `- ${relationship.relation} -> ${relationship.target}`)
          .join("\n")
      : "- None declared"

    return `---

# ${page.title}
Type: ${page.type}
URL: ${page.url}
Aliases: ${page.aliases.join(", ") || "None"}
Tags: ${page.tags.join(", ") || "None"}
Status: ${page.status}
Canonical: ${page.canonical}
Summary: ${page.summary}

Relationships:
${relationships}

Content:
${page.content}
`
  })

  return `# Full Public Context Bundle

Generated from public published notes for ${cfg.site}.
Private DM content is excluded.

## Table of Contents

${toc}

---
${sections.join("\n")}`
}

function buildManifest(cfg, pages) {
  return {
    site: cfg.site,
    site_url: publicUrl(cfg, "/"),
    audience: "players",
    canon_scope: "public_player_facing",
    generated_at: new Date().toISOString(),
    entrypoints: {
      llms_txt: publicUrl(cfg, "/llms.txt"),
      full_text: publicUrl(cfg, "/llms-full.txt"),
      player_prompt: publicUrl(cfg, "/player-ai-prompt.txt"),
      graph: publicUrl(cfg, "/graph.json"),
      entities: publicUrl(cfg, "/entities.jsonl"),
      sitemap: publicUrl(cfg, "/sitemap.xml"),
    },
    collections: {
      pages: publicUrl(cfg, "/data/pages.jsonl"),
      page_content_directory: publicUrl(cfg, `/${GENERATED_PAGE_DIR}/`),
      characters: publicUrl(cfg, "/data/characters.json"),
      factions: publicUrl(cfg, "/data/factions.json"),
      locations: publicUrl(cfg, "/data/locations.json"),
      lore: publicUrl(cfg, "/data/lore.json"),
    },
    pages: pages.map(({ content, wikilinks, ...page }) => page),
    page_count: pages.length,
  }
}

function buildSitemap(cfg, pages) {
  const urls = [
    publicUrl(cfg, "/llms.txt"),
    publicUrl(cfg, "/llms-full.txt"),
    publicUrl(cfg, "/llms.json"),
    publicUrl(cfg, "/player-ai-prompt.txt"),
    publicUrl(cfg, "/graph.json"),
    publicUrl(cfg, "/entities.jsonl"),
    publicUrl(cfg, "/data/pages.jsonl"),
    ...pages.map((page) => page.content_url),
    ...pages.map((page) => page.url),
  ]
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((url) => `  <url><loc>${escapeXml(url)}</loc></url>`).join("\n")}
</urlset>
`
}

function buildRobots(cfg) {
  return `User-agent: *
Allow: /

Sitemap: ${publicUrl(cfg, "/sitemap.xml")}
`
}

async function writeText(relative, content) {
  await fs.writeFile(path.join(OUTPUT_DIR, relative), content, "utf8")
}

async function writeJson(relative, value) {
  await writeText(relative, `${JSON.stringify(value, null, 2)}\n`)
}

async function writeJsonl(relative, values) {
  await writeText(relative, `${values.map((v) => JSON.stringify(v)).join("\n")}\n`)
}

function arrayOfStrings(value) {
  if (!Array.isArray(value)) return []
  return value.map(String).filter(Boolean)
}

function slugify(value) {
  return String(value)
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

function withBasePath(cfg, urlPath) {
  const normalized = urlPath.startsWith("/") ? urlPath : `/${urlPath}`
  if (!cfg.basePath) return normalized
  if (normalized === "/") return `${cfg.basePath}/`
  return `${cfg.basePath}${normalized}`
}

function publicUrl(cfg, urlPath) {
  const pathWithBase = withBasePath(cfg, urlPath)
  if (!cfg.baseUrl) return pathWithBase
  return new URL(pathWithBase, `https://${cfg.baseUrl.split("/")[0]}/`).toString()
}

function escapeXml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
