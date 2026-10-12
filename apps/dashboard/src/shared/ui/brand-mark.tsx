/**
 * Marca no espaço reservado tipográfico até a entrega do logo oficial (pendência
 * registrada em ui-foundations.md): `inverse` na moldura navy, `light` sobre fundo claro.
 * `compact` mostra apenas "+Flex", para a navegação recolhida.
 */
export function BrandMark({
  tone = 'light',
  compact = false,
}: {
  tone?: 'light' | 'inverse';
  compact?: boolean;
}) {
  const inverse = tone === 'inverse';
  return (
    <span
      className={`t-section font-bold whitespace-nowrap italic ${inverse ? 'text-sidebar-selected-foreground' : 'text-foreground'}`}
      role="img"
      aria-label="Clube Flex"
    >
      {compact ? null : 'Clube '}
      <span className={inverse ? 'text-signal-inverse' : 'text-primary'}>
        +Flex
      </span>
    </span>
  );
}
