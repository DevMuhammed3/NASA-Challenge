import {
  pgTable,
  serial,
  text,
  doublePrecision,
  integer,
  timestamp,
  jsonb,
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
