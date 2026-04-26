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
- `GET /questionnaires/<file>.json` - returns a questionnaire JSON file

Optional environment variables:

```bash
PORT=3000 QUESTIONNAIRES_DIR=src/questionnaires npm start
```

## Build

`npm run build` copies questionnaire JSON files from `src/questionnaires` to
`public/questionnaires` before running the Vite build. Vite then emits them to
`dist/questionnaires`.

In production, Nginx can block public `/questionnaires/*` access while Node.js
reads the same files locally. See `DEPLOY_NGINX.md`.

## Deployment

See `DEPLOY_NGINX.md` for an Nginx + systemd deployment guide.
