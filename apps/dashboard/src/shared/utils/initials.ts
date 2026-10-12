/** Iniciais (até duas) de um nome, para marcas e avatares. */
export function initialsOf(name: string): string {
    return name
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((word) => word[0])
        .join('')
        .toUpperCase();
}

/** Iniciais de uma entidade (parceiro, plano), ignorando conectivos curtos. */
export function entityInitialsOf(name: string): string {
    return name
        .split(/\s+/)
        .filter((word) => word.length > 2 || /^\p{Lu}/u.test(word))
        .slice(0, 2)
        .map((word) => word[0])
        .join('')
        .toUpperCase();
}
