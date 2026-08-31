---
name: OpenAPI and Zod compatibility
description: A workspace-specific compatibility constraint for generated validation schemas.
---

Generated Zod schemas in this workspace currently target Zod 3 APIs. Avoid OpenAPI integer fields in new contracts unless the generator/runtime pairing is upgraded; integer schemas may be emitted as `z.int()`, which is unavailable in the installed Zod version.

**Why:** Code generation itself can succeed while the chained library typecheck fails on the generated validation file, blocking the whole API contract workflow.

**How to apply:** When adding numeric API fields, prefer `type: number` for compatibility, or verify the generator output and upgrade the Zod pairing deliberately before using integer-specific OpenAPI types.