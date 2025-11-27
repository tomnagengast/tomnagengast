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
    date: "2025-11-27",
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

Type \`tom\` in the terminal and you can chat with an AI version of me. It runs on [Modal](https://modal.com), a serverless platform that spins up full Linux containers on demand.

Why Modal instead of a typical serverless function? I wanted to use the Claude Code CLI, which needs a real Linux environment to run. Modal lets me define the entire container as code:

\`\`\`python
image = (
    modal.Image.debian_slim()
    .apt_install("curl", "nodejs", "npm")
    .run_commands("npm install -g @anthropic-ai/claude-code")
)

@app.function(image=image)
@modal.fastapi_endpoint(method="POST")
def chat(request: dict):
    result = subprocess.run(
        ["claude", "--print", "-p", prompt],
        capture_output=True
    )
    return {"response": result.stdout}
\`\`\`

The system prompt gives Claude context about my background, work history, and interests so it can answer questions the way I would. Press \`ESC\` or \`Ctrl+C\` to cancel a request mid-flight—there's an AbortController wired up for that.

On mobile, there's a toolbar above the keyboard with \`esc\` and \`^C\` buttons since iOS doesn't have those keys.

## Notes + RSS

The notes section (you're reading one now) is an Easter egg itself—you have to find the document icon to access it.

Notes are stored as a TypeScript array in \`src/data/notes.ts\`. Each note is just a slug, title, date, and markdown content. Simple and version-controlled.

The RSS feed is auto-generated at build time by a script that reads the notes array and outputs \`/rss.xml\`. The feed is auto-discoverable via a \`<link>\` tag in the HTML head, and there's an RSS icon on the notes page for the few of us who still use feed readers.

\`\`\`ts
// scripts/generate-rss.ts
const sortedNotes = [...notes].sort((a, b) =>
  new Date(b.date).getTime() - new Date(a.date).getTime()
);

sortedNotes.map((note) => {
  const description = strippedContent.length > 200
    ? strippedContent.slice(0, 200) + "..."
    : strippedContent;
  // ...
});
\`\`\`

## The Stack

- **React 19** + **TypeScript** - because types are nice
- **Vite** - fast builds, good defaults
- **Tailwind CSS 4** - utility classes with \`darkMode: "media"\` for system preference support
- **React Router** - client-side routing for notes
- **Modal** - serverless containers for the AI agent
- **Claude Code CLI** - powers the \`tom\` command
- **GitHub Actions** - auto-deploys Modal on push

The site itself is deployed on Netlify with automatic deploys from GitHub. The Modal function deploys separately via GitHub Actions whenever the \`modal/\` directory changes.

The whole thing is intentionally minimal—no analytics, no cookies, no tracking. Just words and GIFs.

---

*Built with Claude Code, shipped from the terminal.*
`,
  },
];
