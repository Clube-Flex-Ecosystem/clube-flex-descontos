import { permissionAreas, type Permission } from '@flex/contracts';
import { Button } from '../../../shared/ui/button';

interface PermissionGridProps {
    granted: ReadonlySet<Permission>;
    /** Permissões que o autor pode alterar; as demais ficam desabilitadas. */
    canChange: (permission: Permission) => boolean;
    onToggle: (permission: Permission, enabled: boolean) => void;
    /** Marca ou desmarca de uma vez as permissões alteráveis de uma área. */
    onToggleArea: (permissions: Permission[], enabled: boolean) => void;
}

/** Permissões individuais agrupadas por área, em duas colunas (protótipo do detalhe). */
export function PermissionGrid({
    granted,
    canChange,
    onToggle,
    onToggleArea,
}: PermissionGridProps) {
    return (
        <div className="grid sm:grid-cols-2">
            {permissionAreas.map(({ area, items }) => {
                const enabled = items.filter((item) =>
                    granted.has(item.id),
                ).length;
                // Somente o que o autor pode conceder entra no "Marcar todas".
                const changeable = items
                    .map((item) => item.id)
                    .filter((permission) => canChange(permission));
                const allOn =
                    changeable.length > 0 &&
                    changeable.every((permission) => granted.has(permission));
                return (
                    <fieldset
                        key={area}
                        className="m-0 min-w-0 border-0 border-b border-border px-4 py-3 sm:odd:border-r"
                    >
                        <legend className="sr-only">{area}</legend>
                        <h3 className="t-heading mb-2 flex items-center gap-2 text-foreground">
                            <span className="flex-1">{area}</span>
                            <span className="tnum font-medium text-muted-foreground">
                                {enabled}/{items.length}
                            </span>
                            {changeable.length > 0 ? (
                                <Button
                                    variant="quiet"
                                    compact
                                    className="t-caption min-h-6 px-2 md:min-h-6"
                                    onClick={() =>
                                        onToggleArea(changeable, !allOn)
                                    }
                                >
                                    {allOn ? 'Desmarcar todas' : 'Marcar todas'}
                                </Button>
                            ) : null}
                        </h3>
                        {items.map((item) => (
                            <label
                                key={item.id}
                                className="t-body-small flex cursor-pointer items-start gap-2 py-0.75 has-disabled:cursor-not-allowed has-disabled:text-placeholder"
                            >
                                <input
                                    type="checkbox"
                                    className="mt-px size-4 flex-none accent-selected"
                                    checked={granted.has(item.id)}
                                    disabled={!canChange(item.id)}
                                    onChange={(event) =>
                                        onToggle(item.id, event.target.checked)
                                    }
                                />
                                <span>{item.label}</span>
                            </label>
                        ))}
                    </fieldset>
                );
            })}
        </div>
    );
}
