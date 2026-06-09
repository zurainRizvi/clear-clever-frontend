import type { LucideIcon } from "lucide-react";
import { ArrowRight, CheckCheck, Loader2, Paperclip, Send, Sparkles, X } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";
import { easeOut, quickTransition, staggerDelay } from "@/lib/motion-presets";
import { cn } from "../ui/utils";

export function formatChatTime(date: Date): string {
  return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

export function ClaimChatHero() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: easeOut }}
      className="relative overflow-hidden rounded-2xl mx-1 mb-1"
    >
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage:
            "linear-gradient(135deg, rgba(15,23,42,0.72) 0%, rgba(37,99,235,0.55) 50%, rgba(6,182,212,0.4) 100%), url('data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22400%22 height=%22160%22%3E%3Cdefs%3E%3ClinearGradient id=%22g%22 x1=%220%25%22 y1=%220%25%22 x2=%22100%25%22 y2=%22100%25%22%3E%3Cstop offset=%220%25%22 stop-color=%22%232563EB%22 stop-opacity=%220.15%22/%3E%3Cstop offset=%22100%25%22 stop-color=%22%2306B6D4%22 stop-opacity=%220.1%22/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect fill=%22url(%23g)%22 width=%22400%22 height=%22160%22/%3E%3C/svg%3E')",
        }}
        aria-hidden
      />
      <div className="relative px-5 py-6 sm:py-7">
        <p className="text-white/80 text-xs font-semibold uppercase tracking-widest mb-1">
          ClearClever Claims
        </p>
        <h2 className="text-white font-bold text-xl sm:text-2xl tracking-tight leading-tight">
          Welcome to your claims assistant
        </h2>
        <p className="text-white/85 text-sm mt-2 max-w-md leading-relaxed">
          I can help you file a claim, upload evidence, and generate an AI intelligence report
          before you submit to your insurer.
        </p>
      </div>
    </motion.div>
  );
}

export function ClaimBotAvatar({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm",
        className
      )}
      aria-hidden
    >
      <Sparkles className="h-4 w-4" />
    </div>
  );
}

export function ClaimBotRow({
  children,
  delay = 0,
  timestamp,
}: {
  children: ReactNode;
  delay?: number;
  timestamp?: Date;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...quickTransition, delay }}
      className="flex gap-3 max-w-full"
    >
      <ClaimBotAvatar className="mt-1" />
      <div className="min-w-0 flex-1 space-y-1">
        {children}
        {timestamp ? (
          <p className="text-[11px] text-muted-foreground pl-1">{formatChatTime(timestamp)}</p>
        ) : null}
      </div>
    </motion.div>
  );
}

export function ClaimBotBubble({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl rounded-tl-md border border-border/60 bg-muted/50 px-4 py-3.5 text-[15px] leading-relaxed text-foreground shadow-sm",
        className
      )}
    >
      {children}
    </div>
  );
}

export function ClaimUserBubble({
  children,
  timestamp,
}: {
  children: ReactNode;
  timestamp?: Date;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={quickTransition}
      className="flex flex-col items-end gap-1"
    >
      <div className="max-w-[88%] rounded-2xl rounded-tr-md bg-primary px-4 py-3 text-[15px] font-medium text-primary-foreground shadow-sm">
        {children}
      </div>
      {timestamp ? (
        <div className="flex items-center gap-1 text-[11px] text-muted-foreground pr-1">
          <span>{formatChatTime(timestamp)}</span>
          <CheckCheck className="h-3.5 w-3.5 text-primary" />
        </div>
      ) : null}
    </motion.div>
  );
}

export function ClaimQuickReplies({
  options,
  onSelect,
  disabled,
}: {
  options: { id: string; label: string; icon?: LucideIcon }[];
  onSelect: (id: string) => void;
  disabled?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...quickTransition, delay: 0.08 }}
      className="flex flex-wrap gap-2 pl-12"
    >
      {options.map((option) => {
        const Icon = option.icon;
        return (
          <motion.button
            key={option.id}
            type="button"
            disabled={disabled}
            onClick={() => onSelect(option.id)}
            whileHover={disabled ? undefined : { scale: 1.02 }}
            whileTap={disabled ? undefined : { scale: 0.98 }}
            className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2.5 text-sm font-medium text-foreground shadow-sm hover:bg-accent transition-colors disabled:opacity-50"
          >
            {Icon ? <Icon className="h-4 w-4 text-primary shrink-0" /> : null}
            {option.label}
          </motion.button>
        );
      })}
    </motion.div>
  );
}

export interface ClaimRichCardData {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  gradient: string;
  accent: string;
  actionLabel?: string;
  onAction?: () => void;
  status?: "default" | "success" | "warning";
  detail?: string;
}

export function ClaimRichCard({
  card,
  index = 0,
}: {
  card: ClaimRichCardData;
  index?: number;
}) {
  const reducedMotion = useReducedMotion();
  const Icon = card.icon;
  const statusRing =
    card.status === "success"
      ? "ring-success/40 text-success"
      : card.status === "warning"
        ? "ring-warning/40 text-warning"
        : "ring-primary/30 text-primary";

  return (
    <motion.article
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...quickTransition, delay: staggerDelay(index, !!reducedMotion, 0.06) }}
      whileHover={reducedMotion ? undefined : { y: -4, transition: { type: "spring", stiffness: 400, damping: 28 } }}
      className="group flex w-full max-w-[220px] sm:w-[220px] shrink-0 flex-col overflow-hidden rounded-2xl border border-border/80 bg-card shadow-md hover:shadow-lg transition-shadow"
    >
      <div className={cn("relative h-28 overflow-hidden", card.gradient)}>
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" aria-hidden />
        <div className="absolute bottom-3 left-3 flex h-9 w-9 items-center justify-center rounded-full bg-card/95 ring-2 shadow-sm backdrop-blur-sm">
          <Icon className={cn("h-4 w-4", statusRing.split(" ")[1])} />
        </div>
      </div>
      <div className="flex flex-1 flex-col p-4">
        <h4 className="font-semibold text-[15px] tracking-tight leading-snug">{card.title}</h4>
        <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed line-clamp-3 flex-1">
          {card.description}
        </p>
        {card.detail ? (
          <p className="mt-2 text-xs font-medium text-foreground/80">{card.detail}</p>
        ) : null}
        {card.actionLabel && card.onAction ? (
          <button
            type="button"
            onClick={card.onAction}
            className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
          >
            {card.actionLabel}
            <ArrowRight className="h-3 w-3" />
          </button>
        ) : null}
      </div>
    </motion.article>
  );
}

export function ClaimRichCardRow({
  cards,
  label,
}: {
  cards: ClaimRichCardData[];
  label?: string;
}) {
  if (cards.length === 0) return null;

  return (
    <div className="space-y-2 w-full">
      {label ? <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground pl-1">{label}</p> : null}
      <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 snap-x snap-mandatory scrollbar-thin">
        {cards.map((card, index) => (
          <div key={card.id} className="snap-start">
            <ClaimRichCard card={card} index={index} />
          </div>
        ))}
      </div>
    </div>
  );
}

export function ClaimTypingIndicator({ label = "Analyzing your evidence…" }: { label?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex gap-3 items-center text-muted-foreground text-sm pl-1"
    >
      <Loader2 className="h-4 w-4 animate-spin text-primary" />
      <span>{label}</span>
    </motion.div>
  );
}

export function ClaimInlinePanel({
  children,
  title,
}: {
  children: ReactNode;
  title?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={quickTransition}
      className="rounded-2xl rounded-tl-md border border-border/70 bg-card shadow-md overflow-hidden"
    >
      {title ? (
        <div className="px-4 py-3 border-b border-border/50 bg-muted/30">
          <p className="text-sm font-semibold">{title}</p>
        </div>
      ) : null}
      <div className="p-4">{children}</div>
    </motion.div>
  );
}

export function ClaimFileChip({
  name,
  previewUrl,
  onRemove,
}: {
  name: string;
  previewUrl?: string;
  onRemove: () => void;
}) {
  return (
    <motion.span
      layout
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.92 }}
      transition={quickTransition}
      className="inline-flex items-center gap-2 rounded-xl border border-border bg-muted/50 px-2 py-1.5 text-xs text-foreground"
    >
      {previewUrl ? (
        <img src={previewUrl} alt="" className="h-8 w-8 rounded-lg object-cover" />
      ) : (
        <Paperclip className="h-4 w-4 text-primary" />
      )}
      <span className="max-w-[120px] truncate">{name}</span>
      <button
        type="button"
        onClick={onRemove}
        className="text-muted-foreground hover:text-foreground transition-colors"
        aria-label={`Remove ${name}`}
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </motion.span>
  );
}

export function ClaimInputBar({
  value,
  onChange,
  onSubmit,
  onAttach,
  placeholder = "Describe what happened…",
  disabled,
  submitting,
  attachDisabled,
  maxLength = 4000,
  showSend = true,
  showInput = true,
}: {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onAttach?: () => void;
  placeholder?: string;
  disabled?: boolean;
  submitting?: boolean;
  attachDisabled?: boolean;
  maxLength?: number;
  showSend?: boolean;
  showInput?: boolean;
}) {
  return (
    <form
      className="shrink-0 border-t border-border bg-card px-4 pt-3 pb-4"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
    >
      <div className="flex items-end gap-2 rounded-2xl border border-border bg-muted/30 px-3 py-2 shadow-sm">
        <Sparkles className="h-4 w-4 text-primary shrink-0 mb-3 ml-0.5" aria-hidden />
        {showInput ? (
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            disabled={disabled || submitting}
            rows={1}
            maxLength={maxLength}
            className="flex-1 min-w-0 resize-none bg-transparent border-0 text-[15px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-0 py-2.5 min-h-[44px] max-h-32"
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                onSubmit();
              }
            }}
          />
        ) : (
          <p className="flex-1 py-2.5 text-sm text-muted-foreground">{placeholder}</p>
        )}
        {onAttach ? (
          <button
            type="button"
            onClick={onAttach}
            disabled={disabled || attachDisabled}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border bg-card text-primary hover:bg-accent disabled:opacity-50 mb-0.5"
            aria-label="Attach files"
          >
            <Paperclip className="h-4 w-4" />
          </button>
        ) : null}
        {showSend ? (
          <motion.button
            type="submit"
            disabled={disabled || submitting || !value.trim()}
            whileHover={!disabled && value.trim() ? { scale: 1.04 } : undefined}
            whileTap={!disabled && value.trim() ? { scale: 0.96 } : undefined}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-40 mb-0.5"
            aria-label="Send"
          >
            {submitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </motion.button>
        ) : null}
      </div>
    </form>
  );
}

export function ClaimStepFade({ show, children }: { show: boolean; children: ReactNode }) {
  return (
    <AnimatePresence mode="wait">
      {show ? (
        <motion.div
          key="step"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          transition={quickTransition}
        >
          {children}
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
