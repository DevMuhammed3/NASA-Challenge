# GAIA — Complete Data Source Inventory & Verification Audit

**Project**: GAIA (Geospatial Agricultural Intelligence & Advisory)  
**Location**: Green Valley, Pima County, Arizona, USA (`31.8543°N`, `-111.0000°W`, Elevation ~962m)  
**Historical Climatology Period**: 2021-01-01 to 2025-12-31  
**Audit Standard**: Zero Mock Data Policy — Never fabricate, estimate, or substitute missing telemetry. Unverifiable metrics must be explicitly returned as `unavailable` with actionable requirements.

---

## 1. Climatological & Meteorological Telemetry (NASA POWER AG)

| Parameter Code | Description | Standard Unit | UI Component / API Route | Official Provider | Temporal Resolution / Model | Provenance Status | Verification Endpoint / Methodology | Fill Value Handling |
|---|---|---|---|---|---|---|---|---|
| `T2M` | Temperature at 2 Meters | °C | `DashboardMetrics.tsx`, `HistoricalDataSection.tsx`, `/api/power` | NASA POWER Daily Point API (`AG` Community) | Daily (2021–2025) / MERRA-2 FP-IT 0.5° x 0.625° | `live_api` / `cached_api` | `https://power.larc.nasa.gov/api/temporal/daily/point?parameters=T2M&community=AG&longitude=-111.0000&latitude=31.8543` | Values `<= -900.0` or matching `fill_value` converted to `null`; never 0. |
| `T2M_MAX` | Daily Maximum Temperature | °C | `DashboardMetrics.tsx`, `HistoricalDataSection.tsx`, `/api/power` | NASA POWER Daily Point API (`AG` Community) | Daily (2021–2025) / MERRA-2 FP-IT assimilation | `live_api` / `cached_api` | Verified against NASA CERES / GMAO hourly reanalysis | Filtered for fill values (`-999.0`). |
| `T2M_MIN` | Daily Minimum Temperature | °C | `DashboardMetrics.tsx`, `HistoricalDataSection.tsx`, `/api/power` | NASA POWER Daily Point API (`AG` Community) | Daily (2021–2025) / MERRA-2 FP-IT assimilation | `live_api` / `cached_api` | Verified against NASA CERES / GMAO hourly reanalysis | Filtered for fill values (`-999.0`). |
| `PRECTOTCORR` | Precipitation Corrected | mm/day | `DashboardMetrics.tsx`, `HistoricalDataSection.tsx`, `/api/power` | NASA POWER Daily Point API (`AG` Community) | Daily / GPM IMERG & MERRA-2 bias-corrected | `live_api` / `cached_api` | Satellite radar/microwave constellation calibrated with ground rain gauges | Missing days excluded from monthly sums; if entire month is missing, `precipSum` is `null`. |
| `RH2M` | Relative Humidity at 2 Meters | % | `DashboardMetrics.tsx`, `HistoricalDataSection.tsx`, `/api/power` | NASA POWER Daily Point API (`AG` Community) | Daily mean / MERRA-2 surface assimilation | `live_api` / `cached_api` | Calculated from 2m specific humidity and air pressure | Filtered for fill values (`-999.0`). |
| `WS2M` | Wind Speed at 2 Meters | m/s | `DashboardMetrics.tsx`, `/api/power` | NASA POWER Daily Point API (`AG` Community) | Daily mean / 2m agricultural standard height | `live_api` / `cached_api` | Officially provided by POWER AG community; converted using logarithmic wind profile if needed | Filtered for fill values (`-999.0`). |
| `WS10M` | Wind Speed at 10 Meters | m/s | `DashboardMetrics.tsx`, `HistoricalDataSection.tsx`, `/api/power` | NASA POWER Daily Point API (`AG` Community) | Daily mean / MERRA-2 10-meter surface anemometer | `live_api` / `cached_api` | MERRA-2 boundary layer hydrodynamic model | Filtered for fill values (`-999.0`). |
| `ALLSKY_SFC_SW_DWN` | All-Sky Surface Shortwave Downward Irradiance | MJ/m²/day | `DashboardMetrics.tsx`, `HistoricalDataSection.tsx`, `/api/power` | NASA POWER Daily Point API (`AG` Community) | Daily total / NASA FLASHFlux & CERES satellite radiometric sensors | `live_api` / `cached_api` | Geostationary and polar-orbiting satellite cloud-cover radiometry | Filtered for fill values (`-999.0`). |
| `GWETTOP` | Surface Soil Wetness | Fraction (0–1) | `DashboardMetrics.tsx`, `/api/power` | NASA POWER Daily Point API (`AG` Community) | Daily (0–5 cm depth) / GEOS-5 Catchment Land Surface Model | `live_api` / `cached_api` | Hydrologic model estimate driven by satellite precipitation & solar forcing. Not a physical buried capacitance probe. | Filtered for fill values (`-999.0`). |
| `GWETROOT` | Root-Zone Soil Wetness | Fraction (0–1) | `DashboardMetrics.tsx`, `/api/power` | NASA POWER Daily Point API (`AG` Community) | Daily (0–100 cm depth) / GEOS-5 Catchment Model | `live_api` / `cached_api` | Root-zone hydraulic simulation based on regional soil texture map. | Filtered for fill values (`-999.0`). |
| `GWETPROF` | Profile Soil Wetness | Fraction (0–1) | `DashboardMetrics.tsx`, `/api/power` | NASA POWER Daily Point API (`AG` Community) | Daily (entire soil column to bedrock) / GEOS-5 | `live_api` / `cached_api` | Catchment land surface model water balance simulation. | Filtered for fill values (`-999.0`). |

---

## 2. Satellite Remote Sensing & Imagery (NASA GIBS)

| Layer / Parameter | Purpose | Source Dataset | Resolution | Status | Verification & Grounding Constraint |
|---|---|---|---|---|---|
| MODIS Terra True Color (CR) | Visual site reference & cloud cover | NASA GIBS WMTS (MODIS_Terra_CorrectedReflectance_TrueColor) | 250m / daily | `live_api` | Displayed strictly for visual orientation. Does NOT generate quantitative agronomic numbers. |
| MODIS Terra NDVI 8-Day Composite | Visual vegetation vigor colorized overlay | NASA GIBS WMTS (MODIS_Terra_NDVI_8Day) | 250m / 8-day composite | `live_api` (Visual Only) | **Numerical extraction strictly prohibited**. GIBS tiles are 8-bit RGB color previews, not calibrated surface reflectance rasters. |
| MODIS Land Cover Type | Visual regional biome classification | NASA GIBS WMTS (MODIS_Terra_Land_Cover_Type_Yearly) | 500m / yearly | `live_api` (Visual Only) | Visual context map showing Sonoran desert scrub classification. |
| **Numerical Calibrated NDVI** | Quantitative plant canopy vigor index | USGS Landsat 8/9 Level-2 SR or Sentinel-2 Level-2A BOA | 10m–30m | **`unavailable`** | Requires cloud-masked, atmospherically corrected surface reflectance GeoTIFF pipelines. Legacy pseudo-random sine wave hashes (`Math.sin(...)`) have been completely removed. |

---

## 3. Soil Survey, Taxonomy & Hydrology (USDA NRCS SSURGO / Soil Data Access)

| Parameter | Unit | Value for Green Valley (`31.8543, -111.0`) | Official Source & Query | Status | Agricultural Meaning & Provenance Notice |
|---|---|---|---|---|---|
| Map Unit Key (`mukey`) | Identifier | `53844` | USDA NRCS Soil Data Access REST (`SDA_Get_Mukey_from_intersection_with_WktWgs84`) | `live_api` | Official NCSS map unit identifier for Green Valley prototype coordinates. |
| Map Unit Name (`muname`) | Text | "Arizo-Riverwash complex, 0 to 3 percent slopes" | USDA NRCS Soil Data Access / SSURGO AZ669 | `live_api` | Alluvial fan and channel terrace soils in Eastern Pima County. |
| Map Unit Symbol (`musym`) | Text | "5" | USDA NRCS Pima County Soil Survey | `live_api` | NCSS soil survey symbol. |
| Farmland Classification | Rating | "Not prime farmland" | USDA NRCS SSURGO `mapunit.farmlndcl` | `live_api` | Rated non-prime due to extreme aridity, coarse texture, and low water holding capacity without continuous irrigation. |
| Dominant Component | Soil Series | "Arizo" (50% composition) | USDA NRCS SSURGO `component.compname` | `live_api` | Deep, excessively drained soils formed in mixed gravelly and cobbly alluvium. |
| Natural Drainage Class | Class | "Excessively drained" | USDA NRCS SSURGO `component.drainagecl` | `live_api` | High percolation, rapid gravity drainage, minimal surface ponding. |
| Soil Taxonomy Subgroup | Taxonomic Order | "Sandy-skeletal, mixed, thermic Typic Torriorthents" | USDA NRCS SSURGO `component.taxclname` | `live_api` | Entisol order: young mineral soils in torrid/arid climates with >35% coarse rock fragments. |
| Surface Horizon Depth | cm | 0 to 46 cm | USDA NRCS SSURGO `chorizon.hzdept_r` to `hzdepb_r` | `live_api` | Representative topsoil layer depth. |
| Sand Total | % | 83.5% | USDA NRCS SSURGO `chorizon.sandtotal_r` | `live_api` | Coarse sandy skeletal physical matrix. |
| Silt Total | % | 9.0% | USDA NRCS SSURGO `chorizon.silttotal_r` | `live_api` | Fine mineral component. |
| Clay Total | % | 7.5% | USDA NRCS SSURGO `chorizon.claytotal_r` | `live_api` | Very low clay content, leading to low cation-exchange capacity (CEC). |
| Available Water Capacity (AWC) | cm/cm | 0.06 | USDA NRCS SSURGO `chorizon.awc_r` | `live_api` | **Critically low water storage**. Soil holds only ~0.7 inches of plant-available water per foot of depth, requiring high-frequency drip irrigation. |
| Saturated Conductivity (Ksat) | µm/s | 92.0 µm/s (~13 in/hr) | USDA NRCS SSURGO `chorizon.ksat_r` | `live_api` | High permeability and rapid hydraulic infiltration. Water leaches rapidly beneath root zone under flood irrigation. |
| Taxonomic Survey pH Benchmark | pH (1:1 H2O) | 8.2 | USDA NRCS SSURGO `chorizon.ph1to1h2o_r` | `official_dataset` | **Regional taxonomic benchmark**. Parent material is strongly alkaline and calcareous. Note: Not a real-time farm sensor reading. |
| Taxonomic Survey Salinity Benchmark | dS/m | 1.0 | USDA NRCS SSURGO `chorizon.ec_r` | `official_dataset` | Regional taxonomic benchmark for native alluvium (< 2 dS/m = non-saline native state). |
| Organic Matter (OM) | % | 0.75% | USDA NRCS SSURGO `chorizon.om_r` | `official_dataset` | Typical arid desert benchmark; low natural soil organic carbon. |
| **Available Nitrogen (NO3-N)** | ppm | `null` | N/A | **`unavailable`** | **Cannot be measured remotely**. Requires certified agricultural laboratory KCl extraction (UA Soil, Water & Plant Testing Lab). |
| **Available Phosphorus (Olsen-P)** | ppm | `null` | N/A | **`unavailable`** | **Cannot be measured remotely**. Requires laboratory sodium bicarbonate / Olsen extraction suitable for pH > 7.5. |
| **Available Potassium (K)** | ppm | `null` | N/A | **`unavailable`** | **Cannot be measured remotely**. Requires laboratory ammonium acetate extractable potassium test. |
| **In-Situ Dynamic Farm pH** | pH | `null` | On-farm sensor / laboratory test | **`unavailable`** | Fluctuates with irrigation water alkalinity and sulfur amendments. Requires calibrated on-farm pH meter. |
| **In-Situ Dynamic Farm Salinity (ECe)** | dS/m | `null` | On-farm sensor / laboratory test | **`unavailable`** | Salt accumulates dynamically from well water pumping. Requires direct probe or saturated paste extract test. |
| **Irrigation Water Rights** | AF/year | `null` | Arizona Dept of Water Resources (ADWR) | **`unavailable`** | Property-specific deed and Pima County Active Management Area (AMA) pumping quota. |

---

## 4. Crop Requirements & Agronomic Catalog (15 Vegetable Crops)

| Crop ID | Crop Name | Botanical Family | Planting Windows (Green Valley) | Thermal Limits (Min / Opt / Max) | Water Demand (ETc) | Soil pH Target & Tolerance | Primary Reference Citation |
|---|---|---|---|---|---|---|---|
| `tomato` | Tomato | Solanaceae | Spring (Feb 15–Apr 1), Fall (Jul 15–Aug 20) | 10°C / 21–29°C / 35°C | 600–800 mm (High) | pH 6.0–6.8; Moderate salinity | UA Extension AZ1435, FAO Irrigation Paper 56 |
| `potato` | Potato | Solanaceae | Fall (Sep 1–Oct 15), Spring (Jan 15–Feb 28) | 7°C / 16–21°C / 30°C | 500–700 mm (Medium-High) | pH 5.0–6.5; Sensitive to salinity | UA Extension AZ1005, UC Davis Vegetable RIC |
| `onion` | Onion | Amaryllidaceae | Fall (Oct 1–Nov 15) | 4°C / 13–24°C / 32°C | 450–650 mm (Medium) | pH 6.0–7.0; Moderately sensitive | UA Extension AZ1435 & Commercial Onion Bulletin |
| `garlic` | Garlic | Amaryllidaceae | Fall (Oct 1–Nov 15) | 0°C / 12–22°C / 30°C | 400–550 mm (Medium) | pH 6.0–7.2; Moderately tolerant | UA Extension AZ1005, Oregon State Extension |
| `lettuce` | Lettuce | Asteraceae | Fall/Winter (Sep 15–Dec 1) | 5°C / 15–20°C / 28°C | 350–500 mm (Medium) | pH 6.0–7.0; Moderately sensitive | UA Extension Yuma Ag Center Research Bulletins |
| `spinach` | Spinach | Amaranthaceae | Fall/Winter (Oct 1–Dec 15) | 2°C / 12–18°C / 24°C | 300–450 mm (Low-Med) | pH 6.5–7.5; Tolerant of alkaline soils | UA Extension AZ1435, USDA AMS Standards |
| `okra` | Okra | Malvaceae | Late Spring/Summer (Apr 1–Jun 15) | 15°C / 24–35°C / 42°C | 500–700 mm (Medium) | pH 6.0–7.5; Moderately tolerant | UA Extension Summer Vegetables Guide |
| `carrot` | Carrot | Apiaceae | Fall (Sep 15–Nov 1) | 4°C / 15–21°C / 29°C | 400–600 mm (Medium) | pH 6.0–6.8; Moderately sensitive | UA Extension AZ1435, UC Davis Postharvest |
| `pepper` | Bell Pepper | Solanaceae | Spring (Mar 1–Apr 15), Fall (Jul 15–Aug 15) | 12°C / 21–28°C / 35°C | 600–800 mm (High) | pH 6.0–6.8; Moderately sensitive | UA Extension Commercial Pepper Guide |
| `eggplant` | Eggplant | Solanaceae | Spring (Mar 15–May 1) | 15°C / 24–32°C / 38°C | 600–800 mm (High) | pH 5.8–6.8; Moderately tolerant | UA Extension AZ1435 |
| `cabbage` | Cabbage | Brassicaceae | Fall (Sep 15–Nov 15) | 4°C / 15–21°C / 28°C | 400–550 mm (Medium) | pH 6.0–7.5; Moderately tolerant | UA Extension Cole Crops Bulletin |
| `broccoli` | Broccoli | Brassicaceae | Fall (Sep 15–Nov 1) | 4°C / 15–20°C / 26°C | 400–550 mm (Medium) | pH 6.0–7.2; Moderately tolerant | UA Extension Cole Crops Bulletin |
| `zucchini` | Zucchini | Cucurbitaceae | Spring (Mar 1–Apr 15), Fall (Aug 15–Sep 15) | 10°C / 21–30°C / 36°C | 450–650 mm (Medium) | pH 6.0–7.5; Moderately tolerant | UA Extension Cucurbit Production Guide |
| `green_beans` | Green Beans | Fabaceae | Spring (Mar 15–Apr 15), Fall (Aug 15–Sep 15) | 10°C / 18–26°C / 32°C | 350–500 mm (Medium) | pH 6.0–7.0; Sensitive to salinity & heat | UA Extension AZ1435, FAO Drainage Paper 29 |
| `sweet_potato` | Sweet Potato | Convolvulaceae | Spring (Apr 1–May 15) | 15°C / 24–32°C / 38°C | 500–700 mm (Medium) | pH 5.5–6.8; Moderately tolerant | UA Extension Summer Root Crops, USDA AMS |

---

## 5. Wholesale Market Prices (USDA AMS MyMarketNews)

| Field | Source | Extraction Method | Verification Status | Fallback / Zero Mock Policy |
|---|---|---|---|---|
| Wholesale Report ID | USDA AMS MyMarketNews MARS API (Report 2403 / IX_FV120) | GET `https://marsapi.ams.usda.gov/services/v1.2/reports/2403/report%20details?lastReports=1` | `live_api` when `USDA_MMN_API_KEY` present; verified reference baseline when missing. | Explicit transparency notice shown: wholesale shipping-point quotes reflect volume packing-house sales, not direct farm-gate receipts. |
| Quoted Commodity | Report 2403 `commodity` field | Direct uppercase string (e.g. `TOMATOES`, `LETTUCE`) | `live_api` / `official_dataset` | Preserves original commodity naming without modification. |
| Packaging & Unit | Report 2403 `package` field | Standard shipping container (e.g. `cartons 2 layer`, `50 lb sacks`) | `live_api` / `official_dataset` | Direct transcription. |
| USDA Grade | Report 2403 `grade` field | e.g. `U.S. One`, `Fair Quality`, `Standard` | `live_api` / `official_dataset` | Preserves commercial grade specification. |
| Quoted Price Range | Report 2403 `price_min`, `price_max` | Numeric extraction in USD | `live_api` / `official_dataset` | Arithmetic midpoint computed deterministically: `(min + max) / 2`. |
| Normalized Price ($/lb) | Derived metric | `priceAverage / unitWeightLbs` | `calculated` | Normalized using verified USDA container net weights (e.g., 25 lbs for 2-layer tomato carton, 50 lbs for carrot sack). |
| **Unquoted Commodities** | Crops not in Report 2403 | Set to `unavailable` | **`unavailable`** | **Zero synthetic prices**. If a crop lacks a quote on the report date, GAIA flags price as `unavailable` and requires farmer input. |

---

## 6. Agricultural Statistics & Historical Benchmarks (USDA NASS QuickStats)

| Field | Source | Geographic Level | Verification Status | Zero Mock Rule |
|---|---|---|---|---|
| Benchmark Yields | USDA NASS QuickStats API (`GET https://quickstats.nass.usda.gov/api/api_GET`) | State of Arizona & Pima County | `live_api` when `USDA_NASS_API_KEY` present; verified Census benchmark when missing. | Withheld grower data (`(D)`) is parsed as `null`, never replaced with invented numbers. |
| Harvested Acreage | USDA NASS QuickStats / 2022 Census of Agriculture | Pima County, AZ | `official_dataset` | Provides realistic regional acreage context. |
| Value of Production | USDA NASS QuickStats | State of Arizona | `official_dataset` | Official statistical benchmark. |

---

## 7. Farm Economics & Production Budgets (UA Cooperative Extension)

| Field | Source | Authority | Verification Status | Grounding Standard |
|---|---|---|---|---|
| Enterprise Cost Budgets | University of Arizona Cooperative Extension Southern Arizona Budgets (2026 Models) | Published academic extension economists | `official_dataset` | Itemized line-item costs (land prep, drip irrigation, water pumping, labor, fertilizer, crop protection). |
| Fixed & Variable Split | UA Enterprise Budget Tables | Cooperative Extension methodology | `calculated` | Strict mathematical division: variable costs scale with acreage; fixed overhead remains constant. |
| Gross Margin & Net Profit | GAIA Financial Calculation Engine | Deterministic mathematical formulas | `calculated` | `Gross Revenue = Marketable Yield * Selling Price`; `Net Profit = Gross Revenue - Total Costs`. No AI estimation. |
| Break-Even Selling Price | GAIA Financial Calculation Engine | Deterministic formula | `calculated` | `Total Production Costs / Marketable Yield (lbs)`. Always computable from extension budget, even when market price is unavailable. |

---

## 8. AI Advisory & Grounding System (Gemini 2.5 Flash / Ollama)

| Input / Prompt Field | Grounding Rule | Hallucination Prevention Standard |
|---|---|---|
| Environmental Conditions | Injected verbatim from NASA POWER Daily API observations | System prompt prohibits altering observed temperatures, rainfall, or radiation. |
| Soil Chemistry & Quality | Injected from USDA SSURGO Map Unit 53844 | AI is explicitly instructed that dynamic N-P-K and real-time salinity are unknown and must be verified in a lab. |
| Crop Recommendations | Injected from deterministic suitability engine | AI cannot invent unlisted crops or override documented thermal/water stress limits. |
| Financial Outputs | Injected verbatim from UA enterprise budget calculations | AI cannot recalculate or invent financial numbers; must cite exact budget values. |
| Missing Telemetry Response | Required standard phraseology | "Data unavailable from satellite reanalysis; laboratory soil testing or physical metering required." |
