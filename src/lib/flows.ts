import type { TKey } from "./i18n";

export type ActionKey = "add" | "remove" | "change";
export type Outcome = "self_service" | "stop" | "super_user";

export type Result =
  | { kind: "self"; itemId: number }
  | { kind: "stop"; titleKey: TKey; ruleKey: TKey; doKey: TKey }
  | { kind: "super"; reasonKey: TKey };

export type Next = { question: string } | { result: Result };

export type Option = { labelKey: TKey; next: Next };

export type Question = { textKey: TKey; options: Option[] };

export type Flow = { start: string; total: number; questions: Record<string, Question> };

const yesNo = (yes: Next, no: Next): Option[] => [
  { labelKey: "yes", next: yes },
  { labelKey: "no", next: no },
];

export const flows: Record<ActionKey, Flow> = {
  add: {
    start: "active",
    total: 4,
    questions: {
      active: {
        textKey: "q.add.active",
        options: yesNo(
          { question: "linked" },
          { result: { kind: "stop", titleKey: "res.stop.title", ruleKey: "stop.inactive.rule", doKey: "stop.inactive.do" } },
        ),
      },
      linked: {
        textKey: "q.add.linked",
        options: yesNo({ result: { kind: "super", reasonKey: "reason.linked" } }, { question: "past" }),
      },
      past: {
        textKey: "q.add.past",
        options: yesNo({ question: "billingClosed" }, { result: { kind: "self", itemId: 1 } }),
      },
      billingClosed: {
        textKey: "q.add.billingClosed",
        options: yesNo(
          { result: { kind: "stop", titleKey: "res.warn.title", ruleKey: "warn.backdate.rule", doKey: "warn.backdate.do" } },
          { result: { kind: "self", itemId: 1 } },
        ),
      },
    },
  },
  remove: {
    start: "past",
    total: 2,
    questions: {
      past: {
        textKey: "q.remove.past",
        options: yesNo(
          { result: { kind: "stop", titleKey: "res.stop.title", ruleKey: "stop.endPast.rule", doKey: "stop.endPast.do" } },
          { question: "billing" },
        ),
      },
      billing: {
        textKey: "q.remove.billing",
        options: yesNo({ result: { kind: "super", reasonKey: "reason.billing" } }, { result: { kind: "self", itemId: 2 } }),
      },
    },
  },
  change: {
    start: "what",
    total: 1,
    questions: {
      what: {
        textKey: "q.change.what",
        options: [
          { labelKey: "opt.address", next: { result: { kind: "self", itemId: 3 } } },
          { labelKey: "opt.contact", next: { result: { kind: "self", itemId: 3 } } },
          { labelKey: "opt.other", next: { result: { kind: "super", reasonKey: "reason.otherChange" } } },
        ],
      },
    },
  },
};

export function outcomeOf(r: Result): Outcome {
  return r.kind === "self" ? "self_service" : r.kind === "stop" ? "stop" : "super_user";
}
