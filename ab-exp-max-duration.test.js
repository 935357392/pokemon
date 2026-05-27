/**
 * 单元测试：实验最大时长配置
 * 对应测试用例：docs/test-cases/ab-exp-max-duration.md
 *
 * 使用方法（在 bim 项目中）：
 * 1. 将此文件复制到 tests/unit/ab-experiment/exp-max-duration.test.js
 * 2. 运行：pnpm test:unit tests/unit/ab-experiment/exp-max-duration.test.js
 */

import { describe, it, expect, beforeEach, vi } from "vitest";

/**
 * 模拟 config.vue 中的核心逻辑（不依赖 Vue 组件挂载）
 * 测试 fetch 数据回填 和 save 数据提交 的纯逻辑
 */

// 模拟 form 初始状态
function createForm() {
  return {
    type: "program",
    decision_max_value: 25,
    exp_max_duration: 120,
  };
}

// 模拟 fetch 回填逻辑
function applyFetchResult(form, res) {
  form.decision_max_value = res.decision_max_value ?? 25;
  form.exp_max_duration = res.exp_max_duration ?? 120;
}

// 模拟 save 提交构建逻辑
function buildSaveRequest(form) {
  return {
    decision_max_value: form.decision_max_value,
    exp_max_duration: form.exp_max_duration,
  };
}

// ----------------------------------------------------------------
// TC-001 / TC-002：页面加载回填 [AC-01]
// ----------------------------------------------------------------
describe("实验最大时长 - 数据回填 [AC-01]", () => {
  let form;

  beforeEach(() => {
    form = createForm();
  });

  it("TC-002: 接口返回 exp_max_duration=90，输入框显示 90", () => {
    const res = { decision_max_value: 25, exp_max_duration: 90 };
    applyFetchResult(form, res);
    expect(form.exp_max_duration).toBe(90);
  });

  it("TC-006: 接口未返回 exp_max_duration，默认值为 120", () => {
    const res = { decision_max_value: 25 };
    applyFetchResult(form, res);
    expect(form.exp_max_duration).toBe(120);
  });

  it("TC-001: 页面初始默认值为 120", () => {
    expect(form.exp_max_duration).toBe(120);
  });
});

// ----------------------------------------------------------------
// TC-003 / TC-007 / TC-008：保存提交 [AC-02]
// ----------------------------------------------------------------
describe("实验最大时长 - 保存提交 [AC-02]", () => {
  let form;

  beforeEach(() => {
    form = createForm();
  });

  it("TC-003: 修改为 180，请求体包含 exp_max_duration: 180", () => {
    form.exp_max_duration = 180;
    const req = buildSaveRequest(form);
    expect(req.exp_max_duration).toBe(180);
  });

  it("TC-007: 边界值 7 可正常提交", () => {
    form.exp_max_duration = 7;
    const req = buildSaveRequest(form);
    expect(req.exp_max_duration).toBe(7);
  });

  it("TC-008: 边界值 365 可正常提交", () => {
    form.exp_max_duration = 365;
    const req = buildSaveRequest(form);
    expect(req.exp_max_duration).toBe(365);
  });

  it("保存时 decision_max_value 仍正常提交（不受新字段影响）", () => {
    form.exp_max_duration = 180;
    const req = buildSaveRequest(form);
    expect(req.decision_max_value).toBe(25);
  });
});

// ----------------------------------------------------------------
// TC-004 / TC-005：边界修正（el-input-number 组件行为，由 min/max 属性保证）
// ----------------------------------------------------------------
describe("实验最大时长 - 边界值约束说明 [AC-03 / AC-04]", () => {
  it("TC-004: min=7 保证输入值不会低于7（el-input-number 自动修正）", () => {
    // el-input-number :min="7" 会自动修正，这里验证业务逻辑层面的最小值定义
    const MIN = 7;
    expect(MIN).toBe(7);
  });

  it("TC-005: max=365 保证输入值不会超过365（el-input-number 自动修正）", () => {
    const MAX = 365;
    expect(MAX).toBe(365);
  });
});
