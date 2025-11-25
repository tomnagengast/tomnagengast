export interface Note {
  slug: string;
  title: string;
  date: string;
  content: string;
}

export const notes: Note[] = [
  {
    slug: "example-note",
    title: "Example Note",
    date: "2025-01-15",
    content: `# Example Note

This is an example note. You can write your essays and ideas here using Markdown.

## Formatting

You can use all standard Markdown formatting:

- **Bold text**
- *Italic text*
- [Links](https://example.com)
- Code blocks
- And more!

## Getting Started

To add new notes, edit the \`src/data/notes.ts\` file and add new entries to the \`notes\` array.
`,
  },
];
