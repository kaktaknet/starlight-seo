import { z } from 'astro/zod'

const thing = z.union([
  z.string(),
  z.object({
    type: z.string().optional(),
    name: z.string(),
    description: z.string().optional(),
    url: z.string().optional(),
    sameAs: z.union([z.string(), z.array(z.string())]).optional(),
  }),
])

export const seoFields = () =>
  z
    .object({
      title: z.string().min(1).optional(),
      description: z.string().min(1).optional(),
      type: z.string().optional(),
      image: z.string().optional(),
      imageAlt: z.string().optional(),
      noindex: z.boolean().optional(),
      published: z.coerce.date().optional(),
      modified: z.coerce.date().optional(),
      section: z.string().optional(),
      keywords: z.array(z.string()).optional(),
      about: z.union([thing, z.array(thing)]).optional(),
    })
    .strict()

export const seoSchema = () => z.object({ seo: seoFields().optional() })
