<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes. APIs, conventions, and file structure may differ from older Next.js versions. Read the relevant guide in `node_modules/next/dist/docs/` before writing code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# PSO Repo Rules

- Keep production public content database-backed through Supabase.
- Do not restore `public/resources` as a runtime source.
- Keep generated NSTC question PDFs in ignored `output/` paths until they are uploaded to Supabase Storage.
- Do not commit secrets or local env files.
