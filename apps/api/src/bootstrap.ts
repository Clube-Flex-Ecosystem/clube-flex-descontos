import { parseArgs } from 'node:util';
import { z } from 'zod';
import { loadEnv } from './config/env';
import { BootstrapRefusedError } from './modules/identity/errors';
import {
  createPool,
  setDatabase,
} from './infrastructure/database/drizzle/client';
import { DrizzleUnitOfWork } from './infrastructure/database/drizzle/drizzle-unit-of-work';
import {
  ResendEmailSender,
  UnavailableEmailSender,
} from './infrastructure/email/resend-email-sender';
import { AccessCodeDelivery } from './modules/identity/access-code-delivery';
import { BootstrapFirstAdministratorUseCase } from './modules/identity/use-cases/bootstrap-first-administrator.use-case';

// Comando de terminal local ou console do container; nunca exposto por HTTP.
const inputSchema = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.string().trim().max(254).pipe(z.email()).optional(),
});

function usage(): never {
  process.stderr.write(
    'Uso: bootstrap --name "Nome completo" [--email email@exemplo.com]\n',
  );
  process.exit(2);
}

async function main(): Promise<number> {
  const { values } = parseArgs({
    options: { name: { type: 'string' }, email: { type: 'string' } },
    strict: true,
  });
  const input = inputSchema.safeParse({
    name: values.name,
    email: values.email || undefined,
  });
  if (!input.success) usage();

  const env = loadEnv();
  const pool = createPool(env.DATABASE_URL);
  setDatabase(pool);
  const emailSender =
    env.RESEND_API_KEY && env.EMAIL_FROM
      ? new ResendEmailSender(env.RESEND_API_KEY, env.EMAIL_FROM)
      : new UnavailableEmailSender();
  const bootstrap = new BootstrapFirstAdministratorUseCase(
    new DrizzleUnitOfWork(),
    new AccessCodeDelivery(emailSender, env.DASHBOARD_ORIGIN),
    { now: () => new Date() },
  );

  try {
    const result = await bootstrap.execute({
      fullName: input.data.name,
      ...(input.data.email ? { email: input.data.email } : {}),
    });

    // A saída é intencional e não passa pelo logger: o código é exibido uma única vez.
    const out = (line: string) => process.stdout.write(`${line}\n`);
    out(`Administrador criado: ${result.user.fullName}`);
    out(`Nome de usuário: ${result.user.username}`);
    if (result.accessCode) {
      if (result.deliveryFailed) {
        out('O envio por e-mail falhou; entregue o código manualmente.');
      }
      out(
        `Código de ativação (válido por 30 minutos, uso único): ${result.accessCode}`,
      );
    } else {
      out(`Código de ativação enviado para ${result.user.email}.`);
    }
    out(
      'A senha é definida pelo próprio usuário na tela de ativação do painel.',
    );
    return 0;
  } catch (error) {
    if (error instanceof BootstrapRefusedError) {
      process.stderr.write(`${error.message}\n`);
      return 1;
    }
    throw error;
  } finally {
    await pool.end();
  }
}

main().then(
  (code) => process.exit(code),
  (error: unknown) => {
    process.stderr.write(`Falha no bootstrap: ${String(error)}\n`);
    process.exit(1);
  },
);
