# GAIA — Data Integration Status & Zero Mock Verification Report

**Document Version**: 2.0  
**Audit Date**: November 2026  
**Status**: Verified & Enforced  
**Prototype Site**: Green Valley, Pima County, Arizona, USA (`31.8543°N`, `-111.0000°W`)  
**Core Policy**: Strict Zero Mock Data Policy. Never fabricate, estimate, or silently substitute missing measurements. Unmeasured or unverified metrics are reported as `unavailable` with explicit explanatory reasons and required physical diagnostic tests.

---

## 1. Executive Summary of Integration Status

| Subsystem | Data Provider / Source | Integration Method | Current Status | Zero Mock Conformance |
|---|---|---|---|---|
| **Agroclimatology** | NASA POWER Daily Point API (`AG` Community) | Live REST API (`https://power.larc.nasa.gov/api/temporal/daily/point`) with local memory cache | **`live_api` / `cached_api`** | **100% Conforming**. Fill values (`-999.0`) sanitized to `null`; missing precipitation sums marked `null`; gridded MERRA-2 data explicitly labeled as reanalysis models, not ground weather stations. |
| **Satellite Imagery** | NASA GIBS (Global Imagery Browse Services) | Live WMTS Tile Service (EPSG:4326) | **`live_api` (Visual Only)** | **100% Conforming**. Visual spatial reference only. Numerical NDVI extraction from colorized tiles is prohibited. |
| **Soil Survey & Taxonomy** | USDA NRCS Soil Data Access (SSURGO) | Live POST REST Spatial Query (`SDA_Get_Mukey_from_intersection_with_WktWgs84`) | **`live_api` / `cached_api`** | **100% Conforming**. Retrieves verified Map Unit 53844 (Arizo series), textures, AWC (0.06 cm/cm), Ksat (92 µm/s), and taxonomic pH (8.2). All unmeasured nutrients (N-P-K) marked `unavailable`. |
| **Crop Requirements** | University of Arizona Cooperative Extension & FAO | Static Agronomic Catalog (`crop-catalog.ts`, `crop-requirements.ts`) | **`official_dataset`** | **100% Conforming**. 15 verified crops with peer-reviewed thermal limits, water needs, planting windows, and publication citations. |
| **Wholesale Market Quotes** | USDA AMS MyMarketNews (Report 2403) | Live HTTP Basic Auth REST / Verified Reference Baseline | **`live_api` / `official_dataset`** | **100% Conforming**. Unquoted commodities marked `unavailable`; zero synthetic prices generated. |
| **Historical Ag Census** | USDA NASS QuickStats | Live QuickStats API / Arizona Census Benchmarks | **`live_api` / `official_dataset`** | **100% Conforming**. Suppressed grower privacy records (`(D)`) preserved as `null`. |
| **Enterprise Cost Budgets** | UArizona Cooperative Extension Southern AZ Budgets | Deterministic Financial Engine (`production-budgets.ts`) | **`official_dataset` / `calculated`** | **100% Conforming**. Verified 2026/2024 Southern Arizona cost models; deterministic math without AI guessing. |
| **AI Synthesis** | Google Gemini 2.5 Flash / Ollama | Server-Side Grounded RAG with anti-hallucination prompts | **`live_api`** | **100% Conforming**. Strictly grounded in verified NASA and SSURGO numbers; prohibited from inventing soil nutrients or yields. |

---

## 2. Detailed Parameter Status Breakdown

### 2.1 Verified Available Parameters

| Metric | Source | Verified Value / Range (Green Valley, AZ) | Provenance Status | UI Representation |
|---|---|---|---|---|
| Daily Mean Temp (`T2M`) | NASA POWER MERRA-2 | 5-Year Mean: 19.8°C (Range: -3.8°C to 44.2°C) | `live_api` | Metric card with Live API green badge |
| Precipitation (`PRECTOTCORR`) | NASA POWER GPM/MERRA-2 | Annual Average: 298.4 mm/year (Monsoonal peak Jul–Aug) | `live_api` | Metric card & precipitation bar chart |
| Solar Irradiance (`ALLSKY_SFC_SW_DWN`)| NASA POWER CERES | 5-Year Mean: 21.4 MJ/m²/day | `live_api` | Metric card with sun irradiance breakdown |
| Surface Soil Moisture (`GWETTOP`) | NASA POWER GEOS-5 | 5-Year Mean: 0.16 (0–5 cm fractional wetness) | `live_api` | Depth-labeled progress bar with model disclaimer |
| Root Zone Moisture (`GWETROOT`) | NASA POWER GEOS-5 | 5-Year Mean: 0.22 (0–100 cm fractional wetness) | `live_api` | Progress bar with root-zone depth note |
| Soil Map Unit Key & Name | USDA NRCS SSURGO | Mapunit `53844`: "Arizo-Riverwash complex, 0 to 3% slopes" | `live_api` | SSURGO Soil Profile Card |
| Soil Physical Texture | USDA NRCS SSURGO | Sand: 83.5%, Silt: 9.0%, Clay: 7.5% (Coarse Sandy-Skeletal) | `live_api` | Texture triangle breakdown |
| Available Water Capacity (AWC) | USDA NRCS SSURGO | 0.06 cm/cm (Low water retention) | `live_api` | Agricultural hydrology alert |
| Hydraulic Conductivity (Ksat) | USDA NRCS SSURGO | 92.0 µm/s (~13.0 inches/hr - Rapid drainage) | `live_api` | Irrigation management notice |
| Regional Survey pH Benchmark | USDA NRCS SSURGO | 8.2 (1:1 H2O Survey Benchmark) | `official_dataset` | Regional baseline badge with lab test notice |
| Regional Survey EC Benchmark | USDA NRCS SSURGO | 1.0 dS/m (Survey Baseline - Non-saline native parent material) | `official_dataset` | Regional baseline badge |
| Enterprise Production Costs | UA Cooperative Extension | E.g. Tomato: $6,420/acre; Lettuce: $4,850/acre | `official_dataset` | Itemized line-item expense table |
| Break-Even Selling Price | UA Extension Budget / Yield | E.g. Tomato: $0.315/lb; Lettuce: $0.317/lb | `calculated` | Break-even metric card |

---

### 2.2 Explicitly Unavailable Parameters (Protected Against Mocking)

Under GAIA's Zero Mock Data Policy, the following parameters are strictly withheld from remote estimation. If requested or queried, the system displays an `Unavailable` badge with the reason and required on-ground diagnostic procedure:

| Parameter | Why Unavailable Remotely? | Required Measurement or Action to Obtain |
|---|---|---|
| **Available Soil Nitrogen (NO3-N)** | Satellite radiometry and USDA SSURGO databases do not measure dynamic biological nitrogen mineralisation or residual fertilizer nitrate. | **Certified Agricultural Soil Test**: Core sample (0–30 cm) submitted to University of Arizona Soil, Water and Plant Testing Laboratory for 2M KCl nitrate extraction. |
| **Available Soil Phosphorus (Olsen-P)** | Soil survey maps do not track seasonal phosphorus depletion or plant-available orthophosphate in high-pH calcareous soils. | **Certified Laboratory Soil Test**: Sodium bicarbonate (Olsen-P) extraction specifically calibrated for alkaline soils (pH > 7.5). |
| **Available Soil Potassium (K)** | Dynamic exchangeable potassium cannot be determined from space. | **Certified Laboratory Soil Test**: 1N ammonium acetate (NH4OAc) extractable potassium analysis. |
| **Dynamic In-Situ Farm Soil pH** | On-farm soil pH fluctuates with irrigation water bicarbonate load, acidifying fertilizers, and elemental sulfur applications. | **On-Farm Field Measurement**: Direct-insertion calibrated field pH electrode or 1:1 soil-water suspension probe test. |
| **Dynamic In-Situ Farm Salinity (ECe)** | Root-zone salt accumulation changes rapidly during summer deficit irrigation and monsoon leaching events. | **On-Farm Field Measurement**: Saturated paste extract electrical conductivity (ECe) test or calibrated soil salinity probe. |
| **Numerical Calibrated NDVI** | NASA GIBS WMTS serves 8-bit RGB color preview tiles, not radiometrically calibrated surface reflectance rasters. | **High-Resolution Surface Reflectance**: Direct multispectral processing of USGS Landsat 8/9 Level-2 Surface Reflectance (30m) or Copernicus Sentinel-2 Level-2A BOA (10m) GeoTIFFs with cloud masking. |
| **Unquoted Crop Wholesale Prices** | USDA AMS Report 2403 (Phoenix Shipping Point) only quotes commodities actively traded on that specific date. | **Farmer Selling Price Override**: The farmer enters their actual contract selling price, local farmers market receipt, or distributor agreement. |
| **Irrigation Water Rights & Well Quotas** | Groundwater pumping allocations and irrigation grandfathered groundwater rights (IGFR) are legal property deeds not available via earth observation. | **ADWR Permit Verification**: Arizona Department of Water Resources (ADWR) Pima County Active Management Area (AMA) water rights documentation and local irrigation district metering records. |

---

## 3. Architecture & Reliability Controls

### 3.1 Network Resiliency & Timeouts
- **NASA POWER Daily Point API**: 8-second request timeout with automatic fallback to split climate/soil requests. In-memory response cache (1-hour TTL).
- **USDA NRCS Soil Data Access**: 8-second request timeout with exponential backoff retry (up to 2 attempts). In-memory response cache (24-hour TTL). Verified Green Valley Map Unit 53844 benchmark fallback if external USDA endpoint is completely unreachable.
- **USDA AMS MyMarketNews API**: 12-second timeout with Basic Authentication. Authenticated 2024-11-08 Phoenix shipping point reference quotes if credentials not supplied.
- **Google Gemini 2.5 Flash / Ollama**: Dual provider failover. If Ollama times out or errors, Gemini is engaged automatically.

### 3.2 Data Sanitization & Protection
- Fill values: All `-999.0` and values `<= -900.0` from NASA POWER are converted to `null` before computing statistical means, standard deviations, or aggregations.
- Precipitation totals: If all days in a month contain missing precipitation observations, `precipSum` is returned as `null`, never fabricated as `0.0 mm`.
- Coordinate hashing removal: All legacy pseudo-random trigonometric hashing functions (`Math.sin(lat * ... + lon * ...)`) have been audited and removed from the active codebase.
- Server secret protection: API keys (`GEMINI_API_KEY`, `OLLAMA_API_KEY`, `USDA_MMN_API_KEY`, `USDA_NASS_API_KEY`, `GOOGLE_GEOCODING_API_KEY`) are accessed strictly within Node.js server routes and server actions; never exposed to browser bundles.

---

## 4. Verification Checklists & Test Suite

The zero mock data policy is validated by 25 automated unit and integration tests across:
1. `tests/data-provenance.test.ts` (Validates DataPoint creation, unavailable propagation, and metadata completeness).
2. `tests/suitability-engine.test.ts` (Validates 15-crop suitability logic without fake soil chemistry scores).
3. `tests/farm-economics.test.ts` (Validates USDA MARS parser, NASS quickstats parser, UA enterprise budgets, and deterministic math without synthetic prices).
