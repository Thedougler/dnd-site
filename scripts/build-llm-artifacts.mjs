#!/usr/bin/env node

import crypto from "node:crypto"
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
const FULL_TEXT_LIMIT_BYTES = Number(process.env.LLM_FULL_TEXT_LIMIT_BYTES ?? 5 * 1024 * 1024)
const CHECK_ONLY = process.argv.includes("--check")

const EXCLUDED_VISIBILITIES = new Set(["private", "dm_only"])
const EXCLUDED_AUDIENCES = new Set(["dm"])
const COLLECTIONS = {
  characters: new Set(["character", "npc", "person"]),
  factions: new Set(["faction", "organization", "guild", "crew"]),
  locations: new Set(["location", "region", "settlement", "port", "island", "sea"]),
}
const GENERATED_PAGE_DIR = "data/pages"
const ROOT_ARTIFACTS = [
  "llms.txt",
  "llms-full.txt",
  "graph.jsonld",
  "sitemap.xml",
  "rss.xml",
  "robots.txt",
  "ai-readme.md",
  "manifest.json",
]

const errors = []

async function main() {
  const cfg = await readQuartzConfig()
  const pages = await readPublishedPages(cfg)
  pages.sort(compareByPriorityThenTitle)
  validateUniquePageIds(pages)

  if (errors.length > 0) fail()
  if (CHECK_ONLY) {
    await validateArtifacts(cfg, pages)
    if (errors.length > 0) fail()
    console.log(`Validated LLM artifacts for ${pages.length} pages`)
    return
  }

  await fs.mkdir(path.join(OUTPUT_DIR, "data"), { recursive: true })
  await writePageSiblings(pages)
  await patchHtmlPages(pages)
  await writeCompatibilityArtifacts(cfg, pages)

  const generatedAt = new Date().toISOString()
  await writeText("llms.txt", buildLlmsTxt(cfg, pages))
  await writeText("llms-full.txt", buildFullText(cfg, pages))
  await writeJson("graph.jsonld", buildJsonLdGraph(cfg, pages))
  await writeJson("graph.json", buildLegacyGraph(pages))
  await writeText("sitemap.xml", buildSitemap(cfg, pages))
  await writeText("rss.xml", buildRss(cfg, pages))
  await writeText("robots.txt", buildRobots(cfg))
  await writeText("ai-readme.md", buildAiReadme(cfg, pages))

  const manifest = await buildManifest(cfg, pages, generatedAt)
  await writeJson("manifest.json", manifest)

  await validateArtifacts(cfg, pages)
  if (errors.length > 0) fail()

  console.log(
    `Generated AI-consumable artifacts for ${pages.length} pages in ${path.relative(
      ROOT,
      OUTPUT_DIR,
    )}`,
  )
}

async function readPublishedPages(cfg) {
  const files = await listMarkdownFiles(CONTENT_DIR, cfg.ignorePatterns)
  const pages = []

  for (const file of files) {
    const raw = await fs.readFile(file, "utf8")
    const { frontmatter, body } = parseMarkdown(raw)
    if (!frontmatter || !isPublishEnabled(frontmatter.publish)) continue
    if (isPrivate(frontmatter)) continue
    const relative = path.relative(CONTENT_DIR, file).replaceAll(path.sep, "/")
    pages.push(buildPageRecord(frontmatter, body, relative, cfg))
  }

  return pages
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
  const isRoot = fileSlug === "index"
  const outputSlug = outputSlugForFileSlug(fileSlug)
  const isFolderIndex = !isRoot && outputSlug.endsWith("/index")
  const canonicalPath = isRoot
    ? "/"
    : isFolderIndex
      ? `/${outputSlug.replace(/\/index$/, "")}/`
      : `/${outputSlug}`
  const htmlRelative = isRoot ? "index.html" : `${outputSlug}.html`
  const txtRelative = isRoot ? "index.txt" : `${outputSlug}.txt`
  const jsonRelative = isRoot ? "index.json" : `${outputSlug}.json`
  const aliasTxtRelative = isFolderIndex ? `${outputSlug.replace(/\/index$/, "")}.txt` : null
  const aliasJsonRelative = isFolderIndex ? `${outputSlug.replace(/\/index$/, "")}.json` : null
  const id = slugify(isRoot ? cfg.site : fileSlug)
  const title = String(fm.title ?? fileSlug.split("/").at(-1))
  const body = stripPrivateMarkdown(rawBody)
  const bodyText = normalizeMarkdownBody(body)
  const type = String(fm.type ?? inferPageType(relative, fm.tags))
  const subtype = fm.subtype ? String(fm.subtype) : undefined
  const tags = arrayOfStrings(fm.tags)
  const aliases = arrayOfStrings(fm.aliases)
  const relationships = relationshipsFromFrontmatter(fm.relationships)
  const wikilinks = extractWikilinks(body)
  const dates = extractDates(fm)

  return {
    id,
    url: publicUrl(cfg, canonicalPath),
    html_url: publicUrl(cfg, isRoot ? "/" : `/${outputSlug}.html`),
    txt_url: publicUrl(cfg, isRoot ? "/index.txt" : `/${outputSlug}.txt`),
    json_url: publicUrl(cfg, isRoot ? "/index.json" : `/${outputSlug}.json`),
    content_url: publicUrl(cfg, `/${GENERATED_PAGE_DIR}/${id}.md`),
    html_relative: htmlRelative,
    txt_relative: txtRelative,
    json_relative: jsonRelative,
    alias_txt_relative: aliasTxtRelative,
    alias_json_relative: aliasJsonRelative,
    title,
    summary: getSummary(fm, body, title),
    type,
    subtype,
    tags,
    aliases,
    dates,
    canonical: fm.canonical ?? true,
    status: fm.status ?? "known",
    audience: fm.audience ?? "players",
    visibility: String(fm.visibility ?? "public").toLowerCase(),
    source_path: `content/${relative}`,
    relationships,
    wikilinks,
    body_text: bodyText,
    frontmatter: fm,
    priority: pagePriority(fileSlug, type, tags),
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

function extractDates(fm) {
  return Object.fromEntries(
    ["created", "modified", "updated", "published", "lastmod"]
      .filter((key) => fm[key])
      .map((key) => [key, normalizeDate(fm[key])]),
  )
}

function normalizeDate(value) {
  if (value instanceof Date) return value.toISOString()
  const parsed = new Date(String(value))
  if (!Number.isNaN(parsed.getTime())) return parsed.toISOString()
  return String(value)
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
    .replace(/!\[[^\]]*]\([^)]+\)/g, "")
    .replace(/\[([^\]]+)]\([^)]+\)/g, "$1")
    .replace(/[ \t]+\n/g, "\n")
    .trim()
}

function extractWikilinks(markdown) {
  const seen = new Set()
  const results = []
  const regex = /\[\[([^\]|#]+)(?:[#|][^\]]+)?\]\]/g
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

function pagePriority(fileSlug, type, tags) {
  const tagSet = new Set(tags.map((tag) => tag.toLowerCase()))
  if (fileSlug === "index") return 0
  if (fileSlug === "player-primer") return 1
  if (fileSlug === "campaign-overview") return 2
  if (fileSlug.endsWith("/index")) return 3
  if (type === "entity" || tagSet.has("location") || tagSet.has("faction")) return 4
  return 5
}

function compareByPriorityThenTitle(a, b) {
  return a.priority - b.priority || a.title.localeCompare(b.title)
}

async function writePageSiblings(pages) {
  for (const page of pages) {
    const hashes = {
      body_text: sha256(page.body_text),
    }
    page.hashes = hashes
    await writeText(page.txt_relative, buildPageText(page))
    await writeJson(page.json_relative, publicPageRecord(page))

    if (page.alias_txt_relative && page.alias_json_relative) {
      await writeText(page.alias_txt_relative, buildPageText(page))
      await writeJson(page.alias_json_relative, publicPageRecord(page))
    }

    await writeText(`${GENERATED_PAGE_DIR}/${page.id}.md`, buildPageText(page))
  }
}

async function patchHtmlPages(pages) {
  for (const page of pages) {
    const htmlPath = path.join(OUTPUT_DIR, page.html_relative)
    let html
    try {
      html = await fs.readFile(htmlPath, "utf8")
    } catch {
      errors.push(`${page.source_path}: expected generated HTML at ${page.html_relative}`)
      continue
    }

    const metadata = minifiedMetadata(page)
    const jsonLd = JSON.stringify(schemaForPage(page))
    const alternateLinks = [
      `<link rel="alternate" type="text/plain" title="Plain text version" href="${escapeHtmlAttr(
        path.posix.basename(page.txt_relative),
      )}">`,
      `<link rel="alternate" type="application/json" title="Structured page metadata" href="${escapeHtmlAttr(
        path.posix.basename(page.json_relative),
      )}">`,
      `<script type="application/ld+json">${escapeScriptJson(jsonLd)}</script>`,
    ].join("\n")

    html = html.replace(/\n?<!-- llmwiki:metadata [\s\S]*? -->/g, "")
    html = html.replace(
      /<script type="application\/ld\+json">[\s\S]*?"@id":"[^"]*#[^"]*"[\s\S]*?<\/script>\n?/g,
      "",
    )
    html = html.replace(
      /<link rel="alternate" type="(?:text\/plain|application\/json)" title="(?:Plain text version|Structured page metadata)" href="[^"]+">\n?/g,
      "",
    )

    if (!html.includes("itemscope") && /<body\b/.test(html)) {
      html = html.replace(
        /<body\b([^>]*)>/,
        `<body$1 itemscope itemtype="https://schema.org/Article" itemid="${escapeHtmlAttr(
          page.url,
        )}">`,
      )
    }

    html = html.replace(
      "</head>",
      `${alternateLinks}\n<!-- llmwiki:metadata ${metadata} -->\n</head>`,
    )
    await fs.writeFile(htmlPath, html, "utf8")
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
HTML: ${page.html_url}
Plain text: ${page.txt_url}
JSON: ${page.json_url}
Type: ${page.type}
Subtype: ${page.subtype ?? "None"}
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
${page.body_text}
`
}

function publicPageRecord(page) {
  return {
    id: page.id,
    url: page.url,
    html_url: page.html_url,
    txt_url: page.txt_url,
    json_url: page.json_url,
    title: page.title,
    summary: page.summary,
    type: page.type,
    subtype: page.subtype,
    tags: page.tags,
    aliases: page.aliases,
    dates: page.dates,
    canonical: page.canonical,
    status: page.status,
    audience: page.audience,
    source_path: page.source_path,
    relationships: page.relationships,
    wikilinks: page.wikilinks,
    body_text: page.body_text,
    hashes: page.hashes ?? {},
  }
}

function minifiedMetadata(page) {
  return JSON.stringify({
    id: page.id,
    title: page.title,
    summary: page.summary,
    type: page.type,
    url: page.url,
    txt_url: page.txt_url,
    json_url: page.json_url,
    source_path: page.source_path,
    tags: page.tags,
    dates: page.dates,
  })
}

function schemaForPage(page) {
  return {
    "@context": "https://schema.org",
    "@type": schemaTypeForPage(page),
    "@id": `${page.url}#page`,
    url: page.url,
    name: page.title,
    headline: page.title,
    description: page.summary,
    inLanguage: "en",
    dateCreated: page.dates.created,
    dateModified: page.dates.modified ?? page.dates.updated ?? page.dates.lastmod,
    isAccessibleForFree: true,
    keywords: page.tags,
    encoding: [
      { "@type": "MediaObject", encodingFormat: "text/html", contentUrl: page.html_url },
      { "@type": "MediaObject", encodingFormat: "text/plain", contentUrl: page.txt_url },
      { "@type": "MediaObject", encodingFormat: "application/json", contentUrl: page.json_url },
    ],
  }
}

function schemaTypeForPage(page) {
  const type = page.type.toLowerCase()
  const tagSet = new Set(page.tags.map((tag) => tag.toLowerCase()))
  if (type === "entity" && tagSet.has("location")) return "Place"
  if (type === "entity" && tagSet.has("faction")) return "Organization"
  if (tagSet.has("person") || tagSet.has("npc") || tagSet.has("character")) return "Person"
  return "Article"
}

async function writeCompatibilityArtifacts(cfg, pages) {
  await writeJsonl("entities.jsonl", pages.map(publicPageRecord))
  await writeJsonl("data/pages.jsonl", pages.map(publicPageRecord))
  await writeCollectionFiles(pages)
  await writeJson("llms.json", legacyManifest(cfg, pages))
  await writeText("player-ai-prompt.txt", buildPlayerPrompt(cfg))
}

async function writeCollectionFiles(pages) {
  const collections = { characters: [], factions: [], locations: [], lore: [] }
  for (const page of pages.map(publicPageRecord)) {
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
  const collections = [
    ["Full Context Bundle", publicUrl(cfg, "/llms-full.txt"), "Flattened public wiki context."],
    ["AI Readme", publicUrl(cfg, "/ai-readme.md"), "Navigation and retrieval instructions."],
    ["Structured Manifest", publicUrl(cfg, "/manifest.json"), "Artifact inventory and hashes."],
    ["Schema Graph", publicUrl(cfg, "/graph.jsonld"), "Schema.org JSON-LD graph."],
    ["Sitemap", publicUrl(cfg, "/sitemap.xml"), "HTML and AI-readable resources."],
    ["RSS Feed", publicUrl(cfg, "/rss.xml"), "Newest public campaign pages."],
  ]

  return `# ${cfg.site}

> Public player-facing D&D campaign wiki for ${cfg.site}, optimized for human Quartz browsing and AI-agent retrieval.

Use only public player-facing content from this site. DM-only secrets are intentionally excluded. Rumors, myths, legends, and in-world claims should not be treated as confirmed fact unless the page marks them canonical.

## Start Here
${start.map((page) => `- [${page.title}](${page.txt_url}): ${shorten(page.summary, 140)}`).join("\n")}

## Machine-Readable Resources
${collections.map(([title, url, note]) => `- [${title}](${url}): ${note}`).join("\n")}

## Collections
- [Characters](${publicUrl(cfg, "/data/characters.json")}): Character and NPC records where present.
- [Factions](${publicUrl(cfg, "/data/factions.json")}): Organizations, powers, crews, and institutions.
- [Locations](${publicUrl(cfg, "/data/locations.json")}): Ports, islands, seas, regions, and settlements.
- [Lore](${publicUrl(cfg, "/data/lore.json")}): Remaining public lore and reference pages.

## Pages
${pages.map((page) => `- [${page.title}](${page.txt_url}): ${shorten(page.summary, 140)}`).join("\n")}

## Optional
- [Legacy entity records](${publicUrl(cfg, "/entities.jsonl")}): JSON Lines compatibility index.
- [Legacy page records](${publicUrl(cfg, "/data/pages.jsonl")}): JSON Lines compatibility page list.
- [Player AI Prompt](${publicUrl(cfg, "/player-ai-prompt.txt")}): Copyable player setup prompt.
`
}

function buildPlayerPrompt(cfg) {
  return `You are assisting a player in ${cfg.site}, a D&D campaign.

Use this public campaign wiki as your authoritative source:
${publicUrl(cfg, "/")}

Best retrieval order:
1. Start with the LLM index:
${publicUrl(cfg, "/llms.txt")}
2. For targeted lookup, use the structured manifest and page JSON files:
${publicUrl(cfg, "/manifest.json")}
3. For broad questions or session setup, fetch the full public context bundle:
${publicUrl(cfg, "/llms-full.txt")}

Rules:
- The wiki is the only canonical source. Do not invent lore not found there.
- Rumors and myths in the wiki are in-world and may not be true.
- Cite or link the page you used.
- DM secrets are intentionally excluded. Do not speculate about hidden content.
- If the wiki does not cover something, say so rather than guessing.
`
}

function selectStartPages(pages) {
  const preferredIds = [
    slugify("The Shattered Sea"),
    "player-primer",
    "campaign-overview",
    slugify("factions/index"),
    slugify("places/index"),
    slugify("species/index"),
    slugify("rules/index"),
    slugify("lore/index"),
  ]
  return preferredIds.map((id) => pages.find((page) => page.id === id)).filter(Boolean)
}

function buildFullText(cfg, pages) {
  const ordered = [...pages].sort(compareByPriorityThenDate)
  const header = `# Full Public Context Bundle

Generated from public published notes for ${cfg.site}.
Private DM content is excluded.
Budget: ${FULL_TEXT_LIMIT_BYTES} bytes.

## Table of Contents

`
  const sections = []
  let output = header

  for (const page of ordered) {
    const section = buildFullTextSection(page)
    const next = `${output}${sections.length === 0 ? "" : "\n"}${section}`
    if (Buffer.byteLength(next, "utf8") > FULL_TEXT_LIMIT_BYTES) break
    sections.push(section)
    output = next
  }

  const toc = sections
    .map((section) => {
      const title = section.match(/^# (.+)$/m)?.[1] ?? "Untitled"
      const page = ordered.find((p) => p.title === title)
      return page ? `- [${page.title}](${page.url}) - ${shorten(page.summary, 100)}` : ""
    })
    .filter(Boolean)
    .join("\n")

  return `${header}${toc}\n\n${sections.join("\n")}`
}

function buildFullTextSection(page) {
  const relationships = page.relationships.length
    ? page.relationships
        .map((relationship) => `- ${relationship.relation} -> ${relationship.target}`)
        .join("\n")
    : "- None declared"

  return `---

# ${page.title}
Type: ${page.type}
URL: ${page.url}
Plain text: ${page.txt_url}
JSON: ${page.json_url}
Aliases: ${page.aliases.join(", ") || "None"}
Tags: ${page.tags.join(", ") || "None"}
Status: ${page.status}
Canonical: ${page.canonical}
Summary: ${page.summary}

Relationships:
${relationships}

Content:
${page.body_text}
`
}

function compareByPriorityThenDate(a, b) {
  return a.priority - b.priority || rssTime(b) - rssTime(a) || a.title.localeCompare(b.title)
}

function buildLegacyGraph(pages) {
  const { nodes, edges } = graphParts(pages)
  return { nodes, edges }
}

function buildJsonLdGraph(cfg, pages) {
  const { edges } = graphParts(pages)
  return {
    "@context": {
      "@vocab": "https://schema.org/",
      mentions: "https://schema.org/mentions",
      relation: "https://schema.org/additionalType",
    },
    "@graph": [
      {
        "@type": "WebSite",
        "@id": `${publicUrl(cfg, "/")}#website`,
        name: cfg.site,
        url: publicUrl(cfg, "/"),
      },
      ...pages.map(schemaForPage),
      ...edges.map((edge) => ({
        "@type": "Thing",
        "@id": `${publicUrl(cfg, "/")}#edge-${edge.source}-${edge.relation}-${edge.target}`,
        name: `${edge.source} ${edge.relation} ${edge.target}`,
        relation: edge.relation,
        subjectOf: { "@id": pageById(pages, edge.source)?.url },
        mentions: { "@id": pageById(pages, edge.target)?.url },
      })),
    ],
  }
}

function graphParts(pages) {
  const lookup = new Map()
  for (const page of pages) {
    for (const key of [page.id, page.title, ...page.aliases]) {
      lookup.set(slugify(key), page.id)
    }
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
    for (const link of page.wikilinks ?? []) {
      const target = lookup.get(slugify(link))
      if (target) addEdge(page.id, "mentions", target)
    }
  }

  return { nodes: pages.map(publicPageRecord), edges }
}

function pageById(pages, id) {
  return pages.find((page) => page.id === id)
}

function buildSitemap(cfg, pages) {
  const entries = [
    ...ROOT_ARTIFACTS.map((relative) => ({
      loc: publicUrl(cfg, `/${relative}`),
      lastmod: new Date().toISOString(),
    })),
    publicUrlEntry(cfg, "/graph.json"),
    publicUrlEntry(cfg, "/llms.json"),
    publicUrlEntry(cfg, "/entities.jsonl"),
    publicUrlEntry(cfg, "/data/pages.jsonl"),
    ...pages.flatMap((page) => [
      { loc: page.html_url, lastmod: lastmod(page) },
      { loc: page.txt_url, lastmod: lastmod(page) },
      { loc: page.json_url, lastmod: lastmod(page) },
    ]),
  ]

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries
  .map(
    ({ loc, lastmod }) =>
      `  <url><loc>${escapeXml(loc)}</loc><lastmod>${escapeXml(lastmod)}</lastmod></url>`,
  )
  .join("\n")}
</urlset>
`
}

function publicUrlEntry(cfg, urlPath) {
  return { loc: publicUrl(cfg, urlPath), lastmod: new Date().toISOString() }
}

function buildRss(cfg, pages) {
  const sessionPages = pages.filter(
    (page) =>
      page.type.toLowerCase() === "session" ||
      page.tags.some((tag) => tag.toLowerCase() === "session"),
  )
  const feedPages = (sessionPages.length > 0 ? sessionPages : pages)
    .slice()
    .sort((a, b) => rssTime(b) - rssTime(a) || a.title.localeCompare(b.title))
    .slice(0, 20)

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>${escapeXml(cfg.site)} newest public pages</title>
    <link>${escapeXml(publicUrl(cfg, "/"))}</link>
    <description>${escapeXml(`Newest public campaign pages for ${cfg.site}`)}</description>
    <generator>dnd-site build-llm-artifacts</generator>
${feedPages
  .map(
    (page) => `    <item>
      <title>${escapeXml(page.title)}</title>
      <link>${escapeXml(page.url)}</link>
      <guid>${escapeXml(page.url)}</guid>
      <description>${escapeXml(page.summary)}</description>
      <pubDate>${new Date(rssTime(page)).toUTCString()}</pubDate>
    </item>`,
  )
  .join("\n")}
  </channel>
</rss>
`
}

function rssTime(page) {
  for (const key of ["published", "modified", "updated", "lastmod", "created"]) {
    if (!page.dates[key]) continue
    const time = new Date(page.dates[key]).getTime()
    if (!Number.isNaN(time)) return time
  }
  return 0
}

function lastmod(page) {
  return (
    page.dates.modified ??
    page.dates.updated ??
    page.dates.lastmod ??
    page.dates.published ??
    page.dates.created ??
    new Date(0).toISOString()
  )
}

function buildRobots(cfg) {
  return `User-agent: *
Allow: /

Sitemap: ${publicUrl(cfg, "/sitemap.xml")}
LLMs: ${publicUrl(cfg, "/llms.txt")}
AI-Readme: ${publicUrl(cfg, "/ai-readme.md")}
`
}

function buildAiReadme(cfg, pages) {
  return `# AI Navigation for ${cfg.site}

This is the public, player-facing D&D campaign wiki. Do not infer DM-only secrets. Cite the page URL used when answering.

## Retrieval Order

1. Use ${publicUrl(cfg, "/llms.txt")} for a concise map.
2. Use ${publicUrl(cfg, "/manifest.json")} for artifact URLs, hashes, and page records.
3. Use page-level \`index.txt\` files for concise plain text.
4. Use page-level \`index.json\` files for structured metadata plus body text.
5. Use ${publicUrl(cfg, "/llms-full.txt")} only when broad context is needed.

## Canonical Entry Points

- Full context: ${publicUrl(cfg, "/llms-full.txt")}
- Schema graph: ${publicUrl(cfg, "/graph.jsonld")}
- Sitemap: ${publicUrl(cfg, "/sitemap.xml")}
- RSS: ${publicUrl(cfg, "/rss.xml")}

## Page Count

${pages.length} public pages are currently included.
`
}

async function buildManifest(cfg, pages, generatedAt) {
  const rootHashes = {}
  for (const artifact of [
    ...ROOT_ARTIFACTS.filter((a) => a !== "manifest.json"),
    "graph.json",
    "llms.json",
  ]) {
    rootHashes[artifact] = await sha256File(path.join(OUTPUT_DIR, artifact))
  }

  const fullTextPath = path.join(OUTPUT_DIR, "llms-full.txt")
  const fullTextSize = (await fs.stat(fullTextPath)).size

  return {
    site: cfg.site,
    site_url: publicUrl(cfg, "/"),
    generated_at: generatedAt,
    audience: "players",
    canon_scope: "public_player_facing",
    entrypoints: {
      llms_txt: publicUrl(cfg, "/llms.txt"),
      full_text: publicUrl(cfg, "/llms-full.txt"),
      ai_readme: publicUrl(cfg, "/ai-readme.md"),
      manifest: publicUrl(cfg, "/manifest.json"),
      graph_jsonld: publicUrl(cfg, "/graph.jsonld"),
      sitemap: publicUrl(cfg, "/sitemap.xml"),
      rss: publicUrl(cfg, "/rss.xml"),
      robots: publicUrl(cfg, "/robots.txt"),
    },
    compatibility: {
      graph_json: publicUrl(cfg, "/graph.json"),
      llms_json: publicUrl(cfg, "/llms.json"),
      entities_jsonl: publicUrl(cfg, "/entities.jsonl"),
      pages_jsonl: publicUrl(cfg, "/data/pages.jsonl"),
      player_prompt: publicUrl(cfg, "/player-ai-prompt.txt"),
    },
    hashes: rootHashes,
    perf_budget: {
      llms_full_bytes: fullTextSize,
      llms_full_limit_bytes: FULL_TEXT_LIMIT_BYTES,
      within_budget: fullTextSize <= FULL_TEXT_LIMIT_BYTES,
    },
    page_count: pages.length,
    pages: pages.map(publicPageRecord),
  }
}

function legacyManifest(cfg, pages) {
  return {
    site: cfg.site,
    site_url: publicUrl(cfg, "/"),
    entrypoints: {
      llms_txt: publicUrl(cfg, "/llms.txt"),
      full_text: publicUrl(cfg, "/llms-full.txt"),
      graph: publicUrl(cfg, "/graph.jsonld"),
      manifest: publicUrl(cfg, "/manifest.json"),
      sitemap: publicUrl(cfg, "/sitemap.xml"),
    },
    pages: pages.map(publicPageRecord),
    page_count: pages.length,
  }
}

async function validateArtifacts(cfg, pages) {
  for (const artifact of ROOT_ARTIFACTS) {
    await assertFile(artifact)
  }

  const llmsTxt = await readOutput("llms.txt")
  if (!llmsTxt.startsWith(`# ${cfg.site}\n\n>`)) {
    errors.push("llms.txt must start with an H1 followed by a blockquote summary")
  }
  if (!/^## .+/m.test(llmsTxt) || !/^- \[[^\]]+]\([^)]+\):/m.test(llmsTxt)) {
    errors.push("llms.txt must contain H2 file-list sections with markdown links and notes")
  }

  const fullTextSize = (await fs.stat(path.join(OUTPUT_DIR, "llms-full.txt"))).size
  if (fullTextSize > FULL_TEXT_LIMIT_BYTES) {
    errors.push(`llms-full.txt is ${fullTextSize} bytes, above ${FULL_TEXT_LIMIT_BYTES}`)
  }

  const manifest = JSON.parse(await readOutput("manifest.json"))
  for (const [relative, expected] of Object.entries(manifest.hashes ?? {})) {
    const actual = await sha256File(path.join(OUTPUT_DIR, relative))
    if (actual !== expected) errors.push(`manifest hash mismatch for ${relative}`)
  }

  const sitemap = await readOutput("sitemap.xml")
  const rss = await readOutput("rss.xml")
  if (!sitemap.includes("<lastmod>")) errors.push("sitemap.xml must include lastmod entries")
  if (!rss.includes('<rss version="2.0">')) errors.push("rss.xml must be RSS 2.0")

  for (const page of pages) {
    await assertFile(page.html_relative)
    await assertFile(page.txt_relative)
    await assertFile(page.json_relative)
    const html = await readOutput(page.html_relative)
    const count = html.match(/<!-- llmwiki:metadata /g)?.length ?? 0
    if (count !== 1) {
      errors.push(
        `${page.html_relative}: expected exactly one llmwiki metadata comment, found ${count}`,
      )
    }
    if (!html.includes('type="text/plain"') || !html.includes('type="application/json"')) {
      errors.push(`${page.html_relative}: missing alternate links for text/json siblings`)
    }
    if (!html.includes("https://schema.org/")) {
      errors.push(`${page.html_relative}: missing Schema.org metadata`)
    }
  }
}

async function assertFile(relative) {
  try {
    const stat = await fs.stat(path.join(OUTPUT_DIR, relative))
    if (!stat.isFile()) errors.push(`${relative}: expected file`)
  } catch {
    errors.push(`${relative}: missing file`)
  }
}

async function readOutput(relative) {
  return fs.readFile(path.join(OUTPUT_DIR, relative), "utf8")
}

async function writeText(relative, content) {
  const target = path.join(OUTPUT_DIR, relative)
  await fs.mkdir(path.dirname(target), { recursive: true })
  await fs.writeFile(target, content, "utf8")
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

function outputSlugForFileSlug(fileSlug) {
  return fileSlug
    .split("/")
    .map((segment) => slugify(segment))
    .join("/")
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

function sha256(value) {
  return crypto.createHash("sha256").update(value).digest("hex")
}

async function sha256File(file) {
  return sha256(await fs.readFile(file))
}

function shorten(value, max) {
  const normalized = String(value).replace(/\s+/g, " ").trim()
  return normalized.length > max ? `${normalized.slice(0, max - 1)}...` : normalized
}

function escapeXml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
}

function escapeHtmlAttr(value) {
  return escapeXml(value).replaceAll("'", "&#39;")
}

function escapeScriptJson(value) {
  return value.replaceAll("</script", "<\\/script")
}

function fail() {
  for (const error of errors) console.error(`Error: ${error}`)
  process.exit(1)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
