# Project Guidelines: Spline Web & Agent Skills

This project incorporates the **`addyosmani/agent-skills`** engineering framework to enforce senior software engineering discipline, high-quality 3D web development, and systematic execution.

---

## 1. Skill-Driven Engineering Lifecycle

Whenever working on tasks in this repository, follow the structured lifecycle:

| Phase | Core Skill | Purpose & Output |
| :--- | :--- | :--- |
| **DEFINE** | `.agents/skills/spec-driven-development` | Clarify requirements, define UI/3D interactions, identify edge cases, and create specs before writing code. |
| **PLAN** | `.agents/skills/planning-and-task-breakdown` | Deconstruct features into small, verifiable milestones and identify dependencies. |
| **BUILD** | `.agents/skills/incremental-implementation`<br>`.agents/skills/test-driven-development`<br>`.agents/skills/frontend-ui-engineering` | Implement incrementally in vertical slices. Ensure clean modern frontend practices, semantic markup, and reliable Spline 3D canvas lifecycle. |
| **VERIFY** | `.agents/skills/debugging-and-error-recovery`<br>`.agents/skills/browser-testing-with-devtools` | Systematically diagnose issues, test responsive viewports, audit WebGL / Canvas performance, and prevent runtime crashes. |
| **REVIEW** | `.agents/skills/code-review-and-quality`<br>`.agents/skills/code-simplification` | Assess maintainability, performance, security, and simplify complexity without breaking behavior. |
| **SHIP** | `.agents/skills/shipping-and-launch`<br>`.agents/skills/git-workflow-and-versioning` | Perform pre-flight hygiene checks, create atomic commits, and prepare production deployments. |

---

## 2. Anti-Rationalization Guardrails

Do not bypass engineering rigor. The following justifications are invalid and must be rejected:

| Rationalization (Invalid) | Required Standard |
| :--- | :--- |
| *"It's just a simple 3D web demo, no need for specs or planning."* | All features, scene transitions, and interactive controls must have clear expectations, loading states, and fallback behavior. |
| *"3D WebGL / Spline scenes don't need tests."* | Verify asset loading, mount/unmount memory cleanup, responsive canvas sizing, event listeners, and WebGL context loss recovery. |
| *"I will optimize asset size and performance later."* | Heavy 3D assets impact LCP/FID. Keep Spline assets optimized, track network payload, and ensure smooth 60fps rendering. |
| *"I'll implement the whole page in one giant script."* | Separate concerns: separate data, UI overlay, 3D runtime initialization, and event handling into modular, maintainable files. |

---

## 3. Specialized Review Personas

When conducting reviews or audits, refer to the personas in [`.agents/agents/`](file:///d:/%23PROJECT%20GEMINI/18_SPLINE%20WEB/.agents/agents):
- **Code Reviewer** (`.agents/agents/code-reviewer.md`): Evaluates architecture, readability, and code health.
- **Security Auditor** (`.agents/agents/security-auditor.md`): Audits dependencies, DOM injection, CORS, and data exposure.
- **Test Engineer** (`.agents/agents/test-engineer.md`): Ensures test coverage, edge case handling, and integration resilience.

---

## 4. Checklists & References

Standard checklists and guidelines are located in [`.agents/references/`](file:///d:/%23PROJECT%20GEMINI/18_SPLINE%20WEB/.agents/references):
- Code review checklists
- Performance and web vitals checklists
- Security hardening guides
