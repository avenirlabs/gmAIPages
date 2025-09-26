import React from "react";

type Props = {
  onSubmit?: (text: string) => void;
  placeholder?: string;
  starterPrompts?: string[];
};

export default function ChatQuickStartBar({
  onSubmit,
  placeholder = "Search gifts… (e.g., for sister under ₹500)",
  starterPrompts = ["For Mom", "Anniversary", "Under ₹500", "Tech Lover"]
}: Props) {
  const [text, setText] = React.useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (text.trim()) onSubmit?.(text.trim());
  };

  const handlePromptClick = (prompt: string) => {
    setText(prompt);
    onSubmit?.(prompt);
  };

  return (
    <div className="md:hidden sticky sticky-offset z-40 bg-white/90 backdrop-blur border-b border-neutral-200">
      <div className="container py-3">
        <form onSubmit={submit} className="flex items-center gap-2">
          <input
            className="flex-1 rounded-full border border-neutral-300 px-4 py-2 text-sm outline-none focus:border-brand-primary-500 focus:ring-2 focus:ring-brand-primary-500/20"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={placeholder}
          />
          <button className="rounded-full bg-brand-primary-500 text-white px-4 py-2 text-sm font-medium hover:bg-brand-primary-600 transition-colors">
            Start
          </button>
        </form>

        {/* Mobile chip rail */}
        <div className="chip-rail mt-3">
          {starterPrompts.map((prompt, index) => (
            <button
              key={index}
              onClick={() => handlePromptClick(prompt)}
              className="rounded-full border border-neutral-300 px-4 py-1.5 text-sm text-neutral-700 bg-white hover:border-brand-primary-300 hover:bg-brand-primary-50 transition-colors flex-shrink-0"
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}