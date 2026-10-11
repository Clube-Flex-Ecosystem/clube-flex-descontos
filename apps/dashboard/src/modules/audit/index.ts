/**
 * API pública do módulo de auditoria. A página é carregada diretamente pela rota: expô-la
 * aqui criaria um ciclo com o módulo de usuários, que invalida a consulta ao alterar contas.
 */
export { auditKey } from './queries/audit.query';
