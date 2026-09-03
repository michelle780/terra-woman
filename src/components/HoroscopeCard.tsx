import { useMutation, useQuery, useQueryClient, useServerFn } from "@tanstack/react-query";
import { Sparkles } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { getDailyHoroscope, ZODIAC_SIGNS } from "@/lib/horoscope.functions";

const SIGN_GLYPHS: Record<(typeof ZODIAC_SIGNS)[number], string> = {
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

export function HoroscopeCard() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const fetchHoroscope = useServerFn(getDailyHoroscope);
  const [picking, setPicking] = useState(false);

  const profileQ = useQuery({
    queryKey: ["profile", user!.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("zodiac_sign")
        .eq("id", user!.id)
        .single();
      if (error) throw error;
      return data;
    },
  });

  const sign = profileQ.data?.zodiac_sign as (typeof ZODIAC_SIGNS)[number] | null | undefined;

  const saveSign = useMutation({
    mutationFn: async (newSign: string) => {
      const { error } = await supabase
        .from("profiles")
        .update({ zodiac_sign: newSign })
        .eq("id", user!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["profile", user!.id] });
      qc.invalidateQueries({ queryKey: ["horoscope"] });
      setPicking(false);
      toast.success("Sign saved");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const horoscopeQ = useQuery({
    queryKey: ["horoscope", sign],
    queryFn: () => fetchHoroscope({ data: { sign: sign! } }),
    enabled: !!sign && !picking,
    staleTime: 60 * 60 * 1000,
  });

  const showPicker = picking || (profileQ.isSuccess && !sign);

  return (
    <section className="rise rounded-[24px] bg-paper p-5 ring-1 ring-line">
      <div className="flex items-center justify-between">
        <div>
          <p className="eyebrow">Astrology</p>
          <h2 className="mt-0.5 flex items-center gap-1.5 text-xl">
            <Sparkles className="size-4 text-amber" aria-hidden />
            {sign && !picking ? `${SIGN_GLYPHS[sign]} ${sign} today` : "Your daily horoscope"}
          </h2>
        </div>
        {sign && !picking && (
          <button
            onClick={() => setPicking(true)}
            className="text-xs font-semibold text-muted-foreground underline"
          >
            Change sign
          </button>
        )}
      </div>

      {showPicker ? (
        <div className="mt-4">
          <p className="text-sm text-muted-foreground">
            Pick your sign and we'll write a short horoscope for you each day.
          </p>
          <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4">
            {ZODIAC_SIGNS.map((s) => (
              <button
                key={s}
                onClick={() => saveSign.mutate(s)}
                disabled={saveSign.isPending}
                className={`rounded-2xl px-2 py-2.5 text-center text-xs font-bold ring-1 transition-colors disabled:opacity-60 ${
                  s === sign
                    ? "bg-amber/25 ring-amber/40"
                    : "bg-background ring-line hover:bg-cream"
                }`}
              >
                <span className="block text-lg leading-none">{SIGN_GLYPHS[s]}</span>
                <span className="mt-1 block">{s}</span>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="mt-4">
          {horoscopeQ.isPending ? (
            <p className="text-sm text-muted-foreground">Reading the stars…</p>
          ) : horoscopeQ.isError ? (
            <p className="text-sm text-muted-foreground">
              Couldn't load today's horoscope.{" "}
              <button
                onClick={() => horoscopeQ.refetch()}
                className="font-semibold underline"
              >
                Try again
              </button>
            </p>
          ) : (
            <p className="rounded-2xl bg-background px-4 py-3 text-sm leading-relaxed text-pretty ring-1 ring-line">
              {horoscopeQ.data?.text}
            </p>
          )}
          <p className="mt-2 text-[11px] text-muted-foreground">
            For fun and reflection only — not medical or life advice.
          </p>
        </div>
      )}
    </section>
  );
}
