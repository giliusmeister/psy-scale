# psy-scale

Web application for psychological questionnaires.

## Features

- Multiple questionnaires
- Automatic JSON loading
- Validation of test structure
- Reverse scoring support
- Result calculation
- Export results as JSON

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
