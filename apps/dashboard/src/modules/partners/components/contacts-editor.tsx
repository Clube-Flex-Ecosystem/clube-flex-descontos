import {
  get,
  useFieldArray,
  useFormContext,
  type FieldArrayPath,
} from 'react-hook-form';
import { Button } from '../../../shared/ui/button';
import { TableInput, TableSelect } from '../../../shared/ui/form-controls';
import { Icon } from '../../../shared/ui/icon';
import { fieldMessage } from '../../../shared/validation/server-errors';
import { emptyContact, type PartnerFormValues } from '../schemas/partner-form';

export type ContactsPath = Extract<
  FieldArrayPath<PartnerFormValues>,
  'contacts' | `units.${number}.contacts`
>;

/** Tabela editável de telefones e WhatsApp, do parceiro ou de uma unidade. */
export function ContactsEditor({
  path,
  title,
  rootError,
}: {
  path: ContactsPath;
  title: string;
  /** Mensagem de erro da coleção como um todo (ex.: nenhum contato informado). */
  rootError?: string | undefined;
}) {
  const {
    control,
    register,
    formState: { errors },
  } = useFormContext<PartnerFormValues>();
  const { fields, append, remove } = useFieldArray({ control, name: path });

  return (
    <div className="grid gap-2">
      <span className="t-label">{title}</span>
      {fields.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full min-w-120 border-collapse">
            <thead>
              <tr>
                <th
                  scope="col"
                  className="t-body-small w-36 pr-2 pb-1.5 text-left font-medium text-muted-foreground"
                >
                  Tipo
                </th>
                <th
                  scope="col"
                  className="t-body-small pr-2 pb-1.5 text-left font-medium text-muted-foreground"
                >
                  Número
                </th>
                <th
                  scope="col"
                  className="t-body-small pr-2 pb-1.5 text-left font-medium text-muted-foreground"
                >
                  Identificação (opcional)
                </th>
                <th scope="col" className="pb-1.5">
                  <span className="sr-only">Ações</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {fields.map((field, index) => {
                const valueError = fieldMessage(
                  get(errors, `${path}.${index}.value.message`) as
                    string | undefined,
                );
                const labelError = fieldMessage(
                  get(errors, `${path}.${index}.label.message`) as
                    string | undefined,
                );
                return (
                  <tr key={field.id} className="align-top">
                    <td className="border-t border-border py-1.5 pr-2">
                      <TableSelect
                        aria-label="Tipo de contato"
                        {...register(`${path}.${index}.type`)}
                      >
                        <option value="whatsapp">WhatsApp</option>
                        <option value="phone">Telefone</option>
                      </TableSelect>
                    </td>
                    <td className="border-t border-border py-1.5 pr-2">
                      <TableInput
                        aria-label="Número do contato"
                        className="tnum"
                        autoComplete="off"
                        inputMode="tel"
                        aria-invalid={valueError ? true : undefined}
                        {...register(`${path}.${index}.value`)}
                      />
                      {valueError ? (
                        <p className="t-caption mt-1 text-danger">
                          {valueError}
                        </p>
                      ) : null}
                    </td>
                    <td className="border-t border-border py-1.5 pr-2">
                      <TableInput
                        aria-label="Identificação do contato"
                        aria-invalid={labelError ? true : undefined}
                        {...register(`${path}.${index}.label`)}
                      />
                      {labelError ? (
                        <p className="t-caption mt-1 text-danger">
                          {labelError}
                        </p>
                      ) : null}
                    </td>
                    <td className="border-t border-border py-1.5 text-right">
                      <Button
                        variant="quiet"
                        compact
                        aria-label="Remover contato"
                        onClick={() => remove(index)}
                      >
                        <Icon name="x" />
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : null}
      {rootError ? <p className="t-caption text-danger">{rootError}</p> : null}
      <div>
        <Button compact onClick={() => append(emptyContact())}>
          <Icon name="plus" />
          Adicionar contato
        </Button>
      </div>
    </div>
  );
}
