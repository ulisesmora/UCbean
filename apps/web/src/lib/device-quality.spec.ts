import { describe, expect, it } from 'vitest';
import { qualityFrom, type QualitySignals } from './device-quality';

const desktop: QualitySignals = {
  reducedMotion: false,
  saveData: false,
  slowNetwork: false,
  deviceMemory: 16,
  cores: 12,
  coarsePointer: false,
  webgl: true,
};

describe('qualityFrom', () => {
  it('gives a desktop the full scene', () => {
    expect(qualityFrom(desktop)).toBe('high');
  });

  it('treats a touch screen as an ordinary phone', () => {
    expect(qualityFrom({ ...desktop, coarsePointer: true })).toBe('mid');
  });

  it('reads an iPhone, which reports no memory, as mid rather than low', () => {
    expect(
      qualityFrom({ ...desktop, coarsePointer: true, deviceMemory: undefined, cores: 6 }),
    ).toBe('mid');
  });

  it('drops weak devices to a still photo', () => {
    expect(qualityFrom({ ...desktop, coarsePointer: true, deviceMemory: 2 })).toBe('low');
    expect(qualityFrom({ ...desktop, cores: 2 })).toBe('low');
  });

  it('respects reduced motion, data saving and a slow network', () => {
    expect(qualityFrom({ ...desktop, reducedMotion: true })).toBe('low');
    expect(qualityFrom({ ...desktop, saveData: true })).toBe('low');
    expect(qualityFrom({ ...desktop, slowNetwork: true })).toBe('low');
  });

  it('never tries 3D without WebGL', () => {
    expect(qualityFrom({ ...desktop, webgl: false })).toBe('low');
  });
});
