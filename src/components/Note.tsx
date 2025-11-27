import { useParams, Link, Navigate } from "react-router-dom";
import Markdown from "react-markdown";
import { notes } from "../data/notes";

function Note() {
  const { slug } = useParams<{ slug: string }>();
  const note = notes.find((n) => n.slug === slug);

  if (!note) {
    return <Navigate to="/notes" replace />;
  }

  return (
    <div className="container mx-auto max-w-xl px-4 lg:px-0">
      <div className="mt-24">
        <Link to="/">
          <div className="text-xl underline text-slate-900 dark:text-slate-100 mb-2">
            Tom Nagengast
          </div>
        </Link>
        <Link to="/notes" className="text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200">
          ← Back to notes
        </Link>

        <article className="mt-8">
          <h1 className="text-4xl font-bold mb-4 dark:text-white">{note.title}</h1>
          <time className="text-sm text-slate-500 dark:text-slate-400 block mb-8">
            {new Date(note.date).toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </time>

          <div className="prose prose-slate dark:prose-invert max-w-none">
            <Markdown>{note.content}</Markdown>
          </div>
        </article>
      </div>
    </div>
  );
}

export default Note;
