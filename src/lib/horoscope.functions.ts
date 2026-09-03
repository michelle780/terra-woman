import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const ZODIAC_SIGNS = [
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

const signSchema = z.object({ sign: z.enum(ZODIAC_SIGNS) });

function todayKeyUTC(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Returns today's horoscope for a sign, generating and caching it on first
 * request of the day (one shared horoscope per sign per day).
 */
export const getDailyHoroscope = createServerFn({ method: "GET" })
  .inputValidator((data) => signSchema.parse(data))
  .middleware([requireSupabaseAuth])
  .handler(async ({ data, context }) => {
    const today = todayKeyUTC();

    const { data: existing } = await context.supabase
      .from("horoscopes")
      .select("text")
      .eq("sign", data.sign)
      .eq("horoscope_date", today)
      .maybeSingle();
    if (existing?.text) return { text: existing.text as string, date: today };

    const apiKey = process.env["LOVABLE_API_KEY"]!;
    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: [
          {
            role: "system",
            content:
              "You write short daily horoscopes for a personal wellness app. Warm, grounded, non-deterministic tone — suggest tendencies and gentle prompts, never predictions of harm, never medical advice. 3-4 sentences, plain text, no lists, no emoji, no headers.",
          },
          {
            role: "user",
            content: `Write today's horoscope for ${data.sign} for ${today}. Focus on energy, rest, and self-care.`,
          },
        ],
        max_tokens: 200,
      }),
    });
    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Horoscope generation failed (${res.status}): ${body.slice(0, 200)}`);
    }
    const json = await res.json();
    const text = (json.choices?.[0]?.message?.content ?? "").trim();
    if (!text) throw new Error("Horoscope generation returned empty text");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("horoscopes")
      .upsert(
        { sign: data.sign, horoscope_date: today, text },
        { onConflict: "sign,horoscope_date" },
      );
    if (error) throw error;

    return { text, date: today };
  });
