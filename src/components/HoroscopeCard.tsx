import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Sparkles } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { getDailyHoroscope, ZODIAC_SIGNS } from "@/lib/horoscope.functions";
import {
  birthLocalToUtcIso,
  birthUtcIsoToLocal,
  natalPlacements,
  placements,
  SIGN_GLYPHS,
  sunSignForBirth,
  type ZodiacSign,
} from "@/lib/astro";

const FALLBACK_ZONES = [
  "America/Los_Angeles",
  "America/Denver",
  "America/Chicago",
  "America/New_York",
  "America/Anchorage",
  "Pacific/Honolulu",
  "Europe/London",
  "Europe/Paris",
  "Europe/Berlin",
  "Asia/Dubai",
  "Asia/Kolkata",
  "Asia/Tokyo",
  "Australia/Sydney",
  "Pacific/Auckland",
];

const TIMEZONES: string[] =
  typeof Intl.supportedValuesOf === "function"
    ? Intl.supportedValuesOf("timeZone")
    : FALLBACK_ZONES;

const LOCAL_TZ = Intl.DateTimeFormat().resolvedOptions().timeZone || "America/Los_Angeles";

function tzLabel(tz: string): string {
  return tz.replace(/_/g, " ").replace("/", " — ");
}

export function HoroscopeCard() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const fetchHoroscope = useServerFn(getDailyHoroscope);
  const [editing, setEditing] = useState(false);
  const [draftDate, setDraftDate] = useState("");
  const [draftTime, setDraftTime] = useState("");
  const [draftTz, setDraftTz] = useState(LOCAL_TZ);

  const profileQ = useQuery({
    queryKey: ["profile", user!.id, "birth"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("zodiac_sign, birth_date, birth_time")
        .eq("id", user!.id)
        .single();
      if (error) throw error;
      return data as {
        zodiac_sign: string | null;
        birth_date: string | null;
        birth_time: string | null;
      };
    },
  });

  const birthDate = profileQ.data?.birth_date ?? null;
  const birthTime = profileQ.data?.birth_time ?? null;
  const sign: ZodiacSign | null = birthDate
    ? sunSignForBirth(birthDate, birthTime)
    : ((profileQ.data?.zodiac_sign as ZodiacSign) ?? null);

  const saveBirth = useMutation({
    mutationFn: async ({ date, time, tz }: { date: string; time: string; tz: string }) => {
      const storedTime = time ? birthLocalToUtcIso(date, time, tz) : null;
      const computed = sunSignForBirth(date, storedTime);
      const { error } = await supabase
        .from("profiles")
        .update({
          birth_date: date,
          birth_time: storedTime,
          zodiac_sign: computed,
        })
        .eq("id", user!.id);
      if (error) throw error;
      return computed;
    },
    onSuccess: (computed) => {
      qc.invalidateQueries({ queryKey: ["profile", user!.id] });
      qc.invalidateQueries({ queryKey: ["profile", user!.id, "birth"] });
      qc.invalidateQueries({ queryKey: ["horoscope"] });
      setEditing(false);
      toast.success(`Birth chart saved — ${computed} sun`);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const horoscopeQ = useQuery({
    queryKey: ["horoscope", sign],
    queryFn: () => fetchHoroscope({ data: { sign: sign as (typeof ZODIAC_SIGNS)[number] } }),
    enabled: !!sign && !editing,
    staleTime: 60 * 60 * 1000,
  });

  const showForm = editing || (profileQ.isSuccess && !birthDate);
  const natal = birthDate ? natalPlacements(birthDate, birthTime) : [];
  const today = placements();

  return (
    <section className="rise rounded-[24px] bg-paper p-5 ring-1 ring-line">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="eyebrow">Astrology</p>
          <h2 className="mt-0.5 flex items-center gap-1.5 text-xl">
            <Sparkles className="size-4 text-amber" aria-hidden />
            {sign && !showForm ? `${SIGN_GLYPHS[sign]} ${sign} today` : "Your birth chart"}
          </h2>
        </div>
        {birthDate && !showForm && (
          <button
            onClick={() => {
              const local =
                birthTime && birthTime.includes("T")
                  ? birthUtcIsoToLocal(birthTime, LOCAL_TZ)
                  : null;
              setDraftDate(local?.date ?? birthDate);
              setDraftTime(local?.time ?? (birthTime && !birthTime.includes("T") ? birthTime : ""));
              setDraftTz(LOCAL_TZ);
              setEditing(true);
            }}
            className="text-xs font-semibold text-muted-foreground underline"
          >
            Edit birth details
          </button>
        )}
      </div>

      {showForm ? (
        <form
          className="mt-4 grid gap-3 sm:grid-cols-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (!draftDate) return;
            saveBirth.mutate({ date: draftDate, time: draftTime, tz: draftTz });
          }}
        >
          <p className="text-sm text-muted-foreground sm:col-span-2">
            Enter your birth date and we'll calculate your real sun sign and planetary placements
            from the ephemeris. Birth time is optional — it sharpens the moon placement. Enter it in
            your local time and pick your timezone; we handle the conversion.
          </p>
          <label className="grid gap-1 text-xs font-semibold">
            Birth date
            <input
              type="date"
              required
              value={draftDate}
              onChange={(e) => setDraftDate(e.target.value)}
              className="rounded-2xl bg-background px-3 py-2 text-sm font-normal ring-1 ring-line"
            />
          </label>
          <label className="grid gap-1 text-xs font-semibold">
            Birth time (optional, your local time)
            <input
              type="time"
              value={draftTime}
              onChange={(e) => setDraftTime(e.target.value)}
              className="rounded-2xl bg-background px-3 py-2 text-sm font-normal ring-1 ring-line"
            />
          </label>
          <label className="grid gap-1 text-xs font-semibold sm:col-span-2">
            Timezone
            <select
              value={draftTz}
              onChange={(e) => setDraftTz(e.target.value)}
              className="rounded-2xl bg-background px-3 py-2 text-sm font-normal ring-1 ring-line"
            >
              {(TIMEZONES.includes(draftTz) ? TIMEZONES : [draftTz, ...TIMEZONES]).map((tz) => (
                <option key={tz} value={tz}>
                  {tzLabel(tz)}
                </option>
              ))}
            </select>
          </label>
          <div className="flex gap-2 sm:col-span-2">
            <button
              type="submit"
              disabled={saveBirth.isPending || !draftDate}
              className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-60"
            >
              {saveBirth.isPending ? "Saving…" : "Save birth details"}
            </button>
            {birthDate && (
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="rounded-full px-4 py-2 text-sm font-semibold ring-1 ring-line"
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      ) : (
        <div className="mt-4 grid gap-4">
          {horoscopeQ.isPending ? (
            <p className="text-sm text-muted-foreground">Reading the sky…</p>
          ) : horoscopeQ.isError ? (
            <p className="text-sm text-muted-foreground">
              Couldn't load today's reading.{" "}
              <button onClick={() => horoscopeQ.refetch()} className="font-semibold underline">
                Try again
              </button>
            </p>
          ) : (
            <p className="rounded-2xl bg-background px-4 py-3 text-sm leading-relaxed text-pretty ring-1 ring-line">
              {horoscopeQ.data?.text}
            </p>
          )}

          {natal.length > 0 && (
            <div>
              <p className="eyebrow">Your natal placements</p>
              <ul className="mt-2 grid grid-cols-2 gap-1.5 text-xs sm:grid-cols-4">
                {natal.map((p) => (
                  <li
                    key={p.body}
                    className="rounded-xl bg-background px-2.5 py-2 ring-1 ring-line"
                  >
                    <span className="block font-semibold">{p.body}</span>
                    <span className="text-muted-foreground">
                      {SIGN_GLYPHS[p.sign]} {p.degree}° {p.sign}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div>
            <p className="eyebrow">Sky right now</p>
            <ul className="mt-2 flex flex-wrap gap-1.5 text-xs">
              {today.map((p) => (
                <li key={p.body} className="rounded-full bg-cream px-2.5 py-1 ring-1 ring-line">
                  {p.body} {SIGN_GLYPHS[p.sign]} {p.degree}°{p.retrograde ? " ℞" : ""}
                </li>
              ))}
            </ul>
          </div>

          <p className="text-[11px] text-muted-foreground">
            Positions are real geocentric ephemeris data. Interpretations are for reflection only —
            not medical or life advice.
          </p>
        </div>
      )}
    </section>
  );
}
