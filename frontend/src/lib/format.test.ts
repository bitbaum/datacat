import { describe, expect, it } from 'vitest';
import { formatDuration, formatFileSize } from './format';

describe('formatFileSize', () => {
  it('uses the unit the value fits in, one decimal (two for GB)', () => {
    expect(formatFileSize(0)).toBe('0 B');
    expect(formatFileSize(1023)).toBe('1023 B');
    expect(formatFileSize(1024)).toBe('1.0 KB');
    expect(formatFileSize(1536)).toBe('1.5 KB');
    expect(formatFileSize(1024 * 1024)).toBe('1.0 MB');
    expect(formatFileSize(20 * 1024 * 1024)).toBe('20.0 MB');
    expect(formatFileSize(1024 * 1024 * 1024)).toBe('1.00 GB');
    expect(formatFileSize(1.5 * 1024 * 1024 * 1024)).toBe('1.50 GB');
  });
});

describe('formatDuration', () => {
  it('drops the hour when there is none and zero-pads the rest', () => {
    expect(formatDuration(0)).toBe('0:00');
    expect(formatDuration(65)).toBe('1:05');
    expect(formatDuration(599.9)).toBe('9:59');
    expect(formatDuration(3600)).toBe('1:00:00');
    expect(formatDuration(3661)).toBe('1:01:01');
  });
});
