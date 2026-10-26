import {
  ACCENT_PALETTE,
  ACTION_COLORS,
  PLAY_BUTTON_COLORS,
  SURFACE_PALETTE,
} from './theme.constants';
import { OnerpmPreset } from './theme-preset';
import { blend, contrastRatio } from './testing/contrast';

/** WCAG AA for body text. */
const AA = 4.5;

interface SchemeTokens {
  primary: Record<string, string>;
  surface: Record<string, string>;
  action: Record<string, string>;
  play: Record<string, string>;
}

const semantic = OnerpmPreset.semantic as {
  primary: Record<string, string>;
  colorScheme: { light: SchemeTokens; dark: SchemeTokens };
};

/** Resolves `{primary.700}` / `{surface.950}` / `#ffffff` to a hex color. */
function resolve(token: string): string {
  const reference = /^\{(primary|surface)\.(\d+)\}$/.exec(token);
  if (!reference) {
    return token;
  }
  const palette = reference[1] === 'primary' ? ACCENT_PALETTE : SURFACE_PALETTE;
  return palette[Number(reference[2]) as keyof typeof palette];
}

describe('OnerpmPreset', () => {
  it('uses the accent scale as the primary palette', () => {
    expect(semantic.primary).toEqual(ACCENT_PALETTE);
  });

  it.each(['light', 'dark'] as const)('uses the ink scale for the %s surfaces', (scheme) => {
    expect(semantic.colorScheme[scheme].surface).toEqual(SURFACE_PALETTE);
  });

  describe('play button colors (over a cover)', () => {
    it.each(['light', 'dark'] as const)('%s: come from PLAY_BUTTON_COLORS', (scheme) => {
      expect(semantic.colorScheme[scheme].play).toEqual(PLAY_BUTTON_COLORS);
    });

    it('the icon is readable on the button, also on hover (AA 4.5:1)', () => {
      const { color, background, hoverBackground } = PLAY_BUTTON_COLORS;

      expect(contrastRatio(color, background)).toBeGreaterThanOrEqual(AA);
      expect(contrastRatio(color, hoverBackground)).toBeGreaterThanOrEqual(AA);
    });
  });

  describe('action button colors', () => {
    it.each(['light', 'dark'] as const)('%s: come from ACTION_COLORS', (scheme) => {
      expect(semantic.colorScheme[scheme].action).toEqual(ACTION_COLORS[scheme]);
    });

    it.each(['light', 'dark'] as const)(
      '%s: the label is readable on the button, also on hover (AA 4.5:1)',
      (scheme) => {
        const { color, background, hoverBackground } = ACTION_COLORS[scheme];

        expect(contrastRatio(color, background)).toBeGreaterThanOrEqual(AA);
        expect(contrastRatio(color, hoverBackground)).toBeGreaterThanOrEqual(AA);
      },
    );

    it.each(['light', 'dark'] as const)(
      '%s: the Spotify mark stands out from the button (non-text AA 3:1)',
      (scheme) => {
        const { spotify, background } = ACTION_COLORS[scheme];

        expect(contrastRatio(spotify, background)).toBeGreaterThanOrEqual(3);
      },
    );

    it('the two schemes are opposites: black on light, white on dark', () => {
      expect(ACTION_COLORS.light.background).not.toBe(ACTION_COLORS.dark.background);
      expect(
        contrastRatio(ACTION_COLORS.light.background, ACTION_COLORS.dark.background),
      ).toBeGreaterThan(10);
    });
  });

  describe('accessibility (WCAG AA, 4.5:1)', () => {
    it('light: the button label (white) is readable on the primary color and on its hover/active states', () => {
      const { primary } = semantic.colorScheme.light;

      for (const state of ['color', 'hoverColor', 'activeColor']) {
        expect(
          contrastRatio(resolve(primary['contrastColor']), resolve(primary[state])),
          state,
        ).toBeGreaterThanOrEqual(AA);
      }
    });

    it('dark: the button label is readable on the primary color and on its hover/active states', () => {
      const { primary } = semantic.colorScheme.dark;

      for (const state of ['color', 'hoverColor', 'activeColor']) {
        expect(
          contrastRatio(resolve(primary['contrastColor']), resolve(primary[state])),
          state,
        ).toBeGreaterThanOrEqual(AA);
      }
    });

    it('light: the primary color works as text on the page and card backgrounds', () => {
      const primary = resolve(semantic.colorScheme.light.primary['color']);

      expect(contrastRatio(primary, SURFACE_PALETTE[0])).toBeGreaterThanOrEqual(AA);
      expect(contrastRatio(primary, SURFACE_PALETTE[50])).toBeGreaterThanOrEqual(AA);
    });

    it('dark: the primary color works as text on the page and card backgrounds', () => {
      const primary = resolve(semantic.colorScheme.dark.primary['color']);

      expect(contrastRatio(primary, SURFACE_PALETTE[950])).toBeGreaterThanOrEqual(AA);
      expect(contrastRatio(primary, SURFACE_PALETTE[900])).toBeGreaterThanOrEqual(AA);
    });

    it('light: muted text (surface 500) is readable on white and on the page background', () => {
      expect(contrastRatio(SURFACE_PALETTE[500], SURFACE_PALETTE[0])).toBeGreaterThanOrEqual(AA);
      expect(contrastRatio(SURFACE_PALETTE[500], SURFACE_PALETTE[50])).toBeGreaterThanOrEqual(AA);
    });

    it('dark: muted text (surface 400) is readable on the page and card backgrounds', () => {
      expect(contrastRatio(SURFACE_PALETTE[400], SURFACE_PALETTE[950])).toBeGreaterThanOrEqual(AA);
      expect(contrastRatio(SURFACE_PALETTE[400], SURFACE_PALETTE[900])).toBeGreaterThanOrEqual(AA);
    });
  });
});

describe('OnerpmPreset: Aura colors that failed the axe audit', () => {
  const primitive = OnerpmPreset.primitive as Record<string, Record<string, string>>;
  const components = OnerpmPreset.components as {
    message: {
      colorScheme: {
        light: Record<string, { color: string }>;
        dark: Record<string, { color: string }>;
      };
    };
    button: { colorScheme: { light: { outlined: { danger: { color: string } } } } };
  };
  /** `{red.700}` → the hex of Aura's red 700. */
  const primitiveHex = (token: string) => {
    const [, family, step] = /^\{(\w+)\.(\d+)\}$/.exec(token)!;
    return primitive[family][step];
  };

  it.each([
    ['error message', components.message.colorScheme.light['error'].color, 'red'],
    ['warning message', components.message.colorScheme.light['warn'].color, 'yellow'],
    ['success message', components.message.colorScheme.light['success'].color, 'green'],
    ['outlined danger button', components.button.colorScheme.light.outlined.danger.color, 'red'],
  ])('light %s text is readable on its pale background (and on white)', (_label, token, family) => {
    const text = primitiveHex(token);
    const paleBackground = primitive[family]['50'];

    expect(contrastRatio(text, paleBackground)).toBeGreaterThanOrEqual(AA);
    expect(contrastRatio(text, '#ffffff')).toBeGreaterThanOrEqual(AA);
  });

  it('dark error message text is readable on its red tint over the card (Aura default: 4.47:1)', () => {
    const text = primitiveHex(components.message.colorScheme.dark['error'].color);
    const tint = blend(primitive['red']['500'], SURFACE_PALETTE[900], 0.16);

    expect(contrastRatio(text, tint)).toBeGreaterThanOrEqual(AA);
    expect(contrastRatio(primitive['red']['500'], tint)).toBeLessThan(AA);
  });

  it("is darker than Aura's own defaults, which measured below 4.5:1", () => {
    expect(contrastRatio(primitive['red']['600'], primitive['red']['50'])).toBeLessThan(AA);
    expect(contrastRatio(primitive['yellow']['600'], primitive['yellow']['50'])).toBeLessThan(AA);
  });
});

describe('contrastRatio', () => {
  it('is 21 for black on white and 1 for identical colors', () => {
    expect(contrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 5);
    expect(contrastRatio('#336699', '#336699')).toBeCloseTo(1, 5);
  });

  it('does not depend on the argument order', () => {
    expect(contrastRatio('#ff7a38', '#0c0c11')).toBeCloseTo(
      contrastRatio('#0c0c11', '#ff7a38'),
      10,
    );
  });
});
