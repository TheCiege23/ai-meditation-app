import { NextResponse } from "next/server";

import type { AppLanguage } from "@/lib/types";

export const dynamic = "force-dynamic";

export const runtime = "nodejs";

type GenerateHeyGenBody = {
	script?: string;
	mood?: string;
	duration?: string;
	language?: AppLanguage;
	visual?: string;
};

function getSceneDirection(visual: string | undefined, language: AppLanguage) {
	const isSpanish = language === "es";

	switch (visual) {
		case "sunrise":
			return isSpanish
				? "Usa un fondo ChimAura estilo amanecer dorado con cielo melocotón, brillo cálido, niebla suave y luz muy tranquila."
				: "Use a ChimAura golden sunrise background with peach sky, warm glow, soft mist, and very calm light.";
		case "forest":
			return isSpanish
				? "Usa un fondo ChimAura de bosque sereno con verdes suaves, profundidad natural, niebla ligera y movimiento muy sutil."
				: "Use a ChimAura serene forest background with soft greens, natural depth, light mist, and very subtle motion.";
		case "night":
			return isSpanish
				? "Usa un fondo ChimAura nocturno con azul profundo, brillo lunar suave y una atmósfera de descanso."
				: "Use a ChimAura night background with deep blue tones, soft moon glow, and a restful atmosphere.";
		case "ocean-dusk":
			return isSpanish
				? "Usa un fondo ChimAura oceánico al anochecer con turquesa profundo, ondas suaves y resplandor tenue."
				: "Use a ChimAura ocean dusk background with deep teal tones, soft wave texture, and a gentle glow.";
		case "starfield":
			return isSpanish
				? "Usa un fondo ChimAura de campo estelar con índigo oscuro, estrellas suaves y brillo espiritual sutil."
				: "Use a ChimAura starfield background with dark indigo, soft stars, and a subtle spiritual glow.";
		default:
			return isSpanish
				? "Usa un fondo ChimAura de niebla suave con azul claro, cian, violeta muy tenue y resplandor calmante."
				: "Use a ChimAura soft mist background with light blue, cyan, very soft violet, and a calming glow.";
	}
}

function getBrandDirection(language: AppLanguage) {
	return language === "es"
		? "Mantén la identidad visual de ChimAura: premium, minimalista, calmante, espiritual sin ser religiosa, sin avatar humano visible, sin estilo corporativo."
		: "Keep the ChimAura visual identity: premium, minimal, calming, spiritual without feeling religious, no visible human avatar, no corporate promo style.";
}

function buildMeditationVideoPrompt(input: {
	script: string;
	mood: string;
	duration: string;
	language: AppLanguage;
	visual?: string;
}) {
	const baseScript = input.script.replace(/\s+/g, " ").trim().slice(0, 1200);
	const isSpanish = input.language === "es";
	const sceneDirection = getSceneDirection(input.visual, input.language);
	const brandDirection = getBrandDirection(input.language);

	if (isSpanish) {
		return [
			"Crea un video vertical corto, calmante y premium para una app de meditación llamada ChimAura.",
			`Duración objetivo: ${input.duration}.`,
			`Estado de ánimo: ${input.mood}.`,
			brandDirection,
			sceneDirection,
			"El fondo debe sentirse como una escena ambiental original de ChimAura, no como una plantilla genérica.",
			"Añade movimiento muy sutil: resplandor lento, niebla suave, partículas ligeras o respiración visual lenta.",
			"No uses presentador, avatar parlante, ni encuadre comercial.",
			"Incluye subtítulos quemados en pantalla durante todo el video.",
			"Usa voz humana muy tranquila, cálida y lenta.",
			"Mantén el ritmo meditativo y natural.",
			"No uses terapia, HSA ni lenguaje clínico.",
			`Guion base: ${baseScript}`,
		].join(" ");
	}

	return [
		"Create a short vertical calming premium video for a meditation app called ChimAura.",
		`Target duration: ${input.duration}.`,
		`Mood: ${input.mood}.`,
		brandDirection,
		sceneDirection,
		"The background should feel like an original ChimAura ambient scene, not a generic template.",
		"Add only very subtle movement: slow glow, soft mist, faint particles, or slow breathing-like visual motion.",
		"Do not use a presenter, talking avatar, or commercial promo framing.",
		"Include burned-in subtitles throughout the full video.",
		"Use a very calm, warm, human voice and slow meditative pacing.",
		"Keep the flow natural and soothing.",
		"Do not use therapy, HSA, or clinical framing.",
		`Base script: ${baseScript}`,
	].join(" ");
}

export async function POST(req: Request) {
	try {
		const apiKey = process.env.HEYGEN_API_KEY;
		if (!apiKey) {
			return NextResponse.json(
				{ error: "HEYGEN_API_KEY is not configured." },
				{ status: 503 }
			);
		}

		const body = (await req.json()) as GenerateHeyGenBody;
		const script = body?.script?.trim();
		const mood = body?.mood?.trim() || "Calm";
		const duration = body?.duration?.trim() || "1 min";
		const language: AppLanguage = body?.language === "es" ? "es" : "en";
		const visual = body?.visual?.trim() || "mist";

		if (!script) {
			return NextResponse.json(
				{ error: "Meditation script is required." },
				{ status: 400 }
			);
		}

		const prompt = buildMeditationVideoPrompt({
			script,
			mood,
			duration,
			language,
			visual,
		});

		const response = await fetch("https://api.heygen.com/v1/video_agent/generate", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				"X-API-KEY": apiKey,
			},
			body: JSON.stringify({
				prompt,
			}),
			cache: "no-store",
		});

		const data = (await response.json().catch(() => null)) as
			| {
					error?: string;
					message?: string;
					data?: {
						video_id?: string;
						video_url?: string;
					};
				}
			| null;

		if (!response.ok) {
			return NextResponse.json(
				{
					error: data?.message || data?.error || "HeyGen video generation failed.",
				},
				{ status: response.status }
			);
		}

		const videoId = data?.data?.video_id;
		if (!videoId) {
			return NextResponse.json(
				{ error: "HeyGen did not return a video_id." },
				{ status: 502 }
			);
		}

		return NextResponse.json({
			videoId,
			status: "processing",
		});
	} catch (error) {
		return NextResponse.json(
			{
				error: "Failed to start HeyGen video generation.",
				detail: error instanceof Error ? error.message : undefined,
			},
			{ status: 500 }
		);
	}
}
