/**
 * GAIA Farm Economics & Profitability Type Definitions
 *
 * Covers:
 * - USDA AMS MyMarketNews (Phoenix Shipping Point Report 2403 / IX_FV120)
 * - USDA NASS QuickStats (Arizona state & Pima County agricultural stats)
 * - University of Arizona Cooperative Extension Enterprise Budgets
 * - Deterministic Financial Calculations & Scenario Modeling
 * - Cost Reduction Advisory & Evidence-Based Recommendations
 */

export type PriceCategory =
  | "Shipping Point (Regional Wholesale Reference)"
  | "Terminal Wholesale Market"
  | "Farm-Gate Price (Direct)"
  | "Retail Market";

export interface UsdaMarketPriceItem {
  commodity: string; // e.g. "TOMATOES", "LETTUCE", "ONIONS"
  matchedCropId: string; // e.g. "tomato", "lettuce", "onion"
  variety?: string; // e.g. "Vine Ripes", "Romaine", "Yellow Granex"
  package: string; // e.g. "cartons 2 layer", "cartons 24s", "50 lb sacks"
  grade: string; // e.g. "U.S. One", "Fair Quality", "Standard"
  priceMin: number; // quoted minimum price ($)
  priceMax: number; // quoted maximum price ($)
  priceAverage: number; // calculated arithmetic midpoint ($)
  priceMostlyMin?: number; // mostly range min ($)
  priceMostlyMax?: number; // mostly range max ($)
  unit: string; // e.g. "carton", "cwt (100 lbs)", "50 lb sack", "crate"
  unitWeightLbs: number; // estimated weight in pounds for standardization
  pricePerLb: number; // normalized price per pound ($/lb)
  marketName: string; // "Phoenix, Arizona Shipping Point"
  reportId: number; // 2403
  reportSlug: string; // "IX_FV120"
  reportDate: string; // YYYY-MM-DD
  isHistoricalQuote: boolean;
  source: string;
}

export interface MarketPriceReport {
  status: "Connected" | "Configured but Unverified" | "Unavailable" | "Missing Credentials";
  reportName: string;
  reportId: number;
  market: string;
  reportDate: string;
  lastRetrieved: string;
  isLiveApi: boolean;
  totalQuotes: number;
  quotes: UsdaMarketPriceItem[];
  transparencyNotice: string;
}

export interface NassAgriculturalStat {
  commodity: string;
  cropId: string;
  year: number;
  geographicLevel: "County (Pima County, AZ)" | "State (Arizona)" | "National (USA)";
  yieldPerAcre: number | null;
  yieldUnit: string; // e.g. "CWT / ACRE", "LBS / ACRE", "CARTONS / ACRE"
  harvestedAcres: number | null;
  productionTotal: number | null;
  productionUnit: string;
  priceReceivedPerUnit: number | null;
  priceUnit: string;
  dataSource: string; // e.g. "USDA NASS QuickStats 2024 / Census of Agriculture"
  referenceNote: string;
}

export interface CostBreakdownItem {
  category:
    | "seeds_seedlings"
    | "land_preparation"
    | "irrigation_water"
    | "electricity_fuel"
    | "fertilizers"
    | "crop_protection"
    | "labor_field"
    | "labor_harvest"
    | "machinery"
    | "packaging"
    | "transportation"
    | "land_rent"
    | "operating_interest_overhead";
  name: string;
  amountPerAcre: number; // USD ($/acre)
  percentageOfTotal: number;
  isVariable: boolean; // true = variable, false = fixed
  notes: string;
}

export interface CropProductionBudget {
  cropId: string;
  cropName: string;
  publicationYear: number;
  sourceName: string; // e.g. "University of Arizona Cooperative Extension Southern Arizona 2026 Budget"
  sourceUrl: string;
  hasOfficialUaBudget: boolean;
  assumptions: {
    productionSystem: string; // e.g. "Surface-drip irrigation, raised beds, open field"
    farmSizeAcresReference: number;
    targetMarket: string; // e.g. "Wholesale shipping point / regional distributor"
    irrigationMethod: string; // "Pressurized Drip Irrigation"
    waterCostPerAcreFoot: number; // $/acre-foot
    seasonalWaterAcreFeet: number; // acre-feet/acre
    laborRatePerHour: number; // $/hr
  };
  costs: CostBreakdownItem[];
  totalVariableCostPerAcre: number;
  totalFixedCostPerAcre: number;
  totalCostPerAcre: number;
}

export interface FarmFinancialInputs {
  cropId: string;
  acreage: number; // acres cultivated (default: 1.0 acre)
  expectedYieldPerAcreLbs: number; // Gross yield in pounds
  marketablePercent: number; // % marketable after grading (e.g. 85%)
  sellingPricePerLb: number; // $/lb selling price
  sellingPriceUnitDescription: string;
  priceCategory: PriceCategory;
  priceSource: string;
  customCosts?: Partial<Record<CostBreakdownItem["category"], number>>;
}

export interface FarmFinancialResults {
  cropId: string;
  cropName: string;
  acreage: number;
  grossYieldLbs: number;
  marketableYieldLbs: number;
  sellingPricePerLb: number;
  priceCategory: PriceCategory;
  priceSource: string;

  // Totals
  grossRevenue: number;
  revenuePerAcre: number;
  variableCostsTotal: number;
  variableCostPerAcre: number;
  fixedCostsTotal: number;
  fixedCostPerAcre: number;
  totalProductionCosts: number;
  totalCostPerAcre: number;

  // Margins & Profitability
  grossMargin: number;
  grossMarginPerAcre: number;
  grossMarginPercent: number;
  netProfit: number;
  netProfitPerAcre: number;
  netProfitPercent: number;
  returnOnInvestmentPercent: number; // (net profit / total costs) * 100

  // Break-even metrics
  breakEvenSellingPricePerLb: number; // Total Cost / Marketable Lbs
  breakEvenYieldLbsPerAcre: number; // Total Cost / Selling Price per Lb
  breakEvenSafetyMarginPercent: number; // (Expected Price - BreakEven Price) / Expected Price

  // Input Completeness & Traceability
  isInputComplete: boolean;
  missingRequiredInputs: string[];
  costDataSource: string;
  currency: "USD";
}

export type ScenarioType = "conservative" | "expected" | "optimistic";

export interface FinancialScenario {
  scenarioType: ScenarioType;
  label: string;
  description: string;
  yieldMultiplier: number; // e.g. 0.80 for conservative, 1.00 for expected, 1.18 for optimistic
  priceMultiplier: number; // e.g. 0.85 for conservative, 1.00 for expected, 1.15 for optimistic
  costMultiplier: number; // e.g. 1.10 for conservative, 1.00 for expected, 0.92 for optimistic
  results: FarmFinancialResults;
  documentedAssumptions: string[];
}

export interface CostReductionOpportunity {
  id: string;
  title: string;
  targetExpense:
    | "Irrigation & Water Pumping"
    | "Fertilizer & Soil Amendments"
    | "Labor & Field Operations"
    | "Post-Harvest Losses & Packaging"
    | "Crop Selection & Thermal Alignment";
  whyReducible: string;
  recommendedAction: string;
  estimatedSavingsPerAcreRange: {
    minUsd: number;
    maxUsd: number;
  };
  documentedAssumptions: string[];
  evidenceSource: string;
}

export interface CropEconomicComparisonItem {
  cropId: string;
  cropName: string;
  category: "cool_season" | "warm_season";
  suitabilityStatus: string;
  marketPricePerLb: number;
  priceSource: string;
  yieldPerAcreLbs: number;
  revenuePerAcre: number;
  costPerAcre: number;
  netProfitPerAcre: number;
  roiPercent: number;
  breakEvenPricePerLb: number;
  financialRiskLevel: "Low" | "Moderate" | "High";
  primaryOpportunity: string;
  primaryRisk: string;
}

export interface EconomicAdvisorReport {
  status: string;
  provider: string;
  model: string;
  sections: {
    promisingCropsSummary: string;
    riskAndConcentrationAnalysis: string;
    costReductionRoadmap: string;
    marketSensitivity: string;
    missingDataAndNextSteps: string;
  };
  groundingNotice: string;
}
