export interface Note {
  slug: string;
  title: string;
  date: string;
  content: string;
}

export const notes: Note[] = [
  {
    slug: "building-this-site",
    title: "Building This Site",
    date: "2025-11-26",
    content: `# Building This Site

I wanted a simple portfolio site that felt personal but wasn't boring. Here's how I built it with React, Tailwind, and a few Easter eggs.

## The GIF Easter Eggs

Hover over any of the social icons on the homepage. Go ahead, I'll wait.

Each icon triggers a different GIF that appears in a blob-shaped mask below. GitHub shows a typing cat, LinkedIn gets George Costanza looking busy, email triggers an old-timey dance, and notes reveals the office skeleton.

The implementation is straightforward: track which icon is hovered with React state, preload all GIFs on mount to avoid loading delays, and swap the \`<image>\` source inside an SVG mask.

\`\`\`tsx
const getBlobImage = () => {
  switch (hoveredIcon) {
    case "github":
      return "/gifs/typing-cat.gif";
    case "linkedin":
      return "/gifs/costanza-busy.gif";
    // ...
  }
};
\`\`\`

The blob shape itself is an SVG path used as a mask. The GIF plays inside the organic shape, giving it that lava-lamp feel.

## The CLI Terminal

Click the terminal icon and you'll get a full-screen fake terminal. It supports a few commands:

- \`ls\` - lists available notes
- \`cat <file>\` - reads a note
- \`tom\` - starts an AI chat
- \`help\` - shows available commands
- \`exit\` or \`ESC\` - closes the terminal

The terminal is a React component with command parsing, history management, and auto-scroll. Nothing fancy, just a switch statement on the command and some state for the message history.

### The \`tom\` Agent

Type \`tom\` in the terminal and you can chat with an AI version of me. It uses the [Claude Agent SDK](https://github.com/anthropics/claude-agent-sdk) running on a Netlify function.

\`\`\`ts
const queryIterator = query({
  prompt: userMessage,
  options: {
    model: "claude-opus-4-5-20251101",
    systemPrompt: SYSTEM_PROMPT,
    permissionMode: "bypassPermissions",
  },
});
\`\`\`

The system prompt gives Claude context about my background, work history, and interests so it can answer questions the way I would. Press \`ESC\` or \`Ctrl+C\` to cancel a request mid-flight—there's an AbortController wired up for that.

On mobile, there's a toolbar above the keyboard with \`esc\` and \`^C\` buttons since iOS doesn't have those keys.

## Notes + RSS

The notes section (you're reading one now) is an Easter egg itself—you have to find the document icon to access it.

Notes are stored as a TypeScript array in \`src/data/notes.ts\`. Each note is just a slug, title, date, and markdown content. Simple and version-controlled.

The RSS feed is auto-generated at build time by a script that reads the notes array and outputs \`/rss.xml\`. The feed is auto-discoverable via a \`<link>\` tag in the HTML head, and there's an RSS icon on the notes page for the few of us who still use feed readers.

\`\`\`ts
// scripts/generate-rss.ts
const feed = new RSS({
  title: "Tom Nagengast's Notes",
  feed_url: "https://tomnagengast.com/rss.xml",
  site_url: "https://tomnagengast.com",
});

notes.forEach(note => {
  feed.item({
    title: note.title,
    url: \`https://tomnagengast.com/notes/\${note.slug}\`,
    date: note.date,
    description: note.content,
  });
});
\`\`\`

## The Stack

- **React 19** + **TypeScript** - because types are nice
- **Vite** - fast builds, good defaults
- **Tailwind CSS 4** - utility classes with \`darkMode: "media"\` for system preference support
- **React Router** - client-side routing for notes
- **Netlify Functions** - serverless API for the AI chat
- **Claude Agent SDK** - powers the \`tom\` command

The whole thing is deployed on Netlify with automatic deploys from GitHub. The site is intentionally minimal—no analytics, no cookies, no tracking. Just words and GIFs.

---

*Built with Claude Code, shipped from the terminal.*
`,
  },
];
