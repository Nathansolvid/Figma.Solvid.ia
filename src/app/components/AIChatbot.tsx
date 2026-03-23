/**
 * AIChatbot — Assistant IA ESG flottant, accessible depuis toutes les vues
 * Utilise l'API Anthropic Claude pour fournir des réponses contextuelles ESG
 * Bouton flottant en bas à droite → panneau de chat latéral
 */
import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/app/components/ui/button";
import { Badge } from "@/app/components/ui/badge";
import {
  MessageCircle,
  X,
  Send,
  Loader2,
  Sparkles,
  Trash2,
  Bot,
  User,
  AlertCircle,
  ChevronDown,
} from "lucide-react";
import { cn } from "@/app/components/ui/utils";
import { getStoredApiKey } from "@/services/aiQualitativeService";

// ─── Types ────────────────────────────────────────────────────────────────────
interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface AIChatbotProps {
  /** Contexte ESG optionnel à injecter dans chaque requête */
  context?: {
    currentView?: string;
    dossierName?: string;
    dossierOrg?: string;
    fiscalYear?: string;
    filledIndicators?: number;
    totalIndicators?: number;
    completionPct?: number;
  };
}

// ─── System prompt ────────────────────────────────────────────────────────────
const CHATBOT_SYSTEM_PROMPT = `Tu es l'Assistant IA de Solvid.IA, une plateforme SaaS de reporting ESG pour les PME françaises.
Tu es un expert ESG senior spécialisé dans les normes CSRD, ESRS, VSME et les standards EFRAG.

Ton rôle :
- Aider les utilisateurs à comprendre les exigences de reporting ESG
- Expliquer les indicateurs VSME (Module B, B1-B11) et leur signification
- Guider dans la collecte de données ESG (environnement, social, gouvernance)
- Répondre aux questions sur la réglementation CSRD et les standards ESRS
- Fournir des conseils méthodologiques pour le reporting de durabilité
- Aider à interpréter les résultats et identifier les axes d'amélioration

Règles :
- Réponds TOUJOURS en français
- Sois concis et pratique (pas de longues théories)
- Utilise des exemples concrets adaptés aux PME françaises
- Si tu ne sais pas, dis-le honnêtement
- Utilise la syntaxe Markdown légère (gras, listes) pour structurer tes réponses
- Garde un ton professionnel mais accessible`;

// ─── Suggestions de questions ─────────────────────────────────────────────────
const SUGGESTIONS = [
  "Qu'est-ce que le VSME Module B ?",
  "Comment calculer mes émissions GES Scope 1 ?",
  "Quelles sont les preuves requises pour la CSRD ?",
  "Comment remplir l'indicateur B3.1 (énergie) ?",
];

// ─── Component ────────────────────────────────────────────────────────────────
export function AIChatbot({ context }: AIChatbotProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // Auto-scroll vers le bas
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Focus sur l'input quand le panel s'ouvre
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen]);

  // Envoyer un message
  const sendMessage = async (text?: string) => {
    const messageText = text ?? input.trim();
    if (!messageText || isLoading) return;

    const apiKey = getStoredApiKey();
    if (!apiKey) {
      setError("Clé API Anthropic non configurée. Allez dans Réglages → IA pour la renseigner.");
      return;
    }

    setError(null);
    setInput("");

    // Ajouter le message user
    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: messageText,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      // Construire le contexte ESG
      let contextInfo = "";
      if (context) {
        const parts: string[] = [];
        if (context.currentView) parts.push(`Vue actuelle : ${context.currentView}`);
        if (context.dossierName) parts.push(`Dossier : ${context.dossierName}`);
        if (context.dossierOrg) parts.push(`Organisation : ${context.dossierOrg}`);
        if (context.fiscalYear) parts.push(`Exercice : ${context.fiscalYear}`);
        if (context.filledIndicators !== undefined && context.totalIndicators !== undefined) {
          parts.push(`Progression : ${context.filledIndicators}/${context.totalIndicators} indicateurs (${context.completionPct ?? 0}%)`);
        }
        if (parts.length > 0) {
          contextInfo = `\n\n[Contexte utilisateur : ${parts.join(" · ")}]`;
        }
      }

      // Historique des messages pour le contexte conversationnel
      const apiMessages = [
        ...messages.map(m => ({
          role: m.role as "user" | "assistant",
          content: m.content,
        })),
        {
          role: "user" as const,
          content: messageText + contextInfo,
        },
      ];

      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
          "anthropic-dangerous-direct-browser-access": "true",
        },
        body: JSON.stringify({
          model: "claude-3-5-haiku-20241022",
          max_tokens: 1024,
          system: CHATBOT_SYSTEM_PROMPT,
          messages: apiMessages,
        }),
      });

      if (!response.ok) {
        let errMsg = `Erreur HTTP ${response.status}`;
        try {
          const err = await response.json();
          errMsg = (err as { error?: { message?: string } })?.error?.message ?? errMsg;
        } catch { /* ignore */ }
        throw new Error(errMsg);
      }

      const data = await response.json() as { content?: Array<{ text?: string }> };
      const assistantText = (data.content?.[0]?.text ?? "").trim();

      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: assistantText || "Je n'ai pas pu générer de réponse. Veuillez réessayer.",
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, assistantMessage]);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Erreur inconnue";
      setError(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  // Gérer Entrée pour envoyer (Shift+Entrée pour nouvelle ligne)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Effacer l'historique
  const clearHistory = () => {
    setMessages([]);
    setError(null);
  };

  // Formater le texte markdown simplifié
  const formatMarkdown = (text: string) => {
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/^- (.*)/gm, '• $1')
      .replace(/^(\d+)\. (.*)/gm, '$1. $2')
      .replace(/\n/g, '<br/>');
  };

  return (
    <>
      {/* ── Bouton flottant ── */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full shadow-lg transition-all duration-300",
          "flex items-center justify-center",
          "hover:scale-110 active:scale-95",
          isOpen
            ? "bg-gray-700 text-white rotate-0"
            : "bg-[#0F4C3A] text-white hover:bg-[#0A3B2E]"
        )}
        title="Assistant IA ESG"
      >
        {isOpen ? (
          <X className="w-6 h-6" />
        ) : (
          <div className="relative">
            <MessageCircle className="w-6 h-6" />
            <Sparkles className="w-3 h-3 absolute -top-1 -right-1 text-amber-300" />
          </div>
        )}
      </button>

      {/* Notification badge si fermé et messages non lus */}
      {!isOpen && messages.length > 0 && (
        <span className="fixed bottom-[72px] right-6 z-50 bg-amber-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center pointer-events-none">
          {messages.filter(m => m.role === "assistant").length}
        </span>
      )}

      {/* ── Panneau de chat ── */}
      <div
        ref={panelRef}
        className={cn(
          "fixed bottom-24 right-6 z-50 w-[400px] transition-all duration-300 origin-bottom-right",
          "bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden flex flex-col",
          isOpen
            ? "opacity-100 scale-100 translate-y-0 pointer-events-auto"
            : "opacity-0 scale-95 translate-y-4 pointer-events-none"
        )}
        style={{ maxHeight: "min(600px, calc(100vh - 140px))" }}
      >
        {/* Header */}
        <div className="bg-[#0F4C3A] text-white px-4 py-3 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="bg-white/20 p-1.5 rounded-lg">
              <Bot className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-sm leading-tight">Assistant IA ESG</h3>
              <p className="text-[10px] text-white/70">
                Powered by Claude · Solvid.IA
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {messages.length > 0 && (
              <button
                onClick={clearHistory}
                className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
                title="Effacer l'historique"
              >
                <Trash2 className="w-3.5 h-3.5 text-white/70" />
              </button>
            )}
            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
            >
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4" style={{ minHeight: "300px" }}>
          {/* Message d'accueil */}
          {messages.length === 0 && (
            <div className="text-center py-6 space-y-4">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-[#E8F3F0]">
                <Sparkles className="w-6 h-6 text-[#0F4C3A]" />
              </div>
              <div>
                <h4 className="font-semibold text-sm mb-1">Bonjour ! 👋</h4>
                <p className="text-xs text-muted-foreground leading-relaxed max-w-[280px] mx-auto">
                  Je suis votre assistant ESG. Posez-moi vos questions sur le reporting CSRD, VSME, ou la collecte de données ESG.
                </p>
              </div>
              {/* Suggestions */}
              <div className="space-y-2">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium">
                  Suggestions
                </p>
                <div className="flex flex-wrap gap-1.5 justify-center">
                  {SUGGESTIONS.map((q, i) => (
                    <button
                      key={i}
                      onClick={() => sendMessage(q)}
                      className="text-[11px] px-2.5 py-1.5 rounded-full border border-[#0F4C3A]/20 text-[#0F4C3A] hover:bg-[#E8F3F0] transition-colors text-left"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Messages de la conversation */}
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={cn(
                "flex gap-2.5",
                msg.role === "user" ? "justify-end" : "justify-start"
              )}
            >
              {/* Avatar assistant */}
              {msg.role === "assistant" && (
                <div className="w-7 h-7 rounded-full bg-[#E8F3F0] flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Bot className="w-3.5 h-3.5 text-[#0F4C3A]" />
                </div>
              )}

              {/* Bulle message */}
              <div
                className={cn(
                  "max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed",
                  msg.role === "user"
                    ? "bg-[#0F4C3A] text-white rounded-br-md"
                    : "bg-gray-100 text-gray-800 rounded-bl-md"
                )}
              >
                {msg.role === "assistant" ? (
                  <div
                    className="prose prose-sm max-w-none [&_br]:mb-1 [&_strong]:font-semibold"
                    dangerouslySetInnerHTML={{ __html: formatMarkdown(msg.content) }}
                  />
                ) : (
                  <p>{msg.content}</p>
                )}
                <p
                  className={cn(
                    "text-[10px] mt-1.5",
                    msg.role === "user" ? "text-white/50" : "text-gray-400"
                  )}
                >
                  {msg.timestamp.toLocaleTimeString("fr-FR", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>

              {/* Avatar user */}
              {msg.role === "user" && (
                <div className="w-7 h-7 rounded-full bg-[#0F4C3A]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <User className="w-3.5 h-3.5 text-[#0F4C3A]" />
                </div>
              )}
            </div>
          ))}

          {/* Loading indicator */}
          {isLoading && (
            <div className="flex items-start gap-2.5">
              <div className="w-7 h-7 rounded-full bg-[#E8F3F0] flex items-center justify-center flex-shrink-0">
                <Bot className="w-3.5 h-3.5 text-[#0F4C3A]" />
              </div>
              <div className="bg-gray-100 rounded-2xl rounded-bl-md px-4 py-3">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-[#0F4C3A]/40 animate-bounce" style={{ animationDelay: "0ms" }} />
                  <div className="w-2 h-2 rounded-full bg-[#0F4C3A]/40 animate-bounce" style={{ animationDelay: "150ms" }} />
                  <div className="w-2 h-2 rounded-full bg-[#0F4C3A]/40 animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="flex items-start gap-2 bg-red-50 rounded-lg p-3 border border-red-200">
              <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs text-red-700 font-medium">Erreur</p>
                <p className="text-[11px] text-red-600 mt-0.5">{error}</p>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input area */}
        <div className="border-t p-3 flex-shrink-0 bg-gray-50/50">
          <div className="flex items-end gap-2">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Posez votre question ESG…"
              className="flex-1 text-sm resize-none rounded-xl border border-gray-200 bg-white px-3 py-2.5 outline-none focus:border-[#0F4C3A] focus:ring-1 focus:ring-[#0F4C3A]/20 transition-all"
              rows={1}
              style={{ minHeight: "40px", maxHeight: "100px" }}
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement;
                target.style.height = "40px";
                target.style.height = Math.min(target.scrollHeight, 100) + "px";
              }}
            />
            <Button
              size="sm"
              className={cn(
                "h-10 w-10 rounded-xl flex-shrink-0 transition-all",
                input.trim()
                  ? "bg-[#0F4C3A] hover:bg-[#0A3B2E] text-white"
                  : "bg-gray-200 text-gray-400 cursor-not-allowed"
              )}
              disabled={!input.trim() || isLoading}
              onClick={() => sendMessage()}
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </div>
          <p className="text-[10px] text-muted-foreground mt-1.5 text-center">
            Claude 3.5 Haiku · Les réponses sont indicatives
          </p>
        </div>
      </div>
    </>
  );
}
