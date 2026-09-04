/**
 * Shared text-analysis AI chain for the backend (Groq -> OpenRouter free tier).
 *
 * WHY THIS EXISTS: llm-analysis.js and aiAnalysisService.js used to construct
 * their own `OpenAI` client, hardcode `model: 'gpt-4'`, and throw/skip outright
 * whenever OPENAI_API_KEY was unset. That is a single vendor, single model,
 * hardcoded — the moment OpenAI has a billing hiccup, an outage, or retires
 * gpt-4, every text-analysis feature in this app goes dead with no recovery
 * until someone notices and redeploys. This module gives both services a real
 * multi-vendor fallback chain via `@bitbaum/ai-kit` (from npm), the same
 * package already adopted across the fleet for exactly this failure mode.
 *
 * SCOPE: this is for plain chat-completion TEXT calls only. Vision/image
 * analysis (imageIngestionService.js, videoIngestionService.js's frame
 * analysis, frontend openaiVisionService.ts) and audio transcription
 * (Whisper) are NOT covered here — ai-kit's free chain carries no vision- or
 * audio-capable free models, so forcing those onto this chain would silently
 * degrade output quality rather than provide a real fallback. Those stay on
 * OpenAI, documented as a known limitation.
 *
 * `ai-kit` ships ESM-only; this file is CommonJS (matches the rest of
 * backend/), so it is loaded via a cached dynamic `import()` rather than
 * `require()`.
 */

let aiKitPromise = null;
function loadAIKit() {
  if (!aiKitPromise) {
    aiKitPromise = import('@bitbaum/ai-kit');
  }
  return aiKitPromise;
}

let health = null;
async function getHealthTracker() {
  if (!health) {
    const { createHealthTracker } = await loadAIKit();
    health = createHealthTracker({ downAfter: 3 });
  }
  return health;
}

/** Informational health snapshot for the /health endpoint. Never gates status. */
async function getAIHealth() {
  const tracker = await getHealthTracker();
  return tracker.getHealth();
}

/**
 * The chain's usable links, one per vendor (a second model at the same vendor
 * draws on the same daily budget, so it is not a real fallback — see ai-kit's
 * chain.ts). Returns [] when no AI_GROQ_API_KEY-equivalent (GROQ_API_KEY /
 * OPENROUTER_API_KEY) is configured at all.
 */
async function getChainLinks() {
  const { freeChain, usableChain } = await loadAIKit();
  const links = usableChain(freeChain('DATACAT'), process.env);

  const seen = new Set();
  return links.filter((link) => {
    if (seen.has(link.provider.id)) return false;
    seen.add(link.provider.id);
    return true;
  });
}

/** True if at least one free-tier vendor key is configured. */
async function isChainConfigured() {
  const links = await getChainLinks();
  return links.length > 0;
}

/**
 * Best-effort extraction of a JSON object from a chat completion's text.
 *
 * Free-tier models are not guaranteed to honour OpenAI's `response_format:
 * json_object` the way gpt-4 does, so instead of relying on that flag we ask
 * for JSON in the prompt and parse leniently here — the same pattern already
 * used by the frontend's openaiVisionService.ts for the same reason.
 */
function parseJSONLoose(content) {
  if (!content) throw new Error('Empty response from model');
  try {
    return JSON.parse(content);
  } catch {
    const match = content.match(/\{[\s\S]*\}/);
    if (!match) throw new Error('No JSON object found in model response');
    return JSON.parse(match[0]);
  }
}

/**
 * Run one chat completion down the free-tier chain, returning raw text.
 *
 * Throws `ChainExhaustedError` (from ai-kit) when no vendor is configured or
 * every configured vendor refused — callers decide whether that means "skip
 * this analysis" or "surface an error," matching how the pre-chain code
 * already handled a missing OPENAI_API_KEY per call site.
 */
async function chatText({ system, prompt, temperature = 0.3, maxTokens = 2000 }) {
  const { tryChain, chainFrom } = await loadAIKit();
  const chain = await getChainLinks();
  const tracker = await getHealthTracker();

  return tryChain(chain, {
    health: tracker,
    onLinkFailure: (link, error) => {
      console.warn(
        `AI chain link failed (${link.provider.id}/${link.model}):`,
        error instanceof Error ? error.message : error,
      );
    },
    attempt: async (link) => {
      const [resolved] = chainFrom(undefined, [link]);
      const res = await fetch(`${link.provider.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env[link.provider.keyEnv] ?? ''}`,
        },
        body: JSON.stringify({
          model: resolved?.model ?? link.model,
          temperature,
          max_tokens: maxTokens,
          messages: system
            ? [
                { role: 'system', content: system },
                { role: 'user', content: prompt },
              ]
            : [{ role: 'user', content: prompt }],
        }),
      });

      if (!res.ok) {
        const detail = await res.text().catch(() => '');
        throw new Error(`${link.provider.id} chat failed (${res.status}): ${detail.slice(0, 200)}`);
      }

      const body = await res.json();
      const text = body.choices?.[0]?.message?.content;
      if (!text) throw new Error(`${link.provider.id} returned no content`);

      return {
        content: text,
        model: `${link.provider.id}/${resolved?.model ?? link.model}`,
        usage: body.usage,
      };
    },
  });
}

/** Same as `chatText`, but parses the response as JSON (leniently). */
async function chatJSON(options) {
  const result = await chatText(options);
  return {
    ...result,
    json: parseJSONLoose(result.content),
  };
}

module.exports = {
  chatText,
  chatJSON,
  isChainConfigured,
  getAIHealth,
  parseJSONLoose,
};
