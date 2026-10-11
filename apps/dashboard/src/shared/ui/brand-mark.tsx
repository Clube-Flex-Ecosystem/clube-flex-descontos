/**
 * Marca no espaço reservado tipográfico até a entrega do logo oficial (pendência
 * registrada em ui-foundations.md): `inverse` na moldura navy, `light` sobre fundo claro.
 */
export function BrandMark({ tone = 'light' }: { tone?: 'light' | 'inverse' }) {
  const inverse = tone === 'inverse';
  return (
    <span
      className={`t-section font-bold whitespace-nowrap italic ${inverse ? 'text-sidebar-selected-foreground' : 'text-foreground'}`}
      role="img"
      aria-label="Clube Flex"
    >
      Clube{' '}
      <span className={inverse ? 'text-signal-inverse' : 'text-primary'}>
        +Flex
      </span>
    </span>
  );
}
