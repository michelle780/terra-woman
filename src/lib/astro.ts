import * as Astronomy from "astronomy-engine";

/**
 * Real ephemeris-backed astrology helpers (astronomy-engine).
 * Signs come from actual ecliptic longitudes, not date-range tables.
 */

export const ZODIAC = [
  "Aries",
  "Taurus",
  "Gemini",
  "Cancer",
  "Leo",
  "Virgo",
  "Libra",
  "Scorpio",
  "Sagittarius",
  "Capricorn",
  "Aquarius",
  "Pisces",
] as const;

export type ZodiacSign = (typeof ZODIAC)[number];

export const SIGN_GLYPHS: Record<ZodiacSign, string> = {
  Aries: "♈",
  Taurus: "♉",
  Gemini: "♊",
  Cancer: "♋",
  Leo: "♌",
  Virgo: "♍",
  Libra: "♎",
  Scorpio: "♏",
  Sagittarius: "♐",
  Capricorn: "♑",
  Aquarius: "♒",
  Pisces: "♓",
};

export function signFromLongitude(lon: number): ZodiacSign {
  const norm = ((lon % 360) + 360) % 360;
  return ZODIAC[Math.floor(norm / 30)] ?? "Aries";
}

export function degreeInSign(lon: number): number {
  const norm = ((lon % 360) + 360) % 360;
  return norm % 30;
}

function geoLongitude(body: Astronomy.Body, date: Date): number {
  if (body === Astronomy.Body.Moon) return Astronomy.EclipticGeoMoon(date).lon;
  const vec = Astronomy.GeoVector(body, date, true);
  return Astronomy.Ecliptic(vec).elon;
}

/** Parse a YYYY-MM-DD (plus optional HH:MM or full UTC ISO) as a UTC instant. */
export function toUtcDate(dateKey: string, time?: string | null): Date {
  if (time && time.includes("T")) {
    const iso = new Date(time);
    if (!Number.isNaN(iso.getTime())) return iso;
  }
  const t = time && /^\d{2}:\d{2}/.test(time) ? time.slice(0, 5) : "12:00";
  return new Date(`${dateKey}T${t}:00Z`);
}

/** Milliseconds the given IANA zone is ahead of UTC at the given instant. */
function tzOffsetMs(tz: string, utc: Date): number {
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  const p = Object.fromEntries(dtf.formatToParts(utc).map((x) => [x.type, x.value])) as Record<
    string,
    string
  >;
  const asUtc = Date.UTC(
    Number(p["year"]),
    Number(p["month"]) - 1,
    Number(p["day"]),
    Number(p["hour"]),
    Number(p["minute"]),
    Number(p["second"]),
  );
  return asUtc - utc.getTime();
}

/** Convert a local birth date + time in an IANA zone to a UTC ISO string. */
export function birthLocalToUtcIso(date: string, time: string, tz: string): string {
  const guess = new Date(`${date}T${time}:00Z`);
  let utc = new Date(guess.getTime() - tzOffsetMs(tz, guess));
  // Second pass catches DST boundaries.
  utc = new Date(guess.getTime() - tzOffsetMs(tz, utc));
  return utc.toISOString().slice(0, 16) + "Z";
}

/** Convert a stored UTC ISO back to local date/time parts in the given zone (for editing). */
export function birthUtcIsoToLocal(iso: string, tz: string): { date: string; time: string } {
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
  const p = Object.fromEntries(dtf.formatToParts(new Date(iso)).map((x) => [x.type, x.value]));
  return {
    date: `${p.year}-${p.month}-${p.day}`,
    time: `${p.hour}:${p.minute}`,
  };
}

/** True sun sign for a birth date, from the Sun's ecliptic longitude. */
export function sunSignForBirth(birthDate: string, birthTime?: string | null): ZodiacSign {
  return signFromLongitude(geoLongitude(Astronomy.Body.Sun, toUtcDate(birthDate, birthTime)));
}

export type Placement = { body: string; sign: ZodiacSign; degree: number; retrograde?: boolean };

const TRANSIT_BODIES: { name: string; body: Astronomy.Body }[] = [
  { name: "Sun", body: Astronomy.Body.Sun },
  { name: "Moon", body: Astronomy.Body.Moon },
  { name: "Mercury", body: Astronomy.Body.Mercury },
  { name: "Venus", body: Astronomy.Body.Venus },
  { name: "Mars", body: Astronomy.Body.Mars },
  { name: "Jupiter", body: Astronomy.Body.Jupiter },
  { name: "Saturn", body: Astronomy.Body.Saturn },
];

/** Real planetary placements for an instant (default: now). */
export function placements(date: Date = new Date()): Placement[] {
  return TRANSIT_BODIES.map(({ name, body }) => {
    const lon = geoLongitude(body, date);
    let retrograde: boolean | undefined;
    if (body !== Astronomy.Body.Sun && body !== Astronomy.Body.Moon) {
      const later = geoLongitude(body, new Date(date.getTime() + 86_400_000));
      let delta = later - lon;
      if (delta > 180) delta -= 360;
      if (delta < -180) delta += 360;
      retrograde = delta < 0;
    }
    return {
      body: name,
      sign: signFromLongitude(lon),
      degree: Math.round(degreeInSign(lon) * 10) / 10,
      ...(retrograde === undefined ? {} : { retrograde }),
    };
  });
}

/** Natal placements for a birth date (time optional; defaults to 12:00 UTC). */
export function natalPlacements(birthDate: string, birthTime?: string | null): Placement[] {
  return placements(toUtcDate(birthDate, birthTime));
}

export type MoonDetail = {
  name: string;
  icon: string;
  illumination: number;
  /** 0-360 sun-moon elongation */
  angle: number;
  sign: ZodiacSign;
  degree: number;
  age: number;
};

const PHASES: { name: string; icon: string }[] = [
  { name: "New Moon", icon: "🌑" },
  { name: "Waxing Crescent", icon: "🌒" },
  { name: "First Quarter", icon: "🌓" },
  { name: "Waxing Gibbous", icon: "🌔" },
  { name: "Full Moon", icon: "🌕" },
  { name: "Waning Gibbous", icon: "🌖" },
  { name: "Last Quarter", icon: "🌗" },
  { name: "Waning Crescent", icon: "🌘" },
];

/** Precise moon phase, illumination and zodiac position for an instant. */
export function moonDetail(date: Date = new Date()): MoonDetail {
  const angle = Astronomy.MoonPhase(date);
  const illum = Astronomy.Illumination(Astronomy.Body.Moon, date);
  const index = Math.round(angle / 45) % 8;
  const phase = PHASES[index] ?? PHASES[0]!;
  const lon = Astronomy.EclipticGeoMoon(date).lon;
  return {
    name: phase.name,
    icon: phase.icon,
    illumination: Math.round(illum.phase_fraction * 100),
    angle: Math.round(angle * 10) / 10,
    sign: signFromLongitude(lon),
    degree: Math.round(degreeInSign(lon) * 10) / 10,
    age: Math.round((angle / 360) * 29.530588 * 10) / 10,
  };
}

/** Exact next occurrence of a quarter phase (0 new, 90 first, 180 full, 270 last). */
export function nextPhase(targetAngle: 0 | 90 | 180 | 270, from: Date = new Date()): Date | null {
  const t = Astronomy.SearchMoonPhase(targetAngle, from, 40);
  return t ? t.date : null;
}
