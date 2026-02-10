# Research Notes: Roo Code, Cline, Cursor
Date: 2026-02-05
Scope: public docs only; focus on product behavior and architecture hints.

## Roo Code
- Positioning: AI-coding suite with two delivery modes: a local VS Code extension and cloud agents.
- Extension: runs locally in VS Code; highly customizable.
- Cloud: autonomous agents; can plan/code/review/fix; integrates with GitHub/Slack; adds router, task sync, sharing, remote control, usage analytics; team plan adds centralized billing and shared agents.
- Modes: built-in modes (Code, Ask, Architect, Debug, Orchestrator) with differing tool access; mode switching is explicit.
- Custom modes: create global or project modes; sticky model per mode; export/import modes with rules.
- Auto-approve: explicit security warning; permission tiles (read/edit/command/browser/MCP/mode switching, etc.); global enable switch.
- Cross-IDE architecture hint (JetBrains bridge): JetBrains plugin + Node.js extension host + Roo Code extension; RPC over Unix sockets / named pipes.

## Cline
- VS Code extension; agentic flow with human-in-the-loop approval.
- Plan/Act modes: Plan reads and reasons without edits; Act executes changes; iterative plan-act cycles encouraged.
- Auto-approve: per tool-call permissions for read/edit/command/browser/MCP; safety focus.
- Rules system: .clinerules folder, .clinerules file, then AGENTS.md; supports Cursor/Windsurf rule formats; toggle rules in UI; conditional rules via frontmatter.
- Multi-root workspaces: can read/write/run across multiple folders; limitations (rules only in primary workspace; checkpoints disabled).
- Providers/models: supports many hosted providers and local models; tracks token/cost.
- Tooling: can create/edit files, run terminal commands, use browser, and extend via MCP.

## Cursor
- Standalone product, not a VS Code extension; built as a fork of VS Code and periodically merges upstream.
- Why not an extension: deeper UI control enables features like Cursor Tab and CMD-K that are not possible as plugins.
- Security docs indicate AI requests go through Cursor servers and prompt-building happens server-side; no self-hosted server option currently.

## Cross-tool patterns (design implications)
- Modes/roles with tool restrictions are a consistent UX primitive (Roo Code, Cline).
- Plan vs Act separation is a safety + control mechanism (Cline).
- Auto-approve/permission gating is expected in agentic tools.
- Multi-provider + BYO key support and cost tracking are table stakes.
- Multi-root and rules systems are used to scale context safely.
- Cross-IDE support can be done by hosting a VS Code extension inside another IDE via an extension host + RPC.

## Sources
- https://docs.roocode.com/
- https://docs.roocode.com/roo-code-cloud/overview
- https://docs.roocode.com/basic-usage/using-modes
- https://docs.roocode.com/features/custom-modes
- https://docs.roocode.com/features/auto-approving-actions
- https://github.com/RooCodeInc/Roo-Code-JetBrains
- https://docs.cline.bot/features/plan-and-act
- https://docs.cline.bot/features/auto-approve
- https://docs.cline.bot/features/cline-rules/overview
- https://docs.cline.bot/features/multiroot-workspace
- https://github.com/cline/cline
- https://cursor.com/security
- https://cursordocs.com/en/docs/get-started/migrate-from-vscode
