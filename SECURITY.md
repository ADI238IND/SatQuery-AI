# Security and Data Handling

- Never commit API keys, access tokens or private satellite-data credentials.
- Keep `.env` local and commit only `.env.example`.
- Treat uploaded GeoTIFFs and user files as untrusted input.
- Enforce file-size limits and validate file formats before processing.
- Never execute user-provided code or metadata as shell commands.
- Strip or sandbox paths supplied by uploads.
- If external model APIs are used, disclose that imagery may leave the local system and avoid sending restricted imagery.
- Prefer locally hosted models for sensitive demonstrations.
