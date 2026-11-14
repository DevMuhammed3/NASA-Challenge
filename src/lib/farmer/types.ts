import type { GeoJsonPolygon, FarmCompletenessReport } from "../../db/schema";
import type { CropReference } from "../crops/crop-catalog";

export interface FarmRecord {
  id: number;
  farmerId: string;
  name: string;
  regionName: string;
  latitude: number;
  longitude: number;
  boundaryGeojson?: GeoJsonPolygon;
  totalArea: number;
  areaUnit: "acre" | "hectare" | "sqm";
  productionType: "open_field" | "greenhouse" | "dual";
  description?: string;
  completeness: FarmCompletenessReport;
  createdAt: string;
  updatedAt: string;
}

export interface FarmFieldRecord {
  id: number;
  farmId: number;
  name: string;
  area: number;
  areaUnit: "acre" | "hectare";
  boundaryGeojson?: GeoJsonPolygon;
  currentCrop?: string;
  soilType?: string;
  irrigationType: "drip" | "sprinkler" | "flood" | "none";
  isActive: boolean;
  createdAt: string;
}

export interface SoilProfileRecord {
  id: number;
  fieldId: number;
  texture: string;
  soilPh?: number;
  ecDsM?: number;
  organicMatterPercent?: number;
  nitrogenPpm?: number;
  phosphorusPpm?: number;
  potassiumPpm?: number;
  drainageClass: "well_drained" | "moderate" | "poor" | "excessive";
  salinityRisk: "none" | "slight" | "severe" | "unknown";
  provenanceStatus: "farmer_reported" | "lab_verified" | "ssurgo_regional" | "unavailable";
  updatedAt: string;
}

export interface SoilTestRecord {
  id: number;
  fieldId: number;
  sampleDate: string;
  sampleDepthCm: string;
  labName?: string;
  documentId?: number;
  ph?: number;
  ec?: number;
  organicMatter?: number;
  validationStatus: "pending_review" | "verified" | "rejected";
  createdAt: string;
}

export interface WaterProfileRecord {
  id: number;
  farmId: number;
  sourceType: "deep_well" | "shallow_well" | "canal_district" | "municipal_reclaimed" | "river" | "other";
  wellDepthFeet?: number;
  pumpingCapacityGpm?: number;
  seasonalRestrictions?: string;
  volumetricCostPerAcreFoot?: number;
  irrigationSystem: "drip" | "sprinkler" | "flood" | "other";
  irrigationFrequency?: string;
  typicalDurationHours?: number;
  distributionUniformityPercent?: number;
  updatedAt: string;
}

export interface WaterTestRecord {
  id: number;
  waterProfileId: number;
  testDate: string;
  ph?: number;
  ecDsM?: number;
  tdsPpm?: number;
  sar?: number;
  documentId?: number;
  validationStatus: "pending_review" | "verified";
  createdAt: string;
}

export interface CropHistoryRecord {
  id: number;
  fieldId: number;
  seasonYear: number;
  seasonName: string;
  cropCode: string;
  cropName: string;
  plantingDate?: string;
  harvestDate?: string;
  actualYield?: number;
  yieldUnit: string;
  cultivatedArea?: number;
  fertilizersUsed?: string;
  pesticidesUsed?: string;
  pestIncidents?: string;
  farmerAssessment: "successful" | "moderate" | "failed";
  createdAt: string;
}

export interface GrowingSeasonRecord {
  id: number;
  fieldId: number;
  seasonName: string;
  cropCode: string;
  cropName: string;
  startDate: string;
  expectedHarvestDate: string;
  actualHarvestDate?: string;
  cultivatedAreaAcre: number;
  status: "planned" | "active" | "harvested" | "terminated";
  createdAt: string;
}

export interface CropActivityRecord {
  id: number;
  seasonId: number;
  activityType: "irrigation" | "fertilization" | "pesticide" | "planting" | "pruning" | "scouting" | "harvest";
  activityDate: string;
  quantity?: number;
  unit?: string;
  notes?: string;
  documentId?: number;
  createdAt: string;
}

export interface FarmExpenseRecord {
  id: number;
  farmId: number;
  category: "seeds" | "fertilizer" | "chemicals" | "labor" | "irrigation_pumping" | "machinery" | "packaging" | "transport";
  costPerAcre: number;
  totalCost?: number;
  currency: string;
  applicableYear: number;
  createdAt: string;
}

export interface FarmerPreferenceRecord {
  id: number;
  farmId: number;
  primaryObjective: "maximize_profit" | "conserve_water" | "minimize_risk" | "organic_certification";
  preferredCropCodes: string[];
  excludedCropCodes: { code: string; reason: string }[];
  maxSeasonalBudget?: number;
  waterConstraintAcreFeet?: number;
  laborConstraint?: string;
  preferredGrowingSeasons: string[];
  targetMarkets: string[];
  riskTolerance: "low" | "moderate" | "high";
  updatedAt: string;
}

export interface RecommendationFeedbackRecord {
  id: number;
  recommendationId: number;
  cropCode: string;
  action: "accepted" | "rejected" | "already_planted" | "not_suitable" | "missing_resources" | "other";
  reason?: string;
  feedbackNotes?: string;
  createdAt: string;
}

export interface HarvestRecordItem {
  id: number;
  seasonId: number;
  harvestDate: string;
  actualYield: number;
  yieldUnit: string;
  marketableYieldPercent: number;
  realizedPricePerUnit: number;
  totalRevenue: number;
  totalActualCosts: number;
  actualNetProfit: number;
  farmerSatisfaction: "highly_satisfied" | "satisfied" | "neutral" | "dissatisfied";
  productionChallenges?: string;
  createdAt: string;
}

export interface UploadedFarmDocumentRecord {
  id: number;
  farmId: number;
  fileName: string;
  fileType: "soil_test_pdf" | "water_test_pdf" | "invoice" | "photo";
  fileSize: number;
  mimeType: string;
  storagePath: string;
  verificationStatus: "pending_review" | "verified" | "rejected";
  uploadedAt: string;
}

export interface PersonalizedCropRecommendation {
  crop: CropReference;
  suitabilityScore: number;
  suitabilityClass: "Suitable with Irrigation in Season" | "Conditionally Suitable" | "Unsuitable" | "Soil Diagnostic Required";
  climateSuitability: "Optimal" | "Moderate" | "Constrained";
  soilCompatibility: "Optimal" | "Tolerant" | "Unknown (Lab Required)";
  waterRequirements: {
    seasonalNeedInches: number;
    irrigationMatch: "Supported by on-farm drip" | "Exceeds known pumping limit" | "Unverified";
  };
  seasonalWindow: string;
  rotationAnalysis: {
    nitrogenCreditKgHa: number;
    predecessorCompatibility: "Favorable Predecessor" | "Disease Risk (Avoid)" | "Neutral";
    note: string;
  };
  economicViability: {
    estimatedNetProfitPerAcre: number;
    roiPercent: number;
    breakEvenPricePerLb: number;
    budgetFeasibility: "Within Farmer Budget" | "Exceeds Specified Capital" | "Not Calculated";
  };
  farmerPreferenceMatch: {
    isPreferred: boolean;
    isExcluded: boolean;
    exclusionReason?: string;
  };
  missingDataItems: string[];
  rationale: string;
}
