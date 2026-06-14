"use client";

// Floating action button — bottom-LEFT of viewport, always visible.
// Opens ConceptForm in a modal/drawer overlay.
// If a topic is currently active (from URL params), pre-fills defaultTopicId.
// TODO: read current topicId from URL searchParams.
// TODO: on click, open a modal/sheet containing <ConceptForm defaultTopicId={topicId} onSuccess={...} onCancel={...} />.
// TODO: on ConceptForm success, close modal and refresh the concept list (mutate SWR cache).
export default function AddCardButton() {
  // TODO: const router = useRouter(); const searchParams = useSearchParams()
  // TODO: const [open, setOpen] = useState(false)
  return (
    <button
      aria-label="Add card"
      style={{ position: "fixed", bottom: "1.5rem", left: "1.5rem" }}
    >
      {/* TODO: + icon */}
      Add card
    </button>
  );
}
