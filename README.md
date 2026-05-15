# psy-scale

Web application for psychological questionnaires.

## Features

- Multiple questionnaires
- Automatic JSON loading
- Validation of test structure
- Reverse scoring support
- Result calculation
- Export results as JSON

## Questionnaire Scoring

Questionnaire JSON files define scoring behavior in their `scoring` section. The app currently supports three methods:

- `sum`: sums all visible, scorable answers into a total score. If `showAverage` is enabled, the app also reports the mean score across answered items.
- `subscales_sum`: calculates configured subscales only. Each subscale lists item numbers in `items`; `aggregation` defaults to `sum` and can be set to `mean`.
- `sum_with_subscales`: calculates the main total/average score and configured subscales in the same run.

Calculation details:

- Questions with `scorable: false` are excluded from scoring.
- Questions hidden by `visibility` rules are excluded from totals, averages, and subscales.
- Reverse scoring is applied when a question has `reverse: true`, using `scale.reverseScoring`.
- `reverseItems` documents the expected reversed item numbers in questionnaire metadata; runtime scoring follows the per-question `reverse` flag.
- Result bands are used only when `interpretationMode` is `bands`. `interpretationBasis` selects whether bands are matched against the `total` score or the `average` score.
- Percentiles are read from `norms.subscales`. The total percentile uses `norms.subscales.total` and `percentileBasis` (`total` or `average`), while subscale percentiles use the matching subscale key.
- Per-subscale derived metrics are supported via `subscales[].derivedMetrics`, including formula-based values (for example `((sum - 5) / 25) * 100`), counts with `countValues` (for example `[5, 6]`), and band interpretations with `source`.
- Derived metric `type` values: `sum`, `mean`, `count`, `percentage`, `bands`.
- Domain grouping is supported via top-level `domains` (list of domain keys with linked subscale keys). Domains are aggregated with `sum` (default) or `mean`.
- Top-level `flags` rules are supported for `subscale` and `domain` scopes, with operators `>`, `>=`, `<`, `<=`, `==`, `!=`.
- For each metric, only the highest matched severity flag is shown (`elevated` < `high` < `critical`).
- Imported answer JSON can be used to recalculate results against current questionnaire definitions; only current questionnaire question IDs are used (`q1..qN` style).

## Tech

- React + TypeScript
- Vite

## Run

```bash
npm install
npm run dev
```

## Questionnaire API

Run the separate Node.js API process:

```bash
npm start
```

By default it listens on `http://localhost:3000` and serves JSON files from
`src/questionnaires`.

- `GET /api/questionnaires` - returns the list of questionnaire JSON files
- `GET /api/questionnaires/<file>.json` - returns a questionnaire JSON file
- `GET /questionnaires/<file>.json` - returns a questionnaire JSON file for local or compatibility use

Optional environment variables:

```bash
PORT=3000 QUESTIONNAIRES_DIR=src/questionnaires npm start
```

## Build

`npm run build` copies questionnaire JSON files from `src/questionnaires` to
`public/questionnaires` before running the Vite build. Vite then emits them to
`dist/questionnaires`.

The frontend loads questionnaires at runtime through `/api/questionnaires` and
`/api/questionnaires/<file>.json`; questionnaire JSON is not bundled into the
compiled JavaScript.

In production, Nginx can block public `/questionnaires/*` access while Node.js
reads the same files locally. See `DEPLOY_NGINX.md`.

## Deployment

See `DEPLOY_NGINX.md` for an Nginx + systemd deployment guide.
