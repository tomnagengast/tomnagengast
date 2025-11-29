import { useEffect, useRef, useState } from "react";

interface TerminalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Terminal({ isOpen, onClose }: TerminalProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const terminalRef = useRef<any>(null);
  const fitAddonRef = useRef<any>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Initialize ghostty-web terminal
  useEffect(() => {
    if (!isOpen || !containerRef.current || isInitialized) return;

    const initTerminal = async () => {
      try {
        const { init, Terminal, FitAddon } = await import("ghostty-web");
        await init();

        const term = new Terminal({
          cursorBlink: true,
          fontSize: 14,
          fontFamily: '"JetBrains Mono", "Fira Code", monospace',
          theme: {
            background: "#000000",
            foreground: "#00ff00",
            cursor: "#00ff00",
            cursorAccent: "#000000",
          },
        });

        const fitAddon = new FitAddon();
        term.loadAddon(fitAddon);
        term.open(containerRef.current!);
        fitAddon.fit();

        terminalRef.current = term;
        fitAddonRef.current = fitAddon;
        setIsInitialized(true);

        // Write welcome message
        await executeCommand("welcome", term);
        writePrompt(term);

        // Handle user input
        let lineBuffer = "";
        term.onData((data: string) => {
          if (data === "\r" || data === "\n") {
            // Enter pressed - execute command
            term.write("\r\n");
            if (lineBuffer.trim()) {
              if (lineBuffer.trim() === "exit") {
                onClose();
                return;
              }
              executeCommand(lineBuffer.trim(), term).then(() => {
                writePrompt(term);
              });
            } else {
              writePrompt(term);
            }
            lineBuffer = "";
          } else if (data === "\x7f" || data === "\b") {
            // Backspace
            if (lineBuffer.length > 0) {
              lineBuffer = lineBuffer.slice(0, -1);
              term.write("\b \b");
            }
          } else if (data === "\x03") {
            // Ctrl+C
            if (abortControllerRef.current) {
              abortControllerRef.current.abort();
            }
            term.write("^C\r\n");
            lineBuffer = "";
            writePrompt(term);
          } else if (data === "\x1b") {
            // Escape
            onClose();
          } else if (data >= " " || data === "\t") {
            // Printable characters
            lineBuffer += data;
            term.write(data);
          }
        });

        // Handle resize
        const handleResize = () => {
          if (fitAddonRef.current) {
            fitAddonRef.current.fit();
          }
        };
        window.addEventListener("resize", handleResize);

        return () => {
          window.removeEventListener("resize", handleResize);
        };
      } catch (error) {
        console.error("Failed to initialize terminal:", error);
      }
    };

    initTerminal();
  }, [isOpen, isInitialized, onClose]);

  // Cleanup on close
  useEffect(() => {
    if (!isOpen && terminalRef.current) {
      terminalRef.current.dispose();
      terminalRef.current = null;
      fitAddonRef.current = null;
      setIsInitialized(false);
    }
  }, [isOpen]);

  const writePrompt = (term: any) => {
    term.write("\x1b[32mtom@sandbox\x1b[0m:\x1b[34m~\x1b[0m$ ");
  };

  const executeCommand = async (command: string, term: any) => {
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    try {
      const response = await fetch("/.netlify/functions/shell", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ command }),
        signal,
      });

      if (!response.ok) {
        const data = await response.json();
        term.write(`\x1b[31mError: ${data.error || "Command failed"}\x1b[0m\r\n`);
        return;
      }

      const contentType = response.headers.get("content-type");

      if (contentType?.includes("text/event-stream")) {
        // Handle SSE streaming
        const text = await response.text();
        const lines = text.split("\n");

        for (const line of lines) {
          if (signal.aborted) break;

          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6));

              if (data.error) {
                term.write(`\x1b[31m${data.error}\x1b[0m\r\n`);
              } else if (data.output) {
                // Write output, converting \n to \r\n for terminal
                const output = data.output.replace(/\n/g, "\r\n");
                term.write(output);
              }
            } catch {
              // Skip invalid JSON
            }
          }
        }
      } else {
        // Handle JSON response
        const data = await response.json();
        if (data.output) {
          const output = data.output.replace(/\n/g, "\r\n");
          term.write(output);
          if (!output.endsWith("\n")) {
            term.write("\r\n");
          }
        }
        if (data.error) {
          term.write(`\x1b[31m${data.error}\x1b[0m\r\n`);
        }
      }
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        term.write("\r\n");
      } else {
        const message = error instanceof Error ? error.message : String(error);
        term.write(`\x1b[31mError: ${message}\x1b[0m\r\n`);
      }
    } finally {
      abortControllerRef.current = null;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
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
          <span className="ml-4 text-gray-400 text-sm font-mono">
            tom@sandbox ~ bash
          </span>
        </div>
        <span className="text-gray-500 text-xs">ESC to close</span>
      </div>

      {/* Terminal container */}
      <div
        ref={containerRef}
        className="flex-1 bg-black"
        style={{ padding: "8px" }}
      />

      {/* Mobile toolbar */}
      <div className="flex items-center gap-2 px-3 py-2 bg-gray-800 border-t border-gray-700 md:hidden">
        <button
          onClick={onClose}
          className="px-3 py-1.5 text-xs font-medium bg-gray-700 hover:bg-gray-600 text-gray-200 rounded border border-gray-600"
        >
          esc
        </button>
        <button
          onClick={() => {
            if (abortControllerRef.current) {
              abortControllerRef.current.abort();
            }
          }}
          className="px-3 py-1.5 text-xs font-medium bg-gray-700 hover:bg-gray-600 text-gray-200 rounded border border-gray-600"
        >
          ^C
        </button>
        <span className="flex-1" />
        <span className="text-gray-500 text-xs font-mono">sandbox</span>
      </div>
    </div>
  );
}
