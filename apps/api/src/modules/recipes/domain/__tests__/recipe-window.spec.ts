import { isRecipeLive } from '../recipe-window';

const now = new Date('2026-10-15T12:00:00Z');
const d = (iso: string) => new Date(iso);

describe('isRecipeLive', () => {
  it('sells a switched-on recipe with no dates', () => {
    expect(isRecipeLive({ isActive: true, activeFrom: null, activeTo: null }, now)).toBe(true);
  });

  it('never sells a switched-off recipe', () => {
    expect(isRecipeLive({ isActive: false, activeFrom: null, activeTo: null }, now)).toBe(false);
  });

  it('waits for the start date and stops after the end date', () => {
    expect(isRecipeLive({ isActive: true, activeFrom: d('2026-11-01'), activeTo: null }, now)).toBe(
      false,
    );
    expect(isRecipeLive({ isActive: true, activeFrom: null, activeTo: d('2026-10-01') }, now)).toBe(
      false,
    );
    expect(
      isRecipeLive({ isActive: true, activeFrom: d('2026-10-01'), activeTo: d('2026-10-31') }, now),
    ).toBe(true);
  });
});
