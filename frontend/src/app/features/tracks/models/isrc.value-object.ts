/** Formato ISRC (ISO 3901): país (2) + registrante (3) + ano (2) + designação (5). */
const ISRC_PATTERN = /^([A-Z]{2})([A-Z0-9]{3})(\d{2})(\d{5})$/;

export class InvalidIsrcError extends Error {
  constructor(readonly input: string) {
    super(`ISRC inválido: "${input}"`);
    this.name = 'InvalidIsrcError';
  }
}

/**
 * Value Object do código de gravação. Imutável e sempre válido: só nasce por `create()`,
 * que normaliza (caixa, hífens, espaços) e rejeita formatos inválidos.
 */
export class Isrc {
  private constructor(
    /** Forma canônica, sem hífens: `BR1SP1200071`. */
    readonly value: string,
  ) {
    Object.freeze(this);
  }

  static create(raw: string): Isrc {
    const normalized = raw.replace(/[\s-]/g, '').toUpperCase();
    if (!ISRC_PATTERN.test(normalized)) throw new InvalidIsrcError(raw);
    return new Isrc(normalized);
  }

  /** Código ISO 3166-1 do país de registro (ex.: `BR`). */
  get country(): string {
    return this.value.slice(0, 2);
  }

  /** Código do registrante (gravadora ou produtor). */
  get registrant(): string {
    return this.value.slice(2, 5);
  }

  /** Ano de referência, com dois dígitos (ex.: `12`). */
  get year(): string {
    return this.value.slice(5, 7);
  }

  /** Número de designação da gravação. */
  get designation(): string {
    return this.value.slice(7);
  }

  /** Forma de leitura recomendada pelo manual ISRC: `BR-1SP-12-00071`. */
  format(): string {
    return `${this.country}-${this.registrant}-${this.year}-${this.designation}`;
  }

  equals(other: Isrc): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}
