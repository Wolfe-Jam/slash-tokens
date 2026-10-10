# OSS savings study

What would `decide()` save on the LLM requests in official open-source repos
from four providers? Run with slash-tokens 1.7.0 prices, offline, against each
repo pinned to the commit below.

```bash
bun run bench:oss              # summary, writes bench/oss/results.json
ROWS=1 bun run bench:oss       # every request and every skip
bun bench/oss/goose.ts         # goose job model
```

## Method

- **Requests.** One per call site. claude-quickstarts is listed by hand
  (`repos.ts`) because its models are passed as variables; the other three are
  read by an extractor (a call regex, the model from the call's own arguments,
  else the file's `MODEL` / `MODEL_ID`, else the SDK default).
- **Price.** `quote()` at the model the code names, at its max output (4,096
  when the code sets none), with the call's surrounding code as the input.
- **Decision.** `decide()` twice. *Default floor* keeps the request's own tier
  and only takes a cheaper same-tier model. *Floor 1* takes the cheapest
  same-provider model the prompt fits.
- **Totals.** Each request counts once, at its high-end cost.

## Results

| Repo | Provider | Commit | Requests | Default floor | Floor 1 |
|---|---|---|---|---|---|
| anthropics/claude-quickstarts | Anthropic | `9ec32b9` | 8 | 24% | 65% |
| xai-org/xai-cookbook | xAI | `316ba56` | 33 | 0% | 57% |
| openai/openai-agents-python | OpenAI | `125efa0` | 139 | 52% | 84% |
| google-gemini/cookbook | Google | `dd5b15d` | 32 | 34% | 60% |
| **Pooled by dollars** | | | 212 | 34% | 71% |
| **Average of repos** | | | | 28% | 67% |

At floor 1 every repo lands at 57–84%. At the default floor it is 0–52%. The
"40–80% of tokens" claim is about tasks that fit a smaller model, which is
the floor-1 case.

### What drives each number

- **Anthropic.** Same tier is the newer, cheaper line: Opus 4.8 → Opus 5.5
  (20%), Sonnet 4.5 / 4.6 → Sonnet 5.5 (33%). Floor 1 is Haiku. Two of the
  eight requests already default to Haiku. The clearest small job on a big
  model: `browser.py:948`, a Sonnet 5.5 find-elements subtask capped at 800
  output tokens.
- **xAI.** Every request but one is `grok-4.7`, already the cheapest tier-3
  xAI model, so the default floor saves nothing. Floor 1 is `grok-4.3` (57%;
  output $6 → $2.50 per million).
- **OpenAI.** The newer generation is cheaper: `gpt-5.6-luna` → `gpt-6-luna`
  (58%), `gpt-5.6-sol` → `gpt-6.1-sol` (50%). At floor 1, `gpt-5.6-sol` →
  `gpt-6-luna` saves 97%. GPT-6 counts use the conservative default
  calibration, which over-counts, so real GPT-6 savings would be higher.
- **Google.** The cookbook defaults to `gemini-3.8-flash`. Same tier picks
  `gemini-2.5-flash` (34%), an older generation; floor 1 picks
  `gemini-3.1-flash-lite` (60%). 3.8 Flash is on launch pricing until
  2026-12-31; at Google's list price these savings grow.

## Caveats

- **Floor 1 assumes the smaller model can do the job.** `decide()` checks
  price, context fit and the floor you set, not task difficulty. The floor is
  the user's quality call.
- **openai-agents-python is mostly SDK defaults.** 125 of its 139 requests are
  agents that name no model and take `gpt-5.6-luna`. That weights the pooled
  figure toward OpenAI; the average of repos is the fairer headline.
- **Inputs are approximate.** The input is the surrounding code, not a real
  prompt. Output is priced at the cap. Requests are weighted equally, not by
  traffic.
- **Skipped requests are excluded, not counted as zero.** 18 in all: models
  not in the catalog (`gpt-4o-mini`, `gpt-5.5`, `gpt-5-mini`, `o3-mini`,
  image and TTS models) or a model passed as a variable.

## Related findings

### google-gemini/gemini-cli routes for itself (`9b6e026`)

`packages/core/src/config/defaultModelConfigs.ts` sends subtasks to small
models: classifier, prompt completion, edit corrector and shell / default
summarizers to flash-lite; web search, web fetch and loop detection to flash.
`packages/core/src/routing/` adds a classifier that sends each prompt to Flash
(simple) or Pro (complex). Google hand-builds per-job routing for its own
CLI. Not in the table: its main models (`gemini-2.5-pro`,
`gemini-3-pro-preview`) are not in the catalog.

### aaif-goose/goose uses one model for everything (`3bd8520`)

goose runs every call on the configured model, including one-shot jobs
(session titles, tool labels, compaction) via `complete_one_shot` with no
`max_tokens`. Provider defaults: `claude-sonnet-4-5`, `gpt-6.1-sol`,
`gemini-2.5-pro`, `grok-4.5`. Token counts use tiktoken `o200k_base` for every
provider; cost comes from models.dev and is shown after the call. There is no
spend cap, only turn caps.

Model routing was tried and removed three times:

| Removed | What | PR |
|---|---|---|
| 2025-11-19 | Autopilot (heuristic model switching) | [#5781](https://github.com/aaif-goose/goose/pull/5781) |
| 2026-03-18 | Lead/worker provider | [#7989](https://github.com/aaif-goose/goose/pull/7989) |
| 2026-09-14 | Planning mode | [#12061](https://github.com/aaif-goose/goose/pull/12061) |

#5781 gives the reasons (complex config and rules, context not managed across
models) and proposes "a virtual provider that routes requests to appropriate
model". `decide()` is per request, before the call, within one provider, and
never switches mid-thread.

`goose.ts` models what `decide()` would do on goose's defaults. Sizes are
modelled, not measured; output priced at the 4,096 cap.

| goose job | Anthropic `claude-sonnet-4-5` | OpenAI `gpt-6.1-sol` | xAI `grok-4.5` |
|---|---|---|---|
| Session title / tool label, floor 1 | Haiku, 67–68% | `gpt-6-luna`, 95% | `grok-4.3`, 56–57% |
| Main turn (30k context), floor 1 | Haiku, 74% | `gpt-6-luna`, 95% | `grok-4.3`, 43% |
| Main turn / compaction, default floor | Sonnet 5.5, 33% | 8–25% | 0% |
| Compaction (~180k), floor 1 | Sonnet 5.5, 33% (over Haiku's context) | `gpt-6-luna`, 95% | `grok-4.3`, 39% |

## Scanner gap found

`slash-tokens scan` recognises xAI by `x.ai/api` or `xai.chat`. All 33
xai-cookbook requests call `client.responses.create(` through the
OpenAI-compatible client and are not detected.
