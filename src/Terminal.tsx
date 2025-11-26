import { useState, useRef, useEffect, KeyboardEvent } from "react";

interface Message {
  type: "input" | "output" | "system" | "thinking";
  content: string;
}

interface TerminalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Notes content that ls will display
const NOTES = [
  { name: "about.txt", content: "Building things with code, data, and wine." },
  {
    name: "work.txt",
    content:
      "Currently at Cable.tech and Bajka Wine. Previously at Replit, Replicated, Netlify, and Mindbody.",
  },
  {
    name: "interests.txt",
    content: "Data engineering, AI/ML, wine making, and building products.",
  },
];

export default function Terminal({ isOpen, onClose }: TerminalProps) {
  const [input, setInput] = useState("");
  const [history, setHistory] = useState<Message[]>([
    {
      type: "system",
      content: `Welcome to tom's terminal v1.0.0
Type 'help' for available commands.`,
    },
  ]);
  const [isInChatMode, setIsInChatMode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [chatHistory, setChatHistory] = useState<
    { role: "user" | "assistant"; content: string }[]
  >([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const terminalRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Auto-scroll to bottom when history changes
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [history]);

  // Focus input when terminal opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Handle escape key and Ctrl+C to abort or close
  useEffect(() => {
    const handleKeyDown = (e: globalThis.KeyboardEvent) => {
      if (!isOpen) return;

      // ESC or Ctrl+C while loading in chat mode: abort the request
      if (
        (e.key === "Escape" || (e.key === "c" && e.ctrlKey)) &&
        isLoading &&
        isInChatMode
      ) {
        e.preventDefault();
        if (abortControllerRef.current) {
          abortControllerRef.current.abort();
        }
        return;
      }

      // ESC when not loading: close terminal
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isLoading, isInChatMode, onClose]);

  const addMessage = (type: Message["type"], content: string) => {
    setHistory((prev) => [...prev, { type, content }]);
  };

  const handleLs = () => {
    const output = NOTES.map((note) => `  ${note.name}`).join("\n");
    addMessage("output", output);
  };

  const handleCat = (filename: string) => {
    const note = NOTES.find((n) => n.name === filename);
    if (note) {
      addMessage("output", note.content);
    } else {
      addMessage("output", `cat: ${filename}: No such file or directory`);
    }
  };

  const handleHelp = () => {
    const helpText = `Available commands:
  ls          List available notes
  cat <file>  Read a note (e.g., cat about.txt)
  tom         Start a conversation with Tom's AI assistant
  clear       Clear the terminal
  exit        Close the terminal`;
    addMessage("output", helpText);
  };

  const handleTom = () => {
    setIsInChatMode(true);
    setChatHistory([]);
    addMessage(
      "system",
      `Starting tom's assistant...
You can now ask me questions. Type 'exit' to leave chat mode.

Hi! I'm an AI trained to answer questions the way Tom would.
Ask me about his work, projects, interests, or anything else!`
    );
  };

  const handleChatMessage = async (message: string) => {
    if (message.toLowerCase() === "exit") {
      setIsInChatMode(false);
      addMessage("system", "Exiting chat mode. Back to normal terminal.");
      return;
    }

    // Create a new AbortController for this request
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    setIsLoading(true);
    addMessage("thinking", "Thinking... (ESC or Ctrl+C to cancel)");

    const newChatHistory = [
      ...chatHistory,
      { role: "user" as const, content: message },
    ];
    setChatHistory(newChatHistory);

    try {
      const response = await fetch("/.netlify/functions/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newChatHistory }),
        signal,
      });

      if (!response.ok) {
        throw new Error("Failed to get response");
      }

      const data = await response.json();

      // Remove thinking message and add response
      setHistory((prev) =>
        prev.filter((m) => m.type !== "thinking").concat({
          type: "output",
          content: data.response,
        })
      );

      setChatHistory([
        ...newChatHistory,
        { role: "assistant", content: data.response },
      ]);
    } catch (error) {
      // Check if this was an abort
      if (error instanceof Error && error.name === "AbortError") {
        setHistory((prev) =>
          prev.filter((m) => m.type !== "thinking").concat({
            type: "system",
            content: "Request cancelled.",
          })
        );
      } else {
        setHistory((prev) =>
          prev.filter((m) => m.type !== "thinking").concat({
            type: "output",
            content:
              "Sorry, I couldn't connect to the AI service. Please try again later.",
          })
        );
      }
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  };

  const processCommand = (cmd: string) => {
    const trimmed = cmd.trim();
    if (!trimmed) return;

    addMessage("input", `${isInChatMode ? "tom>" : "$"} ${trimmed}`);

    if (isInChatMode) {
      handleChatMessage(trimmed);
      return;
    }

    const [command, ...args] = trimmed.split(" ");

    switch (command.toLowerCase()) {
      case "ls":
        handleLs();
        break;
      case "cat":
        if (args.length > 0) {
          handleCat(args[0]);
        } else {
          addMessage("output", "cat: missing file operand");
        }
        break;
      case "help":
        handleHelp();
        break;
      case "tom":
        handleTom();
        break;
      case "clear":
        setHistory([]);
        break;
      case "exit":
        onClose();
        break;
      default:
        addMessage(
          "output",
          `${command}: command not found. Type 'help' for available commands.`
        );
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !isLoading) {
      processCommand(input);
      setInput("");
    }
  };

  // Handler for toolbar abort button
  const handleAbort = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  };

  // Handler for toolbar escape/close button
  const handleEscape = () => {
    if (isLoading && isInChatMode) {
      handleAbort();
    } else {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black z-50 flex flex-col font-mono text-green-400"
      onClick={() => inputRef.current?.focus()}
    >
      {/* Terminal header */}
      <div className="flex items-center justify-between px-4 py-2 bg-gray-900 border-b border-gray-700">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <button
              onClick={onClose}
              className="w-3 h-3 rounded-full bg-red-500 hover:bg-red-600"
              aria-label="Close terminal"
            />
            <div className="w-3 h-3 rounded-full bg-yellow-500" />
            <div className="w-3 h-3 rounded-full bg-green-500" />
          </div>
          <span className="ml-4 text-gray-400 text-sm">tom@terminal ~ </span>
        </div>
        <span className="text-gray-500 text-xs">ESC to close</span>
      </div>

      {/* Terminal content */}
      <div ref={terminalRef} className="flex-1 overflow-y-auto p-4 space-y-1">
        {history.map((msg, i) => (
          <div
            key={i}
            className={`whitespace-pre-wrap ${
              msg.type === "input"
                ? "text-white"
                : msg.type === "system"
                  ? "text-cyan-400"
                  : msg.type === "thinking"
                    ? "text-yellow-400 animate-pulse"
                    : "text-green-400"
            }`}
          >
            {msg.content}
          </div>
        ))}

        {/* Input line */}
        <div className="flex items-center">
          <span className="text-white mr-2">
            {isInChatMode ? "tom>" : "$"}
          </span>
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
            className="flex-1 bg-transparent outline-none text-white caret-green-400"
            autoFocus
            spellCheck={false}
            autoCapitalize="off"
            autoCorrect="off"
          />
          <span className="animate-pulse">_</span>
        </div>
      </div>

      {/* Mobile keyboard toolbar - appears above the iOS keyboard */}
      <div className="flex items-center gap-2 px-3 py-2 bg-gray-800 border-t border-gray-700">
        <button
          onClick={handleEscape}
          className="px-3 py-1.5 text-xs font-medium bg-gray-700 hover:bg-gray-600 active:bg-gray-500 text-gray-200 rounded border border-gray-600"
        >
          esc
        </button>
        {isInChatMode && (
          <button
            onClick={handleAbort}
            disabled={!isLoading}
            className={`px-3 py-1.5 text-xs font-medium rounded border ${
              isLoading
                ? "bg-red-900/50 hover:bg-red-800/50 active:bg-red-700/50 text-red-300 border-red-700"
                : "bg-gray-700 text-gray-500 border-gray-600 cursor-not-allowed"
            }`}
          >
            ^C
          </button>
        )}
        <span className="flex-1" />
        <span className="text-gray-500 text-xs">
          {isInChatMode ? "chat mode" : "terminal"}
        </span>
      </div>
    </div>
  );
}
