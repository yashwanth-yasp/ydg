import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import Parser from 'rss-parser'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const SUBSTACK_FEED = 'https://ydgwrites.substack.com/feed'
const POSTS_DIR = path.join(__dirname, '../src/content/posts')

// Ensure posts directory exists
if (!fs.existsSync(POSTS_DIR)) {
  fs.mkdirSync(POSTS_DIR, { recursive: true })
}

async function fetchSubstackPosts() {
  try {
    console.log(`Fetching posts from ${SUBSTACK_FEED}...`)

    const parser = new Parser()
    const feed = await parser.parseURL(SUBSTACK_FEED)

    if (!feed.items || feed.items.length === 0) {
      console.log('No posts found in feed')
      return
    }

    console.log(`Found ${feed.items.length} posts`)

    const recentPosts = feed.items.slice(0, 10)

    for (const item of recentPosts) {
      // Create slug from title
      const slug = item.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')

      const filePath = path.join(POSTS_DIR, `substack-${slug}.md`)

      // Extract data
      const pubDate = item.pubDate
        ? new Date(item.pubDate).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
          })
        : new Date().toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
          })

      const description = item.contentSnippet
        ? item.contentSnippet.substring(0, 160).replace(/'/g, "\\'")
        : 'A post from Substack'

      const content = item.content || item.description || ''

      const markdown = `---
title: '${item.title.replace(/'/g, "\\'")}'
description: '${description}'
pubDate: '${pubDate}'
tags: ['substack', 'writing']
---

${content}

---

[Read on Substack](${item.link})`

      fs.writeFileSync(filePath, markdown, 'utf-8')
      console.log(`✓ Created substack-${slug}.md`)
    }

    console.log('\n✓ Successfully imported Substack posts!')
  } catch (error) {
    console.error('Error fetching Substack posts:', error.message)
    process.exit(1)
  }
}

fetchSubstackPosts()
