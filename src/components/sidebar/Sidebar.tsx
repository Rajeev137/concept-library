"use client";

import type { Topic, Concept, UUID } from "@/types";

interface SidebarProps {
  collapsed: boolean;
  onToggle: (collapsed: boolean) => void;
  isMobileDrawer?: boolean;
}

// Left sidebar: topic list with expandable concept titles, search box, theme toggle,
// and a collapse-to-icon-rail toggle. All state persisted per contract.
// TODO: fetch topics from GET /api/topics on mount; cache with SWR or React Query.
// TODO: when a topic is clicked, toggle its expanded state; persist expanded_topic_ids
//       to localStorage under "ui:expanded-topics".
// TODO: when a concept is clicked, update the URL (?topic=&concept=) via router.push.
// TODO: search box (top of sidebar) filters the displayed topic+concept list client-side
//       by querying GET /api/concepts/search?q= for server-side filtering.
// TODO: each topic row shows concept_count badge (from Topic.concept_count).
// TODO: on mobile (isMobileDrawer=true), render as an overlay drawer with a backdrop.
export default function Sidebar({ collapsed, onToggle, isMobileDrawer }: SidebarProps) {
  // TODO: const { data: topics } = useSWR<Topic[]>("/api/topics", fetcher)
  // TODO: const [expandedTopicIds, setExpandedTopicIds] = useLocalStorage<UUID[]>("ui:expanded-topics", [])
  // TODO: const [searchQuery, setSearchQuery] = useState("")
  return (
    <aside aria-label="Topics">
      {/* TODO: collapse toggle button */}
      {/* TODO: search input */}
      {/* TODO: topic list with <TopicRow> children */}
      {/* TODO: sidebar footer: theme toggle + user email + logout button */}
    </aside>
  );
}
