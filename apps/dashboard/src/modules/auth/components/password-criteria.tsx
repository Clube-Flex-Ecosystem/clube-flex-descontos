import { PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH } from '@flex/contracts';
import { Icon } from '../../../shared/ui/icon';

/**
 * Critérios apresentados antes da submissão (interface do dashboard › Acesso sem
 * sessão): o critério verificável é marcado enquanto a pessoa digita; os demais são
 * orientações conferidas pela API.
 */
export function PasswordCriteria({ value }: { value: string }) {
    const size = [...value].length;
    const lengthOk = size >= PASSWORD_MIN_LENGTH && size <= PASSWORD_MAX_LENGTH;
    return (
        <div className="grid gap-1">
            <ul className="grid gap-1" aria-label="Critérios da senha">
                <li className="t-body-small flex items-start gap-2">
                    <Icon
                        name="check"
                        className={`mt-px ${lengthOk ? 'text-success' : 'text-placeholder'}`}
                    />
                    <span className={lengthOk ? '' : 'muted'}>
                        De {PASSWORD_MIN_LENGTH} a {PASSWORD_MAX_LENGTH}{' '}
                        caracteres
                        <span className="sr-only">
                            {lengthOk ? ': atendido' : ': pendente'}
                        </span>
                    </span>
                </li>
            </ul>
            <p className="t-caption muted font-normal">
                Frases longas funcionam bem; espaços e acentos são permitidos.
                Senhas comuns ou previsíveis são recusadas.
            </p>
        </div>
    );
}
