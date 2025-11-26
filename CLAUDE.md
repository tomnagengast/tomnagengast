# Claude Code Instructions

## Project Overview

This is Tom Nagengast's personal portfolio website built with React, TypeScript, Vite, and Tailwind CSS. It includes:
- A minimal homepage with bio and social links
- A `/notes` section for essays and ideas (Easter egg accessed via document icon)
- RSS feed support for note subscriptions

## Important: Notes Management

### When Modifying Notes

**CRITICAL**: When you modify the content of an existing note in `src/data/notes.ts`, you MUST update the `date` field to the current date.

**Why?** The RSS feed uses the `date` field as the `pubDate`. RSS readers only detect items as "new" or "updated" when the `pubDate` changes. If you update note content without changing the date, subscribers won't be notified.

**Example:**
```typescript
// BEFORE (old note with outdated content)
{
  slug: "my-note",
  title: "My Note",
  date: "2025-01-15",  // Old date
  content: `Old content here...`
}

// AFTER (updated note)
{
  slug: "my-note",
  title: "My Note",
  date: "2025-11-25",  // ✓ Updated to today's date
  content: `New updated content here...`
}
```

### Workflow for Note Changes

1. **Creating a new note**: Set `date` to today's date
2. **Minor typo fixes**: Date update is optional
3. **Significant content updates**: ALWAYS update `date` to today's date
4. **After any note changes**: Run `npm run build` to regenerate the RSS feed

## RSS Feed

- The RSS feed is automatically generated during build via `scripts/generate-rss.ts`
- Feed is located at `/rss.xml`
- Feed is auto-discovered via `<link>` tag in HTML head
- Feed is manually accessible via RSS icon on `/notes` page

## Development

- `npm run dev` - Start development server
- `npm run build` - Build for production (includes RSS generation)
- `npm run generate:rss` - Generate RSS feed only
- `npm run lint` - Run ESLint

## Notes Location

All notes are stored in `src/data/notes.ts` as a TypeScript array. Each note has:
- `slug`: URL-friendly identifier
- `title`: Note title
- `date`: Publication/update date (format: YYYY-MM-DD)
- `content`: Markdown content
