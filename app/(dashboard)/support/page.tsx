"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import {
  MessageCircle, Plus, Send, X, ChevronRight,
  Headphones, Clock, CheckCircle2, XCircle, Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { getTickets, getTicket, createTicket, sendMessage, getNewMessages } from "@/lib/api/support";
import type { SupportTicket, SupportMessage, TicketStatus } from "@/lib/types/support";

// ── Helpers ────────────────────────────────────────────────────────────────────

const STATUS_META: Record<TicketStatus, { label: string; cls: string; icon: typeof Clock }> = {
  open:        { label: "Open",        cls: "bg-blue-100 text-blue-700",   icon: Clock         },
  in_progress: { label: "In Progress", cls: "bg-amber-100 text-amber-700", icon: Loader2       },
  resolved:    { label: "Resolved",    cls: "bg-green-100 text-green-700", icon: CheckCircle2  },
  closed:      { label: "Closed",      cls: "bg-gray-100 text-gray-500",   icon: XCircle       },
};

function fmtTime(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const diff = (now.getTime() - d.getTime()) / 1000;
  if (diff < 60)    return "just now";
  if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function fmtFull(iso: string) {
  return new Date(iso).toLocaleString("en-US", {
    month: "short", day: "numeric", hour: "numeric", minute: "2-digit"
  });
}

// ── Component ──────────────────────────────────────────────────────────────────

export default function SupportPage() {
  const { user } = useAuth();

  const [tickets,        setTickets]        = useState<SupportTicket[]>([]);
  const [activeTicket,   setActiveTicket]   = useState<SupportTicket | null>(null);
  const [messages,       setMessages]       = useState<SupportMessage[]>([]);
  const [loadingList,    setLoadingList]    = useState(true);
  const [loadingChat,    setLoadingChat]    = useState(false);
  const [sending,        setSending]        = useState(false);
  const [newMsg,         setNewMsg]         = useState("");
  const [showNewTicket,  setShowNewTicket]  = useState(false);
  const [newSubject,     setNewSubject]     = useState("");
  const [newFirstMsg,    setNewFirstMsg]    = useState("");
  const [creating,       setCreating]       = useState(false);
  const [error,          setError]          = useState<string | null>(null);

  const chatBottomRef = useRef<HTMLDivElement>(null);
  const textareaRef   = useRef<HTMLTextAreaElement>(null);
  // Highest message id the UI already holds — the cursor for delta polling.
  const lastMsgIdRef  = useRef<number>(0);

  // Append-only merge that ignores ids we've already rendered (handles the
  // race between an optimistic send and the next poll returning the same row).
  const mergeMessages = useCallback((incoming: SupportMessage[]) => {
    if (incoming.length === 0) return;
    setMessages(prev => {
      const seen = new Set(prev.map(m => m.id));
      const fresh = incoming.filter(m => !seen.has(m.id));
      if (fresh.length === 0) return prev;
      const next = [...prev, ...fresh].sort((a, b) => a.id - b.id);
      lastMsgIdRef.current = next[next.length - 1].id;
      return next;
    });
  }, []);

  // Load ticket list
  const loadTickets = useCallback(async () => {
    try {
      const data = await getTickets();
      setTickets(data);
    } catch { /* silent */ }
    finally { setLoadingList(false); }
  }, []);

  useEffect(() => { loadTickets(); }, [loadTickets]);

  // Load a single ticket conversation
  const openTicket = useCallback(async (t: SupportTicket) => {
    setActiveTicket(t);
    setLoadingChat(true);
    setMessages([]);
    lastMsgIdRef.current = 0;
    try {
      const full = await getTicket(t.id);
      setActiveTicket(full);
      const msgs = full.messages ?? [];
      setMessages(msgs);
      lastMsgIdRef.current = msgs.length ? msgs[msgs.length - 1].id : 0;
    } catch { /* silent */ }
    finally { setLoadingChat(false); }
  }, []);

  // Scroll to bottom whenever messages change
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Cursor delta polling: every 3s while the tab is focused, fetch only
  // messages newer than the last id we hold. Pauses entirely when the tab is
  // hidden (and fires one immediate catch-up poll the moment it regains focus)
  // so a backgrounded chat costs the server nothing.
  useEffect(() => {
    const ticketId = activeTicket?.id;
    if (!ticketId) return;

    let timer: ReturnType<typeof setTimeout> | undefined;
    let stopped = false;

    const poll = async () => {
      if (stopped || document.hidden) return;
      try {
        const delta = await getNewMessages(ticketId, lastMsgIdRef.current);
        mergeMessages(delta.data);
        // Reflect agent-driven status changes (resolved/closed) live.
        setActiveTicket(prev =>
          prev && prev.id === ticketId && prev.status !== delta.status
            ? { ...prev, status: delta.status }
            : prev
        );
      } catch { /* silent — next tick retries */ }
    };

    const tick = () => {
      timer = setTimeout(async () => {
        await poll();
        if (!stopped) tick();
      }, 3000);
    };

    const onVisible = () => { if (!document.hidden) poll(); };
    document.addEventListener("visibilitychange", onVisible);
    tick();

    return () => {
      stopped = true;
      if (timer) clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [activeTicket?.id, mergeMessages]);

  // Send a message
  async function handleSend() {
    if (!activeTicket || !newMsg.trim() || sending) return;
    if (activeTicket.status === "closed") return;
    setSending(true);
    try {
      const msg = await sendMessage(activeTicket.id, newMsg.trim());
      mergeMessages([msg]);
      setNewMsg("");
      // Update last_message in list
      setTickets(prev => prev.map(t =>
        t.id === activeTicket.id ? { ...t, last_message: msg.message, last_message_at: msg.created_at } : t
      ));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to send.");
    } finally {
      setSending(false);
    }
  }

  // Create new ticket
  async function handleCreate() {
    if (!newSubject.trim() || !newFirstMsg.trim() || creating) return;
    setCreating(true);
    setError(null);
    try {
      const ticket = await createTicket(newSubject.trim(), newFirstMsg.trim());
      setTickets(prev => [ticket, ...prev]);
      setShowNewTicket(false);
      setNewSubject("");
      setNewFirstMsg("");
      await openTicket(ticket);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create ticket.");
    } finally {
      setCreating(false);
    }
  }

  const isClosed = activeTicket?.status === "closed" || activeTicket?.status === "resolved";

  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden rounded-2xl border border-border bg-white shadow-sm">

      {/* ── Left: Ticket list ─────────────────────────────────────────── */}
      <div className={cn(
        "flex flex-col border-r border-border",
        activeTicket ? "hidden md:flex md:w-72 lg:w-80" : "flex w-full md:w-72 lg:w-80"
      )}>
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <div className="flex items-center gap-2">
            <Headphones className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold text-ink">Support</span>
            {tickets.length > 0 && (
              <span className="text-[10px] font-bold bg-primary/10 text-primary rounded-full px-1.5 py-0.5">
                {tickets.length}
              </span>
            )}
          </div>
          <button
            onClick={() => { setShowNewTicket(true); setError(null); }}
            className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:text-primary/80 transition"
          >
            <Plus className="h-3.5 w-3.5" /> New
          </button>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto">
          {loadingList ? (
            <div className="flex flex-col gap-3 p-4">
              {[1,2,3].map(i => (
                <div key={i} className="animate-pulse space-y-1.5">
                  <div className="h-3 w-1/3 rounded bg-bg" />
                  <div className="h-3.5 w-full rounded bg-bg" />
                  <div className="h-3 w-2/3 rounded bg-bg" />
                </div>
              ))}
            </div>
          ) : tickets.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-center px-6 py-12">
              <MessageCircle className="h-10 w-10 text-ink/20" />
              <p className="text-sm text-ink-muted">No support tickets yet.</p>
              <button
                onClick={() => setShowNewTicket(true)}
                className="text-xs text-primary hover:underline"
              >
                Create your first ticket →
              </button>
            </div>
          ) : (
            tickets.map(t => {
              const meta = STATUS_META[t.status];
              const active = activeTicket?.id === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => openTicket(t)}
                  className={cn(
                    "w-full text-left px-4 py-3 border-b border-border transition hover:bg-bg/60",
                    active && "bg-primary/5 border-l-2 border-l-primary"
                  )}
                >
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <span className="font-mono text-[10px] text-primary/70 font-semibold">{t.ticket_id}</span>
                    <span className={cn("text-[9px] font-semibold px-1.5 py-0.5 rounded-full flex-shrink-0", meta.cls)}>
                      {meta.label}
                    </span>
                  </div>
                  <p className="text-xs font-semibold text-ink truncate mb-0.5">{t.subject}</p>
                  {t.last_message && (
                    <p className="text-[11px] text-ink-muted truncate">{t.last_message}</p>
                  )}
                  <p className="text-[10px] text-ink/40 mt-1">{fmtTime(t.last_message_at ?? t.created_at)}</p>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* ── Right: Chat panel ─────────────────────────────────────────── */}
      <div className={cn(
        "flex-1 flex flex-col",
        !activeTicket && "hidden md:flex"
      )}>
        {activeTicket ? (
          <>
            {/* Chat header */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-border flex-shrink-0">
              <div className="flex items-center gap-3">
                <button
                  className="md:hidden text-ink-muted hover:text-ink"
                  onClick={() => setActiveTicket(null)}
                >
                  <X className="h-5 w-5" />
                </button>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-primary/70 font-semibold">{activeTicket.ticket_id}</span>
                    {(() => { const m = STATUS_META[activeTicket.status]; return (
                      <span className={cn("text-[9px] font-bold px-1.5 py-0.5 rounded-full", m.cls)}>{m.label}</span>
                    ); })()}
                  </div>
                  <p className="text-sm font-semibold text-ink">{activeTicket.subject}</p>
                  {activeTicket.assigned_to && (
                    <p className="text-[11px] text-ink-muted">
                      {activeTicket.assigned_to} is helping you
                    </p>
                  )}
                </div>
              </div>
              <button
                className="md:hidden ml-2 text-ink-muted hover:text-ink"
                onClick={() => setActiveTicket(null)}
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4 bg-bg/30">
              {loadingChat ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="h-6 w-6 animate-spin text-ink/30" />
                </div>
              ) : messages.length === 0 ? (
                <p className="text-center text-xs text-ink-muted py-8">No messages yet.</p>
              ) : (
                messages.map(msg => {
                  const isMe = msg.sender_type === "user";
                  return (
                    <div key={msg.id} className={cn("flex gap-2.5", isMe ? "flex-row-reverse" : "flex-row")}>
                      {/* Avatar */}
                      <div className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5 text-white",
                        isMe ? "bg-primary" : "bg-gray-400"
                      )}>
                        {isMe
                          ? (user?.name?.charAt(0).toUpperCase() ?? "U")
                          : "A"}
                      </div>
                      {/* Bubble */}
                      <div className={cn("max-w-[72%] space-y-1", isMe ? "items-end" : "items-start", "flex flex-col")}>
                        <div className={cn(
                          "px-4 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap break-words",
                          isMe
                            ? "bg-primary text-white rounded-tr-sm"
                            : "bg-white border border-border text-ink rounded-tl-sm shadow-sm"
                        )}>
                          {msg.message}
                        </div>
                        <p className="text-[10px] text-ink/40 px-1" title={fmtFull(msg.created_at)}>
                          {msg.sender_name} · {fmtTime(msg.created_at)}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={chatBottomRef} />
            </div>

            {/* Input */}
            <div className="border-t border-border p-4 flex-shrink-0 bg-white">
              {isClosed ? (
                <p className="text-xs text-center text-ink-muted py-1">
                  This ticket is {activeTicket.status}. Contact support to reopen it.
                </p>
              ) : (
                <div className="flex items-end gap-3">
                  <textarea
                    ref={textareaRef}
                    value={newMsg}
                    onChange={e => setNewMsg(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
                    }}
                    rows={1}
                    placeholder="Type a message… (Enter to send)"
                    className="flex-1 resize-none rounded-xl border border-border bg-bg px-4 py-2.5 text-sm
                               text-ink placeholder-ink/40 focus:outline-none focus:ring-2 focus:ring-primary/30
                               focus:border-primary transition max-h-32 overflow-y-auto"
                    style={{ minHeight: "42px" }}
                    onInput={e => {
                      const el = e.currentTarget;
                      el.style.height = "auto";
                      el.style.height = Math.min(el.scrollHeight, 128) + "px";
                    }}
                  />
                  <button
                    onClick={handleSend}
                    disabled={sending || !newMsg.trim()}
                    className="flex-shrink-0 inline-flex items-center justify-center w-10 h-10 rounded-xl
                               bg-primary text-white disabled:opacity-40 hover:bg-primary/90 transition"
                  >
                    {sending
                      ? <Loader2 className="h-4 w-4 animate-spin" />
                      : <Send className="h-4 w-4" />
                    }
                  </button>
                </div>
              )}
              {error && <p className="text-xs text-red-500 mt-1.5">{error}</p>}
            </div>
          </>
        ) : (
          /* Empty state */
          <div className="flex flex-col items-center justify-center h-full gap-4 text-center px-8">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Headphones className="h-8 w-8 text-primary" />
            </div>
            <div>
              <p className="text-base font-semibold text-ink mb-1">Select a ticket</p>
              <p className="text-sm text-ink-muted">Choose a conversation from the left, or create a new support request.</p>
            </div>
            <button
              onClick={() => setShowNewTicket(true)}
              className="inline-flex items-center gap-2 bg-primary text-white text-sm font-medium px-4 py-2 rounded-xl hover:bg-primary/90 transition"
            >
              <Plus className="h-4 w-4" /> New Support Ticket
            </button>
          </div>
        )}
      </div>

      {/* ── New Ticket Modal ──────────────────────────────────────────── */}
      {showNewTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 backdrop-blur-sm px-4">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-border overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <div className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5 text-primary" />
                <span className="font-semibold text-ink">New Support Ticket</span>
              </div>
              <button
                onClick={() => { setShowNewTicket(false); setError(null); }}
                className="text-ink-muted hover:text-ink transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-ink-muted mb-1.5">Subject</label>
                <input
                  type="text"
                  value={newSubject}
                  onChange={e => setNewSubject(e.target.value)}
                  placeholder="Brief description of your issue"
                  maxLength={200}
                  className="w-full rounded-xl border border-border bg-bg px-4 py-2.5 text-sm text-ink
                             placeholder-ink/40 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-ink-muted mb-1.5">Message</label>
                <textarea
                  value={newFirstMsg}
                  onChange={e => setNewFirstMsg(e.target.value)}
                  placeholder="Describe your issue in detail…"
                  rows={4}
                  maxLength={5000}
                  className="w-full rounded-xl border border-border bg-bg px-4 py-2.5 text-sm text-ink
                             placeholder-ink/40 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition resize-none"
                />
              </div>
              {error && <p className="text-xs text-red-500">{error}</p>}
            </div>

            <div className="flex gap-3 px-6 pb-5">
              <button
                onClick={handleCreate}
                disabled={creating || !newSubject.trim() || !newFirstMsg.trim()}
                className="flex-1 inline-flex items-center justify-center gap-2 bg-primary text-white
                           text-sm font-medium py-2.5 rounded-xl hover:bg-primary/90 disabled:opacity-40 transition"
              >
                {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                {creating ? "Creating…" : "Submit Ticket"}
              </button>
              <button
                onClick={() => { setShowNewTicket(false); setError(null); }}
                className="px-4 py-2.5 rounded-xl border border-border text-sm text-ink-muted hover:text-ink hover:bg-bg transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
