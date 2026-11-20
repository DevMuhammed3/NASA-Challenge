<p align="center">
  <img src="public/logo.png" alt="GAIA logo" width="120" />
</p>

<h1 align="center">GAIA</h1>

<p align="center">
  <strong>Open Earth-observation data, turned into farm decisions.</strong><br />
  NASA POWER · NASA GIBS · USDA soil, prices and statistics · grounded AI
</p>

<p align="center">
  Built by <strong>Dev.Muhammed3</strong> for <strong>NASA Space Apps Challenge — Giza 2026</strong>
</p>

---

GAIA is a Next.js 16 decision-support application for arid-climate agriculture. It brings five years of NASA agroclimatology, satellite imagery, USDA soil surveys, wholesale market prices and agricultural statistics into a single workspace, then layers deterministic agronomy and economics engines on top. A grounded Gemini or Ollama advisor explains the results; it never invents them.

> [!WARNING]
> **Prototype / proof of concept.** GAIA was built in roughly 12 hours for the
> NASA Space Apps Challenge. It is a demonstration, not production software.
> Data can be incomplete and AI output can be wrong — do not use it for real
> farming or financial decisions.

The current build is anchored to **Green Valley, Arizona** (`31.8543°N, -111.0000°W`), the reference site used during the challenge. Every screen is built around one principle: **a number is either measured and attributed, or it is explicitly unavailable.**

## Highlights

- **Five years of real climate data** — 11 NASA POWER parameters, 1,826 daily observations (2021–2025), with fill-value sanitization and provenance on every value.
- **15-crop agronomic model** — thermal, water, solar and soil requirements cited to University of Arizona Extension and FAO sources.
- **Seven-factor suitability analysis** — no arbitrary composite score; soil is reported as `UNKNOWN` until a soil test is provided.
- **Deterministic farm economics** — enterprise budgets, USDA prices, yields, three scenarios, break-even math and dollar-quantified cost reductions.
- **AI with guardrails** — Gemini → Ollama → deterministic fallback; the model interprets verified inputs and is explicitly forbidden from inventing soil chemistry or prices.
- **Farmer decision support** — six-step onboarding, dimensional completeness scoring, rotation-aware recommendations and a feedback loop.
- **Honest failure modes** — timeouts, labeled benchmark fallbacks and a provider-status screen instead of silent fabrication.

## Table of contents

- [Why this exists](#why-this-exists)
- [Features](#features)
- [Architecture](#architecture)
- [Data sources](#data-sources)
- [Data integrity rules](#data-integrity-rules)
- [AI design](#ai-design)
- [Getting started](#getting-started)
- [Environment variables](#environment-variables)
- [Scripts](#scripts)
- [API reference](#api-reference)
- [Project structure](#project-structure)
- [Testing](#testing)
- [Deployment](#deployment)
- [Current limitations](#current-limitations)
  - [Prototype status](#prototype-status)
- [Credits](#credits)
- [Acknowledgements](#acknowledgements)
- [License](#license)

## Why this exists

NASA publishes an enormous amount of agricultural intelligence: daily agroclimatology through NASA POWER, satellite imagery through NASA GIBS, soil surveys through USDA NRCS, and market and census data through USDA. None of it directly answers the question a grower asks:

> What should I plant this season, and will it make money?

The data is gridded at roughly 50 km, spread across agencies and formats, and silent on the things that matter most at field scale. Satellite radiometers cannot measure soil pH, salinity, nitrogen, phosphorus or potassium. An LLM asked to fill those gaps will confidently invent them.

GAIA is an attempt to bridge that gap without pretending. It combines remote observations with farmer-provided ground truth, keeps the arithmetic in deterministic code, and states clearly what still requires a laboratory test or a water meter.

## Features

### Today's conditions

A live dashboard for the reference site: temperature, maximum and minimum records, precipitation, humidity, wind, solar radiation and surface/root-zone soil wetness. Each metric carries a provenance badge showing whether it is a live API reading, a cached response or an official dataset.

### Five-year trends

Monthly aggregates and daily observations from 2021 to 2025, with interactive SVG charts and tables. Precipitation is summed; temperature, humidity, solar and soil moisture are averaged over valid days only.

### Satellite context

A Leaflet map with NASA GIBS WMTS layers — MODIS Terra true color, 8-day NDVI and annual land cover. The imagery is visual context, not a source of numerical extraction.

### Crop recommendations

Fifteen vegetables evaluated against seven factors:

1. Temperature compatibility
2. Heat-stress risk
3. Frost exposure
4. Rainfall and irrigation requirement
5. Solar irradiance compatibility
6. Seasonal window alignment
7. Soil suitability

Each factor reports the observed value, the crop requirement, the calculation method and its source. Crops are classified as suitable with irrigation, conditionally suitable, or high climate risk.

### Farm economics

A deterministic financial engine built on Southern Arizona enterprise budgets, USDA AMS Phoenix Shipping Point prices and USDA NASS yields. It calculates gross revenue, marketable yield, variable and fixed costs, gross margin, net profit, ROI, break-even price and break-even yield, then models conservative, expected and optimistic scenarios. A cost-reduction engine converts the local rainfall and soil-moisture deficit into specific actions with estimated savings per acre.

### Grounded AI advisors

Separate advisors for environmental analysis, crop selection and farm economics. Each receives a structured summary of verified data, returns fixed sections, and falls back gracefully when a provider is unavailable.

### Farmer decision support

A six-step onboarding flow captures farm and field geometry, soil profile, water and irrigation, crop history, costs and preferences. The system scores completeness across six dimensions, lists the blockers that prevent analysis, and generates recommendations that account for rotation credits, disease risk, budget limits and excluded crops.

### Provider status

A single screen reports whether each integration is `Connected`, `Configured`, `Missing` or in `Error`, with latency where available. You can always tell which numbers are live.

## Architecture

```
Browser — seven tabbed workspaces
        │
        ▼
Next.js App Router — 19 route handlers
        │
        ├── Provider services
        │     NASA POWER · NASA GIBS · USDA SSURGO
        │     USDA AMS · USDA NASS · Google Geocoding
        │     Gemini · Ollama
        │
        ├── Deterministic engines
        │     15-crop suitability · enterprise budgets
        │     financial model · cost-reduction model
        │
        ├── Farmer domain
        │     onboarding · completeness · recommendations
        │
        └── Provenance layer
              live_api · cached_api · official_dataset
              farmer_provided · calculated · unavailable
```

**Design rules**

- **Secrets stay on the server.** No `NEXT_PUBLIC_` variables exist; provider keys are read inside route handlers and service modules.
- **Deterministic code owns the numbers.** Revenue, cost, margin, ROI and break-even values are arithmetic, not model output.
- **Missing data is a first-class value.** Unavailable metrics carry a reason and the physical measurement required to resolve them.
- **Degrade, don't fail.** Every external dependency has a timeout, a fallback and a visible status.

## Data sources

| Source | Provides | Used by | Key required |
|---|---|---|---|
| [NASA POWER](https://power.larc.nasa.gov/) (`AG` community) | Daily temperature, precipitation, humidity, wind, solar radiation, soil wetness (2021–2025) | Dashboard, trends, crops | No |
| [NASA GIBS](https://gibs.earthdata.nasa.gov/) | MODIS Terra true color, 8-day NDVI, annual land cover (WMTS) | Satellite map | No |
| [USDA NRCS Soil Data Access](https://sdmdataaccess.sc.egov.usda.gov/) | SSURGO soil series, texture, AWC, Ksat, taxonomic pH | Dashboard, crops | No |
| [USDA AMS MyMarketNews](https://mymarketnews.ams.usda.gov/) (Report 2403 / IX_FV120) | Phoenix Shipping Point vegetable prices | Economics | `USDA_MMN_API_KEY` (optional) |
| [USDA NASS QuickStats](https://quickstats.nass.usda.gov/) | Arizona and Pima County yields, acreage, production | Economics | `USDA_NASS_API_KEY` (optional) |
| [Google Geocoding](https://developers.google.com/maps/documentation/geocoding) | Address-to-coordinate resolution | Location setup | `GOOGLE_GEOCODING_API_KEY` (optional) |
| [Google Gemini](https://ai.google.dev/) | Grounded advisor synthesis (`gemini-2.5-flash` by default) | AI advisors | `GEMINI_API_KEY` (optional) |
| [Ollama](https://ollama.com/) | Local or proxied LLM advisor fallback | AI advisors | Optional |

Optional keys unlock live services. Without them, the app serves clearly labeled regional baselines and deterministic analysis rather than fabricated responses.

## Data integrity rules

These rules are implemented in code and covered by tests:

- **Fill values are never zero.** NASA POWER uses `-999` for missing measurements; any value at or below `-900` becomes `null` before aggregation.
- **Aggregation respects semantics.** Monthly precipitation is a sum of valid days and becomes `null` when no valid days exist. Averages use valid observations only.
- **Soil chemistry is `UNKNOWN` until tested.** The baseline suitability engine never claims soil pH, NPK or salinity from satellite data.
- **Irrigation is mandatory where rainfall is insufficient.** Every crop carries an explicit irrigation notice.
- **Suppressed USDA records stay suppressed.** NASS grower-privacy suppressions are preserved as `null`, not estimated.
- **Imagery is not a measurement.** NDVI tiles are presented as context; numerical NDVI is not extracted from colorized map tiles.
- **Fallbacks are labeled.** Cached responses, benchmarks and synthesized analyses identify themselves as such.
- **AI cannot invent numbers.** Prompts explicitly prohibit fabricating soil properties, prices or yields.

## AI design

The advisor is deliberately the least powerful part of the system.

1. Telemetry is summarized into a structured prompt: location, date range, valid-day count, missing rate, latest readings, five-year statistics and soil-wetness fractions.
2. The prompt restricts the model to those observations, requires it to separate observation from interpretation, and mandates six fixed output sections (five for economics).
3. Responses are parsed into typed fields and cached for 15 minutes.
4. Provider selection is explicit: Ollama first if `AI_PROVIDER=ollama`, otherwise Gemini. Gemini has a 9-second timeout; Ollama is health-checked with a 1.2-second ping before a 12-second request.
5. If both providers fail, the API returns a deterministic analysis synthesized from the same telemetry.

The model can be eloquent. It cannot be the source of truth.

## Getting started

### Prerequisites

- Node.js 20 or newer
- pnpm 9 or newer

### Install and run

```bash
git clone https://github.com/DevMuhammed3/NASA-Challenge.git
cd NASA-Challenge
pnpm install
cp .env.example .env
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

No API keys are required to explore the NASA POWER dashboard, historical trends, crop recommendations, provider status or the satellite map. Add keys to enable live wholesale prices, NASS statistics, geocoding and AI advisors.

### Optional PostgreSQL setup

The 18-table Drizzle schema models the farmer domain and the legacy saved-analysis routes. The main dashboard does not require a database. To enable database-backed routes:

```bash
# Export the connection string for the CLI, then create the tables
export DATABASE_URL="postgresql://user:password@host:5432/database"
pnpm exec drizzle-kit push --url "$DATABASE_URL"
```

The farmer API currently uses an in-memory store, so data resets when the server restarts. See [Current limitations](#current-limitations).

## Environment variables

Copy `.env.example` to `.env`. Every value is optional for the core experience.

| Variable | Default | Purpose |
|---|---|---|
| `AI_PROVIDER` | `google` | Preferred AI provider (`google` or `ollama`) |
| `AI_MODEL` | `gemini-2.5-flash` | Gemini model identifier |
| `GEMINI_API_KEY` | — | Enables Gemini advisor synthesis |
| `OLLAMA_API_KEY` | — | Optional key for a secured or hosted Ollama endpoint |
| `OLLAMA_BASE_URL` | `http://127.0.0.1:11434` | Ollama base URL |
| `OLLAMA_MODEL` | `llama3.3` | Ollama model identifier |
| `GOOGLE_GEOCODING_API_KEY` | — | Enables address resolution |
| `USDA_MMN_API_KEY` | — | Enables live USDA AMS market quotes |
| `USDA_NASS_API_KEY` | — | Enables live USDA NASS statistics |
| `DATABASE_URL` | — | PostgreSQL connection string for database-backed routes |

## Scripts

| Command | Description |
|---|---|
| `pnpm dev` | Start the development server |
| `pnpm build` | Production build |
| `pnpm start` | Serve the production build |
| `pnpm lint` | Run ESLint |
| `pnpm typecheck` | Run TypeScript without emitting |
| `pnpm test` | Compile and run the unit suite |
| `pnpm test:economics` | Run only the economics tests |
| `pnpm test:integration` | Run HTTP integration tests against a running server |

## API reference

### Core data

| Method | Endpoint | Purpose |
|---|---|---|
| `GET` | `/api/power` | NASA POWER observations, aggregates and summary statistics |
| `GET` | `/api/crops` | 15-crop suitability evaluation and recommendation summary |
| `GET` | `/api/economics` | Market quotes, budgets, financial results, scenarios and crop comparison |
| `GET` | `/api/providers` | Health and configuration status for all eight providers |
| `GET` | `/api/geocode` | Resolve an address or place name to coordinates |
| `GET` | `/api/health` | Database connectivity check |

### AI

| Method | Endpoint | Purpose |
|---|---|---|
| `POST` | `/api/advisor` | Environmental analysis from verified telemetry |
| `POST` | `/api/crops/advisor` | Crop-selection advisory |
| `POST` | `/api/economics/advisor` | Farm-economics advisory |

### Farmer decision support

| Method | Endpoint | Purpose |
|---|---|---|
| `GET` `POST` `PUT` | `/api/farmer/profile` | Farm profile |
| `GET` `POST` `PUT` `DELETE` | `/api/farmer/fields` | Field subdivisions and geometry |
| `GET` `POST` | `/api/farmer/seasons` | Growing seasons |
| `GET` `POST` | `/api/farmer/activities` | Irrigation, inputs and field activities |
| `GET` `POST` | `/api/farmer/preferences` | Crop preferences, exclusions and budget |
| `GET` `POST` | `/api/farmer/feedback` | Recommendation decisions and feedback |
| `POST` | `/api/farmer/upload` | Soil tests, water tests, invoices and photos |
| `GET` | `/api/farmer/recommendations` | Personalized, field-aware recommendations |

### Legacy (database-backed)

| Method | Endpoint | Purpose |
|---|---|---|
| `GET` `POST` `DELETE` | `/api/analyze` | Saved farm analyses from the original prototype |
| `GET` `POST` | `/api/chat` | Analysis-scoped chat history and messages |

The legacy routes are retained from the initial prototype and require PostgreSQL. They are not used by the current dashboard.

## Project structure

```
src/
├── app/
│   ├── api/                 # 19 route handlers
│   ├── globals.css          # Tailwind 4 theme tokens
│   ├── layout.tsx
│   └── page.tsx             # Seven-workspace shell
├── components/
│   ├── ui/                  # 13 shadcn/Base UI primitives
│   ├── farmer/              # Onboarding modal and farm dashboard
│   └── *.tsx                # Dashboard, trends, crops, economics, map, advisor
├── lib/
│   ├── services/            # NASA, USDA, geocoding, Gemini/Ollama clients
│   ├── crops/               # 15-crop catalog and suitability engine
│   ├── economics/           # Budgets, finance, prices, NASS, cost reduction
│   ├── farmer/              # Storage, completeness, recommendations, types
│   ├── types/               # Provenance, environmental and economics types
│   ├── config/              # Reference location
│   └── gaia-engine.ts       # Prototype analysis engine (legacy routes)
└── db/
    ├── schema.ts            # 18 Drizzle tables
    └── index.ts             # PostgreSQL pool

tests/                       # 39 test cases across 5 files
docs/                        # Methodology, data inventory and audit reports
public/                      # Logos and static assets
```

## Testing

```bash
pnpm test                 # Unit suite (suitability, economics, provenance, farmer)
pnpm test:economics       # Economics only
pnpm test:integration     # Requires the app running on localhost:3000
```

The suite covers catalog integrity, suitability rules, provenance behavior, USDA parsers, budget arithmetic, scenario multipliers, cost-reduction output, farmer completeness, rotation credit and HTTP responses. Tests are compiled with TypeScript and executed with Node's built-in test runner.

## Deployment

The app deploys to Vercel without a custom build configuration:

1. Import the repository in Vercel.
2. Keep the detected framework preset (Next.js).
3. Add the environment variables you intend to use.
4. Deploy.

Set `DATABASE_URL` only if you need the database-backed routes, and make sure the database accepts connections from your deployment region.

## Current limitations

### Prototype status

This repository is a **12-hour hackathon proof of concept**. It was assembled quickly to demonstrate the idea, so expect rough edges, hard-coded assumptions and unverified outputs. It is not production-ready and must not be used to make real agronomic or financial decisions.

The limitations below describe what is intentionally unfinished or deliberately scoped out of the demo.

- **Single reference site.** Calculations and copy are anchored to Green Valley, Arizona. Geocoding exists, but multi-farm geographic support is not a finished journey.
- **In-memory farmer store.** The farmer API resets on restart. The 15-table domain schema is designed for PostgreSQL but not yet wired to it.
- **Prototype legacy routes.** `/api/analyze` and `/api/chat`, along with Arabic copy and Nile Delta presets, remain from the initial prototype.
- **No authentication or rate limiting.** Suitable for a demo, not for public production.
- **No CI pipeline.** Linting, type checking and tests are run locally.
- **External data obligations.** NASA and USDA data are public, but any commercial use needs a review of attribution, licensing and refresh cadence.

Planned next steps: persist the farmer domain in PostgreSQL, retire the legacy routes, add authentication, then add browser end-to-end tests and CI.

## Credits

**Dev.Muhammed3** — application architecture, frontend and backend implementation, NASA and USDA data integrations, agronomy and economics engines, AI layer, farmer system, tests and documentation.

**Youssef Sameh** — UI/UX design and prototype support.

Thanks to the wider GAIA team for research, data collection, testing and product feedback.

## Acknowledgements

Data and agronomic references are provided by NASA POWER, NASA GIBS, USDA NRCS Soil Data Access, USDA AMS MyMarketNews, USDA NASS QuickStats, University of Arizona Cooperative Extension and the FAO. Their public datasets make this project possible.

## License

Released under the MIT License. See [LICENSE](LICENSE) for details.
