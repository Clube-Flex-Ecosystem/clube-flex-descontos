import { z } from 'zod';

const optionalText = z
  .string()
  .optional()
  .transform((value) => (value?.trim() ? value.trim() : undefined));

const envSchema = z
  .object({
    NODE_ENV: z
      .enum(['development', 'test', 'production'])
      .default('development'),
    PORT: z.coerce.number().int().min(1).max(65535).default(3000),
    DATABASE_URL: z.string().min(1),
    AUTH_SECRET: optionalText,
    LOG_LEVEL: z
      .enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent'])
      .optional(),
    // Origem do dashboard: única permitida pelo CORS com credenciais e base dos links de e-mail.
    DASHBOARD_ORIGIN: optionalText,
    // Origem pública que hidrata os Islands do catálogo.
    CATALOG_ORIGIN: optionalText,
    // Quantidade de proxies confiáveis à frente da API (Coolify); 0 não confia em `X-Forwarded-For`.
    TRUST_PROXY_HOPS: z.coerce.number().int().min(0).max(10).default(0),
    RESEND_API_KEY: optionalText,
    EMAIL_FROM: optionalText,
    // Parâmetros do Argon2id, calibrados por ambiente (padrão: mínimo da OWASP).
    ARGON2_MEMORY_KIB: z.coerce.number().int().min(8).default(19_456),
    ARGON2_PASSES: z.coerce.number().int().min(1).default(2),
    ARGON2_PARALLELISM: z.coerce.number().int().min(1).default(1),
  })
  .superRefine((env, context) => {
    if (env.NODE_ENV === 'production' && !env.DASHBOARD_ORIGIN) {
      context.addIssue({
        code: 'custom',
        path: ['DASHBOARD_ORIGIN'],
        message: 'Obrigatória em produção',
      });
    }
    if (env.NODE_ENV === 'production' && !env.AUTH_SECRET) {
      context.addIssue({
        code: 'custom',
        path: ['AUTH_SECRET'],
        message: 'Obrigatória em produção',
      });
    }
    if (env.RESEND_API_KEY && !env.EMAIL_FROM) {
      context.addIssue({
        code: 'custom',
        path: ['EMAIL_FROM'],
        message: 'Obrigatória quando RESEND_API_KEY está definida',
      });
    }
  })
  .transform((env) => ({
    ...env,
    DASHBOARD_ORIGIN: (env.DASHBOARD_ORIGIN ?? 'http://localhost:5173').replace(
      /\/+$/,
      '',
    ),
    CATALOG_ORIGIN: (env.CATALOG_ORIGIN ?? 'http://localhost:4321').replace(
      /\/+$/,
      '',
    ),
    AUTH_SECRET:
      env.AUTH_SECRET ?? 'desenvolvimento-local-chave-jwt-clube-flex',
  }));

export type Env = z.infer<typeof envSchema>;

export function loadEnv(source: NodeJS.ProcessEnv = process.env): Env {
  const result = envSchema.safeParse(source);
  if (!result.success) {
    const fields = result.error.issues
      .map((issue) => issue.path.join('.'))
      .join(', ');
    throw new Error(`Configuração de ambiente inválida: ${fields}`);
  }
  return result.data;
}
