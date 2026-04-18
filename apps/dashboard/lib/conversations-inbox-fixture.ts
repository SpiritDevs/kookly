export type ConversationTagTone = "neutral" | "accent" | "success" | "warning";

export type ConversationTag = {
  label: string;
  tone: ConversationTagTone;
};

export type ConversationMessage = {
  id: string;
  author: "customer" | "agent" | "system";
  senderName: string;
  body: string;
  timeLabel: string;
  type?: "text" | "attachment" | "note";
  metaLabel?: string;
  attachment?: {
    title: string;
    detail: string;
  };
};

export type ConversationCustomerProfile = {
  name: string;
  email: string;
  company: string;
  location: string;
  plan: string;
  joinedLabel: string;
  timezone: string;
  lastSeenLabel: string;
  valueLabel: string;
  assignee: string;
  statusLabel: string;
  moodLabel: string;
  tags: ConversationTag[];
};

export type ConversationCopilotInsight = {
  prompt: string;
  summary: string[];
  suggestedReply: string;
  sources: Array<{
    id: string;
    label: string;
    description: string;
    tone: ConversationTagTone;
  }>;
};

export type ConversationActivityItem = {
  id: string;
  title: string;
  detail: string;
  timeLabel: string;
};

export type ConversationListItem = {
  id: string;
  name: string;
  initials: string;
  subject: string;
  preview: string;
  updatedAtLabel: string;
  waitTimeLabel: string;
  unreadCount: number;
  priorityLabel: string;
  statusLabel: string;
  channelLabel: string;
  segmentLabel: string;
  tags: ConversationTag[];
  customer: ConversationCustomerProfile;
  thread: {
    headerEyebrow: string;
    messages: ConversationMessage[];
  };
  copilot: ConversationCopilotInsight;
  activity: ConversationActivityItem[];
};

export type ConversationInboxFixture = {
  mailboxLabel: string;
  mailboxDescription: string;
  openCountLabel: string;
  responseSlaLabel: string;
  conversations: ConversationListItem[];
};

export const conversationInboxFixture: ConversationInboxFixture = {
  mailboxLabel: "Customer inbox",
  mailboxDescription: "High-touch conversations that need a human reply today.",
  openCountLabel: "13 open",
  responseSlaLabel: "Median reply 6m",
  conversations: [
    {
      id: "carlos-rivera-refund",
      name: "Carlos Rivera",
      initials: "CR",
      subject: "Damaged table delivered this morning",
      preview:
        "The table I ordered just arrived and one of the legs is broken. What is your refund policy for damaged items?",
      updatedAtLabel: "1m",
      waitTimeLabel: "Waiting 1m",
      unreadCount: 1,
      priorityLabel: "Urgent",
      statusLabel: "Open",
      channelLabel: "Email",
      segmentLabel: "Refund risk",
      tags: [
        { label: "Damaged item", tone: "warning" },
        { label: "VIP customer", tone: "accent" },
      ],
      customer: {
        name: "Carlos Rivera",
        email: "carlos@riverahome.com",
        company: "Rivera Home Studio",
        location: "San Diego, CA",
        plan: "Premium customer",
        joinedLabel: "Joined Jan 2024",
        timezone: "America/Los_Angeles",
        lastSeenLabel: "Active 1 minute ago",
        valueLabel: "$4.2k lifetime value",
        assignee: "Ava Collins",
        statusLabel: "Awaiting support",
        moodLabel: "Concerned but calm",
        tags: [
          { label: "Furniture", tone: "neutral" },
          { label: "Repeat buyer", tone: "success" },
          { label: "Escalation-ready", tone: "warning" },
        ],
      },
      thread: {
        headerEyebrow: "Order #51391 · Soho dining table",
        messages: [
          {
            id: "m1",
            author: "system",
            senderName: "Kookly",
            body: "Conversation routed from post-purchase support and marked high priority because the order value is above $1,000.",
            timeLabel: "1m",
            type: "note",
            metaLabel: "Auto-triage note",
          },
          {
            id: "m2",
            author: "customer",
            senderName: "Carlos Rivera",
            body: "The table I ordered just arrived and one of the legs is broken. What is your refund policy for damaged items?",
            timeLabel: "1m",
          },
          {
            id: "m3",
            author: "customer",
            senderName: "Carlos Rivera",
            body: "I've attached a quick photo below in case it helps.",
            timeLabel: "1m",
            type: "attachment",
            attachment: {
              title: "damaged-table-leg.jpg",
              detail: "Photo attachment · 2.1 MB",
            },
          },
          {
            id: "m4",
            author: "agent",
            senderName: "Ava Collins",
            body:
              "Hi Carlos, I am really sorry your order arrived damaged. If you return the item within 30 days of delivery, we can issue a full refund to your original payment method. We can also offer a 15% voucher for the inconvenience while we arrange the return.",
            timeLabel: "Just drafted",
            metaLabel: "Draft reply",
          },
        ],
      },
      copilot: {
        prompt: "What is our refund policy for damaged items?",
        summary: [
          "Customer is within the 30-day damaged-delivery window and qualifies for a full refund.",
          "Because this is a premium account, include a concierge return offer and a goodwill voucher.",
        ],
        suggestedReply:
          "I am sorry this arrived damaged. We can process a full refund to your original payment method once the damaged table is collected, and I can include a 15% goodwill voucher for your next order.",
        sources: [
          {
            id: "s1",
            label: "Damaged delivery policy",
            description: "Refund or replacement available within 30 days of delivery.",
            tone: "neutral",
          },
          {
            id: "s2",
            label: "Premium recovery playbook",
            description: "Offer concierge pickup plus voucher for orders over $1,000.",
            tone: "accent",
          },
        ],
      },
      activity: [
        {
          id: "a1",
          title: "Shopify event",
          detail: "Order delivered at 9:14 AM local time.",
          timeLabel: "37m ago",
        },
        {
          id: "a2",
          title: "Previous conversation",
          detail: "Carlos left a 5-star review on his last order.",
          timeLabel: "12d ago",
        },
      ],
    },
    {
      id: "maya-chen-shipping",
      name: "Maya Chen",
      initials: "MC",
      subject: "Expedite shipping for showroom launch",
      preview:
        "We have a showroom install on Friday. Is there any way to move our lamp order onto faster shipping?",
      updatedAtLabel: "4m",
      waitTimeLabel: "Waiting 4m",
      unreadCount: 2,
      priorityLabel: "High value",
      statusLabel: "Open",
      channelLabel: "Chat",
      segmentLabel: "Shipping",
      tags: [
        { label: "Launch week", tone: "accent" },
        { label: "B2B", tone: "neutral" },
      ],
      customer: {
        name: "Maya Chen",
        email: "maya@oakatelier.co",
        company: "Oak Atelier",
        location: "New York, NY",
        plan: "Trade account",
        joinedLabel: "Joined Sep 2023",
        timezone: "America/New_York",
        lastSeenLabel: "Seen 4 minutes ago",
        valueLabel: "$8.9k lifetime value",
        assignee: "Jordan Lee",
        statusLabel: "Needs logistics check",
        moodLabel: "Time sensitive",
        tags: [
          { label: "Trade", tone: "success" },
          { label: "Deadline", tone: "warning" },
        ],
      },
      thread: {
        headerEyebrow: "Order #52014 · Meridian lamp bundle",
        messages: [
          {
            id: "m1",
            author: "customer",
            senderName: "Maya Chen",
            body: "We have a showroom install on Friday. Is there any way to move our lamp order onto faster shipping?",
            timeLabel: "4m",
          },
          {
            id: "m2",
            author: "agent",
            senderName: "Jordan Lee",
            body: "I am checking with our warehouse team now. If the cartons clear the carrier handoff in the next hour, we may be able to upgrade them to express.",
            timeLabel: "2m",
          },
        ],
      },
      copilot: {
        prompt: "Can we offer an expedited shipment upgrade?",
        summary: [
          "Trade accounts can receive one courtesy upgrade per quarter when inventory is already packed.",
        ],
        suggestedReply:
          "I am checking the warehouse status now. If the cartons have not left our dock yet, I can request an express upgrade and confirm the new ETA within the hour.",
        sources: [
          {
            id: "s1",
            label: "Shipping exception policy",
            description: "One courtesy express upgrade per quarter for trade accounts.",
            tone: "neutral",
          },
        ],
      },
      activity: [
        {
          id: "a1",
          title: "Carrier note",
          detail: "Label created, awaiting warehouse scan.",
          timeLabel: "18m ago",
        },
      ],
    },
    {
      id: "jordan-banks-login",
      name: "Jordan Banks",
      initials: "JB",
      subject: "Reset link keeps expiring",
      preview:
        "I can sign in on mobile, but desktop keeps saying my reset link has already expired.",
      updatedAtLabel: "9m",
      waitTimeLabel: "Waiting 9m",
      unreadCount: 0,
      priorityLabel: "Needs triage",
      statusLabel: "Open",
      channelLabel: "Email",
      segmentLabel: "Authentication",
      tags: [
        { label: "Bug report", tone: "warning" },
        { label: "Desktop only", tone: "neutral" },
      ],
      customer: {
        name: "Jordan Banks",
        email: "jordan.banks@gmail.com",
        company: "Personal account",
        location: "Austin, TX",
        plan: "Standard customer",
        joinedLabel: "Joined Feb 2025",
        timezone: "America/Chicago",
        lastSeenLabel: "Seen 10 minutes ago",
        valueLabel: "$780 lifetime value",
        assignee: "Unassigned",
        statusLabel: "Needs owner",
        moodLabel: "Frustrated",
        tags: [
          { label: "Auth", tone: "warning" },
          { label: "Potential bug", tone: "accent" },
        ],
      },
      thread: {
        headerEyebrow: "Login issue · Desktop web",
        messages: [
          {
            id: "m1",
            author: "customer",
            senderName: "Jordan Banks",
            body: "I can sign in on mobile, but desktop keeps saying my reset link has already expired.",
            timeLabel: "9m",
          },
        ],
      },
      copilot: {
        prompt: "Could browser time skew invalidate the reset token?",
        summary: [
          "Similar reports this week were caused by users opening older password reset emails.",
        ],
        suggestedReply:
          "Please request a fresh reset email and open the newest link only. If the issue persists, I can escalate this to our product team with your browser details.",
        sources: [
          {
            id: "s1",
            label: "Auth troubleshooting macro",
            description: "Ask user to generate and open the newest reset email only.",
            tone: "accent",
          },
        ],
      },
      activity: [
        {
          id: "a1",
          title: "Support signal",
          detail: "Two related login issues detected this morning.",
          timeLabel: "23m ago",
        },
      ],
    },
    {
      id: "samira-khan-billing",
      name: "Samira Khan",
      initials: "SK",
      subject: "Duplicate charge on corporate card",
      preview:
        "Our finance team spotted what looks like a duplicate charge from yesterday's invoice. Can you verify it?",
      updatedAtLabel: "16m",
      waitTimeLabel: "Waiting 16m",
      unreadCount: 0,
      priorityLabel: "Finance",
      statusLabel: "Open",
      channelLabel: "Email",
      segmentLabel: "Billing",
      tags: [
        { label: "Finance", tone: "warning" },
        { label: "Enterprise", tone: "success" },
      ],
      customer: {
        name: "Samira Khan",
        email: "samira@northstarpartners.com",
        company: "Northstar Partners",
        location: "Chicago, IL",
        plan: "Enterprise customer",
        joinedLabel: "Joined Aug 2022",
        timezone: "America/Chicago",
        lastSeenLabel: "Seen 18 minutes ago",
        valueLabel: "$24.7k lifetime value",
        assignee: "Luca Grant",
        statusLabel: "Finance review",
        moodLabel: "Direct",
        tags: [
          { label: "Accounting", tone: "warning" },
          { label: "Enterprise", tone: "success" },
        ],
      },
      thread: {
        headerEyebrow: "Invoice #INV-2048",
        messages: [
          {
            id: "m1",
            author: "customer",
            senderName: "Samira Khan",
            body: "Our finance team spotted what looks like a duplicate charge from yesterday's invoice. Can you verify it?",
            timeLabel: "16m",
          },
        ],
      },
      copilot: {
        prompt: "Is this a true duplicate or a pending authorization?",
        summary: [
          "Enterprise invoices can show an authorization hold before the final capture settles.",
        ],
        suggestedReply:
          "I am checking whether the second charge is a pending authorization hold or a duplicate capture. I will confirm the transaction status with finance shortly.",
        sources: [
          {
            id: "s1",
            label: "Billing hold explainer",
            description: "Authorization holds can appear as duplicates for up to 48 hours.",
            tone: "neutral",
          },
        ],
      },
      activity: [
        {
          id: "a1",
          title: "Stripe event",
          detail: "Authorization and capture recorded 14 seconds apart.",
          timeLabel: "1h ago",
        },
      ],
    },
    {
      id: "nina-patel-product",
      name: "Nina Patel",
      initials: "NP",
      subject: "Need dimensions for custom shelving",
      preview:
        "Can someone confirm the interior shelf depth on the walnut console before I place a trade order?",
      updatedAtLabel: "21m",
      waitTimeLabel: "Waiting 21m",
      unreadCount: 0,
      priorityLabel: "Pre-sale",
      statusLabel: "Open",
      channelLabel: "Chat",
      segmentLabel: "Product question",
      tags: [
        { label: "Trade lead", tone: "accent" },
        { label: "Sizing", tone: "neutral" },
      ],
      customer: {
        name: "Nina Patel",
        email: "nina@ateliercove.com",
        company: "Atelier Cove",
        location: "Seattle, WA",
        plan: "Trade prospect",
        joinedLabel: "Joined this week",
        timezone: "America/Los_Angeles",
        lastSeenLabel: "Seen 21 minutes ago",
        valueLabel: "Potential $2.6k order",
        assignee: "Mila Torres",
        statusLabel: "Sales assist",
        moodLabel: "Curious",
        tags: [
          { label: "Prospect", tone: "accent" },
          { label: "Furniture", tone: "neutral" },
        ],
      },
      thread: {
        headerEyebrow: "Walnut console collection",
        messages: [
          {
            id: "m1",
            author: "customer",
            senderName: "Nina Patel",
            body: "Can someone confirm the interior shelf depth on the walnut console before I place a trade order?",
            timeLabel: "21m",
          },
        ],
      },
      copilot: {
        prompt: "Where are the interior shelf dimensions documented?",
        summary: [
          "Product spec sheet lists interior shelf depth as 14.5 inches.",
        ],
        suggestedReply:
          "The interior shelf depth on the walnut console is 14.5 inches. I can also send the full spec sheet if you want the complete measurements before ordering.",
        sources: [
          {
            id: "s1",
            label: "Walnut console spec sheet",
            description: "Contains full exterior and interior measurements.",
            tone: "neutral",
          },
        ],
      },
      activity: [
        {
          id: "a1",
          title: "Lead source",
          detail: "Arrived via trade program landing page.",
          timeLabel: "Today",
        },
      ],
    },
  ],
};
