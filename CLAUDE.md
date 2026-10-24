# CLAUDE.md

## Deployment
- This web app runs on Railway, not locally. Railway deploys automatically from the `main` branch of this GitHub repo.
- The database is a Railway PostgreSQL database, available only through the `DATABASE_URL` environment variable on Railway.
- Do not set up a local database or a local server.

## Workflow
- Before every push, run `npm.cmd run build` to make sure the app builds.
- After each finished task, commit and push to GitHub so Railway deploys the new version.

## Windows note
- PowerShell blocks `npm.ps1` on this machine, so run npm commands as `npm.cmd` (for example `npm.cmd run build`).

## Data
- `metering_point_changes.csv` is in the project root folder.
