export interface Note {
  slug: string;
  title: string;
  date: string;
  published: boolean;
  standalone?: boolean;
  description?: string;
  content: string;
}

export const notes: Note[] = [
  {
    slug: "otel",
    title: "OpenTelemetry & the shape of signals",
    date: "2026-05-20",
    published: true,
    standalone: true,
    description:
      "A practitioner's field manual for logs, traces, and metrics — what each is for, what each costs, and how OTel makes them talk.",
    content: `A practitioner's field manual for logs, traces, and metrics — what each is for, what each costs, and how OTel makes them talk.`,
  },
  {
    slug: "qrptspi",
    title: "QRPTSPI & the art of routing",
    date: "2026-05-21",
    published: true,
    standalone: true,
    description: "Standalone reference for QRPTSPI model selection.",
    content: `Standalone reference for QRPTSPI model selection.`,
  },
  {
    slug: "evals",
    title: "Routing matrix evaluation",
    date: "2026-05-21",
    published: false,
    description:
      "Empirical results from a 33-config × 7-phase × 2-judge eval grounding the QRPTSPI picks.",
    content: `See public/notes/evals.md for the full report.`,
  },
  {
    slug: "example-note",
    title: "Example Note",
    date: "2025-01-15",
    published: false,
    content: `# Example Note

This is an example note. You can write your essays and ideas here using Markdown.

![Example Image](https://share.icloud.com/photos/070XcEaBXv35bY54y1zXKA-mQ)

## Formatting

You can use all standard Markdown formatting:

- **Bold text**
- *Italic text*
- [Links](https://example.com)
- Images
- Code blocks
- And more!

## Getting Started

To add new notes, edit the \`src/data/notes.ts\` file and add new entries to the \`notes\` array.
`,
  },
];

export const publishedNotes = notes.filter((note) => note.published);

export const markdownNotes = publishedNotes.filter((note) => !note.standalone);
