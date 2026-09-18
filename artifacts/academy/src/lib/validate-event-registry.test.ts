import { describe, expect, it } from 'vitest';
import { validateWebEventRegistry } from '../../scripts/validate-event-registry';

const template = (title: string) => [{ title }];

describe('validateWebEventRegistry', () => {
  it('allows an intentionally unsupported category with a documented exception', () => {
    expect(() =>
      validateWebEventRegistry({
        eventTemplates: {
          academic: template('Academic event'),
          social: template('Social event'),
        },
        categoryMappings: { exam: 'academic' },
        exceptions: {
          social: 'The web build intentionally omits social events.',
        },
        generateEvent: () => ({ name: 'Academic event' }),
      }),
    ).not.toThrow();
  });

  it('rejects a blank exception reason with the category and compatibility path', () => {
    expect(() =>
      validateWebEventRegistry({
        eventTemplates: {
          mystery: template('Mystery event'),
        },
        categoryMappings: {},
        exceptions: { mystery: '   ' },
      }),
    ).toThrow(
      'Web Radiant AI compatibility path "artifacts/academy/src/lib/radiantAI.ts" has no mapping for shared "mystery" event category.',
    );
  });

  it('still requires a legacy mapping for every non-exempt shared category', () => {
    expect(() =>
      validateWebEventRegistry({
        eventTemplates: {
          academic: template('Academic event'),
          discovery: template('Discovery event'),
        },
        categoryMappings: { exam: 'academic' },
        exceptions: {},
        generateEvent: () => ({ name: 'Academic event' }),
      }),
    ).toThrow(
      'Web Radiant AI compatibility path "artifacts/academy/src/lib/radiantAI.ts" has no mapping for shared "discovery" event category.',
    );
  });
});