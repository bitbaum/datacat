/**
 * Branding is the white-label seam: DataCat ships as TalentFlow, HealthIntake,
 * LegalIntake and others, and every one of those identities is produced by
 * merging a preset or a set of NEXT_PUBLIC_BRAND_* env vars over the defaults.
 *
 * Nothing executed this file before. The repo's `test` script was
 * `npx playwright test` — an e2e suite that needs browsers and a running
 * server, so it can only ever run in an environment expensive enough that it
 * rarely does. There was no hermetic unit gate at all.
 *
 * The bug these tests exist for is in the merge, not in any single value:
 * a present-but-EMPTY env var used to win over a good default, because the
 * filter only rejected `undefined`. `NEXT_PUBLIC_BRAND_NAME=` is an ordinary
 * line to find in a .env, and it silently blanked the product name.
 */
import { afterEach, describe, expect, it } from 'vitest'
import { defaultBranding, getBrandingConfig, type BrandingConfig } from './branding'
import { brandingPresets } from './branding-presets'

const BRAND_VARS = [
  'NEXT_PUBLIC_BRAND_NAME',
  'NEXT_PUBLIC_BRAND_SHORT_NAME',
  'NEXT_PUBLIC_BRAND_DESCRIPTION',
  'NEXT_PUBLIC_BRAND_LOGO',
  'NEXT_PUBLIC_BRAND_FAVICON',
  'NEXT_PUBLIC_BRAND_PRIMARY_COLOR',
  'NEXT_PUBLIC_BRAND_SECONDARY_COLOR',
  'NEXT_PUBLIC_BRAND_ACCENT_COLOR',
  'NEXT_PUBLIC_BRAND_THEME',
  'NEXT_PUBLIC_BRAND_USE_CASE',
  'NEXT_PUBLIC_BRAND_DOMAIN',
] as const

afterEach(() => {
  for (const key of BRAND_VARS) delete process.env[key]
})

describe('defaultBranding', () => {
  it('fills every field, so an un-branded deploy is still coherent', () => {
    // The default is what ships when no env var is set — a blank field here
    // reaches production as an empty <title> or a broken logo src.
    for (const [key, value] of Object.entries(defaultBranding)) {
      expect(String(value).trim(), `defaultBranding.${key} is empty`).not.toBe('')
    }
  })

  it('declares a theme the type actually allows', () => {
    expect(['light', 'dark', 'auto']).toContain(defaultBranding.theme)
  })
})

describe('getBrandingConfig', () => {
  it('returns the defaults when nothing is set', () => {
    expect(getBrandingConfig()).toEqual(defaultBranding)
  })

  it('lets a real env value override the default', () => {
    process.env.NEXT_PUBLIC_BRAND_NAME = 'HealthIntake Pro'
    expect(getBrandingConfig().name).toBe('HealthIntake Pro')
  })

  it('ignores a present-but-empty env var instead of blanking the default', () => {
    // The regression this suite was written for. `FOO=` in a .env produces
    // '' rather than undefined; the old filter only rejected undefined, so the
    // empty string won and the product lost its name.
    process.env.NEXT_PUBLIC_BRAND_NAME = ''
    expect(getBrandingConfig().name).toBe(defaultBranding.name)
  })

  it('ignores a whitespace-only env var', () => {
    process.env.NEXT_PUBLIC_BRAND_DOMAIN = '   '
    expect(getBrandingConfig().domain).toBe(defaultBranding.domain)
  })

  it('leaves untouched fields at their defaults when one var is set', () => {
    process.env.NEXT_PUBLIC_BRAND_NAME = 'LegalIntake Suite'
    const config = getBrandingConfig()
    expect(config.name).toBe('LegalIntake Suite')
    expect(config.logo).toBe(defaultBranding.logo)
    expect(config.primaryColor).toBe(defaultBranding.primaryColor)
  })

  it('never returns a field the defaults do not declare', () => {
    process.env.NEXT_PUBLIC_BRAND_NAME = 'TalentFlow HR'
    expect(Object.keys(getBrandingConfig()).sort()).toEqual(Object.keys(defaultBranding).sort())
  })
})

describe('brandingPresets', () => {
  const presetNames = Object.keys(brandingPresets)

  it('ships at least one preset', () => {
    expect(presetNames.length).toBeGreaterThan(0)
  })

  it.each(presetNames)('preset "%s" only sets keys BrandingConfig declares', (name) => {
    // The expensive drift in a config layer is a key that looks applied and
    // is not: a preset writing `primary_color` next to a config reading
    // `primaryColor` renders the default and reports success.
    const allowed = new Set(Object.keys(defaultBranding))
    const unknown = Object.keys(brandingPresets[name]).filter((k) => !allowed.has(k))
    expect(unknown, `preset "${name}" sets key(s) nothing reads`).toEqual([])
  })

  it.each(presetNames)('preset "%s" sets no empty values', (name) => {
    for (const [key, value] of Object.entries(brandingPresets[name])) {
      expect(String(value).trim(), `${name}.${key} is empty`).not.toBe('')
    }
  })

  it.each(presetNames)('preset "%s" uses valid hex colours', (name) => {
    const preset = brandingPresets[name] as Partial<BrandingConfig>
    for (const key of ['primaryColor', 'secondaryColor', 'accentColor'] as const) {
      const value = preset[key]
      if (value === undefined) continue
      expect(value, `${name}.${key} is not a hex colour`).toMatch(/^#[0-9A-Fa-f]{6}$/)
    }
  })

  it.each(presetNames)('preset "%s" produces a complete config when merged', (name) => {
    // A preset is only ever applied on top of the defaults, so the merged
    // result — not the preset alone — is what has to be whole.
    const merged = { ...defaultBranding, ...brandingPresets[name] }
    for (const [key, value] of Object.entries(merged)) {
      expect(String(value).trim(), `${name} merged: ${key} is empty`).not.toBe('')
    }
    expect(['light', 'dark', 'auto']).toContain(merged.theme)
  })
})
