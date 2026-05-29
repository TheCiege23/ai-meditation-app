const ZODIAC_RANGES = [
  { sign: "Capricorn", start: [12, 22], end: [1, 19] },
  { sign: "Aquarius", start: [1, 20], end: [2, 18] },
  { sign: "Pisces", start: [2, 19], end: [3, 20] },
  { sign: "Aries", start: [3, 21], end: [4, 19] },
  { sign: "Taurus", start: [4, 20], end: [5, 20] },
  { sign: "Gemini", start: [5, 21], end: [6, 20] },
  { sign: "Cancer", start: [6, 21], end: [7, 22] },
  { sign: "Leo", start: [7, 23], end: [8, 22] },
  { sign: "Virgo", start: [8, 23], end: [9, 22] },
  { sign: "Libra", start: [9, 23], end: [10, 22] },
  { sign: "Scorpio", start: [10, 23], end: [11, 21] },
  { sign: "Sagittarius", start: [11, 22], end: [12, 21] },
] as const;

function matchesRange(month: number, day: number, start: readonly [number, number], end: readonly [number, number]) {
  const value = month * 100 + day;
  const startValue = start[0] * 100 + start[1];
  const endValue = end[0] * 100 + end[1];

  if (startValue <= endValue) {
    return value >= startValue && value <= endValue;
  }

  return value >= startValue || value <= endValue;
}

export function getZodiacSign(input: Date | { month: number; day: number }) {
  const month = input instanceof Date ? input.getUTCMonth() + 1 : input.month;
  const day = input instanceof Date ? input.getUTCDate() : input.day;

  for (const range of ZODIAC_RANGES) {
    if (matchesRange(month, day, range.start, range.end)) {
      return range.sign;
    }
  }

  return "Capricorn";
}

export function isValidBirthdate(value: string) {
  const parsed = new Date(value);
  return !Number.isNaN(parsed.getTime());
}