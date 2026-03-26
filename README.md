# KLEENUPLink Referral Engine

This repository contains the MVP foundation for the KLEENUP standalone referral and attribution engine described in the client SRS.

## Repository Layout
- backend: Node.js Express API for referral ingestion, computation, and settlement workflows.
- frontend-admin: Next.js admin dashboard for approvals, policy operations, and reclaws.
- frontend-agent: Next.js agent portal for links, pipeline visibility, and payable balance.
- database: PostgreSQL schema and migration starting point.
- docs: MVP plan and prioritized backlog translated from the client requirements.

## MVP Planning Artifacts
- docs/MVP_BUILD_PLAN.md
- docs/MVP_BACKLOG.md

## Quick Start
1. Backend dependencies:
	- cd backend
	- npm install
2. Run backend:
	- npm run dev
3. Frontend dependencies:
	- cd ../frontend-admin && npm install
	- cd ../frontend-agent && npm install
4. Run frontends (separate terminals):
	- cd frontend-admin && npm run dev
	- cd frontend-agent && npm run dev

## Database
- MVP schema is defined in database/schema.sql.
- Apply it to a PostgreSQL instance before implementing API persistence.

## Current Status
- WordPress proxy endpoints exist in backend/src/routes/wordpressRoutes.js.
- MVP architecture, API scope, and backlog are now documented and ready for implementation sprint work.
