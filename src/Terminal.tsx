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

  // Handle escape key to close
  useEffect(() => {
    const handleKeyDown = (e: globalThis.KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

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

    setIsLoading(true);
    addMessage("thinking", "Thinking...");

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
    } catch {
      setHistory((prev) =>
        prev.filter((m) => m.type !== "thinking").concat({
          type: "output",
          content:
            "Sorry, I couldn't connect to the AI service. Please try again later.",
        })
      );
    } finally {
      setIsLoading(false);
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
          />
          <span className="animate-pulse">_</span>
        </div>
      </div>
    </div>
  );
}
