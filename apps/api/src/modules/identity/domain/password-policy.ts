import {
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
  type FieldErrorCode,
} from '@flex/contracts';

// Senhas comuns com ao menos 15 caracteres, a menor extensão aceita. A lista é
// intencionalmente curta: a verificação contra bases de vazamentos exige um
// serviço externo e fica fora desta entrega.
const COMMON_PASSWORDS = new Set([
  '123456789012345',
  '1234567890123456',
  '12345678901234567890',
  'passwordpassword',
  'password1234567',
  'password123456789',
  'qwertyuiopasdfgh',
  'qwertyuiopasdfghjkl',
  'qwertyuiop123456',
  'abcdefghijklmnop',
  'abcdefghijklmnopqrstuvwxyz',
  'iloveyouiloveyou',
  'senhasenhasenha',
  'senha1234567890',
  'senhasenha12345',
  'minhasenha12345',
  'minhasenhasegura',
  'mudar123mudar123',
  'bemvindobemvindo',
  'clubeflex123456',
  'clubeflexclubeflex',
  'clubeflex2026clubeflex',
  'flexflexflexflex',
  'administrador123',
  'administradoradmin',
  'adminadminadminadmin',
  'welcomewelcomewelcome',
  'letmeinletmeinletmein',
  'correcthorsebatterystaple',
  'thequickbrownfoxjumps',
]);

function normalize(password: string): string {
  return password.normalize('NFKC').toLowerCase().replace(/\s+/g, '');
}

function isRepeatedPattern(value: string): boolean {
  // Uma unidade de até quatro caracteres repetida por toda a senha, como "abcdabcdabcdabcd".
  for (let size = 1; size <= 4; size += 1) {
    if (value.length % size !== 0) continue;
    const unit = value.slice(0, size);
    if (unit.repeat(value.length / size) === value) return true;
  }
  return false;
}

/**
 * Regras de senha da ADR-0004: tamanho de 15 a 128 caracteres, sem regras de composição,
 * recusando senhas comuns ou previsíveis.
 */
export function checkPassword(password: string): FieldErrorCode | null {
  const length = [...password].length;
  if (length < PASSWORD_MIN_LENGTH) return 'PASSWORD_TOO_SHORT';
  if (length > PASSWORD_MAX_LENGTH) return 'PASSWORD_TOO_LONG';

  const normalized = normalize(password);
  if (COMMON_PASSWORDS.has(normalized) || isRepeatedPattern(normalized)) {
    return 'PASSWORD_TOO_COMMON';
  }
  return null;
}
