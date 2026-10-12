import { ResourceNotFoundError, VersionConflictError } from '../errors';

/**
 * Uma atualização condicionada à versão não alterou nenhuma linha: o recurso deixou de
 * existir (404) ou foi alterado por outra pessoa (409).
 */
export async function failVersionedUpdate(
    exists: () => Promise<boolean>,
): Promise<never> {
    throw (await exists())
        ? new VersionConflictError()
        : new ResourceNotFoundError();
}
