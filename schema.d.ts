import type { z } from 'astro/zod'

export declare const seoFields: () => z.ZodObject<any>
export declare const seoSchema: () => z.ZodObject<{ seo: z.ZodOptional<z.ZodObject<any>> }>
