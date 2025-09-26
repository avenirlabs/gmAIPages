import React from "react";

type Props = {
  onSubmit?: (text: string) => void; // parent wires to chat start endpoint
  placeholder?: string;
  starterPrompts?: string[];
};

export default function HeroCTA({
  onSubmit,
  placeholder = "Try: gifts for sister who loves cooking under ₹500",
  starterPrompts = ["For Dad", "Birthday", "Under ₹1000"]
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
    <section className="bg-neutral-50/60 border-b border-neutral-200">
      <div className="container py-20 md:py-24">
        <div className="max-w-3xl">
          <p className="text-sm text-neutral-600">Discover Gifts Smarter, Not Harder</p>
          <h1 className="font-heading text-3xl md:text-5xl mt-4 font-extrabold tracking-tight text-brand-secondary-800">
            AI-powered gift recommendations for every relationship & occasion
          </h1>
          <p className="text-neutral-600 mt-6 text-lg">
            Tell me who it's for and the occasion—I'll surface perfect gifts instantly.
          </p>

          <form onSubmit={submit} className="mt-8 flex items-stretch gap-3">
            <input
              className="flex-1 rounded-lg border border-neutral-300 px-4 py-3 md:py-4 text-base outline-none focus:border-brand-primary-500 focus:ring-2 focus:ring-brand-primary-500/20"
              placeholder={placeholder}
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
            <button className="rounded-lg bg-brand-primary-500 text-white px-8 md:px-12 py-3 md:py-4 font-medium hover:bg-brand-primary-600 transition-colors">
              Start
            </button>
          </form>

          {/* Mobile chip rail */}
          <div className="mt-4 chip-rail md:hidden">
            {starterPrompts.map((prompt, index) => (
              <button
                key={index}
                onClick={() => handlePromptClick(prompt)}
                className="rounded-full border px-3 py-1.5 text-sm text-brand-primary-500"
              >
                {prompt}
              </button>
            ))}
          </div>

          {/* Desktop starter prompts */}
          <div className="mt-3 hidden md:flex flex-wrap gap-2">
            {starterPrompts.map((prompt, index) => (
              <button
                key={index}
                onClick={() => handlePromptClick(prompt)}
                className="rounded-full border px-3 py-1.5 text-xs text-brand-primary-500"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}