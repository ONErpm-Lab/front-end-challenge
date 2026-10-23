import { InvalidIsrcError, Isrc } from './isrc.value-object';

describe('Isrc (Value Object)', () => {
  it('normaliza caixa, hífens e espaços para a forma canônica', () => {
    expect(Isrc.create(' br-1sp-12-00071 ').value).toBe('BR1SP1200071');
  });

  it('expõe as partes do código e a forma de leitura', () => {
    const isrc = Isrc.create('NO1R42509310');

    expect([isrc.country, isrc.registrant, isrc.year, isrc.designation]).toEqual([
      'NO',
      '1R4',
      '25',
      '09310',
    ]);
    expect(isrc.format()).toBe('NO-1R4-25-09310');
    expect(String(isrc)).toBe('NO1R42509310');
  });

  it.each([
    ['', 'vazio'],
    ['BR1SP120007', 'curto'],
    ['BR1SP12000711', 'longo'],
    ['1R1SP1200071', 'país com dígito'],
    ['BR1SPAB00071', 'ano com letras'],
    ['BR1S_1200071', 'caractere inválido'],
  ])('rejeita "%s" (%s)', (raw) => {
    expect(() => Isrc.create(raw)).toThrow(InvalidIsrcError);
  });

  it('compara por valor, não por referência', () => {
    expect(Isrc.create('BR1SP1200071').equals(Isrc.create('br-1sp-12-00071'))).toBe(true);
    expect(Isrc.create('BR1SP1200071').equals(Isrc.create('BR1SP1200070'))).toBe(false);
  });

  it('é imutável', () => {
    const isrc = Isrc.create('BR1SP1200071');

    expect(Object.isFrozen(isrc)).toBe(true);
  });
});
