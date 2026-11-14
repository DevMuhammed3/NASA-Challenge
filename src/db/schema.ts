import {
  pgTable,
  serial,
  text,
  doublePrecision,
  integer,
  timestamp,
  jsonb,
  boolean,
  date,
} from "drizzle-orm/pg-core";

export interface CropRotationRules {
  good_predecessors: string[];
  good_successors: string[];
  avoid_after: string[];
}

export interface CropNutrientsNPK {
  n: "high" | "medium" | "low" | "fixer";
  p: "high" | "medium" | "low";
  k: "high" | "medium" | "low";
  nitrogen_delta_kg_ha: number; // positive for N-fixers, negative for heavy feeders
}

export interface MonthForecastItem {
  monthIndex: number;
  monthNameAr: string;
  monthNameEn: string;
  tempAvg: number;
  tempMax: number;
  tempMin: number;
  humidityAvg: number;
  precipMm: number;
  solarRad: number;
  soilMoistureRoot: number;
  riskNoteAr: string;
  riskNoteEn: string;
}

export interface CropSuitabilityResult {
  cropCode: string;
  nameAr: string;
  nameEn: string;
  scientificName: string;
  family: string;
  familyAr: string;
  suitabilityScore: number;
  tempScore: number;
  phScore: number;
  moistureScore: number;
  rotationBonus: number;
  waterNeed: "low" | "medium" | "high";
  salinityTolerance: "low" | "medium" | "high";
  growthDurationDays: number;
  rootDepth: "shallow" | "medium" | "deep";
  nutrientsNpk: CropNutrientsNPK;
  expectedYieldTonHa: number;
  profitIndex: "High" | "Medium-High" | "Medium";
  reasonsAr: string[];
  reasonsEn: string[];
  warningsAr: string[];
  warningsEn: string[];
  optimalRanges: {
    tempMin: number;
    tempMax: number;
    tempOpt: number;
    phMin: number;
    phMax: number;
    phOpt: number;
  };
}

export interface RotationSeasonStep {
  seasonNumber: number;
  seasonLabelAr: string;
  seasonLabelEn: string;
  cropCode: string;
  cropNameAr: string;
  cropNameEn: string;
  family: string;
  familyAr: string;
  nitrogenRoleAr: string;
  nitrogenRoleEn: string;
  nitrogenBadge: "fixer" | "feeder" | "balancer";
  rootDepth: "shallow" | "medium" | "deep";
  suitabilityScore: number;
  rationaleAr: string;
  rationaleEn: string;
}

export interface ClimateAlertItem {
  id: string;
  severity: "optimal" | "warning" | "critical";
  parameterCode: string;
  titleAr: string;
  titleEn: string;
  messageAr: string;
  messageEn: string;
  actionAr: string;
  actionEn: string;
}

export const crops = pgTable("crops", {
  id: serial("id").primaryKey(),
  code: text("code").notNull().unique(),
  nameAr: text("name_ar").notNull(),
  nameEn: text("name_en").notNull(),
  scientificName: text("scientific_name").notNull(),
  family: text("family").notNull(),
  familyAr: text("family_ar").notNull(),
  tempMin: doublePrecision("temp_min").notNull(),
  tempMax: doublePrecision("temp_max").notNull(),
  tempOpt: doublePrecision("temp_opt").notNull(),
  phMin: doublePrecision("ph_min").notNull(),
  phMax: doublePrecision("ph_max").notNull(),
  phOpt: doublePrecision("ph_opt").notNull(),
  humidityMin: doublePrecision("humidity_min").notNull(),
  humidityMax: doublePrecision("humidity_max").notNull(),
  waterNeed: text("water_need").notNull(), // low | medium | high
  salinityTolerance: text("salinity_tolerance").notNull(), // low | medium | high
  growthDurationDays: integer("growth_duration_days").notNull(),
  rootDepth: text("root_depth").notNull(), // shallow | medium | deep
  weightTemp: doublePrecision("weight_temp").notNull().default(0.45),
  weightPh: doublePrecision("weight_ph").notNull().default(0.35),
  weightMoisture: doublePrecision("weight_moisture").notNull().default(0.2),
  expectedYieldTonHa: doublePrecision("expected_yield_ton_ha").notNull().default(4.5),
  nutrientsNpk: jsonb("nutrients_npk").$type<CropNutrientsNPK>().notNull(),
  rotationRules: jsonb("rotation_rules").$type<CropRotationRules>().notNull(),
  descriptionAr: text("description_ar").notNull(),
  descriptionEn: text("description_en").notNull(),
});

export const farmAnalyses = pgTable("farm_analyses", {
  id: serial("id").primaryKey(),
  farmName: text("farm_name").notNull(),
  regionName: text("region_name").notNull(),
  latitude: doublePrecision("latitude").notNull(),
  longitude: doublePrecision("longitude").notNull(),
  areaFeddans: doublePrecision("area_feddans").notNull().default(10),
  previousCropCode: text("previous_crop_code"),
  // Core NASA POWER & SoilGrids parameters
  avgTemp3Mo: doublePrecision("avg_temp_3mo").notNull(),
  maxTemp3Mo: doublePrecision("max_temp_3mo").notNull(),
  minTemp3Mo: doublePrecision("min_temp_3mo").notNull(),
  relativeHumidity: doublePrecision("relative_humidity").notNull(), // RH2M %
  soilPh: doublePrecision("soil_ph").notNull(), // pH H2O
  totalPrecip3Mo: doublePrecision("total_precip_3mo").notNull(), // PRECTOTCORR mm
  soilMoistureSurface: doublePrecision("soil_moisture_surface").notNull(), // GWETTOP %
  soilMoistureRoot: doublePrecision("soil_moisture_root").notNull(), // GWETROOT %
  solarRadiation: doublePrecision("solar_radiation").notNull(), // ALLSKY_SFC_SW_DWN kWh/m2/d
  ndviIndex: doublePrecision("ndvi_index").notNull(), // NASA GIBS MODIS NDVI (0.1 - 0.85)
  soilTextureAr: text("soil_texture_ar").notNull(),
  soilTextureEn: text("soil_texture_en").notNull(),
  organicCarbonGkg: doublePrecision("organic_carbon_gkg").notNull(),
  salinityEc: doublePrecision("salinity_ec").notNull(), // dS/m
  dataSourceStatus: text("data_source_status").notNull(), // "NASA_LIVE" | "NASA_CLIMATOLOGY_CALIBRATED"
  // Rich JSON analytical outputs
  forecast3Months: jsonb("forecast_3months").$type<MonthForecastItem[]>().notNull(),
  recommendations: jsonb("recommendations").$type<CropSuitabilityResult[]>().notNull(),
  rotationPlan: jsonb("rotation_plan").$type<RotationSeasonStep[]>().notNull(),
  climateAlerts: jsonb("climate_alerts").$type<ClimateAlertItem[]>().notNull(),
  rawNasaPayload: jsonb("raw_nasa_payload").$type<Record<string, unknown>>().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const chatMessages = pgTable("chat_messages", {
  id: serial("id").primaryKey(),
  analysisId: integer("analysis_id"),
  role: text("role").notNull(), // "user" | "assistant"
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ==============================================================================
// GAIA — Normalized Farmer Interaction & Farm Intelligence Models
// ==============================================================================

export interface FarmCompletenessReport {
  locationScore: number;
  climateScore: number;
  soilScore: number;
  waterScore: number;
  historyScore: number;
  economicsScore: number;
  overallScore: number;
  missingDimensions: string[];
  blockersForAnalysis: string[];
}

export interface GeoJsonPolygon {
  type: "Polygon";
  coordinates: number[][][]; // GeoJSON format [ [ [lng, lat], ... ] ]
}

export const farms = pgTable("farms", {
  id: serial("id").primaryKey(),
  farmerId: text("farmer_id").notNull(), // Multi-tenant isolation key
  name: text("name").notNull(),
  regionName: text("region_name").notNull(),
  latitude: doublePrecision("latitude").notNull(),
  longitude: doublePrecision("longitude").notNull(),
  boundaryGeojson: jsonb("boundary_geojson").$type<GeoJsonPolygon>(),
  totalArea: doublePrecision("total_area").notNull().default(1.0),
  areaUnit: text("area_unit").notNull().default("acre"), // acre | hectare | sqm
  productionType: text("production_type").notNull().default("open_field"), // open_field | greenhouse | dual
  description: text("description"),
  completeness: jsonb("completeness").$type<FarmCompletenessReport>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const farmFields = pgTable("farm_fields", {
  id: serial("id").primaryKey(),
  farmId: integer("farm_id")
    .notNull()
    .references(() => farms.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  area: doublePrecision("area").notNull(),
  areaUnit: text("area_unit").notNull().default("acre"),
  boundaryGeojson: jsonb("boundary_geojson").$type<GeoJsonPolygon>(),
  currentCrop: text("current_crop"),
  soilType: text("soil_type"),
  irrigationType: text("irrigation_type").notNull().default("drip"), // drip | sprinkler | flood | none
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const soilProfiles = pgTable("soil_profiles", {
  id: serial("id").primaryKey(),
  fieldId: integer("field_id")
    .notNull()
    .references(() => farmFields.id, { onDelete: "cascade" }),
  texture: text("texture").notNull().default("unknown"), // sandy_loam | clay | loam | etc.
  soilPh: doublePrecision("soil_ph"),
  ecDsM: doublePrecision("ec_ds_m"),
  organicMatterPercent: doublePrecision("organic_matter_percent"),
  nitrogenPpm: doublePrecision("nitrogen_ppm"),
  phosphorusPpm: doublePrecision("phosphorus_ppm"),
  potassiumPpm: doublePrecision("potassium_ppm"),
  drainageClass: text("drainage_class").notNull().default("well_drained"),
  salinityRisk: text("salinity_risk").notNull().default("unknown"),
  provenanceStatus: text("provenance_status").notNull().default("farmer_reported"),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const uploadedFarmDocuments = pgTable("uploaded_farm_documents", {
  id: serial("id").primaryKey(),
  farmId: integer("farm_id")
    .notNull()
    .references(() => farms.id, { onDelete: "cascade" }),
  fileName: text("file_name").notNull(),
  fileType: text("file_type").notNull(), // soil_test_pdf | water_test_pdf | invoice | photo
  fileSize: integer("file_size").notNull(),
  mimeType: text("mime_type").notNull(),
  storagePath: text("storage_path").notNull(),
  verificationStatus: text("verification_status").notNull().default("pending_review"), // pending_review | verified | rejected
  uploadedAt: timestamp("uploaded_at").defaultNow().notNull(),
});

export const soilTests = pgTable("soil_tests", {
  id: serial("id").primaryKey(),
  fieldId: integer("field_id")
    .notNull()
    .references(() => farmFields.id, { onDelete: "cascade" }),
  sampleDate: date("sample_date").notNull(),
  sampleDepthCm: text("sample_depth_cm").notNull().default("0-30"),
  labName: text("lab_name"),
  documentId: integer("document_id").references(() => uploadedFarmDocuments.id),
  ph: doublePrecision("ph"),
  ec: doublePrecision("ec"),
  organicMatter: doublePrecision("organic_matter"),
  validationStatus: text("validation_status").notNull().default("pending_review"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const waterProfiles = pgTable("water_profiles", {
  id: serial("id").primaryKey(),
  farmId: integer("farm_id")
    .notNull()
    .references(() => farms.id, { onDelete: "cascade" }),
  sourceType: text("source_type").notNull().default("deep_well"), // deep_well | canal | municipal | river
  wellDepthFeet: doublePrecision("well_depth_feet"),
  pumpingCapacityGpm: doublePrecision("pumping_capacity_gpm"),
  seasonalRestrictions: text("seasonal_restrictions"),
  volumetricCostPerAcreFoot: doublePrecision("volumetric_cost_per_acre_foot"),
  irrigationSystem: text("irrigation_system").notNull().default("drip"),
  irrigationFrequency: text("irrigation_frequency"),
  typicalDurationHours: doublePrecision("typical_duration_hours"),
  distributionUniformityPercent: doublePrecision("distribution_uniformity_percent").default(85),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const waterTests = pgTable("water_tests", {
  id: serial("id").primaryKey(),
  waterProfileId: integer("water_profile_id")
    .notNull()
    .references(() => waterProfiles.id, { onDelete: "cascade" }),
  testDate: date("test_date").notNull(),
  ph: doublePrecision("ph"),
  ecDsM: doublePrecision("ec_ds_m"),
  tdsPpm: doublePrecision("tds_ppm"),
  sar: doublePrecision("sar"),
  documentId: integer("document_id").references(() => uploadedFarmDocuments.id),
  validationStatus: text("validation_status").notNull().default("pending_review"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const cropHistories = pgTable("crop_histories", {
  id: serial("id").primaryKey(),
  fieldId: integer("field_id")
    .notNull()
    .references(() => farmFields.id, { onDelete: "cascade" }),
  seasonYear: integer("season_year").notNull(),
  seasonName: text("season_name").notNull(),
  cropCode: text("crop_code").notNull(),
  cropName: text("crop_name").notNull(),
  plantingDate: date("planting_date"),
  harvestDate: date("harvest_date"),
  actualYield: doublePrecision("actual_yield"),
  yieldUnit: text("yield_unit").notNull().default("lbs/acre"),
  cultivatedArea: doublePrecision("cultivated_area"),
  fertilizersUsed: text("fertilizers_used"),
  pesticidesUsed: text("pesticides_used"),
  pestIncidents: text("pest_incidents"),
  farmerAssessment: text("farmer_assessment").notNull().default("successful"), // successful | moderate | failed
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const growingSeasons = pgTable("growing_seasons", {
  id: serial("id").primaryKey(),
  fieldId: integer("field_id")
    .notNull()
    .references(() => farmFields.id, { onDelete: "cascade" }),
  seasonName: text("season_name").notNull(),
  cropCode: text("crop_code").notNull(),
  cropName: text("crop_name").notNull(),
  startDate: date("start_date").notNull(),
  expectedHarvestDate: date("expected_harvest_date").notNull(),
  actualHarvestDate: date("actual_harvest_date"),
  cultivatedAreaAcre: doublePrecision("cultivated_area_acre").notNull().default(1.0),
  status: text("status").notNull().default("active"), // planned | active | harvested | terminated
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const cropActivities = pgTable("crop_activities", {
  id: serial("id").primaryKey(),
  seasonId: integer("season_id")
    .notNull()
    .references(() => growingSeasons.id, { onDelete: "cascade" }),
  activityType: text("activity_type").notNull(), // irrigation | fertilization | pesticide | planting | pruning | scouting | harvest
  activityDate: date("activity_date").notNull(),
  quantity: doublePrecision("quantity"),
  unit: text("unit"),
  notes: text("notes"),
  documentId: integer("document_id").references(() => uploadedFarmDocuments.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const farmExpenses = pgTable("farm_expenses", {
  id: serial("id").primaryKey(),
  farmId: integer("farm_id")
    .notNull()
    .references(() => farms.id, { onDelete: "cascade" }),
  category: text("category").notNull(), // seeds | fertilizer | labor | pumping | machinery | packaging | transport
  costPerAcre: doublePrecision("cost_per_acre").notNull(),
  totalCost: doublePrecision("total_cost"),
  currency: text("currency").notNull().default("USD"),
  applicableYear: integer("applicable_year").notNull().default(2026),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const farmerPreferences = pgTable("farmer_preferences", {
  id: serial("id").primaryKey(),
  farmId: integer("farm_id")
    .notNull()
    .references(() => farms.id, { onDelete: "cascade" }),
  primaryObjective: text("primary_objective").notNull().default("maximize_profit"), // maximize_profit | conserve_water | minimize_risk
  preferredCropCodes: jsonb("preferred_crop_codes").$type<string[]>().notNull().default([]),
  excludedCropCodes: jsonb("excluded_crop_codes").$type<{ code: string; reason: string }[]>().notNull().default([]),
  maxSeasonalBudget: doublePrecision("max_seasonal_budget"),
  waterConstraintAcreFeet: doublePrecision("water_constraint_acre_feet"),
  laborConstraint: text("labor_constraint"),
  preferredGrowingSeasons: jsonb("preferred_growing_seasons").$type<string[]>().notNull().default(["fall_winter", "spring"]),
  targetMarkets: jsonb("target_markets").$type<string[]>().notNull().default(["wholesale_shipping"]),
  riskTolerance: text("risk_tolerance").notNull().default("moderate"), // low | moderate | high
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const cropRecommendationRecords = pgTable("crop_recommendation_records", {
  id: serial("id").primaryKey(),
  farmId: integer("farm_id")
    .notNull()
    .references(() => farms.id, { onDelete: "cascade" }),
  fieldId: integer("field_id").references(() => farmFields.id),
  cropCode: text("crop_code").notNull(),
  cropName: text("crop_name").notNull(),
  suitabilityScore: doublePrecision("suitability_score").notNull(),
  suitabilityClass: text("suitability_class").notNull(),
  dimensionalScores: jsonb("dimensional_scores").$type<Record<string, unknown>>().notNull(),
  generatedAt: timestamp("generated_at").defaultNow().notNull(),
});

export const recommendationFeedbacks = pgTable("recommendation_feedbacks", {
  id: serial("id").primaryKey(),
  recommendationId: integer("recommendation_id")
    .notNull()
    .references(() => cropRecommendationRecords.id, { onDelete: "cascade" }),
  action: text("action").notNull(), // accepted | rejected | already_planted | not_suitable | missing_resources | other
  reason: text("reason"),
  feedbackNotes: text("feedback_notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const harvestRecords = pgTable("harvest_records", {
  id: serial("id").primaryKey(),
  seasonId: integer("season_id")
    .notNull()
    .references(() => growingSeasons.id, { onDelete: "cascade" }),
  harvestDate: date("harvest_date").notNull(),
  actualYield: doublePrecision("actual_yield").notNull(),
  yieldUnit: text("yield_unit").notNull().default("lbs/acre"),
  marketableYieldPercent: doublePrecision("marketable_yield_percent").default(85),
  realizedPricePerUnit: doublePrecision("realized_price_per_unit").notNull(),
  totalRevenue: doublePrecision("total_revenue").notNull(),
  totalActualCosts: doublePrecision("total_actual_costs").notNull(),
  actualNetProfit: doublePrecision("actual_net_profit").notNull(),
  farmerSatisfaction: text("farmer_satisfaction").notNull().default("satisfied"), // highly_satisfied | satisfied | neutral | dissatisfied
  productionChallenges: text("production_challenges"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
