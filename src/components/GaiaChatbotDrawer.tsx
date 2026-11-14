"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  MessageSquare,
  Send,
  X,
  Sparkles,
  Bot,
  User,
  HelpCircle,
} from "lucide-react";
import { GaiaLogo } from "./GaiaLogo";
import type {
  CropSuitabilityResult,
  MonthForecastItem,
  RotationSeasonStep,
} from "@/db/schema";

export interface ActiveAnalysisForChat {
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

interface ChatMessageItem {
  id: string;
  role: "user" | "assistant";
  content: string;
}

interface GaiaChatbotDrawerProps {
  activeAnalysis: ActiveAnalysisForChat | null;
  lang: "ar" | "en";
  externalPromptTrigger?: { text: string; timestamp: number } | null;
}

export function GaiaChatbotDrawer({
  activeAnalysis,
  lang,
  externalPromptTrigger,
}: GaiaChatbotDrawerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessageItem[]>([]);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const topCrop = activeAnalysis?.recommendations?.[0];

  // Reset or initialize contextual welcome message when activeAnalysis changes
  useEffect(() => {
    if (!activeAnalysis) return;
    const welcomeContent =
      lang === "ar"
        ? `أهلاً بك يا صديقي المزارع في **مساعد GAIA الذكي** 🌿\nلقد قمتُ بقراءة تقرير تحليل أرضك (**${activeAnalysis.farmName}**) المبني على بيانات ناسا:\n- الحرارة المتوقعة (3 أشهر): \`T2M = ${activeAnalysis.avgTemp3Mo}°C\`\n- رطوبة الجو: \`RH2M = ${activeAnalysis.relativeHumidity}%\` | رطوبة الجذور: \`${activeAnalysis.soilMoistureRoot}%\`\n- قلوية التربة: \`pH = ${activeAnalysis.soilPh}\` | الأمطار: \`${activeAnalysis.totalPrecip3Mo} مم\`\n- **أفضل محصول مقترح تلقائياً:** **${topCrop?.nameAr}** بنسبة ملاءمة \`${topCrop?.suitabilityScore}%\`.\n\nأنا خيار إضافي لمساعدتك في فهم الحل أو الإجابة عن أي استفسار تشغيلي!`
        : `Welcome to **GAIA Expert Assistant** 🌿\nI have loaded your active field report (**${activeAnalysis.farmName}**) powered by NASA telemetry:\n- 3-Mo Expected Temp: \`T2M = ${activeAnalysis.avgTemp3Mo}°C\`\n- Humidity: \`RH2M = ${activeAnalysis.relativeHumidity}%\` | Root Wetness: \`${activeAnalysis.soilMoistureRoot}%\`\n- Soil Reaction: \`pH = ${activeAnalysis.soilPh}\` | 3-Mo Rain: \`${activeAnalysis.totalPrecip3Mo} mm\`\n- **Top Automated Match:** **${topCrop?.nameEn}** (\`${topCrop?.suitabilityScore}%\` suitability).\n\nHow can I help you optimize this solution today?`;

    setMessages([
      {
        id: `welcome-${activeAnalysis.id ?? "init"}`,
        role: "assistant",
        content: welcomeContent,
      },
    ]);
  }, [
    activeAnalysis?.id,
    activeAnalysis?.farmName,
    lang,
    topCrop?.nameAr,
    topCrop?.nameEn,
    topCrop?.suitabilityScore,
    activeAnalysis,
  ]);

  // Handle external prompt trigger (e.g., clicking "Ask GAIA about this crop" on a card)
  useEffect(() => {
    if (externalPromptTrigger && externalPromptTrigger.text) {
      setIsOpen(true);
      handleSendPrompt(externalPromptTrigger.text);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [externalPromptTrigger]);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  async function handleSendPrompt(promptText?: string) {
    const textToSend = (promptText ?? input).trim();
    if (!textToSend || isLoading) return;

    if (!promptText) {
      setInput("");
    }

    const userMsg: ChatMessageItem = {
      id: `user-${Date.now()}`,
      role: "user",
      content: textToSend,
    };
    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: textToSend,
          analysisId: activeAnalysis?.id,
          analysisContext: activeAnalysis,
          lang,
        }),
      });
      const data = await res.json();
      const replyContent =
        data?.reply ||
        (lang === "ar"
          ? "عذراً، حدث خطأ أثناء تحليل السؤال."
          : "Sorry, an error occurred while processing your question.");

      setMessages((prev) => [
        ...prev,
        {
          id: `bot-${Date.now()}`,
          role: "assistant",
          content: replyContent,
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `bot-err-${Date.now()}`,
          role: "assistant",
          content:
            lang === "ar"
              ? "تعذر الاتصال بالخادم، يرجى المحاولة مرة أخرى."
              : "Connection error, please try again.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }

  const quickPrompts =
    lang === "ar"
      ? [
          `لماذا اقترحت لي ${topCrop?.nameAr ?? "هذا المحصول"} بنسبة ${
            topCrop?.suitabilityScore ?? 85
          }%؟`,
          `كيف أرفع نسبة ملاءمة الأرض وأعالج قلوية التربة (pH = ${
            activeAnalysis?.soilPh ?? 7.3
          })؟`,
          "ما هي خطة الري الأمثل للـ 3 شهور القادمة بناءً على بيانات ناسا؟",
          "اشرح لي خطة تدوير المحاصيل للـ 3 مواسم القادمة وتوازن النيتروجين",
        ]
      : [
          `Why was ${topCrop?.nameEn ?? "this crop"} recommended at ${
            topCrop?.suitabilityScore ?? 85
          }%?`,
          `How can I treat soil pH (${
            activeAnalysis?.soilPh ?? 7.3
          }) and boost suitability to 95%?`,
          "What is the 3-month irrigation schedule based on NASA POWER?",
          "Explain my 3-season crop rotation and nitrogen balance plan",
        ];

  return (
    <>
      {/* Floating Action Button (Optional Helper Trigger) */}
      <div className="fixed bottom-5 right-5 z-40 flex items-center gap-3">
        {!isOpen && (
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            className="group flex items-center gap-3 rounded-full border-2 border-[#D6C99A]/80 bg-[#41644A] px-4 py-2.5 text-white shadow-[0_10px_30px_rgba(36,59,42,0.35)] transition-all hover:scale-105 hover:bg-[#34503B]"
          >
            <GaiaLogo size={34} showBadge />
            <div className="text-right">
              <div className="flex items-center gap-1.5 text-xs font-extrabold text-white">
                <Sparkles className="h-3.5 w-3.5" />
                <span>
                  {lang === "ar"
                    ? "اسأل خبير GAIA الذكي (اختياري)"
                    : "Ask GAIA AI Advisor (Optional)"}
                </span>
              </div>
              <div className="text-[10px] font-semibold text-white/80">
                {lang === "ar"
                  ? "يفسر نتائج تحليل ناسا لأرضك"
                  : "Explains your NASA field report"}
              </div>
            </div>
          </button>
        )}
      </div>

      {/* Slide-Up / Slide-Over Contextual Chatbot Panel */}
      {isOpen && (
        <div className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col border-l border-[#E2E6DA] bg-[#FFFFFF] shadow-xl sm:inset-y-4 sm:right-4 sm:rounded-2xl sm:border">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-[#E2E6DA] bg-[#EEF0E6] px-4 py-3.5">
            <div className="flex items-center gap-3">
              <GaiaLogo size={38} showBadge />
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="text-sm font-bold text-[#28301C]">
                    {lang === "ar"
                      ? "مستشار GAIA الزراعي الذكي"
                      : "GAIA Smart Agro-Advisor"}
                  </h3>
                  <span className="rounded-full bg-[#FFFFFF] border border-[#E2E6DA] px-2 py-0.5 text-[10px] font-mono text-[#41644A] font-bold">
                    RAG + NASA
                  </span>
                </div>
                <p className="text-[11px] text-[#687365]">
                  {lang === "ar"
                    ? `مرتبط بتقرير: ${activeAnalysis?.farmName ?? "المزرعة"}`
                    : `Connected to: ${activeAnalysis?.farmName ?? "Active Field"}`}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="cursor-pointer rounded-lg border border-[#E2E6DA] bg-[#FFFFFF] p-1.5 text-[#687365] transition-all duration-150 hover:border-[#41644A] hover:bg-[#EEF0E6] hover:text-[#28301C]"
              aria-label="Close Chatbot"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Active Telemetry Context Strip */}
          {activeAnalysis && (
            <div
              dir="ltr"
              className="flex flex-wrap items-center justify-between gap-2 border-b border-[#E2E6DA] bg-[#FFFFFF] px-4 py-2 font-mono text-[11px] text-[#687365]"
            >
              <span>T2M: {activeAnalysis.avgTemp3Mo}°C</span>
              <span>•</span>
              <span>RH2M: {activeAnalysis.relativeHumidity}%</span>
              <span>•</span>
              <span>pH: {activeAnalysis.soilPh}</span>
              <span>•</span>
              <span className="text-[#41644A] font-bold">
                Top: {topCrop?.nameEn} ({topCrop?.suitabilityScore}%)
              </span>
            </div>
          )}

          {/* Messages Feed */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-2.5 ${
                  msg.role === "user" ? "flex-row-reverse" : "flex-row"
                }`}
              >
                <div
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border ${
                    msg.role === "user"
                      ? "border-[#41644A] bg-[#41644A] text-white"
                      : "border-[#E2E6DA] bg-[#EEF0E6] text-[#28301C]"
                  }`}
                >
                  {msg.role === "user" ? (
                    <User className="h-3.5 w-3.5" />
                  ) : (
                    <Bot className="h-3.5 w-3.5 text-[#41644A]" />
                  )}
                </div>

                <div
                  className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed whitespace-pre-line ${
                    msg.role === "user"
                      ? "bg-[#41644A] text-white font-semibold"
                      : "border border-[#E2E6DA] bg-[#FFFFFF] text-[#28301C]"
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex items-center gap-2 text-xs text-[#687365] px-2">
                <MessageSquare className="h-4 w-4 animate-pulse text-[#41644A]" />
                <span>
                  {lang === "ar"
                    ? "يقرأ بيانات ناسا ويحلل الإجابة..."
                    : "Analyzing NASA telemetry & crop database..."}
                </span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompt Chips */}
          <div className="border-t border-[#E2E6DA] bg-[#FFFFFF] px-3 py-2">
            <div className="mb-1.5 flex items-center gap-1 text-[11px] font-semibold text-[#687365]">
              <HelpCircle className="h-3 w-3 text-[#41644A]" />
              <span>
                {lang === "ar"
                  ? "أسئلة سريعة حول نتيجة أرضك:"
                  : "Quick questions about your field result:"}
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {quickPrompts.map((q, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSendPrompt(q)}
                  disabled={isLoading}
                  className="cursor-pointer rounded-lg border border-[#E2E6DA] bg-[#FFFFFF] px-2.5 py-1 text-right text-[11px] font-medium text-[#28301C] transition-all duration-150 hover:border-[#41644A] hover:bg-[#EEF0E6] hover:text-[#243B2A] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>

          {/* Input Box */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendPrompt();
            }}
            className="flex items-center gap-2 border-t border-[#E2E6DA] bg-[#EEF0E6] p-3"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={
                lang === "ar"
                  ? "اسأل عن أي محصول، الري، أو معالجة التربة..."
                  : "Ask about any crop, irrigation, or soil pH..."
              }
              className="flex-1 rounded-xl border border-[#E2E6DA] bg-[#FFFFFF] px-3.5 py-2.5 text-xs text-[#28301C] placeholder-[#687365]/70 focus:border-[#41644A] focus:outline-none"
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="cursor-pointer flex h-9 w-9 items-center justify-center rounded-xl bg-[#41644A] text-white transition-all duration-150 hover:bg-[#34503B] disabled:cursor-not-allowed disabled:opacity-50 active:scale-95"
              aria-label="Send Message"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
