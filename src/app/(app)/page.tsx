// App home page — rendered inside the app shell.
// Shows an empty state or the most recently viewed concept/topic.
// URL state: /?topic={id}&concept={id} — restored from sessionStorage on mount.
// Page restores scroll position (card list + card detail) via sessionStorage key
// matching the current topic+concept URL params.
export default function HomePage() {
  // TODO: Read topic and concept from searchParams and render the appropriate view:
  //   - No params:          <EmptyState> ("Select a topic or add your first card")
  //   - topic only:         <ConceptList topicId={topic} />
  //   - topic + concept:    <ConceptList topicId={topic} /> + <ConceptDetail conceptId={concept} />
  return (
    <div>
      {/* TODO: conditional rendering based on URL params */}
      <p>TODO: Home / concept list view</p>
    </div>
  );
}
