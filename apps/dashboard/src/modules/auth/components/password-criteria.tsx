import { PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH } from '@flex/contracts';

/** Critérios apresentados antes da submissão (interface do dashboard › Acesso sem sessão). */
export function PasswordCriteria() {
  return (
    <ul
      className="t-caption m-0 list-disc rounded-md bg-surface-muted py-2.5 pr-3 pl-7 font-normal text-muted-foreground"
      aria-label="Critérios da senha"
    >
      <li>
        De {PASSWORD_MIN_LENGTH} a {PASSWORD_MAX_LENGTH} caracteres.
      </li>
      <li>Frases longas funcionam bem; espaços e acentos são permitidos.</li>
      <li>Senhas comuns ou previsíveis são recusadas.</li>
    </ul>
  );
}
