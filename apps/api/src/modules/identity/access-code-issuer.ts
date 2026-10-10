import { ACCESS_CODE_TTL_MS } from './constants';
import { generateAccessCode, hashAccessCode } from './domain/secrets';
import type {
  AccessCodePurpose,
  AccessCodeRepository,
} from './repositories/access-code.repository.types';

/**
 * Emite um código de uso único e invalida os anteriores da mesma finalidade (RN-023).
 * Retorna o valor em texto puro, que nunca é persistido.
 */
export async function issueAccessCode(
  accessCodes: AccessCodeRepository,
  userId: string,
  purpose: AccessCodePurpose,
  now: Date,
): Promise<string> {
  const code = generateAccessCode();
  await accessCodes.invalidateOpen(userId, purpose, now);
  await accessCodes.create({
    userId,
    purpose,
    codeHash: hashAccessCode(code),
    now,
    expiresAt: new Date(now.getTime() + ACCESS_CODE_TTL_MS),
  });
  return code;
}
