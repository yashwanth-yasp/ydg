import { z, defineCollection, type CollectionEntry } from 'astro:content'

const blogCollection = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.string(),
    tags: z.array(z.string())
  })
})

const projectsCollection = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    summary: z.string(),
    role: z.string(),
    tech: z.array(z.string()),
    link: z.string(),
    startDate: z.string(),
    endDate: z.string().optional(),
    featured: z.boolean().default(false)
  })
})


export const collections = {
  posts: blogCollection,
  projects: projectsCollection,
}

export type Post = CollectionEntry<'posts'>
export type Project = CollectionEntry<'projects'>