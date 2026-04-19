"use client";

import { useEffect, useRef, useState } from "react";
import {
  Archive,
  Bookmark,
  ChevronDown,
  ChevronUp,
  Clock3,
  Mail,
  MessageCircleMore,
  MessageSquare,
  MoreHorizontal,
  NotebookPen,
  Paperclip,
  PanelLeftClose,
  PanelRightClose,
  Plus,
  Search,
  SendHorizontal,
  Smile,
  Star,
  Zap,
} from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Panel, buttonClasses, cn } from "@/components/ui";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Textarea } from "@/components/ui/textarea";
import {
  conversationInboxFixture,
  type ConversationInboxFixture,
  type ConversationListItem,
  type ConversationMessage,
} from "@/lib/conversations-inbox-fixture";

function useScrollAffordances<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [canScrollUp, setCanScrollUp] = useState(false);
  const [canScrollDown, setCanScrollDown] = useState(false);

  useEffect(() => {
    if (!ref.current) {
      return;
    }

    function updateScrollAffordances() {
      const element = ref.current;
      if (!element) {
        return;
      }

      setCanScrollUp(element.scrollTop > 2);
      setCanScrollDown(
        element.scrollTop + element.clientHeight < element.scrollHeight - 2,
      );
    }

    updateScrollAffordances();
    const element = ref.current;
    if (!element) {
      return;
    }

    element.addEventListener("scroll", updateScrollAffordances, {
      passive: true,
    });
    window.addEventListener("resize", updateScrollAffordances);

    const resizeObserver =
      typeof ResizeObserver === "undefined"
        ? null
        : new ResizeObserver(() => {
            updateScrollAffordances();
          });
    resizeObserver?.observe(element);

    return () => {
      element.removeEventListener("scroll", updateScrollAffordances);
      window.removeEventListener("resize", updateScrollAffordances);
      resizeObserver?.disconnect();
    };
  }, []);

  return { ref, canScrollUp, canScrollDown };
}

function getUnreadIncomingMessageIds(conversation: ConversationListItem) {
  if (conversation.unreadCount <= 0) {
    return [];
  }

  return conversation.thread.messages
    .filter((message) => message.author !== "agent")
    .slice(-conversation.unreadCount)
    .map((message) => message.id);
}

type ComposerMode = "reply" | "sms" | "email" | "internalNote";
type SendSnoozeOption = {
  label: string;
  icon?: typeof Clock3;
  shortcuts?: string[];
};

const composerModeOptions: Array<{
  value: ComposerMode;
  label: string;
  icon: typeof MessageSquare;
}> = [
  { value: "reply", label: "Reply", icon: MessageSquare },
  { value: "sms", label: "SMS", icon: MessageCircleMore },
  { value: "email", label: "Email", icon: Mail },
  { value: "internalNote", label: "Internal note", icon: NotebookPen },
];

const sendShortcutBadgeClassName =
  "inline-flex items-center rounded-md border border-[color-mix(in_srgb,var(--line)_82%,white)] px-2 py-1 text-[11px] leading-none text-[var(--ink-muted)]";

const sendShortcutSymbols: Record<string, string> = {
  Cmd: "⌘",
  Shift: "⇧",
  Option: "⌥",
  Enter: "↵",
};

const sendSnoozeOptions: SendSnoozeOption[] = [
  { label: "Later today", icon: Clock3 },
  { label: "Tomorrow", shortcuts: ["Cmd", "Enter"] },
  { label: "Monday" },
  { label: "One week" },
  { label: "One month" },
  { label: "Custom" },
];

const threadBottomPinThreshold = 40;

export function ConversationsInboxPage({
  fixture = conversationInboxFixture,
}: Readonly<{
  fixture?: ConversationInboxFixture;
}>) {
  const prefersReducedMotion = useReducedMotion() ?? false;
  const [selectedConversationId, setSelectedConversationId] = useState(
    fixture.conversations[0]?.id ?? "",
  );
  const [draftReply, setDraftReply] = useState(
    fixture.conversations[0]?.copilot.suggestedReply ?? "",
  );
  const [inboxOpen, setInboxOpen] = useState(true);
  const [sentMessagesByConversationId, setSentMessagesByConversationId] =
    useState<Record<string, ConversationMessage[]>>({});
  const [pendingSentMessage, setPendingSentMessage] = useState<{
    conversationId: string;
    messageId: string;
  } | null>(null);
  const [seenConversationIds, setSeenConversationIds] = useState<
    Record<string, boolean>
  >({});

  const conversations = fixture.conversations.map((conversation) => ({
    ...conversation,
    preview:
      sentMessagesByConversationId[conversation.id]?.at(-1)?.body ??
      conversation.preview,
    updatedAtLabel:
      sentMessagesByConversationId[conversation.id]?.at(-1)?.timeLabel ??
      conversation.updatedAtLabel,
    unreadCount: seenConversationIds[conversation.id]
      ? 0
      : conversation.unreadCount,
    thread: {
      ...conversation.thread,
      messages: [
        ...conversation.thread.messages,
        ...(sentMessagesByConversationId[conversation.id] ?? []),
      ],
    },
  }));

  const selectedConversation =
    conversations.find(
      (conversation) => conversation.id === selectedConversationId,
    ) ?? conversations[0];

  useEffect(() => {
    const conversationFromFixture = fixture.conversations.find(
      (conversation) => conversation.id === selectedConversationId,
    );

    if (conversationFromFixture) {
      setDraftReply(conversationFromFixture.copilot.suggestedReply);
    }
  }, [fixture.conversations, selectedConversationId]);

  useEffect(() => {
    window.dispatchEvent(
      new CustomEvent("kookly:conversations-rail-hidden", {
        detail: { hidden: !inboxOpen },
      }),
    );

    return () => {
      window.dispatchEvent(
        new CustomEvent("kookly:conversations-rail-hidden", {
          detail: { hidden: false },
        }),
      );
    };
  }, [inboxOpen]);

  function handleSendMessage(
    conversation: ConversationListItem,
    body: string,
    composerMode: ComposerMode,
  ) {
    const normalizedBody = body.trim();
    if (!normalizedBody) {
      return;
    }

    const messageId = `${conversation.id}-${Date.now()}`;
    const sentMessage: ConversationMessage = {
      id: messageId,
      author: composerMode === "internalNote" ? "system" : "agent",
      senderName:
        composerMode === "internalNote"
          ? "Kookly"
          : conversation.customer.assignee,
      body: normalizedBody,
      timeLabel: "Just now",
      metaLabel:
        composerMode === "reply"
          ? undefined
          : composerMode === "internalNote"
            ? "Internal note"
            : composerMode === "sms"
              ? "SMS sent"
              : "Email sent",
      type: composerMode === "internalNote" ? "note" : "text",
    };

    setSentMessagesByConversationId((current) => ({
      ...current,
      [conversation.id]: [...(current[conversation.id] ?? []), sentMessage],
    }));
    setPendingSentMessage({
      conversationId: conversation.id,
      messageId,
    });
    setDraftReply("");
  }

  if (!selectedConversation) {
    return (
      <Panel className="rounded-[32px] border-dashed bg-white/70">
        <p className="text-sm text-[var(--ink-muted)]">
          No conversations to show yet.
        </p>
      </Panel>
    );
  }

  return (
    <div className="flex h-full flex-col gap-1 isolate lg:min-h-[44rem] lg:flex-row">
      <AnimatePresence initial={false}>
        {inboxOpen ? (
          <motion.div
            key="inbox-rail"
            initial={
              prefersReducedMotion ? { opacity: 0 } : { width: 0, opacity: 0 }
            }
            animate={
              prefersReducedMotion
                ? { opacity: 1 }
                : { width: "20rem", opacity: 1 }
            }
            exit={
              prefersReducedMotion ? { opacity: 0 } : { width: 0, opacity: 0 }
            }
            transition={{
              duration: prefersReducedMotion ? 0.12 : 0.26,
              ease: [0.22, 1, 0.36, 1],
            }}
            className="min-h-0 shrink-0 overflow-hidden xl:w-[22rem]"
          >
            <InboxRail
              conversations={conversations}
              selectedConversationId={selectedConversation.id}
              onSelectConversation={setSelectedConversationId}
              onToggleInbox={() => setInboxOpen(false)}
            />
          </motion.div>
        ) : (
          <motion.div
            key="inbox-rail-gap"
            initial={prefersReducedMotion ? { opacity: 0 } : { width: 0, opacity: 0 }}
            animate={prefersReducedMotion ? { opacity: 1 } : { width: 0, opacity: 1 }}
            exit={prefersReducedMotion ? { opacity: 0 } : { width: 0, opacity: 0 }}
            transition={{
              duration: prefersReducedMotion ? 0.12 : 0.26,
              ease: [0.22, 1, 0.36, 1],
            }}
            className="hidden shrink-0 lg:block"
            aria-hidden="true"
          />
        )}
      </AnimatePresence>
      <motion.div layout className="min-h-0 min-w-0 flex-1">
        <ConversationThread
          conversation={selectedConversation}
          draftReply={draftReply}
          onDraftReplyChange={setDraftReply}
          onSendMessage={handleSendMessage}
          inboxOpen={inboxOpen}
          onToggleInbox={() => setInboxOpen((open) => !open)}
          unreadIncomingMessageIds={getUnreadIncomingMessageIds(
            selectedConversation,
          )}
          pendingSentMessageId={
            pendingSentMessage?.conversationId === selectedConversation.id
              ? pendingSentMessage.messageId
              : null
          }
          onPendingSentMessageHandled={() => setPendingSentMessage(null)}
          onMarkConversationSeen={() =>
            setSeenConversationIds((current) =>
              current[selectedConversation.id]
                ? current
                : {
                    ...current,
                    [selectedConversation.id]: true,
                  },
            )
          }
        />
      </motion.div>
    </div>
  );
}

function InboxRail({
  conversations,
  selectedConversationId,
  onSelectConversation,
  onToggleInbox,
}: Readonly<{
  conversations: ConversationListItem[];
  selectedConversationId: string;
  onSelectConversation: (conversationId: string) => void;
  onToggleInbox: () => void;
}>) {
  const inboxScroll = useScrollAffordances<HTMLDivElement>();

  return (
    <Panel className="flex h-full min-h-[24rem] flex-col overflow-hidden rounded-tl-none rounded-bl-none rounded-tr-lg rounded-br-none border-[color-mix(in_srgb,var(--line)_80%,white)] bg-[color-mix(in_srgb,var(--panel)_94%,white)] p-0 isolate [contain:paint] shadow-[0_24px_60px_-34px_color-mix(in_srgb,var(--panel-ink)_28%,transparent)]">
      <div className="border-b border-[color-mix(in_srgb,var(--panel-ink)_14%,white)] pl-5 pr-2 py-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="inline-flex h-5 w-5 items-center justify-center text-[var(--ink-muted)] transition duration-200 ease-out hover:text-[var(--panel-ink)]"
              aria-label="Hide conversation list"
              onClick={onToggleInbox}
            >
              <PanelLeftClose className="size-4" />
            </button>
            <p className="font-[family-name:var(--font-dashboard-display)] text-[1.35rem] font-semibold tracking-[-0.04em] text-[var(--panel-ink)]">
              Inbox
            </p>
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              className={iconButtonClassName}
              aria-label="Search conversations"
            >
              <Search className="size-4" />
            </button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className={iconButtonClassName}
                  aria-label="Create conversation"
                >
                  <Plus className="size-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                side="bottom"
                sideOffset={8}
                className="w-52 rounded-xl p-1.5"
              >
                <DropdownMenuItem className="gap-2 rounded-lg px-3 py-2.5">
                  <Mail className="size-4 text-[var(--panel-ink)]" />
                  <span className="text-sm text-[var(--panel-ink)]">
                    New Email
                  </span>
                </DropdownMenuItem>
                <DropdownMenuItem className="gap-2 rounded-lg px-3 py-2.5">
                  <MessageCircleMore className="size-4 text-[var(--panel-ink)]" />
                  <span className="text-sm text-[var(--panel-ink)]">
                    New chat
                  </span>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="my-1.5" />
                <DropdownMenuItem className="gap-2 rounded-lg px-3 py-2.5">
                  <MessageSquare className="size-4 text-[var(--panel-ink)]" />
                  <span className="text-sm text-[var(--panel-ink)]">
                    Test preview chat
                  </span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      <div className="relative min-h-0 flex-1 overflow-hidden">
        <div
          className={cn(
            "pointer-events-none absolute inset-x-0 top-0 z-10 h-6 bg-gradient-to-b from-[color-mix(in_srgb,var(--panel)_98%,white)] via-[color-mix(in_srgb,var(--panel)_88%,transparent)] to-transparent transition-opacity duration-200",
            inboxScroll.canScrollUp ? "opacity-100" : "opacity-0",
          )}
        />
        <div
          ref={inboxScroll.ref}
          className="min-h-0 flex-1 overflow-y-auto"
        >
          <div className="grid gap-0">
          {conversations.map((conversation) => {
            const isSelected = conversation.id === selectedConversationId;

            return (
              <button
                key={conversation.id}
                type="button"
                onClick={() => onSelectConversation(conversation.id)}
                className={cn(
                  "relative w-full border-b px-4 py-3 text-left transition duration-200 ease-out last:border-b-0",
                  isSelected
                    ? "border-[color-mix(in_srgb,var(--line)_78%,white)] bg-white"
                    : "border-[color-mix(in_srgb,var(--line)_65%,white)] bg-transparent hover:bg-white/80",
                )}
              >
                <div className="absolute right-4 top-3 flex flex-col items-end text-right">
                  <p className="text-xs font-medium text-[var(--ink-muted)]">
                    {conversation.updatedAtLabel}
                  </p>
                  {conversation.unreadCount > 0 ? (
                    <span className="mt-1 inline-flex min-w-5 items-center justify-center rounded-full bg-[var(--panel-ink)] px-1.5 py-0.5 text-[10px] font-semibold text-white">
                      {conversation.unreadCount}
                    </span>
                  ) : null}
                </div>
                <div className="grid w-full min-w-0 grid-cols-[auto_minmax(0,1fr)] grid-rows-[auto_auto] gap-x-3 gap-y-1 overflow-hidden pr-14">
                  <Avatar className="row-span-2 self-center size-11 bg-[color-mix(in_srgb,var(--accent-soft)_86%,white)]">
                    <AvatarFallback className="bg-transparent text-sm font-semibold text-[var(--panel-ink)]">
                      {conversation.initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex min-h-11 min-w-0 flex-col justify-center overflow-hidden">
                    <p className="truncate font-medium text-[var(--panel-ink)]">
                      {conversation.name}
                    </p>
                    <p className="truncate text-[11px] font-medium uppercase tracking-[0.16em] text-[color-mix(in_srgb,var(--ink-muted)_82%,white)]">
                      {conversation.channelLabel}
                    </p>
                  </div>
                  <p className="min-w-0 overflow-hidden text-ellipsis whitespace-nowrap text-sm leading-5 text-[var(--ink)]">
                    {conversation.preview}
                  </p>
                </div>
              </button>
            );
          })}
          </div>
        </div>
        <div
          className={cn(
            "pointer-events-none absolute inset-x-0 bottom-0 z-10 h-8 bg-gradient-to-t from-[color-mix(in_srgb,var(--panel)_98%,white)] via-[color-mix(in_srgb,var(--panel)_88%,transparent)] to-transparent transition-opacity duration-200",
            inboxScroll.canScrollDown ? "opacity-100" : "opacity-0",
          )}
        />
      </div>
    </Panel>
  );
}

function ConversationThread({
  conversation,
  draftReply,
  onDraftReplyChange,
  onSendMessage,
  inboxOpen,
  onToggleInbox,
  unreadIncomingMessageIds,
  pendingSentMessageId,
  onPendingSentMessageHandled,
  onMarkConversationSeen,
}: Readonly<{
  conversation: ConversationListItem;
  draftReply: string;
  onDraftReplyChange: (value: string) => void;
  onSendMessage: (
    conversation: ConversationListItem,
    body: string,
    composerMode: ComposerMode,
  ) => void;
  inboxOpen: boolean;
  onToggleInbox: () => void;
  unreadIncomingMessageIds: string[];
  pendingSentMessageId: string | null;
  onPendingSentMessageHandled: () => void;
  onMarkConversationSeen: () => void;
}>) {
  const prefersReducedMotion = useReducedMotion() ?? false;
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const composerMenuRef = useRef<HTMLDivElement>(null);
  const composerMenuPanelRef = useRef<HTMLDivElement>(null);
  const messageElementsRef = useRef<Record<string, HTMLDivElement | null>>({});
  const autoPinToBottomRef = useRef(true);
  const unreadMessageElementsRef = useRef<Record<string, HTMLDivElement | null>>(
    {},
  );
  const threadScroll = useScrollAffordances<HTMLDivElement>();
  const [isAutoPinnedToBottom, setIsAutoPinnedToBottom] = useState(true);
  const [composerMode, setComposerMode] = useState<ComposerMode>("reply");
  const [composerMenuOpen, setComposerMenuOpen] = useState(false);
  const [composerMenuDropUp, setComposerMenuDropUp] = useState(false);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) {
      return;
    }

    textarea.style.height = "0px";
    const nextHeight = Math.min(textarea.scrollHeight, 220);
    textarea.style.height = `${nextHeight}px`;
    textarea.style.overflowY = textarea.scrollHeight > 220 ? "auto" : "hidden";
  }, [draftReply]);

  useEffect(() => {
    if (!composerMenuOpen) {
      return;
    }

    function handlePointerDown(event: MouseEvent) {
      const target = event.target as Node;

      if (!composerMenuRef.current?.contains(target)) {
        setComposerMenuOpen(false);
      }
    }

    window.addEventListener("mousedown", handlePointerDown);
    return () => {
      window.removeEventListener("mousedown", handlePointerDown);
    };
  }, [composerMenuOpen]);

  useEffect(() => {
    const root = threadScroll.ref.current;
    if (!root || unreadIncomingMessageIds.length === 0) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (
          entries.some(
            (entry) => entry.isIntersecting && entry.intersectionRatio >= 0.65,
          )
        ) {
          onMarkConversationSeen();
        }
      },
      {
        root,
        threshold: [0.65],
      },
    );

    const frame = window.requestAnimationFrame(() => {
      unreadIncomingMessageIds.forEach((messageId) => {
        const element = unreadMessageElementsRef.current[messageId];
        if (element) {
          observer.observe(element);
        }
      });
    });

    return () => {
      window.cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [onMarkConversationSeen, threadScroll.ref, unreadIncomingMessageIds]);

  useEffect(() => {
    if (!composerMenuOpen) {
      return;
    }

    function updateComposerMenuPlacement() {
      const trigger = composerMenuRef.current;
      const panel = composerMenuPanelRef.current;
      if (!trigger || !panel) {
        return;
      }

      const triggerRect = trigger.getBoundingClientRect();
      const panelRect = panel.getBoundingClientRect();
      const spaceBelow = window.innerHeight - triggerRect.bottom;
      const spaceAbove = triggerRect.top;

      setComposerMenuDropUp(
        spaceBelow < panelRect.height + 12 && spaceAbove > spaceBelow,
      );
    }

    const frame = window.requestAnimationFrame(updateComposerMenuPlacement);
    window.addEventListener("resize", updateComposerMenuPlacement);

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("resize", updateComposerMenuPlacement);
    };
  }, [composerMenuOpen]);

  useEffect(() => {
    autoPinToBottomRef.current = true;
    setIsAutoPinnedToBottom(true);
  }, [conversation.id]);

  useEffect(() => {
    const element = threadScroll.ref.current;
    if (!element) {
      return;
    }
    const scrollElement: HTMLDivElement = element;

    function updateAutoPinState() {
      const shouldAutoPin =
        scrollElement.scrollHeight -
          scrollElement.scrollTop -
          scrollElement.clientHeight <=
        threadBottomPinThreshold;
      autoPinToBottomRef.current = shouldAutoPin;
      setIsAutoPinnedToBottom(shouldAutoPin);
    }

    updateAutoPinState();
    scrollElement.addEventListener("scroll", updateAutoPinState, {
      passive: true,
    });
    window.addEventListener("resize", updateAutoPinState);

    return () => {
      scrollElement.removeEventListener("scroll", updateAutoPinState);
      window.removeEventListener("resize", updateAutoPinState);
    };
  }, [conversation.id, threadScroll.ref]);

  useEffect(() => {
    const element = threadScroll.ref.current;
    if (!element || !autoPinToBottomRef.current) {
      return;
    }

    const frame = window.requestAnimationFrame(() => {
      element.scrollTo({
        top: element.scrollHeight,
        behavior:
          pendingSentMessageId && !prefersReducedMotion ? "smooth" : "auto",
      });
    });

    return () => {
      window.cancelAnimationFrame(frame);
    };
  }, [
    conversation.id,
    conversation.thread.messages.length,
    pendingSentMessageId,
    prefersReducedMotion,
    threadScroll.ref,
  ]);

  useEffect(() => {
    if (!pendingSentMessageId) {
      return;
    }

    let cleanupFrame = 0;
    const frame = window.requestAnimationFrame(() => {
      cleanupFrame = window.requestAnimationFrame(() => {
        onPendingSentMessageHandled();
      });
    });

    return () => {
      window.cancelAnimationFrame(frame);
      window.cancelAnimationFrame(cleanupFrame);
    };
  }, [onPendingSentMessageHandled, pendingSentMessageId]);

  const activeComposerMode =
    composerModeOptions.find((option) => option.value === composerMode) ??
    composerModeOptions[0]!;
  const ActiveComposerIcon = activeComposerMode.icon;
  const isInternalNote = composerMode === "internalNote";
  const hasDraftContent = draftReply.trim().length > 0;
  const latestMessage = conversation.thread.messages.at(-1);
  const showJumpToLatest =
    threadScroll.canScrollDown &&
    !isAutoPinnedToBottom &&
    latestMessage?.author !== "agent";

  function scrollThreadToBottom() {
    const element = threadScroll.ref.current;
    if (!element) {
      return;
    }

    autoPinToBottomRef.current = true;
    setIsAutoPinnedToBottom(true);
    element.scrollTo({
      top: element.scrollHeight,
      behavior: prefersReducedMotion ? "auto" : "smooth",
    });
  }

  function handleSendClick() {
    if (!hasDraftContent) {
      return;
    }

    onSendMessage(conversation, draftReply, composerMode);
    textareaRef.current?.focus();
  }

  function handleComposerKeyDown(
    event: React.KeyboardEvent<HTMLTextAreaElement>,
  ) {
    if (event.nativeEvent.isComposing || event.key !== "Enter") {
      return;
    }

    if (event.metaKey || event.ctrlKey) {
      event.preventDefault();
      handleSendClick();
    }
  }

  return (
    <Panel className="flex h-full min-h-[32rem] min-w-0 flex-col overflow-hidden rounded-t-lg rounded-b-none border-[color-mix(in_srgb,var(--line)_78%,white)] bg-[color-mix(in_srgb,var(--panel)_95%,white)] p-0 isolate [contain:paint] shadow-[0_30px_70px_-42px_color-mix(in_srgb,var(--panel-ink)_28%,transparent)]">
      <div className="sticky top-0 z-10 border-b border-[color-mix(in_srgb,var(--line)_70%,white)] bg-[color-mix(in_srgb,var(--panel)_94%,white)] px-4 py-3">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex min-w-0 items-center gap-2">
            {!inboxOpen ? (
              <button
                type="button"
                className="inline-flex h-5 w-5 items-center justify-center text-[var(--ink-muted)] transition duration-200 ease-out hover:text-[var(--panel-ink)]"
                aria-label="Show conversation list"
                onClick={onToggleInbox}
              >
                <PanelRightClose className="size-4" />
              </button>
            ) : null}
            <h1 className="font-[family-name:var(--font-dashboard-display)] text-[clamp(1.35rem,2vw,1.8rem)] font-semibold tracking-[-0.04em] text-[var(--panel-ink)]">
              {conversation.name}
            </h1>
          </div>
          <div className="flex items-center gap-1">
            <button type="button" className={iconButtonClassName} aria-label="Star">
              <Star className="size-4" />
            </button>
            <button
              type="button"
              className={iconButtonClassName}
              aria-label="Archive"
            >
              <Archive className="size-4" />
            </button>
            <button
              type="button"
              className={iconButtonClassName}
              aria-label="More actions"
            >
              <MoreHorizontal className="size-4" />
            </button>
            <button
              type="button"
              className={buttonClasses({ size: "sm" })}
            >
              Close
            </button>
          </div>
        </div>
      </div>

      <div className="relative min-h-0 flex-1 overflow-hidden">
        <div
          className={cn(
            "pointer-events-none absolute inset-x-0 top-0 z-10 flex h-14 items-start justify-center pt-2 transition-opacity duration-200",
            threadScroll.canScrollUp ? "opacity-100" : "opacity-0",
          )}
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/88 text-[var(--ink-muted)] shadow-[0_10px_30px_-18px_color-mix(in_srgb,var(--panel-ink)_30%,transparent)] backdrop-blur-sm">
            <ChevronUp className="size-4" />
          </div>
        </div>
        <div
          ref={threadScroll.ref}
          className="h-full min-h-0 overflow-y-auto px-5 pb-10 pt-5 sm:px-6 sm:pb-12"
        >
          <div className="mx-auto grid max-w-4xl gap-4">
            <AnimatePresence initial={false}>
            {conversation.thread.messages.map((message) => {
              const isFreshMessage = pendingSentMessageId === message.id;

              return (
                <motion.div
                  key={message.id}
                  layout="position"
                  ref={(element) => {
                    messageElementsRef.current[message.id] = element;

                    if (unreadIncomingMessageIds.includes(message.id)) {
                      unreadMessageElementsRef.current[message.id] = element;
                      return;
                    }

                    delete unreadMessageElementsRef.current[message.id];
                  }}
                  initial={
                    isFreshMessage
                      ? prefersReducedMotion
                        ? { opacity: 0 }
                        : { opacity: 0, y: 18, scale: 0.98 }
                      : false
                  }
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{
                    duration: prefersReducedMotion ? 0.14 : 0.34,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                >
                  <MessageBubble message={message} isFresh={isFreshMessage} />
                </motion.div>
              );
            })}
            </AnimatePresence>
          </div>
        </div>
        <div
          className={cn(
            "pointer-events-none absolute inset-x-0 bottom-0 z-10 flex h-16 items-end justify-center pb-3 transition-opacity duration-200",
            threadScroll.canScrollDown && !isAutoPinnedToBottom
              ? "opacity-100"
              : "opacity-0",
          )}
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/88 text-[var(--ink-muted)] shadow-[0_10px_30px_-18px_color-mix(in_srgb,var(--panel-ink)_30%,transparent)] backdrop-blur-sm">
            <ChevronDown className="size-4" />
          </div>
        </div>
        {showJumpToLatest ? (
          <button
            type="button"
            onClick={scrollThreadToBottom}
            className="absolute bottom-4 right-5 z-20 inline-flex h-10 w-10 items-center justify-center rounded-full bg-[var(--panel-ink)] text-white shadow-[0_18px_40px_-24px_color-mix(in_srgb,var(--panel-ink)_55%,transparent)] transition duration-200 ease-out hover:bg-[color-mix(in_srgb,var(--panel-ink)_92%,black)] sm:right-6"
            aria-label="Scroll to latest message"
          >
            <ChevronDown className="size-4" />
          </button>
        ) : null}
      </div>

      <div className="bg-transparent px-5 pb-5 pt-0 sm:px-6">
        <div
          className={cn(
            "rounded-lg border px-5 py-3 shadow-[0_22px_44px_-34px_color-mix(in_srgb,var(--panel-ink)_28%,transparent)] transition-[border-color,box-shadow,background-color] duration-200 ease-out focus-within:border-[color-mix(in_srgb,var(--panel-ink)_28%,white)] focus-within:shadow-[0_30px_70px_-34px_color-mix(in_srgb,var(--panel-ink)_30%,transparent)]",
            isInternalNote
              ? "border-[color-mix(in_srgb,#e6d48f_55%,white)] bg-[color-mix(in_srgb,#f5e7a3_48%,white)]"
              : "border-[color-mix(in_srgb,var(--line)_78%,white)] bg-white",
          )}
        >
          <div
            ref={composerMenuRef}
            className="relative flex items-center gap-2 text-[var(--panel-ink)]"
          >
            <button
              type="button"
              className="inline-flex items-center gap-1.5 text-sm font-semibold tracking-[-0.02em]"
              aria-expanded={composerMenuOpen}
              aria-haspopup="menu"
              onClick={() => setComposerMenuOpen((open) => !open)}
            >
              <ActiveComposerIcon className="size-4" />
              {activeComposerMode.label}
              <ChevronDown className="size-3" />
            </button>
            {composerMenuOpen ? (
              <div
                ref={composerMenuPanelRef}
                className={cn(
                  "absolute left-0 z-20 min-w-40 rounded-lg border border-[color-mix(in_srgb,var(--line)_78%,white)] bg-white p-1.5 shadow-[0_18px_40px_-24px_color-mix(in_srgb,var(--panel-ink)_26%,transparent)]",
                  composerMenuDropUp ? "bottom-full mb-2" : "top-full mt-2",
                )}
              >
                {composerModeOptions.map((option) => {
                  const OptionIcon = option.icon;

                  return (
                    <button
                      key={option.value}
                      type="button"
                      className={cn(
                        "flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-sm transition duration-150 ease-out",
                        option.value === composerMode
                          ? "bg-[color-mix(in_srgb,var(--panel)_82%,white)] font-medium text-[var(--panel-ink)]"
                          : "text-[var(--ink)] hover:bg-[color-mix(in_srgb,var(--panel)_72%,white)]",
                      )}
                      onClick={() => {
                        setComposerMode(option.value);
                        setComposerMenuOpen(false);
                      }}
                    >
                      <OptionIcon className="size-4" />
                      {option.label}
                    </button>
                  );
                })}
              </div>
            ) : null}
          </div>
          <Textarea
            ref={textareaRef}
            value={draftReply}
            onChange={(event) => onDraftReplyChange(event.target.value)}
            onKeyDown={handleComposerKeyDown}
            className="mt-2 min-h-0 max-h-[220px] resize-none overflow-y-hidden rounded-none border-0 bg-transparent px-0 py-0 text-sm leading-6 shadow-none focus-visible:ring-0"
            placeholder="Write a reply"
          />
          <div className="mt-2 flex items-end justify-between gap-2">
            <div className="flex items-center gap-1.5 text-[var(--panel-ink)]">
              <button
                type="button"
                className="inline-flex h-7 w-7 items-center justify-center rounded-full text-[var(--panel-ink)] transition duration-200 ease-out hover:bg-[color-mix(in_srgb,var(--panel)_70%,white)]"
                aria-label="Quick actions"
              >
                <Zap className="size-4" />
              </button>
              <button
                type="button"
                className="inline-flex h-7 w-7 items-center justify-center rounded-full text-[var(--panel-ink)] transition duration-200 ease-out hover:bg-[color-mix(in_srgb,var(--panel)_70%,white)]"
                aria-label="Saved replies"
              >
                <Bookmark className="size-4" />
              </button>
              <button
                type="button"
                className="inline-flex h-7 w-7 items-center justify-center rounded-full text-[var(--panel-ink)] transition duration-200 ease-out hover:bg-[color-mix(in_srgb,var(--panel)_70%,white)]"
                aria-label="Emoji"
              >
                <Smile className="size-4" />
              </button>
              <button
                type="button"
                className="inline-flex h-7 items-center justify-center rounded-full px-2 text-[11px] font-semibold tracking-[-0.01em] text-[var(--panel-ink)] transition duration-200 ease-out hover:bg-[color-mix(in_srgb,var(--panel)_70%,white)]"
              >
                GIF
              </button>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                className="inline-flex h-7 w-7 items-center justify-center rounded-full text-[var(--panel-ink)] transition duration-200 ease-out hover:bg-[color-mix(in_srgb,var(--panel)_70%,white)]"
                aria-label="Attach file"
              >
                <Paperclip className="size-4" />
              </button>
              <DropdownMenu>
                <div
                  className={cn(
                    "inline-flex items-center overflow-hidden rounded-lg transition duration-200 ease-out",
                    hasDraftContent
                      ? "bg-[var(--panel-ink)] text-white shadow-[0_18px_40px_-28px_color-mix(in_srgb,var(--panel-ink)_60%,transparent)] hover:bg-[color-mix(in_srgb,var(--panel-ink)_92%,black)]"
                      : "bg-transparent text-[var(--ink-muted)] shadow-none",
                  )}
                >
                  <button
                    type="button"
                    disabled={!hasDraftContent}
                    onClick={handleSendClick}
                    className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold tracking-[-0.02em] disabled:cursor-default"
                  >
                    Send
                  </button>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      disabled={!hasDraftContent}
                      aria-label="More send options"
                      className={cn(
                        "inline-flex h-full items-center px-2.5 disabled:cursor-default",
                        hasDraftContent
                          ? "border-l border-white/15"
                          : "border-l border-[color-mix(in_srgb,var(--line)_88%,var(--ink-muted))]",
                      )}
                    >
                      <ChevronDown className="size-4" />
                    </button>
                  </DropdownMenuTrigger>
                </div>
                <DropdownMenuContent
                  align="end"
                  side="top"
                  sideOffset={8}
                  collisionPadding={12}
                  className="w-72 rounded-xl p-1.5"
                >
                  <DropdownMenuItem className="justify-between gap-4 rounded-lg px-3 py-2.5">
                    <div className="flex items-center gap-3">
                      <SendHorizontal className="size-4 text-[var(--panel-ink)]" />
                      <span className="whitespace-nowrap text-sm font-medium text-[var(--panel-ink)]">
                        Send and close
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className={sendShortcutBadgeClassName}>
                        {sendShortcutSymbols.Cmd}
                      </span>
                      <span className={sendShortcutBadgeClassName}>
                        {sendShortcutSymbols.Shift}
                      </span>
                      <span className={sendShortcutBadgeClassName}>
                        {sendShortcutSymbols.Enter}
                      </span>
                    </div>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="my-1.5" />
                  <DropdownMenuLabel className="px-3 pb-1 pt-1 text-[11px] tracking-[0.14em]">
                    Send and snooze
                  </DropdownMenuLabel>
                  {sendSnoozeOptions.map((option) => {
                    const OptionIcon = option.icon;

                    return (
                      <DropdownMenuItem
                        key={option.label}
                        className="justify-between gap-4 rounded-lg px-3 py-2"
                      >
                        <span className="text-sm text-[var(--panel-ink)]">
                          {option.label}
                        </span>
                        <div className="flex items-center gap-1.5">
                          {option.shortcuts?.map((shortcut) => (
                            <span
                              key={`${option.label}-${shortcut}`}
                              className={sendShortcutBadgeClassName}
                            >
                              {sendShortcutSymbols[shortcut] ?? shortcut}
                            </span>
                          ))}
                          {OptionIcon ? (
                            <OptionIcon className="size-4 text-[var(--ink-muted)]" />
                          ) : null}
                        </div>
                      </DropdownMenuItem>
                    );
                  })}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </div>
    </Panel>
  );
}

function MessageBubble({
  message,
  isFresh = false,
}: Readonly<{
  message: ConversationMessage;
  isFresh?: boolean;
}>) {
  const isAgent = message.author === "agent";
  const isSystem = message.author === "system";

  return (
    <div
      className={cn(
        "flex gap-3",
        isAgent ? "justify-end" : "justify-start",
      )}
    >
      {!isAgent ? (
        <Avatar
          size="lg"
          className={cn(
            "mt-1 size-10",
            isSystem
              ? "bg-[color-mix(in_srgb,var(--accent-soft)_70%,white)]"
              : "bg-[color-mix(in_srgb,var(--accent-soft)_88%,white)]",
          )}
        >
          <AvatarFallback className="bg-transparent text-sm font-semibold text-[var(--panel-ink)]">
            {message.senderName
              .split(" ")
              .map((part) => part[0])
              .join("")
              .slice(0, 2)}
          </AvatarFallback>
        </Avatar>
      ) : null}

      <div
        className={cn(
          "max-w-[min(100%,44rem)] rounded-lg border px-5 py-4 shadow-[0_24px_60px_-45px_color-mix(in_srgb,var(--panel-ink)_30%,transparent)] transition-[transform,box-shadow,border-color] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
          isSystem &&
            "border-[color-mix(in_srgb,var(--line)_72%,white)] bg-[color-mix(in_srgb,var(--accent-soft)_38%,white)]",
          !isSystem &&
            !isAgent &&
            "border-[color-mix(in_srgb,var(--line)_74%,white)] bg-white",
          isAgent &&
            "border-[color-mix(in_srgb,var(--accent-soft)_85%,white)] bg-[color-mix(in_srgb,var(--accent-soft)_62%,white)]",
          isFresh &&
            "border-[color-mix(in_srgb,var(--panel-ink)_18%,var(--accent-soft))] shadow-[0_28px_65px_-36px_color-mix(in_srgb,var(--panel-ink)_36%,transparent)]",
        )}
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm font-semibold text-[var(--panel-ink)]">
            {message.senderName}
          </p>
          <div className="flex items-center gap-2 text-xs text-[var(--ink-muted)]">
            {message.metaLabel ? (
              <span className="rounded-full border border-[color-mix(in_srgb,var(--line)_80%,white)] px-2.5 py-1">
                {message.metaLabel}
              </span>
            ) : null}
            <span>{message.timeLabel}</span>
          </div>
        </div>
        <p className="mt-3 whitespace-pre-wrap text-[15px] leading-7 text-[var(--ink)]">
          {message.body}
        </p>
        {message.type === "attachment" && message.attachment ? (
          <div className="mt-4 rounded-lg border border-[color-mix(in_srgb,var(--line)_74%,white)] bg-[color-mix(in_srgb,var(--panel)_52%,white)] p-4">
            <div className="flex items-start gap-3">
              <div className="rounded-2xl bg-[color-mix(in_srgb,var(--accent-soft)_75%,white)] p-3 text-[var(--panel-ink)]">
                <Paperclip className="size-4" />
              </div>
              <div>
                <p className="font-medium text-[var(--panel-ink)]">
                  {message.attachment.title}
                </p>
                <p className="mt-1 text-sm text-[var(--ink-muted)]">
                  {message.attachment.detail}
                </p>
              </div>
            </div>
          </div>
        ) : null}
      </div>

      {isAgent ? (
        <Avatar
          size="lg"
          className="mt-1 size-10 bg-[color-mix(in_srgb,var(--panel-ink)_88%,white)]"
        >
          <AvatarFallback className="bg-transparent text-sm font-semibold text-white">
            AC
          </AvatarFallback>
        </Avatar>
      ) : null}
    </div>
  );
}

const iconButtonClassName =
  "inline-flex h-11 w-11 items-center justify-center rounded-lg border border-transparent bg-transparent text-[var(--ink-muted)] transition duration-200 ease-out hover:bg-white/80 hover:text-[var(--panel-ink)]";
