/**
 * Verified Crop Catalog for Low-to-Mid Desert Climates (Green Valley, AZ)
 *
 * Requirements sources:
 * 1. University of Arizona Cooperative Extension:
 *    - Publication AZ1005 ("Ten Steps to a Successful Vegetable Garden")
 *    - Publication AZ1435 ("Vegetable Planting Calendar for Low and Mid Elevation Deserts")
 * 2. Food and Agriculture Organization (FAO):
 *    - FAO EcoCrop Database (ecocrop.fao.org)
 *    - FAO Irrigation and Drainage Paper 56 (Crop Evapotranspiration)
 * 3. USDA Agricultural Research Service (ARS) Crop Profiles
 */

export interface CropReference {
  id: string;
  name: string;
  scientificName: string;
  botanicalFamily: string;
  category: "cool_season" | "warm_season";
  suitableTempRange: {
    min: number; // minimum threshold for active vegetative growth (°C)
    optMin: number; // lower bound of optimal growth window (°C)
    optMax: number; // upper bound of optimal growth window (°C)
    max: number; // upper limit where heat stress / pollen sterility sets in (°C)
  };
  temperatureToleranceLimits: {
    absoluteMin: number; // temperature causing severe injury or death (°C)
    absoluteMax: number; // temperature causing thermal shutdown or mortality (°C)
  };
  growingSeasonDurationDays: {
    min: number;
    max: number;
  };
  frostSensitivity: "highly_sensitive" | "sensitive" | "moderate" | "tolerant";
  heatSensitivity: "high" | "moderate" | "low" | "tolerant";
  waterRequirements: {
    category: "low" | "medium" | "high";
    seasonalNeedMm: number; // typical crop evapotranspiration (ETc) in mm
    description: string;
  };
  solarRequirements: "full_sun" | "full_sun_or_partial_shade";
  suitablePlantingWindows: {
    seasonName: string;
    startMonth: number; // 1-12
    endMonth: number; // 1-12
    plantingMethod: "direct_seed" | "transplant" | "direct_or_transplant" | "sets_or_cloves";
    harvestWindow: string;
  }[];
  soilRequirements: {
    preferredPhMin: number;
    preferredPhMax: number;
    salinityTolerance: "sensitive" | "moderately_sensitive" | "moderately_tolerant";
    drainageRequired: string;
    note: string;
  };
  references: {
    primarySource: string;
    sourceUrl: string;
    referenceDate: string;
    secondarySource?: string;
  };
  iconName: string; // Lucide icon or key
}

export const CROP_CATALOG: CropReference[] = [
  {
    id: "tomato",
    name: "Tomato",
    scientificName: "Solanum lycopersicum",
    botanicalFamily: "Solanaceae (Nightshade)",
    category: "warm_season",
    suitableTempRange: { min: 15, optMin: 21, optMax: 29, max: 35 },
    temperatureToleranceLimits: { absoluteMin: 2, absoluteMax: 38 },
    growingSeasonDurationDays: { min: 70, max: 95 },
    frostSensitivity: "highly_sensitive",
    heatSensitivity: "high", // blossom drop occurs > 32-35°C
    waterRequirements: {
      category: "high",
      seasonalNeedMm: 600,
      description: "Consistent, deep root-zone moisture required to prevent blossom-end rot and radial fruit cracking.",
    },
    solarRequirements: "full_sun",
    suitablePlantingWindows: [
      {
        seasonName: "Spring Season",
        startMonth: 3,
        endMonth: 4,
        plantingMethod: "transplant",
        harvestWindow: "Late May - Early July (before peak summer heat)",
      },
      {
        seasonName: "Monsoon / Fall Season",
        startMonth: 7,
        endMonth: 8,
        plantingMethod: "transplant",
        harvestWindow: "October - Late November (before winter frost)",
      },
    ],
    soilRequirements: {
      preferredPhMin: 6.0,
      preferredPhMax: 6.8,
      salinityTolerance: "moderately_sensitive",
      drainageRequired: "Well-drained loam or sandy loam",
      note: "Farm soil pH and salinity unmeasured; calcium availability is critical for fruit setting.",
    },
    references: {
      primarySource: "University of Arizona Cooperative Extension, AZ1005 & AZ1435",
      sourceUrl: "https://extension.arizona.edu/pubs/ten-steps-successful-vegetable-garden",
      referenceDate: "2024 Revision",
      secondarySource: "FAO EcoCrop (Ecocrop ID: 1999)",
    },
    iconName: "tomato",
  },
  {
    id: "potato",
    name: "Potato",
    scientificName: "Solanum tuberosum",
    botanicalFamily: "Solanaceae (Nightshade)",
    category: "cool_season",
    suitableTempRange: { min: 10, optMin: 16, optMax: 22, max: 28 },
    temperatureToleranceLimits: { absoluteMin: -1, absoluteMax: 32 },
    growingSeasonDurationDays: { min: 80, max: 110 },
    frostSensitivity: "sensitive", // foliage damaged by hard freeze
    heatSensitivity: "high", // tuberization ceases when soil temp > 24°C
    waterRequirements: {
      category: "medium",
      seasonalNeedMm: 500,
      description: "Steady, uniform moisture; drought stress causes knobby, cracked tubers.",
    },
    solarRequirements: "full_sun",
    suitablePlantingWindows: [
      {
        seasonName: "Late Winter / Early Spring",
        startMonth: 2,
        endMonth: 3,
        plantingMethod: "sets_or_cloves",
        harvestWindow: "May - June (harvest before soil overheats)",
      },
      {
        seasonName: "Late Summer / Fall",
        startMonth: 8,
        endMonth: 9,
        plantingMethod: "sets_or_cloves",
        harvestWindow: "November - December",
      },
    ],
    soilRequirements: {
      preferredPhMin: 5.5,
      preferredPhMax: 6.5,
      salinityTolerance: "sensitive",
      drainageRequired: "Loose, friable sandy loam",
      note: "High soil pH (>7.5) in desert soils promotes potato scab; requires loose soil without rocks.",
    },
    references: {
      primarySource: "University of Arizona Cooperative Extension, AZ1005",
      sourceUrl: "https://extension.arizona.edu/pubs/ten-steps-successful-vegetable-garden",
      referenceDate: "2024 Revision",
      secondarySource: "FAO EcoCrop (Ecocrop ID: 2000)",
    },
    iconName: "potato",
  },
  {
    id: "onion",
    name: "Onion",
    scientificName: "Allium cepa",
    botanicalFamily: "Amaryllidaceae (Allioideae)",
    category: "cool_season",
    suitableTempRange: { min: 8, optMin: 13, optMax: 24, max: 32 },
    temperatureToleranceLimits: { absoluteMin: -6, absoluteMax: 36 },
    growingSeasonDurationDays: { min: 120, max: 175 },
    frostSensitivity: "tolerant", // survives desert winter frosts
    heatSensitivity: "moderate", // heat triggers bulbing and maturity
    waterRequirements: {
      category: "medium",
      seasonalNeedMm: 450,
      description: "Shallow root system requires frequent light irrigations; water stopped 2-3 weeks before harvest.",
    },
    solarRequirements: "full_sun",
    suitablePlantingWindows: [
      {
        seasonName: "Fall Planting (Short-Day Varieties)",
        startMonth: 10,
        endMonth: 11,
        plantingMethod: "transplant",
        harvestWindow: "May - June",
      },
    ],
    soilRequirements: {
      preferredPhMin: 6.0,
      preferredPhMax: 7.2,
      salinityTolerance: "moderately_sensitive",
      drainageRequired: "Friable, fertile loam",
      note: "Desert short-day varieties (e.g. Texas Early Grano, Yellow Granex) are mandatory for Southern Arizona latitude.",
    },
    references: {
      primarySource: "University of Arizona Cooperative Extension, AZ1005 & AZ1435",
      sourceUrl: "https://extension.arizona.edu/pubs/vegetable-planting-calendar-low-mid-elevation-deserts",
      referenceDate: "2024 Revision",
      secondarySource: "FAO EcoCrop (Ecocrop ID: 326)",
    },
    iconName: "onion",
  },
  {
    id: "garlic",
    name: "Garlic",
    scientificName: "Allium sativum",
    botanicalFamily: "Amaryllidaceae (Allioideae)",
    category: "cool_season",
    suitableTempRange: { min: 6, optMin: 12, optMax: 22, max: 30 },
    temperatureToleranceLimits: { absoluteMin: -10, absoluteMax: 35 },
    growingSeasonDurationDays: { min: 150, max: 210 },
    frostSensitivity: "tolerant", // highly cold hardy, benefits from winter chill
    heatSensitivity: "moderate", // summer heat cures mature bulbs
    waterRequirements: {
      category: "medium",
      seasonalNeedMm: 400,
      description: "Consistent irrigation through spring bulb enlargement; taper off when tops begin yellowing.",
    },
    solarRequirements: "full_sun",
    suitablePlantingWindows: [
      {
        seasonName: "Autumn Planting (Softneck / Creole Types)",
        startMonth: 10,
        endMonth: 11,
        plantingMethod: "sets_or_cloves",
        harvestWindow: "Late May - June",
      },
    ],
    soilRequirements: {
      preferredPhMin: 6.0,
      preferredPhMax: 7.2,
      salinityTolerance: "moderately_sensitive",
      drainageRequired: "Well-drained rich loam",
      note: "Softneck (Silverskin, Artichoke) and Creole garlics thrive in Southern Arizona winters with low vernalization requirements.",
    },
    references: {
      primarySource: "University of Arizona Cooperative Extension, AZ1005",
      sourceUrl: "https://extension.arizona.edu/pubs/ten-steps-successful-vegetable-garden",
      referenceDate: "2024 Revision",
      secondarySource: "FAO EcoCrop (Ecocrop ID: 337)",
    },
    iconName: "garlic",
  },
  {
    id: "lettuce",
    name: "Lettuce",
    scientificName: "Lactuca sativa",
    botanicalFamily: "Asteraceae (Daisy)",
    category: "cool_season",
    suitableTempRange: { min: 7, optMin: 13, optMax: 21, max: 26 },
    temperatureToleranceLimits: { absoluteMin: -3, absoluteMax: 30 },
    growingSeasonDurationDays: { min: 45, max: 70 },
    frostSensitivity: "moderate", // tolerates light frosts; severe freezes damage outer leaves
    heatSensitivity: "high", // bolts (flowers) and turns bitter > 27°C
    waterRequirements: {
      category: "medium",
      seasonalNeedMm: 350,
      description: "Very shallow root system; requires frequent light moisture to stay crisp and non-bitter.",
    },
    solarRequirements: "full_sun_or_partial_shade",
    suitablePlantingWindows: [
      {
        seasonName: "Fall to Winter Window",
        startMonth: 9,
        endMonth: 1,
        plantingMethod: "direct_or_transplant",
        harvestWindow: "November - April",
      },
    ],
    soilRequirements: {
      preferredPhMin: 6.0,
      preferredPhMax: 7.0,
      salinityTolerance: "moderately_sensitive",
      drainageRequired: "Moisture-retentive, well-aerated soil",
      note: "Premier commercial winter vegetable crop in southern Arizona / Yuma valley.",
    },
    references: {
      primarySource: "University of Arizona Cooperative Extension, AZ1005 & AZ1435",
      sourceUrl: "https://extension.arizona.edu/pubs/vegetable-planting-calendar-low-mid-elevation-deserts",
      referenceDate: "2024 Revision",
      secondarySource: "FAO EcoCrop (Ecocrop ID: 1332)",
    },
    iconName: "lettuce",
  },
  {
    id: "spinach",
    name: "Spinach",
    scientificName: "Spinacia oleracea",
    botanicalFamily: "Amaranthaceae",
    category: "cool_season",
    suitableTempRange: { min: 5, optMin: 12, optMax: 19, max: 24 },
    temperatureToleranceLimits: { absoluteMin: -7, absoluteMax: 28 },
    growingSeasonDurationDays: { min: 40, max: 55 },
    frostSensitivity: "tolerant", // exceptionally frost hardy
    heatSensitivity: "high", // bolts quickly as daylength and temperatures rise > 24°C
    waterRequirements: {
      category: "medium",
      seasonalNeedMm: 300,
      description: "Requires consistent moisture in top 15 cm of soil.",
    },
    solarRequirements: "full_sun_or_partial_shade",
    suitablePlantingWindows: [
      {
        seasonName: "Autumn & Winter Season",
        startMonth: 10,
        endMonth: 1,
        plantingMethod: "direct_seed",
        harvestWindow: "December - March",
      },
    ],
    soilRequirements: {
      preferredPhMin: 6.5,
      preferredPhMax: 7.5,
      salinityTolerance: "moderately_tolerant",
      drainageRequired: "Rich loam with good organic matter",
      note: "More tolerant of alkaline desert soils than most greens; excellent cold resilience.",
    },
    references: {
      primarySource: "University of Arizona Cooperative Extension, AZ1005",
      sourceUrl: "https://extension.arizona.edu/pubs/ten-steps-successful-vegetable-garden",
      referenceDate: "2024 Revision",
      secondarySource: "FAO EcoCrop (Ecocrop ID: 2011)",
    },
    iconName: "spinach",
  },
  {
    id: "cucumber",
    name: "Cucumber",
    scientificName: "Cucumis sativus",
    botanicalFamily: "Cucurbitaceae (Gourd)",
    category: "warm_season",
    suitableTempRange: { min: 16, optMin: 22, optMax: 30, max: 35 },
    temperatureToleranceLimits: { absoluteMin: 5, absoluteMax: 38 },
    growingSeasonDurationDays: { min: 50, max: 70 },
    frostSensitivity: "highly_sensitive", // frost kills immediately
    heatSensitivity: "moderate", // high heat causes bitterness and predominantly male flowers
    waterRequirements: {
      category: "high",
      seasonalNeedMm: 500,
      description: "High water requirement; drought stress results in curved, bitter fruit.",
    },
    solarRequirements: "full_sun",
    suitablePlantingWindows: [
      {
        seasonName: "Spring Season",
        startMonth: 3,
        endMonth: 4,
        plantingMethod: "direct_or_transplant",
        harvestWindow: "Late May - Early July",
      },
      {
        seasonName: "Late Summer / Monsoon Window",
        startMonth: 7,
        endMonth: 8,
        plantingMethod: "direct_seed",
        harvestWindow: "September - October",
      },
    ],
    soilRequirements: {
      preferredPhMin: 6.0,
      preferredPhMax: 7.0,
      salinityTolerance: "moderately_sensitive",
      drainageRequired: "Warm, fertile, well-drained soil",
      note: "Trellising protects fruit from hot desert soil surface temperatures.",
    },
    references: {
      primarySource: "University of Arizona Cooperative Extension, AZ1005 & AZ1435",
      sourceUrl: "https://extension.arizona.edu/pubs/vegetable-planting-calendar-low-mid-elevation-deserts",
      referenceDate: "2024 Revision",
      secondarySource: "FAO EcoCrop (Ecocrop ID: 873)",
    },
    iconName: "cucumber",
  },
  {
    id: "pepper",
    name: "Pepper (Sweet & Chile)",
    scientificName: "Capsicum annuum",
    botanicalFamily: "Solanaceae (Nightshade)",
    category: "warm_season",
    suitableTempRange: { min: 16, optMin: 21, optMax: 30, max: 35 },
    temperatureToleranceLimits: { absoluteMin: 4, absoluteMax: 38 },
    growingSeasonDurationDays: { min: 70, max: 100 },
    frostSensitivity: "highly_sensitive",
    heatSensitivity: "moderate", // chile varieties tolerate high heat; bell peppers drop blossoms > 33°C
    waterRequirements: {
      category: "medium",
      seasonalNeedMm: 550,
      description: "Regular irrigation; chile peppers tolerate minor stress, but bell peppers require steady moisture.",
    },
    solarRequirements: "full_sun",
    suitablePlantingWindows: [
      {
        seasonName: "Spring Season",
        startMonth: 3,
        endMonth: 4,
        plantingMethod: "transplant",
        harvestWindow: "June - July and October - November",
      },
    ],
    soilRequirements: {
      preferredPhMin: 6.2,
      preferredPhMax: 7.2,
      salinityTolerance: "moderately_sensitive",
      drainageRequired: "Deep, well-drained sandy loam",
      note: "Southwestern chile peppers are deeply culturally and horticulturally adapted to southern Arizona.",
    },
    references: {
      primarySource: "University of Arizona Cooperative Extension, AZ1005",
      sourceUrl: "https://extension.arizona.edu/pubs/ten-steps-successful-vegetable-garden",
      referenceDate: "2024 Revision",
      secondarySource: "FAO EcoCrop (Ecocrop ID: 622)",
    },
    iconName: "pepper",
  },
  {
    id: "eggplant",
    name: "Eggplant",
    scientificName: "Solanum melongena",
    botanicalFamily: "Solanaceae (Nightshade)",
    category: "warm_season",
    suitableTempRange: { min: 18, optMin: 24, optMax: 32, max: 36 },
    temperatureToleranceLimits: { absoluteMin: 5, absoluteMax: 40 },
    growingSeasonDurationDays: { min: 75, max: 95 },
    frostSensitivity: "highly_sensitive",
    heatSensitivity: "low", // one of the most heat-tolerant solanaceous crops
    waterRequirements: {
      category: "medium",
      seasonalNeedMm: 500,
      description: "Deep watering promotes extensive root systems capable of handling desert summer sun.",
    },
    solarRequirements: "full_sun",
    suitablePlantingWindows: [
      {
        seasonName: "Spring Season",
        startMonth: 3,
        endMonth: 5,
        plantingMethod: "transplant",
        harvestWindow: "July - October",
      },
    ],
    soilRequirements: {
      preferredPhMin: 6.0,
      preferredPhMax: 7.0,
      salinityTolerance: "moderately_sensitive",
      drainageRequired: "Warm, fertile, well-aerated loam",
      note: "Very productive in southern Arizona with adequate drip irrigation.",
    },
    references: {
      primarySource: "University of Arizona Cooperative Extension, AZ1005",
      sourceUrl: "https://extension.arizona.edu/pubs/ten-steps-successful-vegetable-garden",
      referenceDate: "2024 Revision",
      secondarySource: "FAO EcoCrop (Ecocrop ID: 1998)",
    },
    iconName: "eggplant",
  },
  {
    id: "carrot",
    name: "Carrot",
    scientificName: "Daucus carota",
    botanicalFamily: "Apiaceae (Umbelliferae)",
    category: "cool_season",
    suitableTempRange: { min: 7, optMin: 15, optMax: 22, max: 28 },
    temperatureToleranceLimits: { absoluteMin: -4, absoluteMax: 32 },
    growingSeasonDurationDays: { min: 65, max: 85 },
    frostSensitivity: "tolerant", // frost sweetens roots by converting starches to sugars
    heatSensitivity: "high", // high heat makes roots bitter, fibrous, and woody
    waterRequirements: {
      category: "medium",
      seasonalNeedMm: 400,
      description: "Consistent surface moisture is critical for seed germination; deep uniform watering thereafter.",
    },
    solarRequirements: "full_sun",
    suitablePlantingWindows: [
      {
        seasonName: "Autumn to Winter Season",
        startMonth: 9,
        endMonth: 2,
        plantingMethod: "direct_seed",
        harvestWindow: "December - May",
      },
    ],
    soilRequirements: {
      preferredPhMin: 6.0,
      preferredPhMax: 7.0,
      salinityTolerance: "sensitive",
      drainageRequired: "Deeply cultivated, stone-free sandy loam",
      note: "Southern Arizona heavy clay or caliche subsoils cause bifurcated (forked) roots if not amended.",
    },
    references: {
      primarySource: "University of Arizona Cooperative Extension, AZ1005 & AZ1435",
      sourceUrl: "https://extension.arizona.edu/pubs/vegetable-planting-calendar-low-mid-elevation-deserts",
      referenceDate: "2024 Revision",
      secondarySource: "FAO EcoCrop (Ecocrop ID: 940)",
    },
    iconName: "carrot",
  },
  {
    id: "cabbage",
    name: "Cabbage",
    scientificName: "Brassica oleracea var. capitata",
    botanicalFamily: "Brassicaceae (Crucifer)",
    category: "cool_season",
    suitableTempRange: { min: 7, optMin: 14, optMax: 20, max: 26 },
    temperatureToleranceLimits: { absoluteMin: -6, absoluteMax: 30 },
    growingSeasonDurationDays: { min: 75, max: 100 },
    frostSensitivity: "tolerant", // highly frost hardy
    heatSensitivity: "high", // heads fail to form or burst/rot in high temperatures
    waterRequirements: {
      category: "medium",
      seasonalNeedMm: 450,
      description: "Regular, steady irrigation; erratic watering causes head splitting.",
    },
    solarRequirements: "full_sun",
    suitablePlantingWindows: [
      {
        seasonName: "Fall Season",
        startMonth: 9,
        endMonth: 11,
        plantingMethod: "transplant",
        harvestWindow: "January - April",
      },
    ],
    soilRequirements: {
      preferredPhMin: 6.5,
      preferredPhMax: 7.5,
      salinityTolerance: "moderately_tolerant",
      drainageRequired: "Heavy, moisture-retentive loam",
      note: "Well-adapted to winter alkaline soils in southern Arizona valleys.",
    },
    references: {
      primarySource: "University of Arizona Cooperative Extension, AZ1005",
      sourceUrl: "https://extension.arizona.edu/pubs/ten-steps-successful-vegetable-garden",
      referenceDate: "2024 Revision",
      secondarySource: "FAO EcoCrop (Ecocrop ID: 521)",
    },
    iconName: "cabbage",
  },
  {
    id: "broccoli",
    name: "Broccoli",
    scientificName: "Brassica oleracea var. italica",
    botanicalFamily: "Brassicaceae (Crucifer)",
    category: "cool_season",
    suitableTempRange: { min: 8, optMin: 14, optMax: 20, max: 25 },
    temperatureToleranceLimits: { absoluteMin: -5, absoluteMax: 28 },
    growingSeasonDurationDays: { min: 65, max: 90 },
    frostSensitivity: "tolerant", // heads handle light frosts (-2°C) without damage
    heatSensitivity: "high", // heads loosen, open into yellow flowers, and become bitter > 26°C
    waterRequirements: {
      category: "medium",
      seasonalNeedMm: 450,
      description: "Consistent root-zone moisture; stress stunts head formation.",
    },
    solarRequirements: "full_sun",
    suitablePlantingWindows: [
      {
        seasonName: "Fall Season",
        startMonth: 9,
        endMonth: 11,
        plantingMethod: "transplant",
        harvestWindow: "December - March",
      },
    ],
    soilRequirements: {
      preferredPhMin: 6.0,
      preferredPhMax: 7.5,
      salinityTolerance: "moderately_tolerant",
      drainageRequired: "Fertile, well-drained loam",
      note: "Premier cool-season vegetable for Pima County winter gardens.",
    },
    references: {
      primarySource: "University of Arizona Cooperative Extension, AZ1005 & AZ1435",
      sourceUrl: "https://extension.arizona.edu/pubs/vegetable-planting-calendar-low-mid-elevation-deserts",
      referenceDate: "2024 Revision",
      secondarySource: "FAO EcoCrop (Ecocrop ID: 524)",
    },
    iconName: "broccoli",
  },
  {
    id: "zucchini",
    name: "Zucchini (Summer Squash)",
    scientificName: "Cucurbita pepo",
    botanicalFamily: "Cucurbitaceae (Gourd)",
    category: "warm_season",
    suitableTempRange: { min: 16, optMin: 22, optMax: 30, max: 35 },
    temperatureToleranceLimits: { absoluteMin: 3, absoluteMax: 38 },
    growingSeasonDurationDays: { min: 45, max: 60 },
    frostSensitivity: "highly_sensitive",
    heatSensitivity: "moderate", // fast-maturing; avoids peak midsummer heat if timed right
    waterRequirements: {
      category: "medium",
      seasonalNeedMm: 450,
      description: "Deep watering at base; avoid wetting leaves to minimize powdery mildew.",
    },
    solarRequirements: "full_sun",
    suitablePlantingWindows: [
      {
        seasonName: "Spring Season",
        startMonth: 3,
        endMonth: 4,
        plantingMethod: "direct_seed",
        harvestWindow: "May - June",
      },
      {
        seasonName: "Monsoon / Late Summer",
        startMonth: 8,
        endMonth: 9,
        plantingMethod: "direct_seed",
        harvestWindow: "Late September - November",
      },
    ],
    soilRequirements: {
      preferredPhMin: 6.0,
      preferredPhMax: 7.2,
      salinityTolerance: "moderately_sensitive",
      drainageRequired: "Rich, well-drained composted soil",
      note: "Extremely prolific early summer producer in Green Valley.",
    },
    references: {
      primarySource: "University of Arizona Cooperative Extension, AZ1005",
      sourceUrl: "https://extension.arizona.edu/pubs/ten-steps-successful-vegetable-garden",
      referenceDate: "2024 Revision",
      secondarySource: "FAO EcoCrop (Ecocrop ID: 881)",
    },
    iconName: "zucchini",
  },
  {
    id: "green_beans",
    name: "Green Beans (Snap Beans)",
    scientificName: "Phaseolus vulgaris",
    botanicalFamily: "Fabaceae (Legume)",
    category: "warm_season",
    suitableTempRange: { min: 15, optMin: 18, optMax: 27, max: 32 },
    temperatureToleranceLimits: { absoluteMin: 3, absoluteMax: 35 },
    growingSeasonDurationDays: { min: 55, max: 65 },
    frostSensitivity: "highly_sensitive",
    heatSensitivity: "high", // pollen sterility and blossom drop occur > 32°C
    waterRequirements: {
      category: "medium",
      seasonalNeedMm: 400,
      description: "Sensitive to water stress during blooming and pod development.",
    },
    solarRequirements: "full_sun",
    suitablePlantingWindows: [
      {
        seasonName: "Spring Window (Early)",
        startMonth: 3,
        endMonth: 4,
        plantingMethod: "direct_seed",
        harvestWindow: "May - June (must finish before July heat)",
      },
      {
        seasonName: "Monsoon / Late Summer Window",
        startMonth: 8,
        endMonth: 9,
        plantingMethod: "direct_seed",
        harvestWindow: "October - November",
      },
    ],
    soilRequirements: {
      preferredPhMin: 6.0,
      preferredPhMax: 7.0,
      salinityTolerance: "sensitive",
      drainageRequired: "Well-drained loam",
      note: "Bush varieties avoid intense summer wind damage; fixes modest nitrogen with Rhizobium inoculant.",
    },
    references: {
      primarySource: "University of Arizona Cooperative Extension, AZ1005 & AZ1435",
      sourceUrl: "https://extension.arizona.edu/pubs/vegetable-planting-calendar-low-mid-elevation-deserts",
      referenceDate: "2024 Revision",
      secondarySource: "FAO EcoCrop (Ecocrop ID: 1625)",
    },
    iconName: "green_beans",
  },
  {
    id: "okra",
    name: "Okra",
    scientificName: "Abelmoschus esculentus",
    botanicalFamily: "Malvaceae (Mallow)",
    category: "warm_season",
    suitableTempRange: { min: 20, optMin: 25, optMax: 35, max: 40 },
    temperatureToleranceLimits: { absoluteMin: 8, absoluteMax: 45 },
    growingSeasonDurationDays: { min: 60, max: 75 },
    frostSensitivity: "highly_sensitive",
    heatSensitivity: "tolerant", // thrives during extreme Sonoran summer heat > 38°C
    waterRequirements: {
      category: "low",
      seasonalNeedMm: 450,
      description: "Deep taproot provides high drought tolerance, but steady drip irrigation maximizes tender pod yields.",
    },
    solarRequirements: "full_sun",
    suitablePlantingWindows: [
      {
        seasonName: "Warm Summer Season",
        startMonth: 4,
        endMonth: 6,
        plantingMethod: "direct_seed",
        harvestWindow: "July - October (continuous harvest)",
      },
    ],
    soilRequirements: {
      preferredPhMin: 6.0,
      preferredPhMax: 7.5,
      salinityTolerance: "moderately_tolerant",
      drainageRequired: "Tolerates various soils with adequate drainage",
      note: "Top performer for Southern Arizona midsummer heat when other vegetables stall.",
    },
    references: {
      primarySource: "University of Arizona Cooperative Extension, AZ1005",
      sourceUrl: "https://extension.arizona.edu/pubs/ten-steps-successful-vegetable-garden",
      referenceDate: "2024 Revision",
      secondarySource: "FAO EcoCrop (Ecocrop ID: 226)",
    },
    iconName: "okra",
  },
];
