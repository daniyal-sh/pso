# Contributing

Thanks for helping build Pakistan Olympiads.

## Local Setup

```bash
npm install
npm run dev
```

Before submitting changes, run:

```bash
npm run lint
npm run build
```

## Content Guidelines

- Keep explanations accurate, concise, and helpful.
- Add source URLs to guide frontmatter.
- Prefer worked examples over vague advice.
- Mark placeholder content clearly until verified.
- Credit authors and contributors.

## Code Guidelines

- Use reusable components from `src/components`.
- Keep mock data in `src/lib/data.ts` unless it belongs in MDX content.
- Keep interactive flows in focused client components.
- Do not add backend assumptions until a backend is selected.
