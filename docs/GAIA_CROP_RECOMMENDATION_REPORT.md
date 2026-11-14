# GAIA — Evidence-Based AI Crop Recommendation Report
## Prototype Location: Green Valley, Arizona, USA (2021–2025)

**Document Version:** 1.0.0  
**Project:** GAIA (Global Agricultural Intelligence Application) — Environmental Data & AI Crop Intelligence MVP  
**Coordinates:** Latitude `31.8543°N`, Longitude `-111.0000°W` | **Elevation:** 962 meters (3,156 ft)  
**USDA Hardiness Zone:** Zone 9a / 9b | **Climate Classification:** Arid / Semi-Arid Sonoran Desert (Köppen *BWh*)  
**Environmental Observation Period:** January 1, 2021 to December 31, 2025 (5 Years, 1,826 Daily Observations)  
**Primary Data Provider:** NASA POWER Daily API v2.10 (Native GEOS-5 / MERRA-2 Agroclimatology)  
**Agronomic Research Sources:** University of Arizona Cooperative Extension (AZ1005, AZ1435), FAO EcoCrop Database, FAO Irrigation & Drainage Paper 56  

---

## 1. Executive Summary

The GAIA Crop Recommendation Engine is an evidence-based, deterministic decision-support system designed to identify viable vegetable crops for small-to-medium scale producers in Green Valley, Arizona. Rather than relying on black-box heuristics or fabricating soil conditions, GAIA couples 5 years of verified NASA POWER meteorological observations with peer-reviewed agricultural requirements from the University of Arizona Cooperative Extension and the United Nations Food and Agriculture Organization (FAO).

### Key Findings for Green Valley, AZ:
1. **Bimodal Growing Environment**: Green Valley exhibits two primary agricultural cycles rather than a conventional single summer cycle. The **Cool Season (October through April)** represents the lowest-risk, highest-yield commercial window for vegetables.
2. **Extreme Summer Heat Threshold**: Between late May and August, daytime maximum temperatures routinely exceed 38°C–42°C (historical 5-year record: **44.99°C** on June 15, 2021). Temperate warm-season Solanaceae (tomatoes, peppers, eggplants) and legumes (green beans) suffer severe blossom abortion, pollen sterility, and thermal shutdown if grown through midsummer.
3. **Winter Radiation and Mild Cold**: Winter temperatures average 12.7°C, with high solar irradiance (13.8–20 MJ/m²/day) and rare, short freezes (historical 5-year record minimum: **-4.43°C** on January 8, 2024). Frost-tolerant crops (garlic, onions, carrots, spinach, lettuce, broccoli, cabbage) thrive during this period.
4. **Mandatory Supplemental Irrigation**: 5-year average annual rainfall is only **306.8 mm/year**, whereas vegetable water demand ranges from 350 to 650 mm per season. Natural rainfall fulfills less than 35% of crop needs; **pressurized drip irrigation is non-negotiable**.
5. **Strict Scientific Boundaries**: Satellite radiometers cannot assay farm-level soil chemistry (pH, electrical conductivity, NPK, micronutrients) or local water rights. In adherence to strict anti-hallucination protocols, soil suitability is classified as **`UNKNOWN`**, mandating local laboratory core testing.

---

## 2. Fixed Prototype Location & Climate Profile

```
Location: Green Valley, Pima County, Arizona, USA
Coordinates: 31.8543°N, -111.0000°W
Elevation: 962 m MSL
Sonoran Desert Upper Valley (Santa Cruz River Basin)
```

### NASA POWER 5-Year Observation Summary (2021-01-01 to 2025-12-31)

| Parameter Code | Environmental Parameter | 5-Year Mean / Record | Agronomic Relevance |
|---|---|---|---|
| **T2M** | Temperature at 2 Meters | **20.5°C** (Annual Mean) | Baseline thermal energy for crop physiological activity |
| **T2M_MAX** | Maximum Daily Temperature | **44.99°C** (June 15, 2021) | Heat stress, flower abortion, and thermal shutdown threshold |
| **T2M_MIN** | Minimum Daily Temperature | **-4.43°C** (January 8, 2024) | Tissue freezing, frost kill, and cold chilling requirements |
| **PRECTOTCORR** | Precipitation (Corrected) | **306.8 mm/year** (Total: 1,534.2 mm) | Demonstrates severe deficit; dictates mandatory irrigation |
| **RH2M** | Relative Humidity at 2 Meters | **32.4%** (Summer pre-monsoon min: 18.2%) | Vapor Pressure Deficit (VPD), high evapotranspiration demand |
| **WS10M** | Wind Speed at 10 Meters | **3.6 m/s** (Spring gust peak > 14 m/s) | Desiccation risk, physical blossom abrasion, windbreak requirement |
| **ALLSKY_SFC_SW_DWN** | Solar Irradiance | **21.12 MJ/m²/day** (Summer peak > 30 MJ) | Abundant photosynthetic potential; shade cloth required for sunscald |
| **GWETTOP** | Surface Soil Wetness (0–5 cm) | **0.14** (Fraction 0–1) | Extreme upper surface drying in arid desert conditions |
| **GWETROOT** | Root-Zone Wetness (0–100 cm) | **0.21** (Fraction 0–1) | Inadequate natural soil moisture for commercial vegetable root zones |
| **GWETPROF** | Profile Wetness | **0.26** (Fraction 0–1) | Deep subsoil moisture status |

---

## 3. Crop Catalog Specifications

The initial GAIA catalog evaluates 15 vegetable crops specified in the MVP requirements. Every crop profile is backed by peer-reviewed research from the University of Arizona Cooperative Extension (Bulletins AZ1005: *Ten Steps to a Successful Vegetable Garden* and AZ1435: *Vegetable Planting Calendar for Low and Mid Elevation Deserts*) and the FAO EcoCrop database.

| # | Crop Name | Botanical Family | Category | Thermal Range (Optimum) | Frost Tolerance | Heat Tolerance | Water Need | UA Planting Window (Green Valley) |
|---|---|---|---|---|---|---|---|---|
| 1 | **Garlic** | *Alliaceae* | Cool Season | 10–25°C (13–18°C) | Hardy (-10°C) | Moderate (stops bulbing >30°C) | Medium (450 mm) | Oct 1 – Nov 15 (Harvest: May–June) |
| 2 | **Onion** | *Alliaceae* | Cool Season | 12–25°C (15–20°C) | Hardy (-5°C) | Moderate (stops bulbing >32°C) | Medium (450 mm) | Oct 15 – Nov 30 (Short-day types) |
| 3 | **Spinach** | *Amaranthaceae* | Cool Season | 5–22°C (10–18°C) | Very Hardy (-8°C) | Low (bolts >24°C) | Low-Med (350 mm) | Oct 1 – Jan 31 (Harvest: Dec–April) |
| 4 | **Lettuce** | *Asteraceae* | Cool Season | 7–24°C (15–20°C) | Tolerant (-3°C) | Low (bolts/bitter >26°C) | Medium (350 mm) | Oct 1 – Jan 15 (Harvest: Dec–April) |
| 5 | **Broccoli** | *Brassicaceae* | Cool Season | 10–24°C (15–18°C) | Hardy (-5°C) | Low (buttoning >26°C) | Medium (450 mm) | Sep 15 – Nov 15 (Harvest: Dec–March) |
| 6 | **Cabbage** | *Brassicaceae* | Cool Season | 10–24°C (15–20°C) | Hardy (-6°C) | Low (splits >28°C) | Medium (450 mm) | Sep 15 – Nov 30 (Harvest: Jan–April) |
| 7 | **Carrot** | *Apiaceae* | Cool Season | 10–24°C (15–20°C) | Hardy (-4°C) | Low (bitter/pale >28°C) | Medium (400 mm) | Sep 1 – Feb 15 (Harvest: Dec–May) |
| 8 | **Potato** | *Solanaceae* | Cool/Mild | 10–28°C (16–22°C) | Sensitive (-1°C) | Moderate (tuber stop >26°C) | Medium (500 mm) | Feb 1 – Mar 15 & Aug 15 – Sep 15 |
| 9 | **Okra** | *Malvaceae* | Warm Season | 18–38°C (24–35°C) | Sensitive (<4°C) | **Exceptional (>42°C)** | Med-High (500 mm) | Apr 1 – Jun 30 (Harvest: Jul–Oct) |
| 10 | **Tomato** | *Solanaceae* | Warm Season | 15–32°C (21–27°C) | Sensitive (<2°C) | Low-Med (blossom drop >32°C) | High (600 mm) | Mar 1 – Apr 15 & Jul 15 – Aug 15 |
| 11 | **Pepper** | *Solanaceae* | Warm Season | 16–32°C (21–28°C) | Sensitive (<3°C) | Moderate (blossom drop >35°C) | Medium (500 mm) | Mar 1 – Apr 15 & Jul 15 – Aug 10 |
| 12 | **Eggplant** | *Solanaceae* | Warm Season | 18–35°C (24–30°C) | Sensitive (<4°C) | Moderate (blossom drop >36°C) | Medium (500 mm) | Mar 15 – Apr 30 & Jul 15 – Aug 1 |
| 13 | **Cucumber** | *Cucurbitaceae* | Warm Season | 16–32°C (22–28°C) | Sensitive (<2°C) | Moderate (bitter/abort >35°C) | High (500 mm) | Mar 15 – Apr 30 & Aug 1 – Aug 31 |
| 14 | **Zucchini** | *Cucurbitaceae* | Warm Season | 15–32°C (20–28°C) | Sensitive (<2°C) | Moderate (mildew/abort >35°C) | Medium (450 mm) | Mar 1 – Apr 15 & Aug 1 – Sep 1 |
| 15 | **Green Beans** | *Fabaceae* | Warm Season | 15–30°C (18–25°C) | Sensitive (<2°C) | Low (pollen kill >30°C) | Medium (400 mm) | Mar 1 – Apr 15 & Aug 1 – Sep 1 |

---

## 4. Deterministic 7-Factor Evaluation Engine

To prevent subjective bias and arbitrary scoring weights, GAIA evaluates crops across 7 independent, fully documented scientific factors. Each factor receives an objective status (`optimal`, `favorable`, `caution`, `restrictive`, or `unknown`):

```
+-------------------------------------------------------------------------------+
|                       GAIA 7-FACTOR SUITABILITY MATRIX                        |
+-------------------------------------------------------------------------------+
| 1. Temperature Range Compatibility (NASA T2M vs. Crop Physiological Range)    |
| 2. Heat Stress & Thermal Maxima (NASA T2M_MAX vs. Reproductive Heat Ceiling)  |
| 3. Frost Exposure & Winter Minimum (NASA T2M_MIN vs. Tissue Freeze Threshold) |
| 4. Rainfall Deficit & Irrigation (NASA PRECTOTCORR vs. FAO ETc Water Need)   |
| 5. Solar Irradiance Compatibility (NASA ALLSKY_SFC_SW_DWN vs. Photosynthesis) |
| 6. Seasonal Window Alignment (UA Cooperative Extension Planting Calendars)    |
| 7. Soil Chemistry & Physical Texture (EXPLICITLY UNKNOWN - Laboratory Mandated)|
+-------------------------------------------------------------------------------+
```

### Classification Criteria:
- **`Suitable with Irrigation in Season` (9 Crops)**: Crops whose seasonal temperature window aligns with Green Valley's climate, where heat and frost risks are readily managed within that window, and where solar irradiance is optimal. Requires pressurized irrigation.
- **`Conditionally Suitable (Risk Management Required)` (6 Crops)**: Crops that encounter severe physiological barriers during part of the year (e.g., extreme summer flower abortion or winter frost kill). Cultivation is strictly restricted to narrow spring or fall windows and requires specialized interventions (shade cloth, temporary row covers).
- **`High Climate Risk / Unsuitable Window` (0 Crops)**: Assigned if a crop cannot achieve economic maturity in any Green Valley season without a fully climate-controlled commercial greenhouse.

---

## 5. Crop Recommendation Results

### Group A: Top Recommended Crops (Suitable with Irrigation in Season)

1. **Garlic (*Allium sativum*)**
   - *Classification*: Suitable with Irrigation in Season
   - *Best Window*: Fall Planting (October 1 – November 15); Harvest in May–June.
   - *Supporting Evidence*: Fall-to-winter mean temperature (12.7°C) satisfies cold vernalization requirements without freeze injury (tolerates -10°C; Green Valley 5-year low: -4.43°C).
   - *Management*: Plant softneck or Creole varieties (e.g., 'Ajo Rojo', 'Inchelium Red') which do not require prolonged extreme chilling.

2. **Onion (*Allium cepa*)**
   - *Classification*: Suitable with Irrigation in Season
   - *Best Window*: Fall Planting (October 15 – November 30); Harvest in May–June.
   - *Supporting Evidence*: Short-day cultivars bulb reliably as daylength increases past 11–12 hours in April. Winter sunshine (15–20 MJ/m²/day) drives rapid bulb sizing.
   - *Management*: Select short-day desert varieties ('Texas Early White', 'Grano', 'Yellow Granex'). Maintain shallow drip lines to avoid tip burn.

3. **Spinach (*Spinacia oleracea*)**
   - *Classification*: Suitable with Irrigation in Season
   - *Best Window*: Autumn & Winter Season (October 1 – January 31); Harvest in December–April.
   - *Supporting Evidence*: Highly cold tolerant (survives -8°C). Mild winter days (15–20°C max) generate rapid foliar growth without thermal bolting.
   - *Management*: Stop sowing by mid-February as soil temperatures rising above 22°C trigger premature flowering.

4. **Lettuce (*Lactuca sativa*)**
   - *Classification*: Suitable with Irrigation in Season
   - *Best Window*: Fall to Winter Window (October 1 – January 15); Harvest in November–April.
   - *Supporting Evidence*: Romaine, butterhead, and looseleaf cultivars thrive in daytime temperatures between 15°C and 22°C. Winter solar levels provide high yields without leaf bitterness.
   - *Management*: Provide light frost protection (row cover) if night temperatures are forecast below -2°C.

5. **Broccoli (*Brassica oleracea* var. *italica*)**
   - *Classification*: Suitable with Irrigation in Season
   - *Best Window*: Fall Season (September 15 – November 15); Harvest in December–March.
   - *Supporting Evidence*: Curd formation requires cool nights (8–14°C) and mild days (15–20°C). Green Valley winters provide ideal heading conditions.
   - *Management*: Avoid late winter plantings; harvesting must conclude before April temperatures trigger flower loosening and yellowing.

6. **Cabbage (*Brassica oleracea* var. *capitata*)**
   - *Classification*: Suitable with Irrigation in Season
   - *Best Window*: Fall Season (September 15 – November 30); Harvest in January–April.
   - *Supporting Evidence*: Dense head formation is favored by Green Valley's dry, sunny winter days. Freeze events (-4°C) sweeten the leaves by converting starches to sugars.
   - *Management*: Mulch heavily to conserve root-zone moisture during dry winter spells.

7. **Carrot (*Daucus carota*)**
   - *Classification*: Suitable with Irrigation in Season
   - *Best Window*: Autumn to Late Winter (September 1 – February 15); Harvest in December–May.
   - *Supporting Evidence*: Taproot elongation is optimal at soil temperatures of 15–18°C. Cool winter temperatures produce exceptionally sweet, deep orange roots.
   - *Management*: Requires friable, stone-free sandy loam. In heavy or compacted soils, plant Nantes or Danvers half-long varieties.

8. **Potato (*Solanum tuberosum*)**
   - *Classification*: Suitable with Irrigation in Season
   - *Best Window*: Window 1 (February 1 – March 15); Window 2 (August 15 – September 15).
   - *Supporting Evidence*: Spring and fall windows provide the necessary 16–22°C vegetative threshold.
   - *Management*: Harvest spring potatoes promptly by late May/early June before soil temperatures reach 26°C (which completely halts tuberization).

9. **Okra (*Abelmoschus esculentus*)**
   - *Classification*: Suitable with Irrigation in Season
   - *Best Window*: Warm Summer Season (April 1 – June 30); Continuous harvest July–October.
   - *Supporting Evidence*: The standout warm-season crop for Green Valley. Thrives in full desert sun (>30 MJ/m²/day) and sustained temperatures above 35°C–40°C where all other vegetables suffer blossom drop.
   - *Management*: Direct seed once soil temperatures exceed 20°C. Harvest pods every 2–3 days to maintain productivity.

---

### Group B: Conditionally Suitable Crops (Risk Management Required)

1. **Tomato (*Solanum lycopersicum*)**
   - *Risks*: Severe summer blossom drop when temperatures exceed 32°C–35°C; pollen becomes sterile. Plants suffer frost injury below 2°C and mortality at 0°C.
   - *Strategy*: Grow in two distinct split windows:
     - *Spring Window*: Transplant March 1–20; harvest May to early July before peak heat.
     - *Monsoon/Fall Window*: Transplant July 20–August 15; harvest October to late November before frost.
   - *Intervention*: Erect 30% shade cloth from late May through June; maintain uniform drip irrigation to prevent blossom-end rot.

2. **Pepper (*Capsicum annuum* - Bell & Chile)**
   - *Risks*: Pollen sterility and flower drop above 35°C; fruit sunscald under intense solar irradiance (peak >30 MJ/m²/day); high frost sensitivity (<3°C).
   - *Strategy*: Native chile varieties ('Anaheim', 'Poblano', 'Jalapeño') exhibit superior heat resilience compared to large bell peppers.
   - *Intervention*: Use shade cloth to eliminate sunscald; shelter young plants from drying spring winds (mean 3.6 m/s, gusts >14 m/s).

3. **Eggplant (*Solanum melongena*)**
   - *Risks*: Slightly more heat tolerant than tomato, but fruit set halts during sustained 40°C heat waves; killed by frost.
   - *Strategy*: Transplant late March; harvest through July and again in September–October.
   - *Intervention*: Drip irrigation with deep root wetting; remove sunburned fruit promptly.

4. **Cucumber (*Cucumis sativus*)**
   - *Risks*: High evapotranspiration demand; extreme heat (>35°C) and low humidity (<20%) induce severe fruit bitterness, misshapen fruit, and powdery mildew.
   - *Strategy*: Trellis under morning-sun/afternoon-shade orientation; plant in early March or early August.
   - *Intervention*: Thick organic mulch (straw/wood shavings) to maintain root coolness; avoid overhead watering.

5. **Zucchini / Summer Squash (*Cucurbita pepo*)**
   - *Risks*: Rapid growth, but female flower production drops sharply above 35°C; squash vine borer and powdery mildew flare up during late summer monsoon moisture.
   - *Strategy*: Plant early March for heavy May/June harvest. Plant August 1 for quick October harvest.
   - *Intervention*: Inspect vines weekly; use floating row covers until flowering begins.

6. **Green Beans (*Phaseolus vulgaris*)**
   - *Risks*: High sensitivity to desert heat. Temperatures exceeding 30°C–32°C cause flowers to drop without setting pods; dry spring winds cause desiccation.
   - *Strategy*: Plant as soon as frost risk passes (March 1–15) to mature before the June heat spike, or direct seed August 1–15 for fall harvest.
   - *Intervention*: Consider tepary beans (*Phaseolus acutifolius*) as an ultra-heat and drought-resilient local alternative.

---

## 6. Seasonal Planting Calendar Matrix

Based on University of Arizona Cooperative Extension Bulletin AZ1435:

```
+---------------+-----+-----+-----+-----+-----+-----+-----+-----+-----+-----+-----+-----+
| CROP          | JAN | FEB | MAR | APR | MAY | JUN | JUL | AUG | SEP | OCT | NOV | DEC |
+---------------+-----+-----+-----+-----+-----+-----+-----+-----+-----+-----+-----+-----+
| Garlic        |     |     |     |     | [H] | [H] |     |     |     | [P] | [P] |     |
| Onion         |     |     |     |     | [H] | [H] |     |     |     | [P] | [P] |     |
| Spinach       | [P] |     |     |     |     |     |     |     |     | [P] | [P] | [P] |
| Lettuce       | [P] |     |     |     |     |     |     |     |     | [P] | [P] | [P] |
| Broccoli      |     |     |     |     |     |     |     |     | [P] | [P] | [P] | [H] |
| Cabbage       |     |     |     |     |     |     |     |     | [P] | [P] | [P] |     |
| Carrot        | [P] | [P] |     |     | [H] |     |     |     | [P] | [P] | [P] | [P] |
| Potato        |     | [P] | [P] |     | [H] |     |     | [P] | [P] |     | [H] | [H] |
| Okra          |     |     |     | [P] | [P] | [P] | [H] | [H] | [H] | [H] |     |     |
| Tomato        |     |     | [P] | [P] | [H] | [H] | [P] | [P] |     | [H] | [H] |     |
| Pepper        |     |     | [P] | [P] |     | [H] | [P] | [P] |     | [H] | [H] |     |
| Eggplant      |     |     | [P] | [P] |     | [H] | [P] |     |     | [H] | [H] |     |
| Cucumber      |     |     | [P] | [P] | [H] | [H] |     | [P] |     | [H] |     |     |
| Zucchini      |     |     | [P] | [P] | [H] | [H] |     | [P] | [P] | [H] | [H] |     |
| Green Beans   |     |     | [P] | [P] | [H] |     |     | [P] | [P] | [H] |     |     |
+---------------+-----+-----+-----+-----+-----+-----+-----+-----+-----+-----+-----+-----+
Legend: [P] = Planting / Seeding / Transplanting Window | [H] = Harvesting Window
```

---

## 7. AI Advisor System Architecture

The GAIA AI Crop Advisor provides natural-language agricultural context by combining deterministic evaluation data with LLM reasoning (Google Gemini 2.5 Flash / Ollama local models):

```
+-------------------------------------------------------------------------------+
|                        GAIA AI ADVISOR PIPELINE                               |
+-------------------------------------------------------------------------------+
|  NASA POWER 5-Yr Observations  +  UA Extension Crop Requirements (Catalog)    |
|                                |                                              |
|                                v                                              |
|               Deterministic 7-Factor Suitability Engine                       |
|               (Evaluates 15 crops -> Objective Categorization)                |
|                                |                                              |
|                                v                                              |
|            Prompt Engineering with Anti-Hallucination Guardrails              |
|                                |                                              |
|                                v                                              |
|         Google Gemini 2.5 Flash (or Ollama Fallback Engine)                   |
|                                |                                              |
|                                v                                              |
|     5 Structured Farmer-Friendly Report Sections (A, B, C, D, E)              |
+-------------------------------------------------------------------------------+
```

### Safety and Anti-Hallucination Guardrails:
1. **No Invented Soil Chemistry**: The prompt and engine strictly prohibit claiming that satellite data measures soil pH, nitrogen, phosphorus, potassium, or electrical conductivity.
2. **No Guaranteed Yields**: The AI advisor never guarantees tons/acre or commercial profitability; it evaluates climatic and seasonal compatibility.
3. **No Unlicensed Fertilizer Prescriptions**: The advisor does not prescribe chemical fertilizer dosages without on-site soil testing.
4. **Resilient Fallback**: If remote AI endpoints experience rate limiting or network latency, the system seamlessly serves a pre-computed deterministic advisory report verified against UA Extension AZ1005.

---

## 8. Verification and Test Results

The GAIA Crop Recommendation module has been verified through automated unit tests and live API integration tests:

### Test Suite Execution Summary:
- **Unit Test Runner**: Node.js built-in runner (`node --test`)
- **Unit Test File**: `tests/suitability-engine.test.ts`
  - Total Tests: **12 passed, 0 failed, 0 skipped**
  - Verified Catalog Completeness: Exactly 15 crops evaluated.
  - Verified Cool Season Classifications: Garlic, Onion, Spinach, Lettuce, Broccoli, Cabbage, Carrot classified as `Suitable with Irrigation in Season`.
  - Verified Okra Heat Tolerance: Correctly classified as `Suitable with Irrigation in Season`.
  - Verified Warm-Season Risk Management: Tomato, Pepper, Beans, Cucumber, Zucchini classified as `Conditionally Suitable`.
  - Verified Scientific Transparency: Soil suitability strictly evaluated as `unknown` with mandatory lab testing guidance.
- **Integration Test File**: `tests/api-integration.test.ts`
  - Total Tests: **2 passed, 0 failed**
  - `GET /api/crops`: Returns HTTP 200, status `Success`, 15 crop evaluations, and Green Valley metadata.
  - `POST /api/crops/advisor`: Returns HTTP 200, status `Success`, provider `Google Gemini`, and all 5 structured report sections.

---

## 9. Known Scientific & Practical Limitations

1. **Spatial Resolution vs. Microclimates**: NASA POWER data is provided at a 0.5° latitude by 0.625° longitude resolution (~50 km x 60 km grid cell). While regional temperatures and solar irradiance are highly accurate, individual farm parcels may experience microclimatic variations due to cold air drainage in the Santa Cruz River basin or localized wind eddies.
2. **Satellite Limitations on Soil Properties**: Earth-observing satellites measure topsoil dielectric constants (estimating surface moisture fraction), but cannot determine soil pH, salinity (EC), caliche depth, texture, or nutrient availability. Farmers must conduct certified soil lab testing before investing in seed or infrastructure.
3. **Water Dependency**: Arid desert farming requires assured water delivery. Surface water in southern Arizona is governed by strict water rights, and well water may contain elevated sodium or bicarbonates. Water quality testing is strongly recommended alongside soil testing.

---

## 10. Document Sign-Off

- **Lead Engineer / Agronomic Data Specialist**: GAIA Architecture Team
- **Validation Dataset**: NASA POWER Daily Point API (1,826 Observations, 2021–2025)
- **Status**: Production-Ready Prototype MVP
- **Next Planned Milestone**: In-situ soil sensor IoT integration and multi-zone GIS mapping.
