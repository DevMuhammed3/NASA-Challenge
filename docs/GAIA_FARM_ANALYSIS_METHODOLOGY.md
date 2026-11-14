# GAIA — Farm Analysis Methodology & Decision Support System

## 1. Principles of Integration

The GAIA Farm Analysis Engine fuses:
1. **Remote Geospatial Telemetry (Coarse Gridded)**:
   - NASA POWER: $0.5^\circ \times 0.625^\circ$ gridded climatological resolution.
   - USDA SSURGO: Map Unit polygon resolution (e.g., Map Unit 53844, 1:24,000 scale).
2. **On-Farm Ground Observations (Point & Polygon)**:
   - Farmer field boundaries, soil lab test results, and water pump flow meters.

### Spatial Disambiguation Rule
- Regional gridded data (NASA POWER) is explicitly documented as **Regional Model Representation** ($\sim 50\text{ km}$ grid resolution).
- NRCS SSURGO is explicitly documented as **Regional Soil Survey Baseline** (Map Unit polygon approximation).
- Only lab tests and farm water meters are classified as **Direct On-Farm Measurements**.

---

## 2. Dimensional Suitability Scoring

GAIA does not collapse all data into a misleading single score when critical data is missing. Instead, it evaluates **7 distinct dimensions**:

### Dimension 1: Climate Suitability
- **Inputs**: NASA POWER 5-Year historical observations (2021–2025).
- **Metrics**: Thermal window compatibility (T2M daily, T2M_MAX, T2M_MIN frost risk), cumulative heat units, and solar radiation.
- **Output**: `Suitable in Season`, `Conditionally Suitable`, or `Unsuitable`.

### Dimension 2: Soil Suitability
- **Inputs**: Lab soil tests or farmer-provided metrics.
- **Rule**: If lab test is missing, Soil Suitability is strictly evaluated as `UNKNOWN / LAB TEST REQUIRED`.
- **Metrics**: Root depth penetration, salinity tolerance ($EC_e < 2.5\text{ dS/m}$ for sensitive vegetables), and pH buffering (alkaline soils $7.8-8.2$ demand sulfur/acidification).

### Dimension 3: Water Availability & Irrigation Suitability
- **Inputs**: Farmer's water source, GPM pumping capacity, delivery method (drip vs flood), and water salinity ($EC_w$).
- **Rule**: Never assume groundwater availability equals farm irrigation rights. Pumping lift costs and delivery infrastructure dictate real suitability.

### Dimension 4: Crop Rotation & Soil Health
- **Inputs**: Previous crop history for the target field.
- **Rule**:
  - Legume predecessor (e.g., Faba bean) provides $+15\text{ kg N/ha}$ credit and prevents root pathogen buildup.
  - Solanaceous predecessor (e.g., Tomato) prohibits consecutive Solanaceous planting (Eggplant, Pepper) to avoid nematode and blight buildup.

### Dimension 5: Seasonal Suitability
- **Inputs**: Current calendar date and University of Arizona Planting Calendar (AZ1435).
- **Rule**: Planting outside verified extension windows automatically triggers risk warnings.

### Dimension 6: Economic Viability
- **Inputs**: Farmer's specific budget, custom cost structure, and USDA AMS Phoenix Shipping Point wholesale prices.
- **Rule**: Calculates custom break-even prices and net margins matching the farm's exact acreage and capital constraints.

### Dimension 7: Data Confidence & Missing Information
- **Output**: Farm Data Completeness report broken down by domain (Location, Climate, Soil, Water, History, Economics).
- **Impact Statement**: Explains exactly what diagnostic or data is required to advance from preliminary guidance to certified agronomic planning.
