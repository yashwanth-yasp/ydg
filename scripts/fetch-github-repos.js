import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const GITHUB_USERNAME = 'yashwanth-yasp'
const PROJECTS_DIR = path.join(__dirname, '../src/content/projects')

// check to ensure the directory exists, if not create it
if (!fs.existsSync(PROJECTS_DIR)) {
  fs.mkdirSync(PROJECTS_DIR, { recursive: true })
}

async function fetchGitHubRepos() {
  try {
    console.log(`Fetching repositories for ${GITHUB_USERNAME}...`)

    const response = await fetch(
      `https://api.github.com/users/${GITHUB_USERNAME}/repos?per_page=100`,
      {
        headers: {
          'Accept': 'application/vnd.github.v3+json',
          ...(process.env.GITHUB_TOKEN && { 'Authorization': `token ${process.env.GITHUB_TOKEN}` })
        }
      }
    )

    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status} ${response.statusText}`)
    }

    const repos = await response.json()

    // Filter out forks and archived repos
    const filteredRepos = repos.filter((repo) => !repo.fork && !repo.archived)

    console.log(`Fetching commit counts for ${filteredRepos.length} repositories...`)

    // Fetch commit count for each repo
    const reposWithCommits = await Promise.all(
      filteredRepos.map(async (repo) => {
        try {
          const commitResponse = await fetch(
            `https://api.github.com/repos/${GITHUB_USERNAME}/${repo.name}/commits?per_page=1`,
            {
              headers: {
                'Accept': 'application/vnd.github.v3+json',
                ...(process.env.GITHUB_TOKEN && { 'Authorization': `token ${process.env.GITHUB_TOKEN}` })
              }
            }
          )

          // Get total count from Link header or default to 0
          let commitCount = 0
          if (commitResponse.ok) {
            const linkHeader = commitResponse.headers.get('link')
            if (linkHeader) {
              const match = linkHeader.match(/&page=(\d+)>; rel="last"/)
              commitCount = match ? parseInt(match[1], 10) : 1
            } else {
              commitCount = 1
            }
          }

          return { ...repo, commitCount }
        } catch (error) {
          console.warn(`Could not fetch commits for ${repo.name}:`, error.message)
          return { ...repo, commitCount: 0 }
        }
      })
    )

    // Sort by commit count (descending) and take top 10
    const sortedRepos = reposWithCommits
      .sort((a, b) => b.commitCount - a.commitCount)
      .slice(0, 10)

    console.log(`Found ${sortedRepos.length} repositories`)

    for (const repo of sortedRepos) {
      const slug = repo.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')
      const filePath = path.join(PROJECTS_DIR, `${slug}.md`)

      const markdown = `---
title: '${repo.name.replace(/'/g, "\\'")}' 
summary: '${(repo.description || 'A GitHub project').replace(/'/g, "\\'")}'
role: 'Developer'
tech: [${repo.language ? `'${repo.language}'` : "'JavaScript'"}, 'GitHub']
link: '${repo.html_url}'
startDate: '${new Date(repo.created_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short'
      })}'
commits: ${repo.commitCount}
featured: false
---

## Overview

${repo.description || 'No description available'}

**Repository:** [${repo.name}](${repo.html_url})

### Stats

- **Commits:** ${repo.commitCount}
- **Stars:** ${repo.stargazers_count}
- **Forks:** ${repo.forks_count}
- **Language:** ${repo.language || 'Not specified'}
- **Last Updated:** ${new Date(repo.updated_at).toLocaleDateString()}

### Links

- [View on GitHub](${repo.html_url})
${repo.homepage ? `- [Live Demo](${repo.homepage})` : ''}
`

      fs.writeFileSync(filePath, markdown, 'utf-8')
      console.log(`✓ Created ${slug}.md (${repo.commitCount} commits)`)
    }

    console.log('\n✓ Successfully updated GitHub projects!')
  } catch (error) {
    console.error('Error fetching GitHub repos:', error.message)
    process.exit(1)
  }
}

fetchGitHubRepos()
