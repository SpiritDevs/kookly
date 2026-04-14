"use client";

import { useGT } from "gt-next";
import { SectionPageContent } from "@/components/section-page-content";

type ConversationsPageVariant =
  | "all"
  | "mentions"
  | "createdByYou"
  | "allConversations"
  | "unassigned"
  | "spam";

function getConversationsPageCopy(
  gt: ReturnType<typeof useGT>,
  variant: ConversationsPageVariant,
) {
  switch (variant) {
    case "mentions":
      return {
        title: gt("Mentions"),
        heading: gt("Review every conversation that needs your attention."),
        description: gt(
          "Keep direct pings, escalations, and handoff notes in one place so the next response is easy to prioritize.",
        ),
      };
    case "createdByYou":
      return {
        title: gt("Created By You"),
        heading: gt("Track the conversations you started."),
        description: gt(
          "Use this view to revisit your open threads, follow up on blockers, and keep ownership clear across the team.",
        ),
      };
    case "allConversations":
      return {
        title: gt("All Conversations"),
        heading: gt("Browse the full conversation feed."),
        description: gt(
          "This view brings active and recent threads together so you can scan the whole queue without filtering first.",
        ),
      };
    case "unassigned":
      return {
        title: gt("Unassigned"),
        heading: gt("Pick up conversations that still need an owner."),
        description: gt(
          "Use this queue to spot inbound work quickly and make sure nothing sits without a clear next responder.",
        ),
      };
    case "spam":
      return {
        title: gt("Spam"),
        heading: gt("Keep unwanted conversations out of the main queue."),
        description: gt(
          "Use this section to review low-quality or irrelevant inbound messages without cluttering the conversations your team actually needs to work.",
        ),
      };
    case "all":
    default:
      return {
        title: gt("Conversations"),
        heading: gt("Keep the whole team aligned on customer threads."),
        description: gt(
          "Organize mentions, ownership, and follow-up work from one conversation hub without losing track of the live queue.",
        ),
      };
  }
}

export function ConversationsPageContent({
  variant = "all",
}: Readonly<{
  variant?: ConversationsPageVariant;
}>) {
  const gt = useGT();
  const copy = getConversationsPageCopy(gt, variant);

  return <SectionPageContent {...copy} />;
}
