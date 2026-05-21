# Routing matrix evaluation — empirical results

A 33-config × 7-phase × 2-judge eval to ground the picks in [`qrptspi`](/notes/qrptspi). All runs headless via `claude -p` and `codex exec`.

## Method

- **33 configurations tested** — 8 Codex (gpt-5.5 × {default, fast tier} × {low, medium, high, xhigh}) + 25 Claude variants (Opus 4.7 / 4.7-1M / 4.6 / 4.6-1M each across 4-5 effort tiers; Opus 4.5; Sonnet 4.6 low/medium/high; Haiku 4.5 low/medium/high).
- **8 task instances across 7 phases** — Q, R, PRD, TDD, S, P, plus two I tasks (tight spec + loose spec).
- **264 implementation runs total.** Headless mode via `claude -p --model {m} --effort {e}` and `codex exec --ignore-user-config -m gpt-5.5 -c model_reasoning_effort={e}`.
- **Bulk judging.** Each phase's 33 outputs were sent in a single prompt to two judges (Claude Opus 4.7 high + Codex gpt-5.5 high) for blind scoring. Scores averaged across judges.
- **Scoring rubric.** 6 criteria per output, 0–2 each, total /12. Criteria varied per phase (correctness, restraint, format, edge-case coverage, etc).

## Overall ranking

Mean score across all 8 tasks, /12:

```
 1. codex-fast-high        11.50  ███████████
 2. opus-4-7-1m-low        11.31  ███████████
 3. codex-default-low      11.25  ███████████
 4. sonnet-4-6-high        11.06  ███████████
 5. sonnet-4-6-low         10.94  ██████████
 6. codex-fast-low         10.75  ██████████
 7. opus-4-7-medium        10.62  ██████████
 8. codex-fast-xhigh       10.50  ██████████
 9. opus-4-7-high          10.38  ██████████
10. opus-4-7-low           10.38  ██████████
11. codex-default-high     10.19  ██████████
12. codex-default-medium   10.19  ██████████
13. opus-4-7-1m-medium     10.19  ██████████
14. opus-4-7-1m-xhigh      10.12  ██████████
15. codex-default-xhigh    10.00  ██████████
16. opus-4-7-max            9.56  █████████
17. opus-4-7-1m-max         9.50  █████████
18. opus-4-7-1m-high        9.44  █████████
19. opus-4-7-xhigh          9.44  █████████
20. opus-4-6-high           9.25  █████████
21. opus-4-6-1m-low         9.19  █████████
22. opus-4-6-xhigh          9.19  █████████
23. opus-4-5                9.00  █████████
24. opus-4-6-1m-xhigh       8.81  ████████
25. sonnet-4-6-medium       8.81  ████████
26. codex-fast-medium       8.69  ████████
27. opus-4-6-1m-medium      8.69  ████████
28. opus-4-6-low            8.62  ████████
29. opus-4-6-medium         8.62  ████████
30. opus-4-6-1m-high        8.50  ████████
31. haiku-4-5-high          8.31  ████████
32. haiku-4-5-low           8.19  ████████
33. haiku-4-5-medium        7.88  ███████
```

## Per-phase winners

| Phase | Top config (avg /12) | Tied at top |
|---|---|---|
| **Q** (Questions) | codex-default-medium (12.0) | + codex-fast-high/medium/xhigh, opus-4-6-1m-low (5-way tie) |
| **R** (Research) | codex-default-medium (12.0) | + codex-fast-low/medium/xhigh, opus-4-6-1m-low |
| **PRD** (Product spec) | codex-default-low (12.0) | + codex-fast-low, opus-4-7-medium, sonnet-4-6-low |
| **TDD** (Tech design) | codex-default-low (12.0) | + sonnet-4-6-high |
| **S** (Structure outline) | codex-fast-xhigh (12.0) | + opus-4-7-1m-low, opus-4-7-1m-max, opus-4-7-low, others |
| **P** (Plan) | codex-default-low (11.5) | + codex-default-medium, codex-fast-high, codex-fast-low, haiku-4-5-high (5-way tie) |
| **I tight** (Implement) | codex-default-low/medium/high/xhigh, codex-fast-high (12.0) | nearly everyone tied — task was too easy |
| **I loose** (Implement) | codex-default-high (12.0) | + codex-default-xhigh, codex-fast-high, opus-4-7-max, opus-4-7-1m-max |

## Behavioral findings (real, not measurement artifacts)

### Older Opus models try to clarify with the user

opus-4-6, opus-4-5, and many opus-4-7-max/xhigh variants produced outputs like:

> *"Two PRDs already exist with different approaches. Do you want me to (1) Pick the stronger one and refine it, (2) Merge the best of both into a single final version, or (3) Write fresh from scratch?"*

…instead of producing the PRD content itself. In a headless `-p` run there's no user to answer, so these score 0.

This is a real behavioral difference. Those configs are more conservative about producing artifacts when context feels ambiguous — useful for interactive sessions, costly for headless pipelines.

### Codex `fast` tier ≥ `default` tier

codex-fast-high (11.50) outranked codex-default-high (10.19). The "fast" service tier doesn't trade quality for speed in this matrix — appears neutral or slightly positive. Worth surfacing as a recommendation.

### Max effort rarely wins

opus-4-7-max ranked 16th. The cheaper opus-4-7-low (10th) beat it. Corroborates the "max is a trap" finding (Towards AI eval, Anthropic's own guidance to start at xhigh and only escalate max when evals show measurable headroom).

### Sonnet 4.6 high/low are surprisingly competitive (top 5)

Partial counter to the "Sonnet isn't smart enough for complex codebases" generalization — at least for the synthetic task types in this matrix (which weren't extremely codebase-heavy). For routine planning/spec phases, Sonnet 4.6 high punches above expectations.

### Haiku 4.5 consistently bottoms out

But not catastrophically — score range 7.88–8.31 means it's still functional, just outclassed. The cost case for Haiku as a "cheap executor" doesn't survive quality contact.

### The "tight implementation" task was too easy

Almost everyone got 12/12 on it. Confirms that tight, prescriptive specs are within reach of every frontier and mid-tier model. The differentiation lives at the loose end.

## Caveats

- **N=1 task per phase.** Single data point per phase per config. Variance dominates. Treat directionally, not statistically.
- **Headless penalizes interactive behavior.** Configs that "check in with the user" get 0s — but in real interactive use, this might be a feature, not a bug.
- **Self-judging present.** Both judges are models from the contestant pool. Cross-vendor disagreement was minor on most phases.
- **The "fast tier" advantage may be matrix-specific.** Two more tasks at varied complexity would help calibrate this.
- **Older Opus models (4.5, 4.6) may have been retired or accessed via different routing** than 4.7 — some behavioral differences could be infrastructure, not model intelligence.

## What this changes in the routing doc

Comparing the matrix winners to the picks currently in [`/notes/qrptspi`](/notes/qrptspi):

| Phase | Current pick | Matrix top | Action |
|---|---|---|---|
| Q | Opus 4.7 high | codex-default-medium | keep — within margin |
| R | Opus 4.7 high/xhigh | codex-default-medium | keep — within margin |
| PRD | Opus 4.7 xhigh | codex-default-low (tied with opus-4-7-medium) | **flag Opus older-version clarification risk** |
| TDD | gpt-5.5 high | codex-default-low | ✓ matches |
| S | Opus 4.7 high → xhigh 1M | opus-4-7-1m-low tied with codex-fast-xhigh | keep — within margin |
| P | Opus 4.7 high/xhigh | codex-default-low | **flip to gpt-5.5 high** |
| I tight | gpt-5.5 high | most configs tied | ✓ matches |
| I loose | gpt-5.5 high | codex-default-high (tied with opus-4-7-max) | keep — within margin |

**Concrete updates:**
1. P pick flips from Opus → gpt-5.5 (matrix says codex-default-low leads at 11.5).
2. Add "Opus 4.6 / 4.5 ask for clarification in headless mode → score 0" to the don'ts.
3. Note that Codex `fast` tier matches or beats `default` tier — surface as a tip.
4. Add Sonnet 4.6 high as a viable alternate for TDD/PRD on cost-sensitive flows.

---

*Raw artifacts at `/tmp/qrptspi-matrix/`. Aggregated scores in `aggregated.json`.*
*Generated 2026-05-21 from 264 implementation runs + 16 bulk judge calls.*
