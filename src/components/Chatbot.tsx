import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageCircle, X, Send, Trash2, ChevronDown,
  Plus, MessageSquare, ChevronLeft, ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import logo from "@/assets/logo.jpeg";

// ── Types ─────────────────────────────────────────────────────────────────────
interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: number;
}

interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
}

// ── Per-user storage key ──────────────────────────────────────────────────────
// FIX: old code used a single key — everyone shared the same history.
// Now we scope by user ID so each account sees only its own conversations.
const storageKey = (userId: string) => `nthakaguide_chats_${userId}`;

function loadConversations(userId: string): Conversation[] {
  try {
    const raw = localStorage.getItem(storageKey(userId));
    return raw ? (JSON.parse(raw) as Conversation[]) : [];
  } catch {
    return [];
  }
}

function saveConversations(userId: string, convos: Conversation[]) {
  try {
    // Keep newest 50 conversations; trim each to 200 messages
    const trimmed = convos
      .sort((a, b) => b.updatedAt - a.updatedAt)
      .slice(0, 50)
      .map(c => ({ ...c, messages: c.messages.slice(-200) }));
    localStorage.setItem(storageKey(userId), JSON.stringify(trimmed));
  } catch {}
}

function newConversation(): Conversation {
  return {
    id: crypto.randomUUID(),
    title: "New conversation",
    messages: [
      {
        role: "assistant",
        content: `## Welcome to NthakaGuide!\n\nI'm your Malawian agricultural assistant. I can help with:\n\n- **Crop recommendations** for your district\n- **Fertiliser plans** and application rates\n- **Pest & disease** identification and control\n- **Soil management** and conservation farming\n- **Rainfall** and seasonal planting advice\n\nWhat would you like to know about farming in Malawi today?`,
        timestamp: Date.now(),
      },
    ],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

// Auto-title from first user message (first 40 chars)
function deriveTitle(messages: Message[]): string {
  const first = messages.find(m => m.role === "user");
  if (!first) return "New conversation";
  return first.content.slice(0, 40) + (first.content.length > 40 ? "…" : "");
}

// ── Offline fallback AI ───────────────────────────────────────────────────────
// Used when the backend is unreachable, so users still get helpful responses.
function offlineFallback(userMessage: string): string {
  const msg = userMessage.toLowerCase();
  if (msg.includes("maize") || msg.includes("corn"))
    return "**Maize** grows well across most of Malawi's agro-ecological zones.\n\n- **Planting depth:** 5–7 cm\n- **Spacing:** 75 × 25 cm\n- **Fertiliser:** Basal NPK at planting; top-dress Urea at 4–6 leaf stage\n- **pH range:** 5.5–7.0\n\n*Note: I'm currently offline — for full AI recommendations, please reconnect.*";
  if (msg.includes("fertiliser") || msg.includes("fertilizer"))
    return "**Common fertilisers in Malawi:**\n\n- **Urea (46-0-0):** Nitrogen top-dressing for maize and tobacco\n- **DAP (18-46-0):** Starter fertiliser at planting — good for phosphorus-deficient soils\n- **CAN:** Nitrogen with calcium — reduces soil acidification vs Urea\n- **NPK 23:21:0:** Balanced basal application\n\n*Note: I'm currently offline — full recommendations require the backend server.*";
  if (msg.includes("soil") || msg.includes("ph"))
    return "**Soil health guidelines for Malawi:**\n\n- Ideal pH: **6.0–7.0** for most crops\n- Apply **agricultural lime** if pH is below 5.5\n- Organic matter above **3%** improves water retention\n- Test soil every 2–3 seasons\n\n*Note: I'm currently offline. The full AI assistant needs a server connection.*";
  if (msg.includes("rain") || msg.includes("season") || msg.includes("planting"))
    return "**Malawi planting seasons:**\n\n- **Main rains (dimba):** November–December planting; harvest March–April\n- **Dry season irrigation:** May–September along the lakeshore and shire valley\n- Check your district's rainfall forecast in the Rainfall tab for live data\n\n*Note: I'm currently offline — connect to the server for district-specific advice.*";
  return "I'm currently operating in **offline mode** — the backend server is unreachable.\n\nI can still answer basic questions about:\n- Malawi crops (maize, tobacco, groundnuts, beans, soybean)\n- Fertiliser types available in Malawi\n- Soil pH and nutrient management\n- Planting seasons\n\nFor full AI-powered recommendations, please check your connection and try again.";
}

// ── Markdown renderer ─────────────────────────────────────────────────────────
function renderContent(content: string) {
  const lines = content.split("\n");
  const elements: JSX.Element[] = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (line.startsWith("### ")) {
      elements.push(<p key={i} className="font-bold text-primary text-xs uppercase tracking-wide mt-2 mb-0.5">{line.slice(4)}</p>);
    } else if (line.startsWith("## ")) {
      elements.push(<p key={i} className="font-bold text-foreground text-sm mt-2 mb-1">{line.slice(3)}</p>);
    } else if (line.startsWith("- ") || line.startsWith("* ")) {
      const items: string[] = [];
      while (i < lines.length && (lines[i].startsWith("- ") || lines[i].startsWith("* "))) {
        items.push(lines[i].slice(2));
        i++;
      }
      elements.push(
        <ul key={`ul-${i}`} className="space-y-0.5 my-1 pl-1">
          {items.map((item, idx) => (
            <li key={idx} className="flex gap-1.5 text-xs leading-relaxed">
              <span className="text-primary mt-0.5 shrink-0">▸</span>
              <span dangerouslySetInnerHTML={{ __html: inlineFormat(item) }} />
            </li>
          ))}
        </ul>
      );
      continue;
    } else if (/^\d+\.\s/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\d+\.\s/.test(lines[i])) {
        items.push(lines[i].replace(/^\d+\.\s/, ""));
        i++;
      }
      elements.push(
        <ol key={`ol-${i}`} className="space-y-0.5 my-1 pl-1">
          {items.map((item, idx) => (
            <li key={idx} className="flex gap-1.5 text-xs leading-relaxed">
              <span className="text-golden font-bold shrink-0 w-4">{idx + 1}.</span>
              <span dangerouslySetInnerHTML={{ __html: inlineFormat(item) }} />
            </li>
          ))}
        </ol>
      );
      continue;
    } else if (line === "---" || line === "***") {
      elements.push(<hr key={i} className="border-border/50 my-1.5" />);
    } else if (line.trim() === "") {
      elements.push(<div key={i} className="h-1" />);
    } else {
      elements.push(
        <p key={i} className="text-xs leading-relaxed"
          dangerouslySetInnerHTML={{ __html: inlineFormat(line) }} />
      );
    }
    i++;
  }
  return <div className="space-y-0.5">{elements}</div>;
}

function inlineFormat(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong class="font-semibold text-foreground">$1</strong>')
    .replace(/\*(.+?)\*/g, '<em class="italic text-muted-foreground">$1</em>')
    .replace(/`(.+?)`/g, '<code class="bg-muted px-1 py-0.5 rounded text-[10px] font-mono text-primary">$1</code>');
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function Chatbot() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string>("");
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const userId = user?.id ?? user?.email ?? "";

  // Load conversations for this specific user when they log in
  useEffect(() => {
    if (!userId) return;
    const stored = loadConversations(userId);
    if (stored.length > 0) {
      setConversations(stored);
      setActiveId(stored[0].id);
    } else {
      const fresh = newConversation();
      setConversations([fresh]);
      setActiveId(fresh.id);
    }
  }, [userId]);

  // Persist whenever conversations change
  useEffect(() => {
    if (userId && conversations.length > 0) {
      saveConversations(userId, conversations);
    }
  }, [conversations, userId]);

  const activeConvo = conversations.find(c => c.id === activeId);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    if (open) setTimeout(scrollToBottom, 100);
  }, [activeConvo?.messages, streamingContent, open, scrollToBottom]);

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    setShowScrollBtn(el.scrollHeight - el.scrollTop - el.clientHeight > 120);
  };

  // Start a new conversation
  const createNewConvo = () => {
    const fresh = newConversation();
    setConversations(prev => [fresh, ...prev]);
    setActiveId(fresh.id);
    setSidebarOpen(false);
  };

  // Delete a conversation
  const deleteConvo = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setConversations(prev => {
      const next = prev.filter(c => c.id !== id);
      if (next.length === 0) {
        const fresh = newConversation();
        setActiveId(fresh.id);
        return [fresh];
      }
      if (id === activeId) setActiveId(next[0].id);
      return next;
    });
  };

  // Append a message to the active conversation
  const appendMessage = (msg: Message) => {
    setConversations(prev =>
      prev.map(c => {
        if (c.id !== activeId) return c;
        const updated = { ...c, messages: [...c.messages, msg], updatedAt: Date.now() };
        updated.title = deriveTitle(updated.messages);
        return updated;
      })
    );
  };

  // Send with streaming
  const sendMessage = async () => {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg: Message = { role: "user", content: text, timestamp: Date.now() };
    appendMessage(userMsg);
    setInput("");
    setLoading(true);
    setStreamingContent("");

    const currentMessages = [
      ...(activeConvo?.messages ?? []),
      userMsg,
    ]
      .filter(m => m.role === "user" || m.role === "assistant")
      .slice(-20)
      .map(m => ({ role: m.role, content: m.content }));

    abortRef.current = new AbortController();

    try {
      const response = await fetch("http://localhost:5000/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: currentMessages, stream: true }),
        signal: abortRef.current.signal,
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || `Server error ${response.status}`);
      }

      // ── Streaming path ────────────────────────────────────────────────────
      const contentType = response.headers.get("content-type") ?? "";
      if (contentType.includes("text/event-stream") || contentType.includes("text/plain")) {
        const reader = response.body!.getReader();
        const decoder = new TextDecoder();
        let accumulated = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          // Handle SSE "data: ..." lines
          for (const line of chunk.split("\n")) {
            if (line.startsWith("data: ")) {
              const payload = line.slice(6).trim();
              if (payload === "[DONE]") continue;
              try {
                const parsed = JSON.parse(payload);
                const token =
                  parsed.choices?.[0]?.delta?.content ??
                  parsed.token ??
                  parsed.text ??
                  "";
                accumulated += token;
                setStreamingContent(accumulated);
              } catch {
                // raw text fallback
                accumulated += payload;
                setStreamingContent(accumulated);
              }
            }
          }
        }

        const finalMsg: Message = { role: "assistant", content: accumulated, timestamp: Date.now() };
        setStreamingContent("");
        appendMessage(finalMsg);
        setIsOffline(false);
      } else {
        // ── Non-streaming fallback (backend doesn't support streaming) ─────
        const data = await response.json();
        const reply = data.reply || "Sorry, I could not process that.";
        appendMessage({ role: "assistant", content: reply, timestamp: Date.now() });
        setIsOffline(false);
      }
    } catch (err: any) {
      setStreamingContent("");
      if (err.name === "AbortError") return;

      // Network failure → offline fallback
      const isNetwork =
        err.message?.includes("fetch") ||
        err.message?.includes("network") ||
        err.message?.includes("Failed to fetch") ||
        err.message?.includes("ERR_CONNECTION_REFUSED");

      if (isNetwork) {
        setIsOffline(true);
        const fallback = offlineFallback(text);
        appendMessage({ role: "assistant", content: fallback, timestamp: Date.now() });
      } else {
        appendMessage({
          role: "assistant",
          content: `**Error:** ${err.message || "Something went wrong. Please try again."}`,
          timestamp: Date.now(),
        });
      }
    } finally {
      setLoading(false);
      abortRef.current = null;
    }
  };

  const stopStreaming = () => {
    abortRef.current?.abort();
    if (streamingContent) {
      appendMessage({ role: "assistant", content: streamingContent, timestamp: Date.now() });
      setStreamingContent("");
    }
    setLoading(false);
  };

  const formatTime = (ts: number) =>
    new Date(ts).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });

  const formatDate = (ts: number) => {
    const d = new Date(ts);
    const today = new Date();
    if (d.toDateString() === today.toDateString()) return "Today";
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
    return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
  };

  if (!user) return null;

  const messages = activeConvo?.messages ?? [];

  return (
    <>
      {/* Floating button */}
      <AnimatePresence>
        {!open && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setOpen(true)}
            className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full bg-golden text-golden-foreground shadow-golden flex items-center justify-center hover:bg-golden/90 transition-colors"
            aria-label="Open NthakaGuide Assistant"
          >
            <MessageCircle className="h-6 w-6" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat window */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.94 }}
            transition={{ type: "spring", damping: 22, stiffness: 280 }}
            className="fixed bottom-6 right-6 z-50 flex shadow-2xl rounded-2xl overflow-hidden"
            style={{ width: sidebarOpen ? 640 : 380, maxWidth: "calc(100vw - 1.5rem)", height: 560, maxHeight: "calc(100vh - 5rem)" }}
          >
            {/* ── Sidebar ─────────────────────────────────────────────────── */}
            <AnimatePresence>
              {sidebarOpen && (
                <motion.div
                  initial={{ width: 0, opacity: 0 }}
                  animate={{ width: 220, opacity: 1 }}
                  exit={{ width: 0, opacity: 0 }}
                  transition={{ type: "spring", damping: 24, stiffness: 300 }}
                  className="bg-muted/50 border-r border-border flex flex-col shrink-0 overflow-hidden"
                >
                  <div className="flex items-center justify-between px-3 py-3 border-b border-border">
                    <span className="text-xs font-semibold text-foreground">Conversations</span>
                    <Button variant="ghost" size="sm" onClick={createNewConvo}
                      className="h-7 w-7 p-0 text-muted-foreground hover:text-primary" title="New chat">
                      <Plus className="h-3.5 w-3.5" />
                    </Button>
                  </div>

                  <div className="flex-1 overflow-y-auto py-1">
                    {conversations.map(convo => (
                      <div
                        key={convo.id}
                        onClick={() => { setActiveId(convo.id); setSidebarOpen(false); }}
                        className={`group flex items-start gap-2 px-3 py-2.5 cursor-pointer hover:bg-accent/50 transition-colors ${convo.id === activeId ? "bg-accent" : ""}`}
                      >
                        <MessageSquare className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-foreground truncate">{convo.title}</p>
                          <p className="text-[10px] text-muted-foreground">{formatDate(convo.updatedAt)}</p>
                        </div>
                        <button
                          onClick={e => deleteConvo(convo.id, e)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>

                  {isOffline && (
                    <div className="px-3 py-2 border-t border-border">
                      <p className="text-[10px] text-amber-600 dark:text-amber-400">⚠ Offline mode — basic answers only</p>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* ── Main chat area ───────────────────────────────────────────── */}
            <div className="flex flex-col flex-1 bg-card min-w-0">
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-primary/5 shrink-0">
                <div className="flex items-center gap-2.5">
                  <button
                    onClick={() => setSidebarOpen(s => !s)}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                    title="Toggle conversations"
                  >
                    {sidebarOpen ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  </button>
                  <img src={logo} alt="NthakaGuide logo" className="h-8 w-8 rounded-lg shadow-sm" />
                  <div>
                    <p className="font-display font-bold text-foreground text-sm leading-tight">NthakaGuide Assistant</p>
                    <p className="text-[10px] text-muted-foreground">
                      {isOffline ? "⚠ Offline mode" : "Malawi Agriculture Expert"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="sm" onClick={createNewConvo}
                    className="h-8 w-8 p-0 text-muted-foreground hover:text-primary" title="New conversation">
                    <Plus className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setOpen(false)}
                    className="h-8 w-8 p-0">
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Messages */}
              <div
                ref={scrollRef}
                onScroll={handleScroll}
                className="flex-1 overflow-y-auto px-3 py-3 space-y-3 scroll-smooth"
              >
                {messages.map((msg, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                    className={`flex gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    {msg.role === "assistant" && (
                      <div className="h-6 w-6 flex items-center justify-center shrink-0 mt-0.5">
                        <img src={logo} alt="" className="h-6 w-6 rounded-md" />
                      </div>
                    )}
                    <div className={`flex flex-col gap-0.5 max-w-[84%] ${msg.role === "user" ? "items-end" : "items-start"}`}>
                      <div className={`rounded-2xl px-3 py-2.5 ${
                        msg.role === "user"
                          ? "bg-primary text-primary-foreground rounded-tr-sm"
                          : "bg-muted text-foreground rounded-tl-sm border border-border/40"
                      }`}>
                        {msg.role === "user"
                          ? <p className="text-xs leading-relaxed">{msg.content}</p>
                          : renderContent(msg.content)}
                      </div>
                      <span className="text-[9px] text-muted-foreground px-1">{formatTime(msg.timestamp)}</span>
                    </div>
                    {msg.role === "user" && (
                      <div className="h-6 w-6 rounded-full bg-golden/20 flex items-center justify-center shrink-0 mt-0.5">
                        <span className="text-[10px] font-bold text-golden uppercase">
                          {(user?.name || user?.email || "U").charAt(0)}
                        </span>
                      </div>
                    )}
                  </motion.div>
                ))}

                {/* Streaming bubble */}
                {streamingContent && (
                  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex gap-2 justify-start">
                    <div className="h-6 w-6 flex items-center justify-center shrink-0 mt-0.5">
                      <img src={logo} alt="" className="h-6 w-6 rounded-md" />
                    </div>
                    <div className="bg-muted border border-border/40 rounded-2xl rounded-tl-sm px-3 py-2.5 max-w-[84%]">
                      {renderContent(streamingContent)}
                      <span className="inline-block w-0.5 h-3 bg-primary animate-pulse ml-0.5 align-middle" />
                    </div>
                  </motion.div>
                )}

                {/* Typing indicator (no streaming content yet) */}
                {loading && !streamingContent && (
                  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex gap-2 justify-start">
                    <div className="h-6 w-6 flex items-center justify-center shrink-0">
                      <img src={logo} alt="" className="h-6 w-6 rounded-md" />
                    </div>
                    <div className="bg-muted border border-border/40 rounded-2xl rounded-tl-sm px-4 py-3">
                      <div className="flex gap-1 items-center">
                        {[0, 1, 2].map(n => (
                          <motion.div key={n} className="h-1.5 w-1.5 rounded-full bg-primary/60"
                            animate={{ y: [0, -4, 0] }}
                            transition={{ duration: 0.6, delay: n * 0.15, repeat: Infinity }} />
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Scroll to bottom button */}
              <AnimatePresence>
                {showScrollBtn && (
                  <motion.button
                    initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}
                    onClick={scrollToBottom}
                    className="absolute bottom-[4.5rem] right-4 z-10 h-7 w-7 rounded-full bg-card border border-border shadow-md flex items-center justify-center"
                  >
                    <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                  </motion.button>
                )}
              </AnimatePresence>

              {/* Input area */}
              <div className="border-t border-border p-3 shrink-0 bg-card">
                <div className="flex gap-2">
                  <input
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                    placeholder="Ask about Malawi crops, soil, fertilisers…"
                    className="flex-1 rounded-xl border border-input bg-background px-3 py-2 text-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-0 transition-shadow"
                    disabled={loading && !streamingContent}
                  />
                  {loading ? (
                    <Button onClick={stopStreaming} size="sm"
                      className="bg-destructive/80 hover:bg-destructive text-white px-3 rounded-xl h-auto" title="Stop">
                      <span className="h-3 w-3 rounded-sm bg-white" />
                    </Button>
                  ) : (
                    <Button onClick={sendMessage} size="sm" disabled={!input.trim()}
                      className="bg-golden text-golden-foreground hover:bg-golden/90 px-3 rounded-xl h-auto">
                      <Send className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
                <p className="text-[9px] text-muted-foreground text-center mt-1.5">
                  {isOffline ? "Running in offline mode — reconnect for full AI" : "Specialised in Malawian agriculture · Saved per account"}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}