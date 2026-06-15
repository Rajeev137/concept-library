"use client";

import { useRef, useState, KeyboardEvent } from "react";

interface TagInputProps {
  value: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
}

const MAX_TAG_LEN = 32;

export default function TagInput({ value, onChange, placeholder }: TagInputProps) {
  const [input, setInput] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  function addTag(raw: string) {
    const tag = raw.trim().toLowerCase().slice(0, MAX_TAG_LEN);
    if (!tag || value.includes(tag)) return;
    onChange([...value, tag]);
  }

  function removeTag(index: number) {
    onChange(value.filter((_, i) => i !== index));
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag(input);
      setInput("");
    } else if (e.key === "Backspace" && input === "" && value.length > 0) {
      onChange(value.slice(0, -1));
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value;
    if (raw.endsWith(",")) {
      addTag(raw.slice(0, -1));
      setInput("");
    } else {
      setInput(raw);
    }
  }

  return (
    <div
      className="flex flex-wrap items-center gap-1.5 w-full rounded-md border border-[var(--border-default)] px-3 py-2 text-sm bg-[var(--bg-secondary)] focus-within:ring-2 focus-within:ring-[var(--bg-accent)] transition-colors cursor-text"
      onClick={() => inputRef.current?.focus()}
    >
      {value.map((tag, i) => (
        <span
          key={tag}
          className="inline-flex items-center gap-1 rounded-full bg-[var(--tag-bg)] px-2 py-0.5 text-xs font-medium text-[var(--tag-text)]"
        >
          {tag}
          <button
            type="button"
            aria-label={`Remove tag ${tag}`}
            onClick={(e) => { e.stopPropagation(); removeTag(i); }}
            className="flex items-center text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
          >
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
              <path d="M1 1l8 8M9 1L1 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </button>
        </span>
      ))}
      <input
        ref={inputRef}
        type="text"
        value={input}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={value.length === 0 ? placeholder : undefined}
        className="flex-1 min-w-[8rem] bg-transparent text-[var(--text-secondary)] placeholder-[var(--text-muted)] focus:outline-none"
      />
    </div>
  );
}
