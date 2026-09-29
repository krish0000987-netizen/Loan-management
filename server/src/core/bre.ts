/**
 * NEXUS BRE — Business Rule Engine.
 * Rules are stored as JSON ASTs (AND/OR/NOT with leaf comparisons),
 * evaluated against a context object. Rules are versioned, priority-ordered
 * and never silently modified.
 */

export type LeafOperator =
  | "gte" | "gt" | "lte" | "lt" | "eq" | "neq"
  | "between" | "in" | "not_in" | "contains";

export interface LeafCondition {
  operator: LeafOperator;
  field: string;
  value?: number | string;
  min?: number;
  max?: number;
  values?: (number | string)[];
}

export interface GroupCondition {
  operator: "and" | "or" | "not";
  children: Condition[];
}

export type Condition = LeafCondition | GroupCondition;

export interface BreRule {
  id?: number;
  code: string;
  name: string;
  category: "product" | "credit_policy" | "regulatory" | "operational" | "approval";
  priority: number;
  conditions: Condition;
  action: {
    eligible?: boolean;
    riskGrade?: string;
    reason?: string;
    limitAmount?: number;
    maxTenure?: number;
  };
}

export interface BreResult {
  passed: boolean;
  failures: string[];
  matchedRules: { code: string; name: string; priority: number }[];
}

/**
 * Resolve a dotted field path against a context object.
 * Supports BOTH flat dotted keys ({"credit.score": 740}) and nested objects
 * ({credit: {score: 740}}) — production contexts are flat, so this must
 * check the literal path first.
 */
export function resolvePath(ctx: Record<string, unknown>, path: string): unknown {
  if (path in ctx) return ctx[path];
  const parts = path.split(".");
  let cur: unknown = ctx;
  for (const p of parts) {
    if (cur === null || cur === undefined) return undefined;
    if (typeof cur === "object") cur = (cur as Record<string, unknown>)[p];
    else return undefined;
  }
  return cur;
}

function toNum(v: unknown): number | null {
  if (typeof v === "number") return v;
  if (typeof v === "string") {
    const n = Number(v.replace(/[^0-9.\-]/g, ""));
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

function evalLeaf(cond: LeafCondition, ctx: Record<string, unknown>): string | null {
  const raw = resolvePath(ctx, cond.field);
  const n = toNum(raw);
  switch (cond.operator) {
    case "eq": return String(raw) === String(cond.value) ? null : `${cond.field} expected ${cond.value}, got ${String(raw)}`;
    case "neq": return String(raw) !== String(cond.value) ? null : `${cond.field} must not equal ${String(cond.value)}`;
    case "gte": return n !== null && n >= (cond.value as number) ? null : `${cond.field} must be >= ${cond.value} (got ${String(raw)})`;
    case "gt": return n !== null && n > (cond.value as number) ? null : `${cond.field} must be > ${cond.value} (got ${String(raw)})`;
    case "lte": return n !== null && n <= (cond.value as number) ? null : `${cond.field} must be <= ${cond.value} (got ${String(raw)})`;
    case "lt": return n !== null && n < (cond.value as number) ? null : `${cond.field} must be < ${cond.value} (got ${String(raw)})`;
    case "between": return n !== null && n >= (cond.min as number) && n <= (cond.max as number) ? null : `${cond.field} must be between ${cond.min} and ${cond.max} (got ${String(raw)})`;
    case "in": return (cond.values ?? []).some((v) => String(v) === String(raw)) ? null : `${cond.field} must be one of [${(cond.values ?? []).join(", ")}]`;
    case "not_in": return !(cond.values ?? []).some((v) => String(v) === String(raw)) ? null : `${cond.field} must not be in [${(cond.values ?? []).join(", ")}]`;
    case "contains": return typeof raw === "string" && raw.toLowerCase().includes(String(cond.value).toLowerCase()) ? null : `${cond.field} must contain "${cond.value}"`;
    default: return null;
  }
}

export function evaluateConditions(cond: Condition, ctx: Record<string, unknown>, failures: string[]): boolean {
  if ("children" in cond) {
    if (cond.operator === "not") {
      const childPassed = evaluateConditions(cond.children[0], ctx, []);
      if (childPassed) failures.push(`NOT(${describe(cond.children[0])}) failed`);
      return !childPassed;
    }
    const results = cond.children.map((c) => evaluateConditions(c, ctx, failures));
    if (cond.operator === "and") return results.every(Boolean);
    return results.some(Boolean);
  }
  const fail = evalLeaf(cond as LeafCondition, ctx);
  if (fail) failures.push(fail);
  return fail === null;
}

function describe(cond: Condition): string {
  if ("children" in cond) return cond.operator.toUpperCase();
  const l = cond as LeafCondition;
  return `${l.field} ${l.operator} ${l.value ?? l.min ?? l.values ?? ""}`;
}

/** Evaluate a single rule against context. */
export function evaluateRule(rule: BreRule, ctx: Record<string, unknown>): BreResult {
  const failures: string[] = [];
  const passed = evaluateConditions(rule.conditions, ctx, failures);
  return {
    passed,
    failures,
    matchedRules: passed ? [{ code: rule.code, name: rule.name, priority: rule.priority }] : []
  };
}

/**
 * Evaluate an ordered rule set (by priority). First failing rule short-circuits
 * and its reason becomes the decision reason. Context is flat — the caller
 * builds the evaluation context from the application snapshot.
 */
export function evaluateRuleSet(
  rules: BreRule[],
  ctx: Record<string, unknown>
): { eligible: boolean; reasons: string[]; riskGrade: string; failedRule?: string } {
  const sorted = [...rules].sort((a, b) => a.priority - b.priority || a.id! - b.id!);
  const reasons: string[] = [];
  let riskGrade = "standard";
  for (const rule of sorted) {
    const res = evaluateRule(rule, ctx);
    if (!res.passed) {
      reasons.push(`${rule.name}: ${res.failures.join("; ")}`);
      return { eligible: false, reasons, riskGrade, failedRule: rule.code };
    }
    if (rule.action.riskGrade) {
      const grades = ["low", "standard", "medium", "high"];
      const gi = grades.indexOf(rule.action.riskGrade);
      const ci = grades.indexOf(riskGrade);
      if (gi > ci) riskGrade = rule.action.riskGrade;
    }
  }
  reasons.push("All policy rules passed");
  return { eligible: true, reasons, riskGrade };
}

/** Human-readable rendering of a condition tree (for rule listing). */
export function renderCondition(cond: Condition, depth = 0): string {
  if ("children" in cond) {
    if (cond.operator === "not") return `NOT (${renderCondition(cond.children[0], depth)})`;
    const sep = cond.operator === "and" ? " AND " : " OR ";
    return cond.children.map((c) => renderCondition(c, depth + 1)).join(sep);
  }
  const l = cond as LeafCondition;
  const fmtField = l.field.split(".").pop()!.replace(/_/g, " ");
  switch (l.operator) {
    case "between": return `${fmtField} between ${l.min} and ${l.max}`;
    case "in": return `${fmtField} in [${(l.values ?? []).join(", ")}]`;
    case "not_in": return `${fmtField} not in [${(l.values ?? []).join(", ")}]`;
    case "contains": return `${fmtField} contains "${l.value}"`;
    case "eq": return `${fmtField} = ${l.value}`;
    case "neq": return `${fmtField} ≠ ${l.value}`;
    case "gte": return `${fmtField} ≥ ${l.value}`;
    case "gt": return `${fmtField} > ${l.value}`;
    case "lte": return `${fmtField} ≤ ${l.value}`;
    case "lt": return `${fmtField} < ${l.value}`;
    default: return fmtField;
  }
}
