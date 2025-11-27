import { notes } from "../src/data/notes";
import { writeFileSync } from "fs";
import { join } from "path";

const SITE_URL = "https://tomnagengast.com";
const SITE_TITLE = "Tom Nagengast";
const SITE_DESCRIPTION = "Essays and ideas from Tom Nagengast";

function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function stripMarkdown(markdown: string): string {
  // Remove markdown formatting for description
  // Note: Images must be removed BEFORE links (image syntax contains link-like syntax)
  return markdown
    .replace(/^#+\s+/gm, "") // Remove headers
    .replace(/\*\*([^*]+)\*\*/g, "$1") // Remove bold
    .replace(/\*([^*]+)\*/g, "$1") // Remove italic
    .replace(/!\[([^\]]*)\]\([^\)]+\)/g, "") // Remove images (before links!)
    .replace(/\[([^\]]+)\]\([^\)]+\)/g, "$1") // Remove links, keep text
    .replace(/`([^`]+)`/g, "$1") // Remove inline code
    .replace(/```[\s\S]*?```/g, "") // Remove code blocks
    .replace(/^[-*+]\s+/gm, "") // Remove list markers
    .trim();
}

function generateRSS(): string {
  const sortedNotes = [...notes].sort((a, b) =>
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const items = sortedNotes
    .map((note) => {
      const url = `${SITE_URL}/notes/${note.slug}`;
      const strippedContent = stripMarkdown(note.content);
      const description = strippedContent.length > 200
        ? strippedContent.slice(0, 200) + "..."
        : strippedContent;
      const pubDate = new Date(note.date).toUTCString();

      return `    <item>
      <title>${escapeXml(note.title)}</title>
      <link>${url}</link>
      <guid>${url}</guid>
      <pubDate>${pubDate}</pubDate>
      <description>${escapeXml(description)}</description>
    </item>`;
    })
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${SITE_TITLE}</title>
    <link>${SITE_URL}</link>
    <description>${SITE_DESCRIPTION}</description>
    <language>en-us</language>
    <atom:link href="${SITE_URL}/rss.xml" rel="self" type="application/rss+xml" />
${items}
  </channel>
</rss>`;
}

// Generate and write RSS feed
const rss = generateRSS();
const publicDir = join(process.cwd(), "public");
writeFileSync(join(publicDir, "rss.xml"), rss, "utf-8");

console.log("✓ RSS feed generated successfully");
