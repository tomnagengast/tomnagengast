# Claude Code Instructions for tomnagengast.com

## Critical Rule: Note Date Updates

**When modifying existing notes in `src/data/notes.ts`:**

1. Check the current date: `date +%Y-%m-%d`
2. Update the note's `date` field to today's date
3. This ensures RSS subscribers receive update notifications

**Do NOT skip this step** - the RSS feed's `pubDate` comes from this field, and RSS readers only detect changes when the date changes.

## Project Context

- Personal portfolio site with notes/essays section
- Notes are in `src/data/notes.ts`
- RSS feed auto-generates from notes on build
- Notes section is an Easter egg (document icon on homepage)

## Common Tasks

### Adding a New Note
```typescript
// In src/data/notes.ts
{
  slug: "note-slug",
  title: "Note Title",
  date: "YYYY-MM-DD",  // Today's date
  content: `# Note Title\n\nYour markdown content...`
}
```

### Updating an Existing Note
1. Modify the `content` field
2. **Update the `date` field to today's date**
3. Run `npm run build` to regenerate RSS

### Testing Changes
- Dev server: `npm run dev`
- Build (with RSS): `npm run build`
- Check RSS: Look at `dist/rss.xml` or `public/rss.xml`
