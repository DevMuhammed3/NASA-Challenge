import { GREEN_VALLEY_LOCATION } from "../config/location";
import { calculateFarmCompleteness } from "./data-completeness";
import type {
  FarmRecord,
  FarmFieldRecord,
  SoilProfileRecord,
  SoilTestRecord,
  WaterProfileRecord,
  WaterTestRecord,
  CropHistoryRecord,
  GrowingSeasonRecord,
  CropActivityRecord,
  FarmExpenseRecord,
  FarmerPreferenceRecord,
  RecommendationFeedbackRecord,
  HarvestRecordItem,
  UploadedFarmDocumentRecord,
} from "./types";

// In-Memory store for prototype & server runtime persistence
interface FarmDatabaseStore {
  farms: FarmRecord[];
  fields: FarmFieldRecord[];
  soilProfiles: SoilProfileRecord[];
  soilTests: SoilTestRecord[];
  waterProfiles: WaterProfileRecord[];
  waterTests: WaterTestRecord[];
  cropHistories: CropHistoryRecord[];
  growingSeasons: GrowingSeasonRecord[];
  cropActivities: CropActivityRecord[];
  farmExpenses: FarmExpenseRecord[];
  preferences: FarmerPreferenceRecord[];
  feedbacks: RecommendationFeedbackRecord[];
  harvests: HarvestRecordItem[];
  documents: UploadedFarmDocumentRecord[];
}

// Pre-seed with the reference Green Valley prototype farm so the user can immediately test
const INITIAL_DEMO_FARM_ID = 1;
const DEFAULT_FARMER_ID = "farmer_green_valley_default";

function createInitialStore(): FarmDatabaseStore {
  const initialFarm: FarmRecord = {
    id: INITIAL_DEMO_FARM_ID,
    farmerId: DEFAULT_FARMER_ID,
    name: "Rancho Santa Cruz Demo Farm",
    regionName: GREEN_VALLEY_LOCATION.name,
    latitude: GREEN_VALLEY_LOCATION.latitude,
    longitude: GREEN_VALLEY_LOCATION.longitude,
    boundaryGeojson: {
      type: "Polygon",
      coordinates: [
        [
          [-111.006, 31.851],
          [-110.994, 31.851],
          [-110.994, 31.858],
          [-111.006, 31.858],
          [-111.006, 31.851],
        ],
      ],
    },
    totalArea: 40.0,
    areaUnit: "acre",
    productionType: "open_field",
    description: "Model vegetable farm in Upper Santa Cruz River Basin testing precision drip irrigation.",
    completeness: {
      locationScore: 100,
      climateScore: 100,
      soilScore: 60,
      waterScore: 80,
      historyScore: 70,
      economicsScore: 80,
      overallScore: 78,
      missingDimensions: [
        "Certified soil test report pending laboratory validation",
      ],
      blockersForAnalysis: [
        "Soil pH is calibrated to regional SSURGO baseline (7.8); laboratory sample recommended.",
      ],
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const initialFields: FarmFieldRecord[] = [
    {
      id: 1,
      farmId: INITIAL_DEMO_FARM_ID,
      name: "North Pivot Block 1 (Fall Vegetables)",
      area: 15.0,
      areaUnit: "acre",
      boundaryGeojson: {
        type: "Polygon",
        coordinates: [
          [
            [-111.006, 31.854],
            [-111.000, 31.854],
            [-111.000, 31.858],
            [-111.006, 31.858],
            [-111.006, 31.854],
          ],
        ],
      },
      currentCrop: "Broccoli",
      soilType: "Arizo-Riverwash complex (sandy-skeletal loam)",
      irrigationType: "drip",
      isActive: true,
      createdAt: new Date().toISOString(),
    },
    {
      id: 2,
      farmId: INITIAL_DEMO_FARM_ID,
      name: "South Terraced Field 2 (Alliums & Greens)",
      area: 25.0,
      areaUnit: "acre",
      boundaryGeojson: {
        type: "Polygon",
        coordinates: [
          [
            [-111.006, 31.851],
            [-110.994, 31.851],
            [-110.994, 31.854],
            [-111.006, 31.854],
            [-111.006, 31.851],
          ],
        ],
      },
      currentCrop: "Spinach",
      soilType: "Sandy loam, well-drained",
      irrigationType: "drip",
      isActive: true,
      createdAt: new Date().toISOString(),
    },
  ];

  const initialSoil: SoilProfileRecord[] = [
    {
      id: 1,
      fieldId: 1,
      texture: "sandy_loam",
      soilPh: 7.6,
      ecDsM: 1.2,
      organicMatterPercent: 1.4,
      nitrogenPpm: 18,
      phosphorusPpm: 24,
      potassiumPpm: 160,
      drainageClass: "well_drained",
      salinityRisk: "slight",
      provenanceStatus: "farmer_reported",
      updatedAt: new Date().toISOString(),
    },
    {
      id: 2,
      fieldId: 2,
      texture: "loam",
      soilPh: 7.8,
      ecDsM: 1.5,
      organicMatterPercent: 1.1,
      nitrogenPpm: 14,
      phosphorusPpm: 20,
      potassiumPpm: 145,
      drainageClass: "well_drained",
      salinityRisk: "slight",
      provenanceStatus: "farmer_reported",
      updatedAt: new Date().toISOString(),
    },
  ];

  const initialWater: WaterProfileRecord = {
    id: 1,
    farmId: INITIAL_DEMO_FARM_ID,
    sourceType: "deep_well",
    wellDepthFeet: 310,
    pumpingCapacityGpm: 450,
    seasonalRestrictions: "Summer peak power tariff avoidance (12 PM - 6 PM)",
    volumetricCostPerAcreFoot: 65,
    irrigationSystem: "drip",
    irrigationFrequency: "Every 3 days (1.2 inches/week peak)",
    typicalDurationHours: 6.5,
    distributionUniformityPercent: 88,
    updatedAt: new Date().toISOString(),
  };

  const initialHistory: CropHistoryRecord[] = [
    {
      id: 1,
      fieldId: 1,
      seasonYear: 2024,
      seasonName: "Fall-Winter 2024",
      cropCode: "faba_bean",
      cropName: "Faba Bean (Legume Predecessor)",
      plantingDate: "2024-10-15",
      harvestDate: "2025-02-20",
      actualYield: 3200,
      yieldUnit: "lbs/acre",
      cultivatedArea: 15.0,
      fertilizersUsed: "Inoculated Rhizobium + 20 lbs P2O5/acre",
      pesticidesUsed: "None (Organic IPM)",
      pestIncidents: "Minor black bean aphid in early spring; controlled by lady beetles.",
      farmerAssessment: "successful",
      createdAt: new Date().toISOString(),
    },
    {
      id: 2,
      fieldId: 1,
      seasonYear: 2025,
      seasonName: "Spring 2025",
      cropCode: "sweet_corn",
      cropName: "Sweet Corn",
      plantingDate: "2025-03-01",
      harvestDate: "2025-06-15",
      actualYield: 9500,
      yieldUnit: "lbs/acre",
      cultivatedArea: 15.0,
      fertilizersUsed: "80 lbs N/acre split via drip fertigation",
      pesticidesUsed: "Bt spray for corn earworm",
      pestIncidents: "Heat wave in late May caused 8% tip blanking.",
      farmerAssessment: "moderate",
      createdAt: new Date().toISOString(),
    },
  ];

  const initialSeasons: GrowingSeasonRecord[] = [
    {
      id: 1,
      fieldId: 1,
      seasonName: "Fall-Winter 2025/2026 Commercial Cycle",
      cropCode: "broccoli",
      cropName: "Broccoli (High Packout Variety)",
      startDate: "2025-10-01",
      expectedHarvestDate: "2026-02-15",
      cultivatedAreaAcre: 15.0,
      status: "active",
      createdAt: new Date().toISOString(),
    },
  ];

  const initialActivities: CropActivityRecord[] = [
    {
      id: 1,
      seasonId: 1,
      activityType: "planting",
      activityDate: "2025-10-01",
      quantity: 15,
      unit: "acres",
      notes: "Transplanted 6-week containerized seedlings at 14,500 plants/acre spacing.",
      createdAt: new Date().toISOString(),
    },
    {
      id: 2,
      seasonId: 1,
      activityType: "irrigation",
      activityDate: "2025-10-04",
      quantity: 1.5,
      unit: "inches",
      notes: "Establishment pulse irrigation via subsurface drip at 12 psi.",
      createdAt: new Date().toISOString(),
    },
    {
      id: 3,
      seasonId: 1,
      activityType: "fertilization",
      activityDate: "2025-10-18",
      quantity: 35,
      unit: "lbs_n_acre",
      notes: "Injected soluble calcium nitrate via drip header to support rapid vegetative framing.",
      createdAt: new Date().toISOString(),
    },
  ];

  const initialExpenses: FarmExpenseRecord[] = [
    {
      id: 1,
      farmId: INITIAL_DEMO_FARM_ID,
      category: "seeds",
      costPerAcre: 350,
      currency: "USD",
      applicableYear: 2026,
      createdAt: new Date().toISOString(),
    },
    {
      id: 2,
      farmId: INITIAL_DEMO_FARM_ID,
      category: "fertilizer",
      costPerAcre: 480,
      currency: "USD",
      applicableYear: 2026,
      createdAt: new Date().toISOString(),
    },
    {
      id: 3,
      farmId: INITIAL_DEMO_FARM_ID,
      category: "irrigation_pumping",
      costPerAcre: 260,
      currency: "USD",
      applicableYear: 2026,
      createdAt: new Date().toISOString(),
    },
    {
      id: 4,
      farmId: INITIAL_DEMO_FARM_ID,
      category: "labor",
      costPerAcre: 850,
      currency: "USD",
      applicableYear: 2026,
      createdAt: new Date().toISOString(),
    },
  ];

  const initialPreferences: FarmerPreferenceRecord = {
    id: 1,
    farmId: INITIAL_DEMO_FARM_ID,
    primaryObjective: "maximize_profit",
    preferredCropCodes: ["broccoli", "lettuce_romaine", "spinach", "okra", "onion"],
    excludedCropCodes: [
      { code: "watermelon", reason: "High water volume demand exceeds off-peak pumping permit." },
    ],
    maxSeasonalBudget: 75000,
    waterConstraintAcreFeet: 60,
    riskTolerance: "moderate",
    preferredGrowingSeasons: ["fall_winter", "spring"],
    targetMarkets: ["wholesale_shipping", "local_coop"],
    updatedAt: new Date().toISOString(),
  };

  return {
    farms: [initialFarm],
    fields: initialFields,
    soilProfiles: initialSoil,
    soilTests: [],
    waterProfiles: [initialWater],
    waterTests: [],
    cropHistories: initialHistory,
    growingSeasons: initialSeasons,
    cropActivities: initialActivities,
    farmExpenses: initialExpenses,
    preferences: [initialPreferences],
    feedbacks: [],
    harvests: [],
    documents: [],
  };
}

// Global in-memory singleton to persist between hot reloads
const globalStore = globalThis as typeof globalThis & {
  __gaiaFarmerStore?: FarmDatabaseStore;
};

if (!globalStore.__gaiaFarmerStore) {
  globalStore.__gaiaFarmerStore = createInitialStore();
}

const store = globalStore.__gaiaFarmerStore;

export class FarmerStorage {
  // --- Farms ---
  static getFarm(id: number, farmerId?: string): FarmRecord | null {
    const farm = store.farms.find((f) => f.id === id);
    if (!farm) return null;
    if (farmerId && farm.farmerId !== farmerId && farm.farmerId !== DEFAULT_FARMER_ID) {
      return null; // Tenant isolation
    }
    return farm;
  }

  static getFarmerFarms(farmerId: string): FarmRecord[] {
    return store.farms.filter(
      (f) => f.farmerId === farmerId || f.farmerId === DEFAULT_FARMER_ID
    );
  }

  static createFarm(payload: Omit<FarmRecord, "id" | "completeness" | "createdAt" | "updatedAt">): FarmRecord {
    const id = store.farms.length > 0 ? Math.max(...store.farms.map((f) => f.id)) + 1 : 1;
    const completeness = calculateFarmCompleteness({
      farm: payload,
      fields: [],
      soilProfiles: [],
      waterProfile: null,
      cropHistory: [],
      expenses: [],
    });

    const newFarm: FarmRecord = {
      ...payload,
      id,
      completeness,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    store.farms.push(newFarm);
    return newFarm;
  }

  static updateFarm(id: number, patch: Partial<FarmRecord>, farmerId?: string): FarmRecord | null {
    const idx = store.farms.findIndex((f) => f.id === id);
    if (idx === -1) return null;
    if (farmerId && store.farms[idx].farmerId !== farmerId && store.farms[idx].farmerId !== DEFAULT_FARMER_ID) {
      return null;
    }

    const updated = {
      ...store.farms[idx],
      ...patch,
      updatedAt: new Date().toISOString(),
    };

    // Recalculate completeness
    const fields = this.getFields(id);
    const soils = store.soilProfiles.filter((s) => fields.some((fld) => fld.id === s.fieldId));
    const water = this.getWaterProfile(id);
    const history = store.cropHistories.filter((h) => fields.some((fld) => fld.id === h.fieldId));
    const expenses = this.getExpenses(id);

    updated.completeness = calculateFarmCompleteness({
      farm: updated,
      fields,
      soilProfiles: soils,
      waterProfile: water,
      cropHistory: history,
      expenses,
    });

    store.farms[idx] = updated;
    return updated;
  }

  // --- Fields ---
  static getFields(farmId: number): FarmFieldRecord[] {
    return store.fields.filter((f) => f.farmId === farmId);
  }

  static addField(payload: Omit<FarmFieldRecord, "id" | "createdAt">): FarmFieldRecord {
    const id = store.fields.length > 0 ? Math.max(...store.fields.map((f) => f.id)) + 1 : 1;
    const newField: FarmFieldRecord = {
      ...payload,
      id,
      createdAt: new Date().toISOString(),
    };
    store.fields.push(newField);

    // Refresh farm completeness
    this.refreshFarmCompleteness(payload.farmId);
    return newField;
  }

  static updateField(id: number, patch: Partial<FarmFieldRecord>): FarmFieldRecord | null {
    const idx = store.fields.findIndex((f) => f.id === id);
    if (idx === -1) return null;
    store.fields[idx] = { ...store.fields[idx], ...patch };
    this.refreshFarmCompleteness(store.fields[idx].farmId);
    return store.fields[idx];
  }

  static deleteField(id: number): boolean {
    const idx = store.fields.findIndex((f) => f.id === id);
    if (idx === -1) return false;
    const farmId = store.fields[idx].farmId;
    store.fields.splice(idx, 1);
    this.refreshFarmCompleteness(farmId);
    return true;
  }

  // --- Soil Profiles & Tests ---
  static getSoilProfile(fieldId: number): SoilProfileRecord | null {
    return store.soilProfiles.find((s) => s.fieldId === fieldId) || null;
  }

  static upsertSoilProfile(payload: Omit<SoilProfileRecord, "id" | "updatedAt">): SoilProfileRecord {
    const idx = store.soilProfiles.findIndex((s) => s.fieldId === payload.fieldId);
    if (idx !== -1) {
      store.soilProfiles[idx] = {
        ...store.soilProfiles[idx],
        ...payload,
        updatedAt: new Date().toISOString(),
      };
      return store.soilProfiles[idx];
    }
    const id = store.soilProfiles.length > 0 ? Math.max(...store.soilProfiles.map((s) => s.id)) + 1 : 1;
    const newSoil: SoilProfileRecord = {
      ...payload,
      id,
      updatedAt: new Date().toISOString(),
    };
    store.soilProfiles.push(newSoil);
    return newSoil;
  }

  static addSoilTest(payload: Omit<SoilTestRecord, "id" | "createdAt">): SoilTestRecord {
    const id = store.soilTests.length > 0 ? Math.max(...store.soilTests.map((t) => t.id)) + 1 : 1;
    const newTest: SoilTestRecord = {
      ...payload,
      id,
      createdAt: new Date().toISOString(),
    };
    store.soilTests.push(newTest);
    return newTest;
  }

  // --- Water Profile ---
  static getWaterProfile(farmId: number): WaterProfileRecord | null {
    return store.waterProfiles.find((w) => w.farmId === farmId) || null;
  }

  static upsertWaterProfile(payload: Omit<WaterProfileRecord, "id" | "updatedAt">): WaterProfileRecord {
    const idx = store.waterProfiles.findIndex((w) => w.farmId === payload.farmId);
    if (idx !== -1) {
      store.waterProfiles[idx] = {
        ...store.waterProfiles[idx],
        ...payload,
        updatedAt: new Date().toISOString(),
      };
      this.refreshFarmCompleteness(payload.farmId);
      return store.waterProfiles[idx];
    }
    const id = store.waterProfiles.length > 0 ? Math.max(...store.waterProfiles.map((w) => w.id)) + 1 : 1;
    const newWater: WaterProfileRecord = {
      ...payload,
      id,
      updatedAt: new Date().toISOString(),
    };
    store.waterProfiles.push(newWater);
    this.refreshFarmCompleteness(payload.farmId);
    return newWater;
  }

  // --- Crop History ---
  static getCropHistory(fieldId: number): CropHistoryRecord[] {
    return store.cropHistories.filter((h) => h.fieldId === fieldId);
  }

  static addCropHistory(payload: Omit<CropHistoryRecord, "id" | "createdAt">): CropHistoryRecord {
    const id = store.cropHistories.length > 0 ? Math.max(...store.cropHistories.map((h) => h.id)) + 1 : 1;
    const record: CropHistoryRecord = {
      ...payload,
      id,
      createdAt: new Date().toISOString(),
    };
    store.cropHistories.push(record);

    const fld = store.fields.find((f) => f.id === payload.fieldId);
    if (fld) this.refreshFarmCompleteness(fld.farmId);
    return record;
  }

  // --- Growing Seasons & Activities ---
  static getSeasons(fieldId?: number): GrowingSeasonRecord[] {
    if (fieldId) return store.growingSeasons.filter((s) => s.fieldId === fieldId);
    return store.growingSeasons;
  }

  static addSeason(payload: Omit<GrowingSeasonRecord, "id" | "createdAt">): GrowingSeasonRecord {
    const id = store.growingSeasons.length > 0 ? Math.max(...store.growingSeasons.map((s) => s.id)) + 1 : 1;
    const season: GrowingSeasonRecord = {
      ...payload,
      id,
      createdAt: new Date().toISOString(),
    };
    store.growingSeasons.push(season);
    return season;
  }

  static getActivities(seasonId?: number): CropActivityRecord[] {
    if (seasonId) return store.cropActivities.filter((a) => a.seasonId === seasonId);
    return store.cropActivities;
  }

  static addActivity(payload: Omit<CropActivityRecord, "id" | "createdAt">): CropActivityRecord {
    const id = store.cropActivities.length > 0 ? Math.max(...store.cropActivities.map((a) => a.id)) + 1 : 1;
    const activity: CropActivityRecord = {
      ...payload,
      id,
      createdAt: new Date().toISOString(),
    };
    store.cropActivities.push(activity);
    return activity;
  }

  // --- Expenses & Budgets ---
  static getExpenses(farmId: number): FarmExpenseRecord[] {
    return store.farmExpenses.filter((e) => e.farmId === farmId);
  }

  static upsertExpense(payload: Omit<FarmExpenseRecord, "id" | "createdAt">): FarmExpenseRecord {
    const idx = store.farmExpenses.findIndex(
      (e) => e.farmId === payload.farmId && e.category === payload.category
    );
    if (idx !== -1) {
      store.farmExpenses[idx] = { ...store.farmExpenses[idx], ...payload };
      this.refreshFarmCompleteness(payload.farmId);
      return store.farmExpenses[idx];
    }
    const id = store.farmExpenses.length > 0 ? Math.max(...store.farmExpenses.map((e) => e.id)) + 1 : 1;
    const newExp: FarmExpenseRecord = { ...payload, id, createdAt: new Date().toISOString() };
    store.farmExpenses.push(newExp);
    this.refreshFarmCompleteness(payload.farmId);
    return newExp;
  }

  // --- Farmer Preferences ---
  static getPreferences(farmId: number): FarmerPreferenceRecord | null {
    return store.preferences.find((p) => p.farmId === farmId) || null;
  }

  static upsertPreferences(payload: Omit<FarmerPreferenceRecord, "id" | "updatedAt">): FarmerPreferenceRecord {
    const idx = store.preferences.findIndex((p) => p.farmId === payload.farmId);
    if (idx !== -1) {
      store.preferences[idx] = {
        ...store.preferences[idx],
        ...payload,
        updatedAt: new Date().toISOString(),
      };
      return store.preferences[idx];
    }
    const id = store.preferences.length > 0 ? Math.max(...store.preferences.map((p) => p.id)) + 1 : 1;
    const newPref: FarmerPreferenceRecord = { ...payload, id, updatedAt: new Date().toISOString() };
    store.preferences.push(newPref);
    return newPref;
  }

  // --- Recommendation Decisions & Feedback ---
  static addFeedback(payload: Omit<RecommendationFeedbackRecord, "id" | "createdAt">): RecommendationFeedbackRecord {
    const id = store.feedbacks.length > 0 ? Math.max(...store.feedbacks.map((f) => f.id)) + 1 : 1;
    const feedback: RecommendationFeedbackRecord = {
      ...payload,
      id,
      createdAt: new Date().toISOString(),
    };
    store.feedbacks.push(feedback);
    return feedback;
  }

  static getFeedbacks(): RecommendationFeedbackRecord[] {
    return store.feedbacks;
  }

  // --- Harvest Records ---
  static addHarvest(payload: Omit<HarvestRecordItem, "id" | "createdAt">): HarvestRecordItem {
    const id = store.harvests.length > 0 ? Math.max(...store.harvests.map((h) => h.id)) + 1 : 1;
    const record: HarvestRecordItem = {
      ...payload,
      id,
      createdAt: new Date().toISOString(),
    };
    store.harvests.push(record);
    return record;
  }

  static getHarvests(): HarvestRecordItem[] {
    return store.harvests;
  }

  // --- Uploaded Documents ---
  static addDocument(payload: Omit<UploadedFarmDocumentRecord, "id" | "uploadedAt">): UploadedFarmDocumentRecord {
    const id = store.documents.length > 0 ? Math.max(...store.documents.map((d) => d.id)) + 1 : 1;
    const doc: UploadedFarmDocumentRecord = {
      ...payload,
      id,
      uploadedAt: new Date().toISOString(),
    };
    store.documents.push(doc);
    return doc;
  }

  static getDocuments(farmId: number): UploadedFarmDocumentRecord[] {
    return store.documents.filter((d) => d.farmId === farmId);
  }

  // Helper
  private static refreshFarmCompleteness(farmId: number) {
    const farm = store.farms.find((f) => f.id === farmId);
    if (!farm) return;
    const fields = this.getFields(farmId);
    const soils = store.soilProfiles.filter((s) => fields.some((fld) => fld.id === s.fieldId));
    const water = this.getWaterProfile(farmId);
    const history = store.cropHistories.filter((h) => fields.some((fld) => fld.id === h.fieldId));
    const expenses = this.getExpenses(farmId);

    farm.completeness = calculateFarmCompleteness({
      farm,
      fields,
      soilProfiles: soils,
      waterProfile: water,
      cropHistory: history,
      expenses,
    });
    farm.updatedAt = new Date().toISOString();
  }
}
