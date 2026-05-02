#!/usr/bin/env node

import fs from "node:fs/promises"
import path from "node:path"
import process from "node:process"
import { createRequire } from "node:module"

const require = createRequire(import.meta.url)
const YAML = require("yaml")

const ROOT = process.cwd()
const OUTPUT_DIR = path.resolve(ROOT, process.env.LLM_OUTPUT_DIR ?? "public")
const CONFIG_PATH = path.resolve(ROOT, process.env.LLM_QUARTZ_CONFIG ?? "quartz.config.yaml")

const errors = []

async function main() {
  const cfg = await readQuartzConfig()

  const pages = await loadPages()

  for (const page of pages) {
    page.content = await readPageContent(page.source_path)
  }

  await writeText("llms.txt", buildLlmsTxt(cfg, pages))
  await writeText("llms-full.txt", buildFullText(cfg, pages))
  await writeJson("llms.json", buildManifest(cfg, pages))
  await writeText("sitemap.xml", buildSitemap(cfg, pages))
  await writeText("robots.txt", buildRobots(cfg))

  if (errors.length > 0) {
    for (const error of errors) console.error(`Error: ${error}`)
    process.exit(1)
  }

  console.log(
    `Generated LLM artifacts for ${pages.length} pages in ${path.relative(ROOT, OUTPUT_DIR)}`,
  )
}

async function loadPages() {
  const raw = await fs.readFile(path.join(OUTPUT_DIR, "data", "pages.jsonl"), "utf8")
  return raw
    .split("\n")
    .filter(Boolean)
    .map((line) => JSON.parse(line))
}

async function readPageContent(sourcePath) {
  const full = path.resolve(ROOT, sourcePath)
  try {
    const raw = await fs.readFile(full, "utf8")
    const match = raw.match(/^\uFEFF?---\r?\n[\s\S]*?\r?\n---\r?\n?([\s\S]*)$/)
    const body = match ? match[1] : raw
    return normalizeMarkdownBody(stripPrivateMarkdown(body))
  } catch {
    return ""
  }
}

async function readQuartzConfig() {
  const raw = await fs.readFile(CONFIG_PATH, "utf8")
  const parsed = YAML.parse(raw)
  const configuration = parsed?.configuration ?? {}
  return {
    site: configuration.pageTitle ?? "Public Wiki",
    baseUrl: normalizeBaseUrl(configuration.baseUrl),
    basePath: basePathFromBaseUrl(configuration.baseUrl),
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
  return `# ${cfg.site}

> Public player-facing campaign wiki for ${cfg.site}, optimized for both human Quartz browsing and agent retrieval.

## Scope
- Public player-facing content only.
- DM-only secrets are intentionally excluded.
- Rumors, myths, and legends must not be treated as confirmed fact unless marked canonical.

## Start Here
${start.map((page) => `- [${page.title}](${page.url})`).join("\n")}

## Major Collections
- [Characters](${withBasePath(cfg, "/data/characters.json")})
- [Factions](${withBasePath(cfg, "/data/factions.json")})
- [Locations](${withBasePath(cfg, "/data/locations.json")})
- [Lore](${withBasePath(cfg, "/data/lore.json")})

## Machine-Readable Resources
- [Full Context Bundle](${withBasePath(cfg, "/llms-full.txt")})
- [Structured Index](${withBasePath(cfg, "/llms.json")})
- [Entity Graph](${withBasePath(cfg, "/graph.json")})
- [Entity Records](${withBasePath(cfg, "/entities.jsonl")})
- [Page Records](${withBasePath(cfg, "/data/pages.jsonl")})
- [Sitemap](${withBasePath(cfg, "/sitemap.xml")})

## LLM Instructions
- Prefer explicit summaries, aliases, tags, and relationships over inference.
- Do not invent hidden lore.
- Treat uncertain content as uncertain.
- Cite or link the page used when answering.
`
}

function selectStartPages(pages) {
  const preferred = ["the-shattered-sea", "ship-bastion", "ship-stats"]
  const selected = preferred.map((id) => pages.find((page) => page.id === id)).filter(Boolean)
  for (const page of pages) {
    if (selected.length >= 5) break
    if (!selected.includes(page)) selected.push(page)
  }
  return selected
}

function buildFullText(cfg, pages) {
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

${sections.join("\n")}`
}

function buildManifest(cfg, pages) {
  return {
    site: cfg.site,
    audience: "players",
    canon_scope: "public_player_facing",
    generated_at: new Date().toISOString(),
    entrypoints: {
      llms_txt: withBasePath(cfg, "/llms.txt"),
      full_text: withBasePath(cfg, "/llms-full.txt"),
      graph: withBasePath(cfg, "/graph.json"),
      entities: withBasePath(cfg, "/entities.jsonl"),
      sitemap: withBasePath(cfg, "/sitemap.xml"),
    },
    collections: {
      pages: withBasePath(cfg, "/data/pages.jsonl"),
      characters: withBasePath(cfg, "/data/characters.json"),
      factions: withBasePath(cfg, "/data/factions.json"),
      locations: withBasePath(cfg, "/data/locations.json"),
      lore: withBasePath(cfg, "/data/lore.json"),
    },
    page_count: pages.length,
  }
}

function buildSitemap(cfg, pages) {
  const origin = cfg.baseUrl ? `https://${cfg.baseUrl.split("/")[0]}` : "https://example.com"
  const urls = [
    withBasePath(cfg, "/llms.txt"),
    withBasePath(cfg, "/llms-full.txt"),
    withBasePath(cfg, "/llms.json"),
    withBasePath(cfg, "/graph.json"),
    withBasePath(cfg, "/entities.jsonl"),
    ...pages.map((page) => page.url),
  ]
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map((url) => `  <url><loc>${escapeXml(new URL(url, `${origin}/`).toString())}</loc></url>`)
  .join("\n")}
</urlset>
`
}

function buildRobots(cfg) {
  return `User-agent: *
Allow: /

Sitemap: ${withBasePath(cfg, "/sitemap.xml")}
`
}

async function writeText(relative, content) {
  await fs.writeFile(path.join(OUTPUT_DIR, relative), content, "utf8")
}

async function writeJson(relative, value) {
  await writeText(relative, `${JSON.stringify(value, null, 2)}\n`)
}

function withBasePath(cfg, urlPath) {
  const normalized = urlPath.startsWith("/") ? urlPath : `/${urlPath}`
  if (!cfg.basePath) return normalized
  if (normalized === "/") return `${cfg.basePath}/`
  return `${cfg.basePath}${normalized}`
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
