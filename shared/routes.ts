import { z } from 'zod';
import { insertBottleSchema, insertOpenedBottleSchema, bottles, openedBottles, importBottleSchema } from './schema';

// ============================================
// SHARED ERROR SCHEMAS
// ============================================
export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
};

// ============================================
// API CONTRACT
// ============================================
export const api = {
  bottles: {
    list: {
      method: 'GET' as const,
      path: '/api/bottles',
      input: z.object({
        q: z.string().optional(),
        status: z.string().optional(),
        confidence: z.string().optional(),
        window_source: z.string().optional(),
        color: z.string().optional(),
        type: z.string().optional(),
        sweetness: z.string().optional(),
        location: z.string().optional(),
        sort: z.string().optional(),
      }).optional(),
      responses: {
        200: z.array(z.custom<typeof bottles.$inferSelect>()),
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/bottles/:id',
      responses: {
        200: z.custom<typeof bottles.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/bottles',
      input: insertBottleSchema.omit({ userId: true }),
      responses: {
        200: z.custom<typeof bottles.$inferSelect>(),
        201: z.custom<typeof bottles.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    update: {
      method: 'PATCH' as const, // Using PATCH for partial updates
      path: '/api/bottles/:id',
      input: insertBottleSchema.omit({ userId: true }).partial(),
      responses: {
        200: z.custom<typeof bottles.$inferSelect>(),
        400: errorSchemas.validation,
        404: errorSchemas.notFound,
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/bottles/:id',
      responses: {
        200: z.object({ success: z.boolean() }),
        404: errorSchemas.notFound,
      },
    },
    import: {
      method: 'POST' as const,
      path: '/api/bottles/import',
      input: z.union([importBottleSchema, z.array(importBottleSchema)]),
      responses: {
        200: z.object({
          importedCount: z.number(),
          updatedCount: z.number(),
          errors: z.array(z.object({
            externalKey: z.string(),
            reason: z.string()
          }))
        }),
        400: errorSchemas.validation
      }
    },
    filters: {
      method: 'GET' as const,
      path: '/api/bottles/filters',
      responses: {
        200: z.object({
          colors: z.array(z.string()),
          types: z.array(z.string()),
          confidences: z.array(z.string()),
          window_sources: z.array(z.string()),
          sweetnesses: z.array(z.string()),
          locations: z.array(z.string()),
        }),
      },
    }
  },
  opened: {
    list: {
      method: 'GET' as const,
      path: '/api/opened',
      responses: {
        200: z.array(z.custom<typeof openedBottles.$inferSelect>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/opened',
      input: insertOpenedBottleSchema,
      responses: {
        201: z.custom<typeof openedBottles.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    update: {
      method: 'PATCH' as const,
      path: '/api/opened/:id',
      input: insertOpenedBottleSchema.partial(),
      responses: {
        200: z.custom<typeof openedBottles.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    }
  },
  dashboard: {
    stats: {
      method: 'GET' as const,
      path: '/api/dashboard/stats',
      responses: {
        200: z.object({
          openNow: z.number(),
          peak: z.number(),
          drinkSoon: z.number(),
          wait: z.number(),
          possiblyPast: z.number(),
          toVerify: z.number(),
        })
      }
    }
  }
};

// ============================================
// REQUIRED: buildUrl helper
// ============================================
export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}
