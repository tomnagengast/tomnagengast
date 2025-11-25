import { Link } from "react-router-dom";
import { notes } from "../data/notes";

function Notes() {
  return (
    <div className="container mx-auto max-w-xl px-4 lg:px-0">
      <div className="mt-24">
        <Link to="/">
          <div className="text-xl underline text-slate-900 mb-8">
            Tom Nagengast
          </div>
        </Link>

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
