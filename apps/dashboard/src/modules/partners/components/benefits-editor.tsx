import { get, useFormContext, useWatch } from 'react-hook-form';
import type { Plan } from '@flex/contracts';
import { Badge } from '../../../shared/ui/badge';
import { InputField, TableInput } from '../../../shared/ui/form-controls';
import { fieldMessage } from '../../../shared/validation/server-errors';
import type { PartnerFormValues } from '../schemas/partner-form';

/**
 * Cupom geral e uma condição por plano. O cupom do plano prevalece sobre o geral e a
 * ausência de condição impede que o parceiro seja listado para o plano.
 */
export function BenefitsEditor({ plans }: { plans: readonly Plan[] }) {
    const {
        control,
        register,
        setFocus,
        formState: { errors },
    } = useFormContext<PartnerFormValues>();
    const benefits = useWatch({ control, name: 'benefits' });
    const planById = new Map(plans.map((plan) => [plan.id, plan]));
    const message = (path: string) =>
        fieldMessage(get(errors, `${path}.message`) as string | undefined);
    const rootError = message('benefits.root');

    return (
        <div className="grid gap-4">
            <InputField
                label="Cupom geral"
                placeholder="Ex.: FLEX10"
                optional
                mono
                frameClassName="max-w-80"
                hint="Aplicável a todos os planos que não tenham um cupom próprio."
                error={message('generalCoupon')}
                {...register('generalCoupon')}
            />
            {benefits.length === 0 ? (
                <p className="t-body-small muted">
                    Nenhum plano ativo cadastrado. Cadastre planos para definir
                    os benefícios.
                </p>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full min-w-120 border-collapse">
                        <thead>
                            <tr>
                                <th
                                    scope="col"
                                    className="t-body-small pr-2 pb-1.5 text-left font-medium text-muted-foreground"
                                >
                                    Plano
                                </th>
                                <th
                                    scope="col"
                                    className="t-body-small w-28 pr-2 pb-1.5 text-left font-medium text-muted-foreground"
                                >
                                    Desconto (até %)
                                </th>
                                <th
                                    scope="col"
                                    className="t-body-small pr-2 pb-1.5 text-left font-medium text-muted-foreground"
                                >
                                    Cupom do plano (opcional)
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {benefits.map((benefit, index) => {
                                const plan = planById.get(benefit.planId);
                                const name = plan?.name ?? 'Plano';
                                const percentageError = message(
                                    `benefits.${index}.discountPercentage`,
                                );
                                const couponError = message(
                                    `benefits.${index}.coupon`,
                                );
                                const enabled = register(
                                    `benefits.${index}.enabled`,
                                );
                                return (
                                    <tr
                                        key={benefit.planId}
                                        className="align-top"
                                    >
                                        <td className="border-t border-border py-2 pr-2">
                                            {/* Habilitar fica junto ao nome; o foco segue para o percentual. */}
                                            <label className="inline-flex cursor-pointer items-center gap-2">
                                                <input
                                                    type="checkbox"
                                                    className="size-4 flex-none accent-selected"
                                                    aria-label={`Oferecer benefício no plano ${name}`}
                                                    {...enabled}
                                                    onChange={(event) => {
                                                        void enabled.onChange(
                                                            event,
                                                        );
                                                        if (
                                                            event.target.checked
                                                        )
                                                            requestAnimationFrame(
                                                                () =>
                                                                    setFocus(
                                                                        `benefits.${index}.discountPercentage`,
                                                                    ),
                                                            );
                                                    }}
                                                />
                                                <strong className="t-body font-semibold">
                                                    {name}
                                                </strong>
                                            </label>
                                            {plan?.status === 'inactive' ? (
                                                <span className="ml-2">
                                                    <Badge dot>
                                                        Plano inativo
                                                    </Badge>
                                                </span>
                                            ) : null}
                                        </td>
                                        <td className="border-t border-border py-1.5 pr-2">
                                            <TableInput
                                                aria-label={`Desconto no plano ${name}, em %`}
                                                type="number"
                                                min={1}
                                                max={100}
                                                step={1}
                                                inputMode="numeric"
                                                placeholder="%"
                                                className="tnum"
                                                readOnly={!benefit.enabled}
                                                aria-invalid={
                                                    percentageError
                                                        ? true
                                                        : undefined
                                                }
                                                {...register(
                                                    `benefits.${index}.discountPercentage`,
                                                )}
                                            />
                                            {percentageError ? (
                                                <p className="t-caption mt-1 text-danger">
                                                    {percentageError}
                                                </p>
                                            ) : null}
                                        </td>
                                        <td className="border-t border-border py-1.5 pr-2">
                                            <TableInput
                                                aria-label={`Cupom do plano ${name}`}
                                                placeholder="Usa o cupom geral"
                                                className="font-mono"
                                                readOnly={!benefit.enabled}
                                                aria-invalid={
                                                    couponError
                                                        ? true
                                                        : undefined
                                                }
                                                {...register(
                                                    `benefits.${index}.coupon`,
                                                )}
                                            />
                                            {couponError ? (
                                                <p className="t-caption mt-1 text-danger">
                                                    {couponError}
                                                </p>
                                            ) : null}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
            {rootError ? (
                <p className="t-caption text-danger">{rootError}</p>
            ) : null}
        </div>
    );
}
