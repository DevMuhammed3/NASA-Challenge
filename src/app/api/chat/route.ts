import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import {
  chatMessages,
  farmAnalyses,
  type CropSuitabilityResult,
  type MonthForecastItem,
  type RotationSeasonStep,
} from "@/db/schema";
import { eq, asc } from "drizzle-orm";

interface AnalysisContextPayload {
  id?: number;
  farmName: string;
  regionName: string;
  latitude: number;
  longitude: number;
  previousCropCode?: string | null;
  avgTemp3Mo: number;
  maxTemp3Mo: number;
  minTemp3Mo: number;
  relativeHumidity: number;
  soilPh: number;
  totalPrecip3Mo: number;
  soilMoistureRoot: number;
  soilMoistureSurface: number;
  solarRadiation: number;
  ndviIndex: number;
  soilTextureAr: string;
  soilTextureEn: string;
  salinityEc: number;
  recommendations: CropSuitabilityResult[];
  rotationPlan: RotationSeasonStep[];
  forecast3Months: MonthForecastItem[];
}

function synthesizeExpertAgriculturalResponse(
  question: string,
  ctx: AnalysisContextPayload,
  lang: "ar" | "en"
): string {
  const q = question.toLowerCase();
  const topCrop = ctx.recommendations?.[0];
  const secondCrop = ctx.recommendations?.[1];
  const thirdCrop = ctx.recommendations?.[2];
  const m1 = ctx.forecast3Months?.[0];
  const m2 = ctx.forecast3Months?.[1];
  const m3 = ctx.forecast3Months?.[2];

  // Check if user asks about a specific crop in the recommendations list
  const mentionedCrop = ctx.recommendations?.find(
    (c) =>
      q.includes(c.nameAr) ||
      q.includes(c.nameEn.toLowerCase()) ||
      q.includes(c.cropCode.toLowerCase()) ||
      (c.cropCode === "wheat" && (q.includes("قمح") || q.includes("wheat"))) ||
      (c.cropCode === "faba_bean" && (q.includes("فول") || q.includes("faba"))) ||
      (c.cropCode === "clover" && (q.includes("برسيم") || q.includes("clover"))) ||
      (c.cropCode === "maize" && (q.includes("ذرة") || q.includes("ذره") || q.includes("maize") || q.includes("corn"))) ||
      (c.cropCode === "barley" && (q.includes("شعير") || q.includes("barley"))) ||
      (c.cropCode === "potato" && (q.includes("بطاطس") || q.includes("potato"))) ||
      (c.cropCode === "tomato" && (q.includes("طماطم") || q.includes("tomato"))) ||
      (c.cropCode === "cotton" && (q.includes("قطن") || q.includes("cotton"))) ||
      (c.cropCode === "soybean" && (q.includes("صويا") || q.includes("soy"))) ||
      (c.cropCode === "sugar_beet" && (q.includes("بنجر") || q.includes("beet")))
  );

  // 1. Question about soil pH / Alkalinity / Salinity / Soil Improvement
  if (
    q.includes("ph") ||
    q.includes("قلوي") ||
    q.includes("حموض") ||
    q.includes("ملوح") ||
    q.includes("تربة") ||
    q.includes("تربه") ||
    q.includes("alkalin") ||
    q.includes("soil") ||
    q.includes("ارفع نسبة") ||
    q.includes("تحسين")
  ) {
    if (lang === "en") {
      return `### 🧪 Soil Chemistry & Alkalinity Analysis (${ctx.farmName})
Based on **SoilGrids v2.0** and **NASA POWER** telemetry at \`(${ctx.latitude.toFixed(4)}°N, ${ctx.longitude.toFixed(4)}°E)\`:
- **Topsoil Reaction (\`pH H2O\`):** \`${ctx.soilPh}\` (${ctx.soilPh >= 7.6 ? "Moderately Alkaline" : ctx.soilPh <= 6.2 ? "Slightly Acidic" : "Optimal Neutral-Balance"})
- **Soil Texture & Salinity:** ${ctx.soilTextureEn} | \`EC = ${ctx.salinityEc} dS/m\`
- **Root-Zone Wetness (\`GWETROOT\`):** \`${ctx.soilMoistureRoot}%\`

**How to optimize your soil & boost suitability above 92%:**
1. **pH Adjustment:** ${
        ctx.soilPh >= 7.4
          ? `Since your soil pH is \`${ctx.soilPh}\`, apply **150 kg/feddan of micronized agricultural sulfur** mixed with mature organic compost during seedbed preparation to unlock phosphorus and micronutrients (Fe, Zn, Mn).`
          : `Your soil pH (\`${ctx.soilPh}\`) is already favorable for nutrient uptake; maintain organic matter via legume cover crops.`
      }
2. **Acid-Forming Fertilizers:** Use **Ammonium Sulfate (20.6% N)** and **Phosphoric Acid** via fertigation instead of urea.
3. **Top Resilient Crop Match:** **${topCrop?.nameEn}** currently scores **${topCrop?.suitabilityScore}%** (${topCrop?.phScore}% pH match, ${topCrop?.tempScore}% temperature match).`;
    }

    return `### 🧪 تحليل قلوية وخصائص التربة لأرضك (${ctx.farmName})
بناءً على بيانات **SoilGrids** و **NASA POWER** لإحداثيات أرضك \`(${ctx.latitude.toFixed(4)}°N, ${ctx.longitude.toFixed(4)}°E)\`:
- **درجة قلوية/حموضة التربة (\`pH H2O\`):** \`${ctx.soilPh}\` (${
      ctx.soilPh >= 7.6
        ? "تميل للقلوية — تحتاج معالجة لتيسير الفوسفور والعناصر الصغرى"
        : ctx.soilPh <= 6.2
        ? "تميل للحموضة الخفيفة"
        : "متوازنة ومثالية لامتصاص العناصر"
    })
- **قوام التربة والملوحة:** ${ctx.soilTextureAr} | الملوحة \`EC = ${ctx.salinityEc} dS/m\`
- **رطوبة منطقة الجذور (\`GWETROOT\`):** \`${ctx.soilMoistureRoot}%\`

**خطوات عملية لرفع نسبة ملاءمة الأرض لأكثر من 92%:**
1. **معالجة الـ pH:** ${
      ctx.soilPh >= 7.4
        ? `بما أن رقم الـ pH في أرضك هو \`${ctx.soilPh}\`، أنصحك بإضافة **150 كجم كبريت زراعي ميكروني/فدان** مع الخدمة الشتوية أو السباخ البلدي المتحلل لخفض القلوية وتيسير امتصاص الفوسفور والحديد والزنك.`
        : `درجة pH التربة (\`${ctx.soilPh}\`) ممتازة حالياً؛ حافظ عليها بإضافة الكمبوست وتجنب الإفراط في الأسمدة القلوية.`
    }
2. **نوعية التسميد:** استخدم **سلفات النشادر (20.6% N)** وسلفات البوتاسيوم بدلاً من اليوريا لأنها ذات تأثير حامضي موضعي يفيد جذور النبات.
3. **المحصول الأنسب حالياً:** **${topCrop?.nameAr}** بنسبة ملاءمة **${topCrop?.suitabilityScore}%** (توافق الحرارة: ${topCrop?.tempScore}% | توافق الـ pH: ${topCrop?.phScore}%).`;
  }

  // 2. Question about Irrigation, Water, Humidity, or 3-Month Weather Forecast
  if (
    q.includes("ري") ||
    q.includes("رى") ||
    q.includes("مياه") ||
    q.includes("مطر") ||
    q.includes("امطار") ||
    q.includes("أمطار") ||
    q.includes("رطوب") ||
    q.includes("حرار") ||
    q.includes("طقس") ||
    q.includes("3 شهور") ||
    q.includes("ثلاث") ||
    q.includes("irrigat") ||
    q.includes("water") ||
    q.includes("rain") ||
    q.includes("humidity") ||
    q.includes("temp") ||
    q.includes("forecast")
  ) {
    if (lang === "en") {
      return `### 💧 3-Month NASA POWER Climate & Irrigation Schedule
From **NASA POWER Agroclimatology** for \`(${ctx.latitude.toFixed(4)}°N, ${ctx.longitude.toFixed(4)}°E)\`:
- **Expected 3-Month Mean Temp (\`T2M\`):** \`${ctx.avgTemp3Mo}°C\` (Max: \`${ctx.maxTemp3Mo}°C\`, Min: \`${ctx.minTemp3Mo}°C\`)
- **Atmospheric Humidity (\`RH2M\`):** \`${ctx.relativeHumidity}%\`
- **3-Month Cumulative Rainfall (\`PRECTOTCORR\`):** \`${ctx.totalPrecip3Mo} mm\`
- **Root-Zone Soil Moisture (\`GWETROOT\`):** \`${ctx.soilMoistureRoot}%\` (Surface \`GWETTOP\`: \`${ctx.soilMoistureSurface}%\`)

**Month-by-Month Breakdown:**
- **${m1?.monthNameEn}:** \`${m1?.tempAvg}°C\` | Humidity \`${m1?.humidityAvg}%\` | Rain \`${m1?.precipMm} mm\`
- **${m2?.monthNameEn}:** \`${m2?.tempAvg}°C\` | Humidity \`${m2?.humidityAvg}%\` | Rain \`${m2?.precipMm} mm\`
- **${m3?.monthNameEn}:** \`${m3?.tempAvg}°C\` | Humidity \`${m3?.humidityAvg}%\` | Rain \`${m3?.precipMm} mm\`

**Operational Irrigation Advice for ${topCrop?.nameEn}:**
- ${
        ctx.totalPrecip3Mo < 25
          ? `Because expected 3-month rainfall is low (\`${ctx.totalPrecip3Mo} mm\`), rely on scheduled supplemental irrigation every **7–10 days** (or daily pulse drip).`
          : `Factor in the \`${ctx.totalPrecip3Mo} mm\` seasonal rainfall to save ~15% irrigation water during wet weeks.`
      }
- Best irrigation window: **05:30 AM – 08:00 AM** when solar flux (\`ALLSKY_SFC_SW_DWN = ${ctx.solarRadiation} kWh/m²/d\`) and wind evaporation are lowest.`;
    }

    return `### 💧 خطة الري والمناخ للـ 3 أشهر القادمة (من بيانات NASA POWER)
بناءً على القياسات الفضائية لموقع أرضك \`(${ctx.latitude.toFixed(4)}°N, ${ctx.longitude.toFixed(4)}°E)\`:
- **متوسط الحرارة المتوقع (\`T2M\`):** \`${ctx.avgTemp3Mo}°C\` (العظمى: \`${ctx.maxTemp3Mo}°C\` | الصغرى: \`${ctx.minTemp3Mo}°C\`)
- **نسبة الرطوبة الجوية (\`RH2M\`):** \`${ctx.relativeHumidity}%\`
- **إجمالي الأمطار المتوقعة لـ 3 أشهر (\`PRECTOTCORR\`):** \`${ctx.totalPrecip3Mo} مم\`
- **رطوبة التربة في منطقة الجذور (\`GWETROOT\`):** \`${ctx.soilMoistureRoot}%\` (الطبقة السطحية \`GWETTOP\`: \`${ctx.soilMoistureSurface}%\`)

**التفصيل الشهري للـ 90 يوماً القادمة:**
- **${m1?.monthNameAr}:** حرارة \`${m1?.tempAvg}°C\` | رطوبة \`${m1?.humidityAvg}%\` | أمطار \`${m1?.precipMm} مم\`
- **${m2?.monthNameAr}:** حرارة \`${m2?.tempAvg}°C\` | رطوبة \`${m2?.humidityAvg}%\` | أمطار \`${m2?.precipMm} مم\`
- **${m3?.monthNameAr}:** حرارة \`${m3?.tempAvg}°C\` | رطوبة \`${m3?.humidityAvg}%\` | أمطار \`${m3?.precipMm} مم\`

**نصيحة الري التشغيلية لمحصول (${topCrop?.nameAr}):**
1. ${
      ctx.totalPrecip3Mo < 25
        ? `نظراً لأن الأمطار المتوقعة محدودة (\`${ctx.totalPrecip3Mo} مم\`)، يجب الاعتماد على الري التكميلي المنتظم مع الحفاظ على رطوبة الجذور فوق 55%.`
        : `استفد من الأمطار الموسمية المتوقعة (\`${ctx.totalPrecip3Mo} مم\`) بتقليل مقننات الري بنسبة 15% في أسابيع الهطول لمنع اختناق الجذور.`
    }
2. **أفضل توقيت للري:** الصباح الباكر بين **5:30 و 8:00 صباحاً** لتقليل فاقد البخر الناتج عن الإشعاع الشمسي (\`${ctx.solarRadiation} kWh/m²/d\`).`;
  }

  // 3. Question about Crop Rotation (تدوير المحاصيل)
  if (
    q.includes("تدوير") ||
    q.includes("دورة") ||
    q.includes("دوره") ||
    q.includes("نيتروجين") ||
    q.includes("الموسم القادم") ||
    q.includes("بعد") ||
    q.includes("rotat") ||
    q.includes("nitrogen") ||
    q.includes("next season")
  ) {
    const s1 = ctx.rotationPlan?.[0];
    const s2 = ctx.rotationPlan?.[1];
    const s3 = ctx.rotationPlan?.[2];

    if (lang === "en") {
      return `### 🔄 3-Season Scientific Crop Rotation Plan
Our **Crop Rotation Engine** prevents consecutive planting of the same botanical family and balances soil Nitrogen (\`NPK\`):

1. **${s1?.seasonLabelEn}: ${s1?.cropNameEn}** (\`${s1?.family}\` — Score: \`${s1?.suitabilityScore}%\`)
   - *Role:* ${s1?.nitrogenRoleEn} | *Root Depth:* ${s1?.rootDepth}
   - *Why:* ${s1?.rationaleEn}
2. **${s2?.seasonLabelEn}: ${s2?.cropNameEn}** (\`${s2?.family}\` — Score: \`${s2?.suitabilityScore}%\`)
   - *Role:* ${s2?.nitrogenRoleEn} | *Root Depth:* ${s2?.rootDepth}
   - *Why:* ${s2?.rationaleEn}
3. **${s3?.seasonLabelEn}: ${s3?.cropNameEn}** (\`${s3?.family}\` — Score: \`${s3?.suitabilityScore}%\`)
   - *Role:* ${s3?.nitrogenRoleEn} | *Root Depth:* ${s3?.rootDepth}
   - *Why:* ${s3?.rationaleEn}

💡 **Agronomic Impact:** This rotation saves ~25–35% on synthetic nitrogen fertilizers and breaks cereal/legume soil-borne pest cycles.`;
    }

    return `### 🔄 خطة تدوير المحاصيل الذكية لـ 3 مواسم متتالية
صمّم محرك **GAIA Crop Rotation** هذه الدورة لأرضك لمنع تكرار نفس العائلة النباتية وموازنة النيتروجين في التربة:

1. **${s1?.seasonLabelAr}: ${s1?.cropNameAr}** (${s1?.familyAr} — الملاءمة: \`${s1?.suitabilityScore}%\`)
   - *الدور الغذائي:* ${s1?.nitrogenRoleAr}
   - *التفسير العلمي:* ${s1?.rationaleAr}
2. **${s2?.seasonLabelAr}: ${s2?.cropNameAr}** (${s2?.familyAr} — الملاءمة: \`${s2?.suitabilityScore}%\`)
   - *الدور الغذائي:* ${s2?.nitrogenRoleAr}
   - *التفسير العلمي:* ${s2?.rationaleAr}
3. **${s3?.seasonLabelAr}: ${s3?.cropNameAr}** (${s3?.familyAr} — الملاءمة: \`${s3?.suitabilityScore}%\`)
   - *الدور الغذائي:* ${s3?.nitrogenRoleAr}
   - *التفسير العلمي:* ${s3?.rationaleAr}

💡 **الفائدة الاقتصادية والبيئية:** تطبيق هذا التناوب يوفر **25% إلى 35% من تكلفة الأسمدة النيتروجينية** ويكسر دورة حياة الحشرات والفطريات المتوطنة في التربة.`;
  }

  // 4. Question about a specific crop mentioned by the farmer
  if (mentionedCrop) {
    if (lang === "en") {
      return `### 🌱 Detailed Evaluation for **${mentionedCrop.nameEn}** (*${mentionedCrop.scientificName}*)
- **Overall Suitability Score:** \`${mentionedCrop.suitabilityScore}%\` (Rank #${
        ctx.recommendations.findIndex((c) => c.cropCode === mentionedCrop.cropCode) + 1
      } out of ${ctx.recommendations.length} crops)
- **Botanical Family:** \`${mentionedCrop.family}\` | **Growth Duration:** \`${mentionedCrop.growthDurationDays} days\`
- **Parameter Breakdown:**
  - Temperature Match (\`T2M = ${ctx.avgTemp3Mo}°C\` vs ideal \`${mentionedCrop.optimalRanges.tempMin}–${mentionedCrop.optimalRanges.tempMax}°C\`): \`${mentionedCrop.tempScore}%\`
  - Soil pH Match (\`pH = ${ctx.soilPh}\` vs ideal \`${mentionedCrop.optimalRanges.phMin}–${mentionedCrop.optimalRanges.phMax}\`): \`${mentionedCrop.phScore}%\`
  - Humidity/Moisture Match (\`RH2M = ${ctx.relativeHumidity}%\`): \`${mentionedCrop.moistureScore}%\`
  - Crop Rotation Adjustment: \`${mentionedCrop.rotationBonus >= 0 ? `+${mentionedCrop.rotationBonus}%` : `${mentionedCrop.rotationBonus}%`}\`

**Key Scientific Reasons:**
${mentionedCrop.reasonsEn.map((r) => `- ✅ ${r}`).join("\n")}
${mentionedCrop.warningsEn.map((w) => `- ⚠️ ${w}`).join("\n")}`;
    }

    return `### 🌱 التقييم العلمي لمحصول **${mentionedCrop.nameAr}** (*${mentionedCrop.scientificName}*)
- **نسبة الملاءمة الإجمالية لأرضك:** \`${mentionedCrop.suitabilityScore}%\` (الترتيب #${
      ctx.recommendations.findIndex((c) => c.cropCode === mentionedCrop.cropCode) + 1
    } من بين ${ctx.recommendations.length} محاصيل)
- **العائلة النباتية:** ${mentionedCrop.familyAr} | **مدة النمو:** \`${mentionedCrop.growthDurationDays} يوماً\`
- **تفصيل درجات التوافق مع بيانات ناسا و SoilGrids:**
  - توافق الحرارة (\`T2M = ${ctx.avgTemp3Mo}°C\` مقابل المدى المثالي \`${mentionedCrop.optimalRanges.tempMin}–${mentionedCrop.optimalRanges.tempMax}°C\`): \`${mentionedCrop.tempScore}%\`
  - توافق قلوية التربة (\`pH = ${ctx.soilPh}\` مقابل المدى المثالي \`${mentionedCrop.optimalRanges.phMin}–${mentionedCrop.optimalRanges.phMax}\`): \`${mentionedCrop.phScore}%\`
  - توافق الرطوبة (\`RH2M = ${ctx.relativeHumidity}%\`): \`${mentionedCrop.moistureScore}%\`
  - أثر تدوير المحاصيل: \`${mentionedCrop.rotationBonus >= 0 ? `+${mentionedCrop.rotationBonus}%` : `${mentionedCrop.rotationBonus}%`}\`

**الأسباب والتفسير العلمي (Explainability):**
${mentionedCrop.reasonsAr.map((r) => `- ✅ ${r}`).join("\n")}
${mentionedCrop.warningsAr.map((w) => `- ⚠️ ${w}`).join("\n")}`;
  }

  // 5. Default comprehensive explanation of the top recommendations & why they were chosen
  if (lang === "en") {
    return `### 🌍 GAIA Decision Support Summary for **${ctx.farmName}**
Based on live telemetry from **NASA POWER**, **NASA GIBS (NDVI = \`${ctx.ndviIndex}\`)**, and **SoilGrids (\`pH = ${ctx.soilPh}\`)**:

1. **🥇 Top Recommended Crop: ${topCrop?.nameEn} (\`${topCrop?.suitabilityScore}%\`)**
   - ${topCrop?.reasonsEn?.[0] ?? "Optimal match with expected 3-month temperature and soil pH."}
   - Expected Yield: \`~${topCrop?.expectedYieldTonHa} ton/ha\` | Duration: \`${topCrop?.growthDurationDays} days\`.
2. **🥈 Second Alternative: ${secondCrop?.nameEn} (\`${secondCrop?.suitabilityScore}%\`)**
   - Family: \`${secondCrop?.family}\` | Water Need: \`${secondCrop?.waterNeed}\`.
3. **🥉 Third Alternative: ${thirdCrop?.nameEn} (\`${thirdCrop?.suitabilityScore}%\`)**
   - Family: \`${thirdCrop?.family}\` | Salinity Tolerance: \`${thirdCrop?.salinityTolerance}\`.

Ask me about **specific crops** (e.g., *Wheat, Faba Bean, Barley, Maize*), **how to treat soil pH**, or **your 3-month irrigation schedule**!`;
  }

  return `### 🌍 ملخص قرار نظام GAIA الذكي لمزرعتك (**${ctx.farmName}**)
بناءً على تحليل بيانات **NASA POWER** ومؤشر الغطاء النباتي **NASA GIBS (\`NDVI = ${ctx.ndviIndex}\`)** وبيانات التربة **SoilGrids (\`pH = ${ctx.soilPh}\`)**:

1. **🥇 الخيار الأول الأنسب: ${topCrop?.nameAr} (بنسبة ملاءمة \`${topCrop?.suitabilityScore}%\`)**
   - ${topCrop?.reasonsAr?.[0] ?? "توافق ممتاز مع درجات الحرارة المتوقعة وقلوية التربة."}
   - الإنتاجية المتوقعة: \`${topCrop?.expectedYieldTonHa} طن/هكتار\` | مدة النمو: \`${topCrop?.growthDurationDays} يوماً\`.
2. **🥈 البديل الثاني: ${secondCrop?.nameAr} (بنسبة ملاءمة \`${secondCrop?.suitabilityScore}%\`)**
   - العائلة: ${secondCrop?.familyAr} | احتياج المياه: \`${
    secondCrop?.waterNeed === "low"
      ? "منخفض"
      : secondCrop?.waterNeed === "medium"
      ? "متوسط"
      : "مرتفع"
  }\`.
3. **🥉 البديل الثالث: ${thirdCrop?.nameAr} (بنسبة ملاءمة \`${thirdCrop?.suitabilityScore}%\`)**
   - العائلة: ${thirdCrop?.familyAr} | تحمل الملوحة: \`${
    thirdCrop?.salinityTolerance === "high"
      ? "مرتفع"
      : secondCrop?.salinityTolerance === "medium"
      ? "متوسط"
      : "منخفض"
  }\`.

يمكنك سؤالي الآن عن:
- **"لماذا اخترت ${topCrop?.nameAr} دون غيره؟"**
- **"كيف أرفع نسبة الملاءمة وأعالج قلوية التربة؟"**
- **"ما هي خطة الري للـ 3 شهور القادمة؟"**`;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const analysisId = Number(searchParams.get("analysisId"));

    if (!analysisId || Number.isNaN(analysisId)) {
      return NextResponse.json({ status: "Success", messages: [] });
    }

    const messages = await db
      .select()
      .from(chatMessages)
      .where(eq(chatMessages.analysisId, analysisId))
      .orderBy(asc(chatMessages.createdAt));

    return NextResponse.json({ status: "Success", messages });
  } catch (error) {
    console.error("GET /api/chat error:", error);
    return NextResponse.json({ status: "Success", messages: [] });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const message: string = (body.message || "").trim();
    const lang: "ar" | "en" = body.lang === "en" ? "en" : "ar";
    const analysisId: number | undefined = body.analysisId
      ? Number(body.analysisId)
      : undefined;
    let analysisContext: AnalysisContextPayload | undefined =
      body.analysisContext;

    if (!message) {
      return NextResponse.json(
        { status: "Error", message: "Empty message" },
        { status: 400 }
      );
    }

    // If analysisContext wasn't passed in body, load from DB by analysisId
    if (!analysisContext && analysisId) {
      const [found] = await db
        .select()
        .from(farmAnalyses)
        .where(eq(farmAnalyses.id, analysisId));
      if (found) {
        analysisContext = found as unknown as AnalysisContextPayload;
      }
    }

    // Save user message if analysisId exists
    if (analysisId) {
      await db.insert(chatMessages).values({
        analysisId,
        role: "user",
        content: message,
      });
    }

    let replyText = "";

    // Check if OPENAI_API_KEY is configured for external LLM augmentation
    const openAiKey = process.env.OPENAI_API_KEY;
    if (openAiKey && analysisContext) {
      try {
        const systemPrompt = `You are GAIA, an expert agricultural decision-support AI built for the NASA Space Apps Challenge.
You do NOT guess. You explain and advise strictly based on the farmer's active NASA POWER, NASA GIBS NDVI, and ISRIC SoilGrids analysis report:
- Farm: ${analysisContext.farmName} (${analysisContext.latitude}, ${analysisContext.longitude})
- 3-Month Expected Temperature (T2M): ${analysisContext.avgTemp3Mo}°C (Min: ${analysisContext.minTemp3Mo}°C, Max: ${analysisContext.maxTemp3Mo}°C)
- Atmospheric Relative Humidity (RH2M): ${analysisContext.relativeHumidity}%
- Soil pH (SoilGrids phh2o): ${analysisContext.soilPh} (${analysisContext.soilTextureEn})
- 3-Month Total Precipitation (PRECTOTCORR): ${analysisContext.totalPrecip3Mo} mm
- Root-Zone Soil Moisture (GWETROOT): ${analysisContext.soilMoistureRoot}%
- Satellite NDVI (NASA GIBS): ${analysisContext.ndviIndex}
- Previous Crop: ${analysisContext.previousCropCode || "None"}
- Top Ranked Crops: ${analysisContext.recommendations
          ?.slice(0, 4)
          .map((c) => `${c.nameEn}/${c.nameAr} (${c.suitabilityScore}%)`)
          .join(", ")}
- 3-Season Rotation Plan: ${analysisContext.rotationPlan
          ?.map((s) => `S${s.seasonNumber}: ${s.cropNameEn} (${s.nitrogenRoleEn})`)
          .join(" -> ")}
Respond concisely and helpfully in ${lang === "en" ? "English" : "Arabic"}. Always cite the exact NASA/SoilGrids numbers.`;

        const llmRes = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${openAiKey}`,
          },
          body: JSON.stringify({
            model: "gpt-4o-mini",
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: message },
            ],
            temperature: 0.3,
          }),
        });

        if (llmRes.ok) {
          const json = await llmRes.json();
          replyText = json?.choices?.[0]?.message?.content || "";
        }
      } catch {
        // Fallback to local RAG expert engine below
      }
    }

    if (!replyText && analysisContext) {
      replyText = synthesizeExpertAgriculturalResponse(
        message,
        analysisContext,
        lang
      );
    } else if (!replyText) {
      replyText =
        lang === "en"
          ? "Please run a field analysis first so I can advise you based on your farm's NASA POWER and SoilGrids telemetry."
          : "يرجى تحليل موقع الأرض أولاً حتى أتمكن من تقديم استشارة دقيقة مبنية على أرقام NASA POWER و SoilGrids الخاصة بمزرعتك.";
    }

    if (analysisId) {
      await db.insert(chatMessages).values({
        analysisId,
        role: "assistant",
        content: replyText,
      });
    }

    return NextResponse.json({
      status: "Success",
      reply: replyText,
    });
  } catch (error) {
    console.error("POST /api/chat error:", error);
    return NextResponse.json(
      { status: "Error", message: "Failed to generate assistant response" },
      { status: 500 }
    );
  }
}
