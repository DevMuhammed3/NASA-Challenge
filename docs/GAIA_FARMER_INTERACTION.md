# GAIA — Farmer Interaction & Farm Intelligence System

## 1. Vision & Architecture Overview

The GAIA Farmer Interaction & Farm Intelligence System upgrades GAIA from a read-only agroclimatic dashboard into a bi-directional **Agricultural Decision Support System (ADSS)**.

The system combines:
1. **Verified External Scientific Data**: NASA POWER (5-year gridded solar, temperature, precipitation, humidity, wind, and soil moisture), NASA GIBS (satellite imagery), and USDA NRCS SSURGO (soil survey map units).
2. **Farmer-Provided Ground Truth**: Farm boundaries, field subdivisions, soil test lab reports, well depth/irrigation data, historical crop rotations, and operational cost structures.
3. **Deterministic Mathematical Engines**: Objective suitability scoring, enterprise budget accounting, and multi-tier financial scenario stress tests.
4. **Strictly Grounded AI Synthesizers**: Google Gemini and local Ollama instances constrained to explain verified inputs and mathematical outputs without hallucinating unmeasured soil pH, water availability, or commodity prices.

---

## 2. Multi-Step Progressive Onboarding Flow

Farmers are never forced into an all-at-once overwhelming form. Each step features:
- Clear separation between **Required** and **Optional** fields.
- Ubiquitous **"I don't know"** options to prevent guessing.
- Explicit **Save as Draft** & **Continue Later** capabilities.
- Real-time **Dimensional Completeness** tracking.

### Step 1: Farm & Field Geometry
- **Farm Metadata**: Name, region, production system (open field, protected greenhouse, or dual).
- **Map-Based Boundary Drawing**: Powered by Leaflet vector tools. Farmers can draw a polygon around their farm, edit vertices, calculate geodesic acreage/hectares, or manually type land area if drawing is unavailable.
- **Field Subdivisions**: Partitioning farm acreage into distinct management zones (e.g., North Block, Drip Sector A).
- **Default Baseline**: Green Valley, Pima County, Arizona (`31.8543°N`, `-111.0000°W`) remains the default reference region.

### Step 2: Soil Profile & Laboratory Diagnostic
- **Physical & Chemical Metrics**: Texture class, soil order, pH, Electrical Conductivity ($EC_e$), organic matter, available $N-P-K$, and drainage class.
- **Laboratory Report Upload**: Support for PDF and image uploads of certified lab soil tests with sampling date, depth range ($0-30\text{ cm}$ vs $30-60\text{ cm}$), and assigned field.
- **Verification Quarantine**: Uploaded reports are marked as `pending_review` until validated, never contaminating automated algorithms without provenance.

### Step 3: Water Resources & Irrigation Infrastructure
- **Source Classification**: Deep aquifer well (Santa Cruz basin lift depth), municipal reclaimed, surface canal, river, or rainwater catchment.
- **Quantitative Availability**: Pumping capacity (GPM), seasonal curtailments, and estimated volumetric cost ($\$/\text{acre-foot}$ or $\$ / 1000\text{ gal}$).
- **Delivery System**: Subsurface/surface drip (DU > 85%), overhead center pivot, micro-sprinkler, or gravity flood.
- **Water Chemistry**: Salinity ($EC_w$, TDS in ppm), sodium adsorption ratio (SAR), and pH.

### Step 4: Multi-Season Crop History
- **Historical Records (Previous 3–5 Years)**: For each field, recording predecessor crops, planting/harvest dates, harvested yield ($\text{lbs/acre}$ or $\text{tons/ha}$), fertilizer applications, pest infestations, and farmer self-assessment.
- **Scientific Value**: Feeds the crop rotation engine to calculate nitrogen carryover credits and break disease cycles (e.g., soil-borne *Verticillium* or *Fusarium*).

### Step 5: Farm Economics & Enterprise Budgeting
- **Configurable Operational Inputs**: Seedling prices, fertilizer $\$/\text{ton}$, agricultural electricity/fuel pumping rates, hourly seasonal labor rates, packaging containers, and transport logistics.
- **Currency Agnostic**: Supports USD, EUR, EGP, and custom regional currencies.

### Step 6: Farmer Objectives, Preferences & Risk Appetite
- **Core Optimization Goals**: Maximize net profit, minimize groundwater consumption, reduce capital exposure, or optimize soil organic matter.
- **Crop Inclusions & Exclusions**: Specific crops the farmer prefers or strictly rejects (e.g., lack of cold storage for leafy greens), with recorded rationales.

---

## 3. Season & Activity Management

Farmers actively track live growing cycles for each field:
1. **Season Lifecycle**: `Planned` $\rightarrow$ `Active` $\rightarrow$ `Harvested` $\rightarrow$ `Archived`.
2. **Activity Logging**:
   - **Irrigation**: Date, volume (inches or gallons), duration, method.
   - **Fertigation / Fertilization**: Date, product, rate, active nutrient formulation (NPK).
   - **Plant Protection**: Date, target pest/weed, product name, application method, safety intervals.
   - **Cultural Practices**: Planting, transplanting, thinning, weeding, pruning, row cover installation.
   - **Harvest Log**: Harvest date, total harvested weight, marketable packout percentage, realized farm-gate unit price, gross revenue, and post-harvest notes.

---

## 4. Feedback & Continuous Evaluation

To evaluate model accuracy against real-world Sonoran agriculture:
- **Recommendation Decisions**: Farmers can Accept, Defer, or Reject a GAIA recommendation.
- **Rejection Reasons**: Lack of machinery, poor local wholesale buyer interest, excessive water demand, or personal preference.
- **Harvest Ground Truth Comparison**: Comparing expected enterprise budget net margins against actual harvest revenue without silently modifying scientific physics parameters.
