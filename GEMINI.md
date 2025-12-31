# Gemini Project Memory: Sheets con xubio

## Project Overview
This project appears to be a web application integrating with Xubio (likely for invoicing/billing), using Vue.js for the frontend.
- **Root Path:** `C:\dev\Sheets con xubio`
- **Frontend App:** Located in `test-imprimir-pdf/` (Vue.js + Vite).
- **API/Backend:** `api/` folder suggests serverless functions or a light backend proxy.

## Environment
- **OS:** Windows (win32)
- **Shell:** PowerShell / cmd (Windows commands preferred as per `.cursor/rules/entorno.mdc`)

## Documentation Structure
Adhering to `.cursor/rules/documentos.mdc`, documentation is centralied in `test-imprimir-pdf/docs/`:
- `ADRS/`: Architectural Decision Records.
- `Consulta APIs/`: External API docs (Xubio).
- `Guias/`: Guides.
- `analisis/`: Analysis of flows and fields.
- `planes/`: Plans and tasks.

## Active Context & Plans
- **Refactoring:** `test-imprimir-pdf/planes/refactor-app-js.md` and `docs/ADRS/ADR-005-refactorizacion-app-js-y-sistema-logging.md` indicate active work on refactoring `app.js` and logging.
- **Facturación:** `docs/analisis/tasks_facturacion.md` tracks billing-related tasks.

## Key Technologies
- **Frontend:** Vue.js, Vite.
- **Testing:** Vitest (`vitest.config.js`).
- **Linting:** ESLint (`eslint.config.cjs`).

## Notes
- Use `mcp-tasks` for managing technical backlog if needed.
- Refer to `docs/` for deep context on architecture and flows.
