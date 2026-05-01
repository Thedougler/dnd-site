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

const REQUIRED_FIELDS = ["title", "type", "publish", "visibility", "summary"]
const EXCLUDED_VISIBILITIES = new Set(["private", "dm_only"])
const EXCLUDED_AUDIENCES = new Set(["dm"])
const COLLECTIONS = {
  characters: new Set(["character", "npc", "person"]),
  factions: new Set(["faction", "organization", "guild", "crew"]),
  locations: new Set(["location", "region", "settlement", "port", "island", "sea"]),
}

const warnings = []
const errors = []

async function main() {
  const cfg = await readQuartzConfig()
  const files = await listMarkdownFiles(CONTENT_DIR, cfg.ignorePatterns)
  const pages = []

  for (const file of files) {
    const raw = await fs.readFile(file, "utf8")
    const parsed = parseMarkdown(raw, file)
    if (!parsed.frontmatter.publish) continue
    if (isPrivate(parsed.frontmatter)) continue

    const relative = path.relative(CONTENT_DIR, file)
    validateFrontmatter(parsed.frontmatter, relative)

    const page = buildPageRecord(parsed, relative, cfg)
    pages.push(page)
  }

  pages.sort((a, b) => a.title.localeCompare(b.title))
  const lookup = buildNodeLookup(pages)
  const edges = buildEdges(pages, lookup)

  if (errors.length > 0) {
    for (const warning of warnings) console.warn(`Warning: ${warning}`)
    for (const error of errors) console.error(`Error: ${error}`)
    process.exit(1)
  }

  const graph = {
    nodes: pages.map(({ content, ...page }) => page),
    edges,
  }

  await fs.mkdir(path.join(OUTPUT_DIR, "data"), { recursive: true })
  await writeText("llms.txt", buildLlmsTxt(cfg, pages))
  await writeText("llms-full.txt", buildFullText(cfg, pages))
  await writeJson("llms.json", buildManifest(cfg, pages))
  await writeJson("graph.json", graph)
  await writeJsonl("entities.jsonl", graph.nodes)
  await writeJsonl(
    "data/pages.jsonl",
    pages.map(({ content, ...page }) => page),
  )
  await writeCollectionFiles(pages)
  await writeText("sitemap.xml", buildSitemap(cfg, pages))
  await writeText("robots.txt", buildRobots(cfg))
  await validateOutputs(graph.nodes)

  for (const warning of warnings) console.warn(`Warning: ${warning}`)
  console.log(
    `Generated LLM distribution layer for ${pages.length} public pages in ${path.relative(ROOT, OUTPUT_DIR)}`,
  )
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

async function listMarkdownFiles(dir, ignorePatterns) {
  const ignored = new Set(ignorePatterns.map((entry) => entry.replace(/^\/+|\/+$/g, "")))
  const results = []

  async function walk(current) {
    const entries = await fs.readdir(current, { withFileTypes: true })
    for (const entry of entries) {
      const full = path.join(current, entry.name)
      const relative = path.relative(dir, full).replaceAll(path.sep, "/")
      if (shouldIgnore(relative, ignored)) continue
      if (entry.isDirectory()) {
        await walk(full)
      } else if (entry.isFile() && entry.name.endsWith(".md")) {
        results.push(full)
      }
    }
  }

  await walk(dir)
  return results.sort()
}

function shouldIgnore(relative, ignored) {
  const segments = relative.split("/")
  return (
    segments.some((segment) => ignored.has(segment)) ||
    [...ignored].some((pattern) => relative.startsWith(`${pattern}/`))
  )
}

function parseMarkdown(raw, file) {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/)
  if (!match) {
    errors.push(`${path.relative(ROOT, file)} is missing YAML frontmatter`)
    return { frontmatter: {}, body: raw }
  }

  try {
    return {
      frontmatter: YAML.parse(match[1]) ?? {},
      body: match[2] ?? "",
    }
  } catch (error) {
    errors.push(`${path.relative(ROOT, file)} has invalid YAML frontmatter: ${error.message}`)
    return { frontmatter: {}, body: match[2] ?? "" }
  }
}

function isPrivate(frontmatter) {
  return (
    frontmatter.publish === false ||
    EXCLUDED_VISIBILITIES.has(String(frontmatter.visibility ?? "").toLowerCase()) ||
    EXCLUDED_AUDIENCES.has(String(frontmatter.audience ?? "").toLowerCase())
  )
}

function validateFrontmatter(frontmatter, relative) {
  for (const field of REQUIRED_FIELDS) {
    if (
      frontmatter[field] === undefined ||
      frontmatter[field] === null ||
      frontmatter[field] === ""
    ) {
      errors.push(
        `${relative} is published and public but missing required frontmatter field "${field}"`,
      )
    }
  }

  if (frontmatter.publish !== true) {
    errors.push(`${relative} must set publish: true to appear in the LLM distribution layer`)
  }

  if (frontmatter.visibility !== "public") {
    errors.push(`${relative} must set visibility: public to appear in the LLM distribution layer`)
  }

  if (!Array.isArray(frontmatter.aliases) || frontmatter.aliases.length === 0) {
    warnings.push(`${relative} has no aliases`)
  }
  if (!Array.isArray(frontmatter.tags) || frontmatter.tags.length === 0) {
    warnings.push(`${relative} has no tags`)
  }
  if (!Array.isArray(frontmatter.relationships) || frontmatter.relationships.length === 0) {
    warnings.push(`${relative} has no frontmatter relationships`)
  }
}

function buildPageRecord(parsed, relative, cfg) {
  const fileSlug = relative.replace(/\.md$/, "")
  const id = slugify(fileSlug === "index" ? cfg.site : fileSlug.split("/").at(-1))
  const title = parsed.frontmatter.title
  const body = stripPrivateMarkdown(parsed.body)
  const content = normalizeMarkdownBody(body)
  const url = withBasePath(cfg, fileSlug === "index" ? "/" : `/${encodeURI(fileSlug)}/`)
  const type = String(parsed.frontmatter.type)
  const tags = arrayOfStrings(parsed.frontmatter.tags)
  const aliases = arrayOfStrings(parsed.frontmatter.aliases)
  const relationships = [
    ...relationshipsFromFrontmatter(parsed.frontmatter.relationships),
    ...relationshipsFromBody(body),
  ]

  if (!/^##\s+Summary\b/im.test(body)) {
    warnings.push(`${relative} has no ## Summary section`)
  }
  if (/rumou?r/i.test(body) && !/^##\s+Rumou?rs?/im.test(body)) {
    warnings.push(`${relative} mentions rumors but has no dedicated rumor heading`)
  }

  return {
    id,
    type,
    title,
    aliases,
    url,
    visibility: "public",
    audience: parsed.frontmatter.audience ?? "players",
    canonical: parsed.frontmatter.canonical ?? true,
    status: parsed.frontmatter.status ?? "known",
    summary: String(parsed.frontmatter.summary),
    tags,
    relationships,
    source_path: `content/${relative}`,
    content,
  }
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

function relationshipsFromFrontmatter(relationships) {
  if (!Array.isArray(relationships)) return []
  return relationships
    .filter((relationship) => relationship?.relation && relationship?.target)
    .map((relationship) => ({
      relation: String(relationship.relation),
      target: String(relationship.target),
    }))
}

function relationshipsFromBody(body) {
  const section = extractSection(body, "Relationships")
  if (!section) return []

  const relationships = []
  for (const line of section.split("\n")) {
    const match = line.match(/^\s*[-*]\s*([^:>-]+?)\s*(?:->|:)\s*(.+?)\s*$/)
    if (!match) continue
    relationships.push({
      relation: match[1].trim(),
      target: cleanRelationshipTarget(match[2]),
    })
  }
  return relationships
}

function extractSection(body, heading) {
  const pattern = new RegExp(`^##\\s+${heading}\\s*$`, "im")
  const match = pattern.exec(body)
  if (!match) return ""
  const start = match.index + match[0].length
  const rest = body.slice(start)
  const next = rest.search(/^##\s+/m)
  return (next === -1 ? rest : rest.slice(0, next)).trim()
}

function cleanRelationshipTarget(value) {
  return value
    .replace(/\[\[([^\]|]+)\|([^\]]+)\]\]/g, "$1")
    .replace(/\[\[([^\]]+)\]\]/g, "$1")
    .trim()
}

function buildNodeLookup(pages) {
  const lookup = new Map()
  for (const page of pages) {
    const keys = [
      page.id,
      page.title,
      ...page.aliases,
      page.source_path.replace(/^content\/|\.md$/g, ""),
    ]
    for (const key of keys) lookup.set(slugify(key), page.id)
  }
  return lookup
}

function buildEdges(pages, lookup) {
  const edges = []
  for (const page of pages) {
    for (const relationship of page.relationships) {
      const target = lookup.get(slugify(relationship.target))
      if (!target) {
        errors.push(
          `${page.source_path} relationship "${relationship.relation}" points to missing target "${relationship.target}"`,
        )
        continue
      }
      edges.push({
        source: page.id,
        relation: slugify(relationship.relation),
        target,
      })
    }
  }
  return edges.sort((a, b) =>
    `${a.source}:${a.relation}:${a.target}`.localeCompare(`${b.source}:${b.relation}:${b.target}`),
  )
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

async function writeCollectionFiles(pages) {
  const records = pages.map(({ content, relationships, ...page }) => ({ ...page, relationships }))
  const collections = {
    characters: [],
    factions: [],
    locations: [],
    lore: [],
  }

  for (const record of records) {
    const type = record.type.toLowerCase()
    if (COLLECTIONS.characters.has(type)) collections.characters.push(record)
    else if (COLLECTIONS.factions.has(type)) collections.factions.push(record)
    else if (COLLECTIONS.locations.has(type)) collections.locations.push(record)
    else collections.lore.push(record)
  }

  for (const [name, collection] of Object.entries(collections)) {
    await writeJson(`data/${name}.json`, collection)
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

async function validateOutputs(nodes) {
  const required = ["llms.txt", "llms-full.txt", "llms.json", "graph.json", "entities.jsonl"]
  for (const file of required) {
    const full = path.join(OUTPUT_DIR, file)
    try {
      const stat = await fs.stat(full)
      if (!stat.isFile() || stat.size === 0) throw new Error("empty or missing")
    } catch {
      errors.push(`${file} was not generated`)
    }
  }

  JSON.parse(await fs.readFile(path.join(OUTPUT_DIR, "llms.json"), "utf8"))
  JSON.parse(await fs.readFile(path.join(OUTPUT_DIR, "graph.json"), "utf8"))

  const jsonl = await fs.readFile(path.join(OUTPUT_DIR, "entities.jsonl"), "utf8")
  for (const [index, line] of jsonl.split("\n").filter(Boolean).entries()) {
    try {
      JSON.parse(line)
    } catch (error) {
      errors.push(`entities.jsonl line ${index + 1} is invalid JSON: ${error.message}`)
    }
  }

  const serializedNodes = JSON.stringify(nodes)
  if (/dm_only|private/i.test(serializedNodes)) {
    errors.push("Generated entity output contains private visibility markers")
  }

  if (errors.length > 0) {
    for (const error of errors) console.error(`Error: ${error}`)
    process.exit(1)
  }
}

async function writeText(relative, content) {
  await fs.writeFile(path.join(OUTPUT_DIR, relative), content, "utf8")
}

async function writeJson(relative, value) {
  await writeText(relative, `${JSON.stringify(value, null, 2)}\n`)
}

async function writeJsonl(relative, values) {
  await writeText(relative, `${values.map((value) => JSON.stringify(value)).join("\n")}\n`)
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
