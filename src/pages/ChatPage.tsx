import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Sparkles, Loader2, ChevronRight, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import AppLayout from "@/components/AppLayout";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import ReactMarkdown from "react-markdown";

type Message = { role: "user" | "assistant"; content: string };

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`;

const suggestions = [
  "What should I eat for breakfast? 🍳",
  "Quick high-protein snacks?",
  "Low calorie dinner ideas 🥗",
  "I'm craving something sweet 🍫",
  "How much water should I drink?",
  "I missed lunch, what now?",
  "Best post-workout meal?",
  "Healthy biryani alternatives?",
];

const ChatPage = () => {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user) loadChatHistory();
  }, [user]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const loadChatHistory = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("ai_chat_history")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at")
      .limit(50);

    if (data && data.length > 0) {
      setMessages(data.map((m) => ({
        role: m.sender === "user" ? "user" as const : "assistant" as const,
        content: m.message,
      })));
    } else {
      addGreeting();
    }
  };

  const addGreeting = async () => {
    const greeting: Message = {
      role: "assistant",
      content: `Hi ${profile?.name || "there"}! 🌿 I'm Fitzen Buddy. How can I help you today?`,
    };
    setMessages([greeting]);
    if (user) {
      await supabase.from("ai_chat_history").insert({
        user_id: user.id, message: greeting.content, sender: "bot",
      } as any);
    }
  };

  const clearChat = async () => {
    if (!user) return;
    await supabase.from("ai_chat_history").delete().eq("user_id", user.id);
    setMessages([]);
    addGreeting();
    toast({ title: "Chat cleared ✨" });
  };

  const handleSend = async (text?: string) => {
    const msgText = text || input;
    if (!msgText.trim() || !user || loading) return;
    const userMsg: Message = { role: "user", content: msgText };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInput("");
    setLoading(true);

    await supabase.from("ai_chat_history").insert({
      user_id: user.id, message: msgText, sender: "user",
    } as any);

    let assistantSoFar = "";
    try {
      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          messages: updatedMessages.slice(-20).map((m) => ({ role: m.role, content: m.content })),
          userProfile: profile,
        }),
      });

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({ error: "AI error" }));
        throw new Error(err.error || `Error ${resp.status}`);
      }
      if (!resp.body) throw new Error("No response body");

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";

      const upsertAssistant = (chunk: string) => {
        assistantSoFar += chunk;
        setMessages((prev) => {
          const last = prev[prev.length - 1];
          if (last?.role === "assistant" && prev.length === updatedMessages.length + 1) {
            return prev.map((m, i) => (i === prev.length - 1 ? { ...m, content: assistantSoFar } : m));
          }
          return [...prev, { role: "assistant", content: assistantSoFar }];
        });
      };

      let streamDone = false;
      while (!streamDone) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });
        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") { streamDone = true; break; }
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) upsertAssistant(content);
          } catch {
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }

      if (assistantSoFar) {
        await supabase.from("ai_chat_history").insert({
          user_id: user.id, message: assistantSoFar, sender: "bot",
        } as any);
      }
    } catch (e: any) {
      toast({ title: "AI Error", description: e.message, variant: "destructive" });
      setMessages((prev) => [...prev, { role: "assistant", content: "I'm having trouble right now. Try again in a moment! 🌿" }]);
    } finally {
      setLoading(false);
    }
  };

  const showSuggestions = messages.length <= 1 && !loading;

  return (
    <AppLayout>
      <div className="flex flex-col h-[calc(100vh-5rem)] md:h-screen max-w-2xl mx-auto w-full">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 md:p-5 border-b border-border flex items-center gap-3 flex-shrink-0"
        >
          <motion.div
            className="w-10 h-10 rounded-xl gradient-ai flex items-center justify-center flex-shrink-0"
            animate={{ rotate: [0, 5, -5, 0] }}
            transition={{ repeat: Infinity, duration: 4 }}
          >
            <Sparkles className="w-5 h-5 text-ai-foreground" />
          </motion.div>
          <div className="flex-1">
            <h1 className="text-base md:text-lg font-semibold text-foreground">Fitzen Buddy</h1>
            <p className="text-[10px] text-muted-foreground">Your personal health companion 🌿</p>
          </div>
          <motion.div whileTap={{ scale: 0.9 }}>
            <Button
              variant="ghost"
              size="icon"
              onClick={clearChat}
              className="text-muted-foreground hover:text-destructive"
              title="Clear chat"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </motion.div>
        </motion.div>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 md:p-5 space-y-4">
          <AnimatePresence>
            {messages.map((m, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
                className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <motion.div
                  className={`max-w-[85%] md:max-w-[80%] px-4 py-3 rounded-2xl text-sm ${
                    m.role === "user"
                      ? "gradient-primary text-primary-foreground rounded-tr-md"
                      : "bg-secondary text-foreground rounded-tl-md"
                  }`}
                >
                  {m.role === "assistant" ? (
                    <div className="prose prose-sm max-w-none dark:prose-invert [&>p]:my-1 [&>ul]:my-1 [&>p]:text-foreground">
                      <ReactMarkdown>{m.content}</ReactMarkdown>
                    </div>
                  ) : m.content}
                </motion.div>
              </motion.div>
            ))}
          </AnimatePresence>

          {loading && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
              <div className="bg-secondary rounded-2xl rounded-tl-md px-4 py-3 flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Thinking...</span>
              </div>
            </motion.div>
          )}

          {/* Suggestion chips — only on initial chat */}
          <AnimatePresence>
            {showSuggestions && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="space-y-2"
              >
                <p className="text-xs text-muted-foreground text-center">Quick questions 👇</p>
                <div className="flex flex-wrap gap-2 justify-center">
                  {suggestions.map((s) => (
                    <motion.button
                      key={s}
                      whileHover={{ scale: 1.04 }}
                      whileTap={{ scale: 0.96 }}
                      onClick={() => handleSend(s)}
                      className="flex items-center gap-1 px-3 py-2 rounded-full bg-secondary border border-border text-xs text-foreground hover:bg-primary/10 hover:border-primary transition-all"
                    >
                      {s}
                      <ChevronRight className="w-3 h-3 text-muted-foreground" />
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Input */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-3 md:p-4 border-t border-border flex-shrink-0"
        >
          <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask anything about diet, cravings, meals..."
              className="flex-1 text-sm"
              disabled={loading}
            />
            <motion.div whileTap={{ scale: 0.9 }}>
              <Button type="submit" size="icon" disabled={loading || !input.trim()} className="gradient-primary text-primary-foreground flex-shrink-0">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </Button>
            </motion.div>
          </form>
          <p className="text-[10px] text-muted-foreground text-center mt-2">
            ⚕️ Not a replacement for medical advice
          </p>
        </motion.div>
      </div>
    </AppLayout>
  );
};

export default ChatPage;
