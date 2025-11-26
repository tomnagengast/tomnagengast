import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./components/Home";
import Notes from "./components/Notes";
import Note from "./components/Note";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/notes" element={<Notes />} />
        <Route path="/notes/:slug" element={<Note />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
