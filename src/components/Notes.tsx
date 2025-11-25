import { Link } from "react-router-dom";
import { notes } from "../data/notes";

function Notes() {
  return (
    <div className="container mx-auto max-w-xl px-4 lg:px-0">
      <div className="mt-24">
        <div className="flex justify-between items-center mb-8">
          <Link to="/">
            <div className="text-xl underline text-slate-900">
              Tom Nagengast
            </div>
          </Link>
          <a
            href="/rss.xml"
            className="text-slate-600 hover:text-slate-900 transition-colors"
            title="Subscribe to RSS feed"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="2"
              stroke="currentColor"
              height="20"
              width="20"
            >
              <title>RSS Feed</title>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12.75 19.5v-.75a7.5 7.5 0 0 0-7.5-7.5H4.5m0-6.75h.75c7.87 0 14.25 6.38 14.25 14.25v.75M6 18.75a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z"
              />
            </svg>
          </a>
        </div>

        <div className="space-y-6">
          {notes.length === 0 ? (
            <p className="text-slate-600">No notes yet. Check back soon!</p>
          ) : (
            notes.map((note) => (
              <Link
                key={note.slug}
                to={`/notes/${note.slug}`}
                className="block group"
              >
                <article className="border-b border-slate-200 pb-6 hover:border-slate-400 transition-colors">
                  <h2 className="text-2xl font-semibold text-slate-900 group-hover:text-slate-600 transition-colors">
                    {note.title}
                  </h2>
                  <time className="text-sm text-slate-500 mt-2 block">
                    {new Date(note.date).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </time>
                </article>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default Notes;
