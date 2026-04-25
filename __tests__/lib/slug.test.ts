import { describe, it, expect } from 'vitest'
import { generateSlug } from '@/lib/slug'

describe('generateSlug', () => {
  it('converts a name with diacritics to a slug', () => {
    expect(generateSlug('Luis Riofrío')).toBe('luis-riofrio')
  })

  it('removes common diacritics (á é í ó ú ñ ü)', () => {
    expect(generateSlug('Ángela Muñóz')).toBe('angela-munoz')
    expect(generateSlug('José Ünder')).toBe('jose-under')
  })

  it('converts uppercase to lowercase', () => {
    expect(generateSlug('JUAN PABLO')).toBe('juan-pablo')
  })

  it('replaces spaces with hyphens', () => {
    expect(generateSlug('hello world')).toBe('hello-world')
  })

  it('collapses multiple spaces into one hyphen', () => {
    expect(generateSlug('hello   world')).toBe('hello-world')
  })

  it('collapses multiple hyphens into one', () => {
    expect(generateSlug('hello--world')).toBe('hello-world')
  })

  it('trims leading and trailing spaces', () => {
    expect(generateSlug('  hello  ')).toBe('hello')
  })

  it('removes special characters (@, #, !, ?)', () => {
    expect(generateSlug('hello@world!')).toBe('helloworld')
  })

  it('preserves numbers', () => {
    expect(generateSlug('trader 2024')).toBe('trader-2024')
  })

  it('handles already slug-like input', () => {
    expect(generateSlug('already-slug')).toBe('already-slug')
  })

  it('returns empty string for empty input', () => {
    expect(generateSlug('')).toBe('')
  })

  it('handles single word with diacritics', () => {
    expect(generateSlug('Córdoba')).toBe('cordoba')
  })

  it('does not insert hyphens where none existed', () => {
    expect(generateSlug('abc')).toBe('abc')
  })
})
