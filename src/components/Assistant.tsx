"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertOctagon, ArrowLeft, Bot, Check, CheckCircle2, ClipboardCopy, FilePlus2, FileMinus2,
  FilePen, HelpCircle, RotateCcw, Search, ShieldAlert, TriangleAlert, WifiOff,
} from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { flows, outcomeOf, type ActionKey, type Question, type Result } from "@/lib/flows";
import { translate, type Lang, type TKey } from "@/lib/i18n";
import type { KnowledgeItem } from "@/lib/types";
import { cn, splitSteps } from "@/lib/utils";

const LANG_KEY = "cca-lang";

type View = "start" | "flow" | "faq";
type Step = { questionId: string; question: Question; chosen?: number };

const btnBase =
  "inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-2 disabled:opacity-50";
const btnPrimary = cn(btnBase, "bg-teal-700 px-5 py-2.5 text-white hover:bg-teal-800");
const btnOutline = cn(btnBase, "border border-slate-300 bg-white px-4 py-2 text-slate-700 hover:bg-slate-100");

// Replays the chosen answers through the flow to find the current question or the result.
function walk(action: ActionKey, answers: number[]) {
  const flow = flows[action];
  const steps: Step[] = [];
  let qid: string | null = flow.start;
  let result: Result | null = null;
  for (let i = 0; qid; i++) {
    const question: Question = flow.questions[qid];
    const chosen = answers[i];
    steps.push({ questionId: qid, question, chosen });
    if (chosen === undefined) break;
    const next = question.options[chosen].next;
    if ("result" in next) {
      result = next.result;
      qid = null;
    } else qid = next.question;
  }
  return { steps, result, total: flow.total };
}

export function Assistant() {
  const [lang, setLang] = useState<Lang>("et");
  const [view, setView] = useState<View>("start");
  const [action, setAction] = useState<ActionKey | null>(null);
  const [answers, setAnswers] = useState<number[]>([]);
  const [items, setItems] = useState<KnowledgeItem[] | null>(null);
  const [loadError, setLoadError] = useState(false);
  const mainRef = useRef<HTMLElement>(null);

  const t = useCallback((key: TKey, vars?: Record<string, string | number>) => translate(lang, key, vars), [lang]);

  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(LANG_KEY);
      if (saved === "en" || saved === "et") setLang(saved);
    } catch {}
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
    document.title = translate(lang, "appName");
  }, [lang]);

  const changeLang = (l: Lang) => {
    setLang(l);
    try {
      sessionStorage.setItem(LANG_KEY, l);
    } catch {}
  };

  const loadKnowledge = useCallback(async () => {
    setLoadError(false);
    try {
      const res = await fetch("/api/knowledge", { cache: "no-store" });
      if (!res.ok) throw new Error(String(res.status));
      const data = await res.json();
      setItems(data.items);
    } catch {
      setItems(null);
      setLoadError(true);
    }
  }, []);

  useEffect(() => {
    loadKnowledge();
  }, [loadKnowledge]);

  // Move focus to the main area on every screen change so keyboard users land on the new content.
  useEffect(() => {
    mainRef.current?.focus();
  }, [view, action, answers.length]);

  const startOver = () => {
    setView("start");
    setAction(null);
    setAnswers([]);
  };

  const begin = (a: ActionKey | "unsure") => {
    setAnswers([]);
    if (a === "unsure") {
      setAction(null);
      setView("faq");
    } else {
      setAction(a);
      setView("flow");
    }
  };

  const answer = (optionIndex: number) => {
    if (!action) return;
    const next = [...answers, optionIndex];
    setAnswers(next);
    const { result } = walk(action, next);
    if (result) {
      // Anonymous usage statistics only: language, action and outcome.
      fetch("/api/usage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ language: lang, action, outcome: outcomeOf(result) }),
      }).catch(() => {});
    }
  };

  const back = () => {
    if (answers.length === 0) startOver();
    else setAnswers(answers.slice(0, -1));
  };

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <button onClick={startOver} className={cn(btnBase, "gap-2.5 rounded-md px-1 text-left")}>
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-700 text-white">
              <FilePen className="h-5 w-5" aria-hidden />
            </span>
            <span className="flex flex-col leading-tight">
              <span className="text-base font-semibold text-slate-900">{t("appName")}</span>
              <span className="text-xs font-normal text-slate-500">{t("company")}</span>
            </span>
          </button>
          <nav className="flex items-center gap-2 sm:gap-4">
            <button
              onClick={() => setView("faq")}
              aria-current={view === "faq" ? "page" : undefined}
              className={cn(
                btnBase,
                "rounded-md px-3 py-2 text-sm text-slate-700 hover:bg-slate-100",
                view === "faq" && "bg-slate-100 text-teal-800",
              )}
            >
              <HelpCircle className="h-4 w-4" aria-hidden />
              {t("faq")}
            </button>
            <div role="group" aria-label={t("langLabel")} className="flex rounded-lg border border-slate-300 p-0.5">
              {(["et", "en"] as const).map((l) => (
                <button
                  key={l}
                  onClick={() => changeLang(l)}
                  aria-pressed={lang === l}
                  lang={l}
                  className={cn(
                    btnBase,
                    "rounded-md px-2.5 py-1 text-xs font-semibold uppercase",
                    lang === l ? "bg-teal-700 text-white" : "text-slate-600 hover:bg-slate-100",
                  )}
                >
                  {l}
                </button>
              ))}
            </div>
          </nav>
        </div>
      </header>

      <main ref={mainRef} tabIndex={-1} className="mx-auto w-full max-w-4xl flex-1 px-4 py-8 outline-none sm:px-6 sm:py-12">
        {loadError && (
          <div role="alert" className="mb-6 flex flex-col gap-3 rounded-xl border border-amber-300 bg-amber-50 p-4 text-amber-900 sm:flex-row sm:items-center">
            <WifiOff className="h-5 w-5 shrink-0" aria-hidden />
            <p className="flex-1 text-sm">{t("dbError")}</p>
            <button onClick={loadKnowledge} className={btnOutline}>
              <RotateCcw className="h-4 w-4" aria-hidden />
              {t("retry")}
            </button>
          </div>
        )}

        {view === "start" && <StartView t={t} onSelect={begin} />}
        {view === "flow" && action && (
          <FlowView
            t={t}
            lang={lang}
            action={action}
            answers={answers}
            items={items}
            onAnswer={answer}
            onBack={back}
            onStartOver={startOver}
          />
        )}
        {view === "faq" && <FaqView t={t} lang={lang} items={items} loading={!items && !loadError} onBack={startOver} />}
      </main>

      <footer className="border-t border-slate-200 bg-white">
        <p className="mx-auto max-w-4xl px-4 py-4 text-xs text-slate-500 sm:px-6">{t("disclaimer")}</p>
      </footer>
    </div>
  );
}

type T = (key: TKey, vars?: Record<string, string | number>) => string;

function AssistantMessage({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-teal-100 text-teal-800">
        <Bot className="h-5 w-5" aria-hidden />
      </span>
      <div className="rounded-2xl rounded-tl-sm border border-slate-200 bg-white px-5 py-4 shadow-sm">{children}</div>
    </div>
  );
}

function StartView({ t, onSelect }: { t: T; onSelect: (a: ActionKey | "unsure") => void }) {
  const cards: { key: ActionKey | "unsure"; icon: React.ElementType; label: TKey; desc: TKey }[] = [
    { key: "add", icon: FilePlus2, label: "action.add", desc: "action.add.desc" },
    { key: "remove", icon: FileMinus2, label: "action.remove", desc: "action.remove.desc" },
    { key: "change", icon: FilePen, label: "action.change", desc: "action.change.desc" },
    { key: "unsure", icon: HelpCircle, label: "action.unsure", desc: "action.unsure.desc" },
  ];
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">{t("appName")}</h1>
      </div>
      <AssistantMessage>
        <p className="text-slate-700">{t("intro")}</p>
        <p className="mt-1 font-medium text-slate-900">{t("chooseAction")}</p>
      </AssistantMessage>
      <div className="grid gap-4 sm:grid-cols-2">
        {cards.map(({ key, icon: Icon, label, desc }) => (
          <button
            key={key}
            onClick={() => onSelect(key)}
            className={cn(
              btnBase,
              "group items-start justify-start gap-4 rounded-xl border border-slate-200 bg-white p-6 text-left shadow-sm hover:border-teal-600 hover:shadow-md",
            )}
          >
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-teal-50 text-teal-700 group-hover:bg-teal-700 group-hover:text-white">
              <Icon className="h-6 w-6" aria-hidden />
            </span>
            <span>
              <span className="block text-lg font-semibold text-slate-900">{t(label)}</span>
              <span className="mt-1 block text-sm font-normal text-slate-600">{t(desc)}</span>
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

function FlowView({
  t, lang, action, answers, items, onAnswer, onBack, onStartOver,
}: {
  t: T; lang: Lang; action: ActionKey; answers: number[]; items: KnowledgeItem[] | null;
  onAnswer: (i: number) => void; onBack: () => void; onStartOver: () => void;
}) {
  const { steps, result, total } = walk(action, answers);
  const current = steps[steps.length - 1];
  const actionLabel = t(`action.${action}` as TKey);
  const stepLabel = result ? t("result") : t("step", { n: steps.length, total });
  const progress = result ? 100 : ((steps.length - 1) / total) * 100;

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">{actionLabel}</h1>
          <span className="text-sm font-medium text-slate-600" aria-live="polite">{stepLabel}</span>
        </div>
        <div
          className="h-2 overflow-hidden rounded-full bg-slate-200"
          role="progressbar"
          aria-label={stepLabel}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(progress)}
        >
          <div className="h-full rounded-full bg-teal-600 transition-all" style={{ width: `${progress}%` }} />
        </div>
      </div>

      {/* Earlier answers, shown as a compact conversation history */}
      {steps.filter((s) => s.chosen !== undefined).length > 0 && (
        <ol className="space-y-2">
          {steps
            .filter((s) => s.chosen !== undefined)
            .map((s) => (
              <li key={s.questionId} className="flex flex-wrap items-baseline justify-between gap-x-4 rounded-lg bg-white/60 px-4 py-2 text-sm">
                <span className="text-slate-600">{t(s.question.textKey)}</span>
                <span className="font-semibold text-slate-900">{t(s.question.options[s.chosen!].labelKey)}</span>
              </li>
            ))}
        </ol>
      )}

      {!result && (
        <div className="space-y-4">
          <AssistantMessage>
            <p className="text-lg font-medium text-slate-900">{t(current.question.textKey)}</p>
          </AssistantMessage>
          <div className="flex flex-wrap gap-3 pl-12">
            {current.question.options.map((o, i) => (
              <button key={o.labelKey} onClick={() => onAnswer(i)} className={cn(btnPrimary, "min-w-24")}>
                {t(o.labelKey)}
              </button>
            ))}
          </div>
        </div>
      )}

      {result && <ResultView t={t} lang={lang} result={result} items={items} actionLabel={actionLabel} steps={steps} />}

      <div className="flex flex-wrap gap-3 border-t border-slate-200 pt-6">
        <button onClick={onBack} className={btnOutline}>
          <ArrowLeft className="h-4 w-4" aria-hidden />
          {t("back")}
        </button>
        <button onClick={onStartOver} className={btnOutline}>
          <RotateCcw className="h-4 w-4" aria-hidden />
          {t("startOver")}
        </button>
      </div>
    </div>
  );
}

function StepList({ steps }: { steps: string }) {
  return (
    <ol className="mt-2 space-y-2">
      {splitSteps(steps).map((s, i) => (
        <li key={i} className="flex gap-3">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-200 text-xs font-semibold text-slate-700">
            {i + 1}
          </span>
          <span className="pt-0.5">{s}</span>
        </li>
      ))}
    </ol>
  );
}

function ResultView({
  t, lang, result, items, actionLabel, steps,
}: {
  t: T; lang: Lang; result: Result; items: KnowledgeItem[] | null; actionLabel: string; steps: Step[];
}) {
  if (result.kind === "self") {
    const item = items?.find((i) => i.id === result.itemId);
    return (
      <section className="rounded-xl border-2 border-emerald-600 bg-emerald-50 p-6" aria-labelledby="result-title">
        <div className="flex items-center gap-3 text-emerald-800">
          <CheckCircle2 className="h-7 w-7 shrink-0" aria-hidden />
          <h2 id="result-title" className="text-xl font-bold">{t("res.self.title")}</h2>
        </div>
        {item ? (
          <div className="mt-4 space-y-4 text-slate-800">
            <p>{lang === "et" ? item.answerEt : item.answerEn}</p>
            <div>
              <h3 className="font-semibold text-slate-900">{t("stepsHeading")}</h3>
              <StepList steps={lang === "et" ? item.stepsEt : item.stepsEn} />
            </div>
          </div>
        ) : (
          <p className="mt-4 text-slate-700">{t("missingItem")}</p>
        )}
      </section>
    );
  }

  if (result.kind === "stop") {
    return (
      <section className="rounded-xl border-2 border-red-600 bg-red-50 p-6" aria-labelledby="result-title">
        <div className="flex items-center gap-3 text-red-800">
          {result.titleKey === "res.warn.title" ? (
            <TriangleAlert className="h-7 w-7 shrink-0" aria-hidden />
          ) : (
            <AlertOctagon className="h-7 w-7 shrink-0" aria-hidden />
          )}
          <h2 id="result-title" className="text-xl font-bold">{t(result.titleKey)}</h2>
        </div>
        <dl className="mt-4 space-y-3 text-slate-800">
          <div>
            <dt className="font-semibold text-slate-900">{t("ruleHeading")}</dt>
            <dd>{t(result.ruleKey)}</dd>
          </div>
          <div>
            <dt className="font-semibold text-slate-900">{t("insteadHeading")}</dt>
            <dd>{t(result.doKey)}</dd>
          </div>
        </dl>
      </section>
    );
  }

  const summary = [
    `${t("summary.action")}: ${actionLabel}`,
    ...steps.filter((s) => s.chosen !== undefined).map((s) => `${t(s.question.textKey)}: ${t(s.question.options[s.chosen!].labelKey)}`),
    `${t("summary.reason")}: ${t(result.reasonKey)}`,
    `${t("summary.mp")}: ${t("summary.fill")}`,
    `${t("summary.customer")}: ${t("summary.fill")}`,
  ].join("\n");

  return (
    <section className="rounded-xl border-2 border-indigo-600 bg-indigo-50 p-6" aria-labelledby="result-title">
      <div className="flex items-center gap-3 text-indigo-800">
        <ShieldAlert className="h-7 w-7 shrink-0" aria-hidden />
        <h2 id="result-title" className="text-xl font-bold">{t("res.super.title")}</h2>
      </div>
      <div className="mt-4 space-y-4 text-slate-800">
        <div>
          <h3 className="font-semibold text-slate-900">{t("reasonHeading")}</h3>
          <p>{t(result.reasonKey)}</p>
        </div>
        <SummaryBox key={summary} t={t} summary={summary} />
      </div>
    </section>
  );
}

function SummaryBox({ t, summary }: { t: T; summary: string }) {
  const [text, setText] = useState(summary);
  const [status, setStatus] = useState<"idle" | "copied" | "failed">("idle");
  const ref = useRef<HTMLTextAreaElement>(null);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setStatus("copied");
    } catch {
      ref.current?.select();
      setStatus(document.execCommand?.("copy") ? "copied" : "failed");
    }
    setTimeout(() => setStatus("idle"), 2500);
  };

  return (
    <div>
      <label htmlFor="summary" className="font-semibold text-slate-900">{t("summaryHeading")}</label>
      <p className="mb-2 text-sm text-slate-600">{t("summaryHelp")}</p>
      <textarea
        id="summary"
        ref={ref}
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={Math.max(6, summary.split("\n").length + 1)}
        className="w-full rounded-lg border border-slate-300 bg-white p-3 font-mono text-sm text-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600"
      />
      <div className="mt-3 flex items-center gap-3">
        <button onClick={copy} className={btnPrimary}>
          {status === "copied" ? <Check className="h-4 w-4" aria-hidden /> : <ClipboardCopy className="h-4 w-4" aria-hidden />}
          {t("copy")}
        </button>
        <span role="status" className={cn("text-sm font-medium", status === "failed" ? "text-red-700" : "text-emerald-700")}>
          {status === "copied" ? t("copied") : status === "failed" ? t("copyFailed") : ""}
        </span>
      </div>
    </div>
  );
}

function FaqView({
  t, lang, items, loading, onBack,
}: {
  t: T; lang: Lang; items: KnowledgeItem[] | null; loading: boolean; onBack: () => void;
}) {
  const [query, setQuery] = useState("");

  const localized = useMemo(
    () =>
      (items ?? []).map((i) => ({
        id: i.id,
        question: lang === "et" ? i.questionEt : i.questionEn,
        answer: lang === "et" ? i.answerEt : i.answerEn,
        steps: lang === "et" ? i.stepsEt : i.stepsEn,
      })),
    [items, lang],
  );

  const q = query.trim().toLowerCase();
  const filtered = q
    ? localized.filter((i) => [i.question, i.answer, i.steps].some((f) => f.toLowerCase().includes(q)))
    : localized;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight text-slate-900">{t("faq.title")}</h1>
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" aria-hidden />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("faq.search")}
          aria-label={t("faq.search")}
          className="w-full rounded-lg border border-slate-300 bg-white py-3 pl-10 pr-4 text-slate-800 placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600"
        />
      </div>

      {loading && <p className="text-slate-600">{t("loading")}</p>}

      {!loading && items && (
        filtered.length === 0 ? (
          <p className="text-slate-600" role="status">{t("faq.none")}</p>
        ) : (
          <Accordion type="multiple" className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            {filtered.map((i) => (
              <AccordionItem key={i.id} value={String(i.id)}>
                <AccordionTrigger>{i.question}</AccordionTrigger>
                <AccordionContent className="space-y-3 text-slate-700">
                  <p>{i.answer}</p>
                  <div>
                    <h3 className="font-semibold text-slate-900">{t("stepsHeading")}</h3>
                    <StepList steps={i.steps} />
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        )
      )}

      <button onClick={onBack} className={btnOutline}>
        <ArrowLeft className="h-4 w-4" aria-hidden />
        {t("faq.backToStart")}
      </button>
    </div>
  );
}
