import { test } from "node:test";
import assert from "node:assert/strict";
import { evaluateConditions, evaluateRule, evaluateRuleSet, renderCondition, type BreRule, type Condition } from "../core/bre.js";

const ctx: Record<string, unknown> = {
  "credit.score": 740,
  "capacity.foir": 38.5,
  "customer.age": 34,
  "customer.monthly_income": 65000,
  "credit.dpd_max": 0,
  "exposure.total": 800000,
  "bank.bounce_count": 1,
  "credit.utilization": 45,
  "application.stage": "kfs",
  "credit.enquiries_6m": 2
};

test("leaf operators: gte/lte/between/in/contains", () => {
  assert.equal(evaluateConditions({ operator: "gte", field: "credit.score", value: 650 }, ctx, []), true);
  assert.equal(evaluateConditions({ operator: "gte", field: "credit.score", value: 800 }, ctx, []), false);
  assert.equal(evaluateConditions({ operator: "between", field: "customer.age", min: 21, max: 65 }, ctx, []), true);
  assert.equal(evaluateConditions({ operator: "between", field: "customer.age", min: 40, max: 60 }, ctx, []), false);
  assert.equal(evaluateConditions({ operator: "in", field: "application.stage", values: ["kfs", "agreement"] }, ctx, []), true);
  assert.equal(evaluateConditions({ operator: "not_in", field: "application.stage", values: ["kfs"] }, ctx, []), false);
});

test("AND/OR/NOT group composition", () => {
  const and: Condition = { operator: "and", children: [
    { operator: "gte", field: "credit.score", value: 650 },
    { operator: "lte", field: "capacity.foir", value: 55 }
  ] };
  assert.equal(evaluateConditions(and, ctx, []), true);
  const or: Condition = { operator: "or", children: [
    { operator: "lt", field: "credit.score", value: 600 },
    { operator: "gt", field: "credit.score", value: 700 }
  ] };
  assert.equal(evaluateConditions(or, ctx, []), true);
  const not: Condition = { operator: "not", children: [{ operator: "eq", field: "customer.age", value: 34 }] };
  assert.equal(evaluateConditions(not, ctx, []), false);
});

test("evaluateRule reports failure reasons", () => {
  const rule: BreRule = { code: "T1", name: "Score gate", category: "credit_policy", priority: 1,
    conditions: { operator: "and", children: [{ operator: "gte", field: "credit.score", value: 800 }] },
    action: { eligible: true } };
  const res = evaluateRule(rule, ctx);
  assert.equal(res.passed, false);
  assert.ok(res.failures[0].includes("credit.score"));
});

test("evaluateRuleSet: priority-ordered, short-circuits on first failure", () => {
  const rules: BreRule[] = [
    { code: "A", name: "Score", category: "credit_policy", priority: 10, conditions: { operator: "gte", field: "credit.score", value: 650 }, action: {} },
    { code: "B", name: "FOIR", category: "credit_policy", priority: 20, conditions: { operator: "lte", field: "capacity.foir", value: 40 }, action: {} },
    { code: "C", name: "Age", category: "credit_policy", priority: 30, conditions: { operator: "between", field: "customer.age", min: 21, max: 65 }, action: {} }
  ];
  const pass = evaluateRuleSet(rules, ctx);
  assert.equal(pass.eligible, true);
  const failCtx = { ...ctx, "capacity.foir": 60 };
  const fail = evaluateRuleSet(rules, failCtx);
  assert.equal(fail.eligible, false);
  assert.equal(fail.failedRule, "B");
  assert.ok(fail.reasons[0].includes("FOIR"));
});

test("evaluateRuleSet: risk grade escalates to worst action", () => {
  const rules: BreRule[] = [
    { code: "R1", name: "a", category: "credit_policy", priority: 1, conditions: { operator: "gte", field: "credit.score", value: 1 }, action: { riskGrade: "standard" } },
    { code: "R2", name: "b", category: "credit_policy", priority: 2, conditions: { operator: "gte", field: "credit.score", value: 1 }, action: { riskGrade: "high" } }
  ];
  assert.equal(evaluateRuleSet(rules, ctx).riskGrade, "high");
});

test("renderCondition produces readable policy text", () => {
  const cond: Condition = { operator: "and", children: [
    { operator: "gte", field: "credit.score", value: 650 },
    { operator: "lte", field: "capacity.foir", value: 55 },
    { operator: "between", field: "customer.age", min: 21, max: 65 }
  ] };
  const text = renderCondition(cond);
  assert.ok(text.includes("score"));
  assert.ok(text.includes("AND"));
  assert.ok(text.includes("between"));
});

test("missing context values fail closed (no silent pass)", () => {
  const rule: BreRule = { code: "T", name: "requires data", category: "credit_policy", priority: 1,
    conditions: { operator: "gte", field: "credit.score", value: 650 }, action: {} };
  const res = evaluateRule(rule, {});
  assert.equal(res.passed, false);
});
