"use client";

/**
 * AI Prompt Input Component
 * 
 * Collects explicit user intent for AI generation.
 * Includes optional structured controls.
 */

import { useState } from "react";

interface AIPromptInputProps {
  onGenerate: (prompt: string, options?: {
    tone?: string;
    length?: string;
    sectionType?: string;
  }) => void;
  isGenerating: boolean;
  disabled?: boolean;
}

export function AIPromptInput({ onGenerate, isGenerating, disabled }: AIPromptInputProps) {
  const [prompt, setPrompt] = useState("");
  const [tone, setTone] = useState("");
  const [length, setLength] = useState("");
  const [sectionType, setSectionType] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!prompt.trim() || isGenerating || disabled) return;
    
    onGenerate(prompt.trim(), {
      tone: tone || undefined,
      length: length || undefined,
      sectionType: sectionType || undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Main Prompt */}
      <div>
        <label htmlFor="ai-prompt" className="block text-sm font-medium text-zinc-900 dark:text-zinc-50 mb-2">
          Describe what you want to generate
        </label>
        <textarea
          id="ai-prompt"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          disabled={isGenerating || disabled}
          placeholder="e.g., Create a newsletter header with a title and subtitle..."
          rows={6}
          className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:bg-zinc-100 disabled:text-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50 dark:placeholder-zinc-500 dark:focus:border-blue-400 dark:disabled:bg-zinc-900"
          required
        />
      </div>

      {/* Optional Controls */}
      <div className="space-y-3">
        <div>
          <label htmlFor="ai-tone" className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
            Tone (optional)
          </label>
          <select
            id="ai-tone"
            value={tone}
            onChange={(e) => setTone(e.target.value)}
            disabled={isGenerating || disabled}
            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm text-zinc-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50 dark:focus:border-blue-400 dark:disabled:bg-zinc-900"
          >
            <option value="">Any tone</option>
            <option value="professional">Professional</option>
            <option value="casual">Casual</option>
            <option value="friendly">Friendly</option>
            <option value="formal">Formal</option>
            <option value="creative">Creative</option>
          </select>
        </div>

        <div>
          <label htmlFor="ai-length" className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
            Length (optional)
          </label>
          <select
            id="ai-length"
            value={length}
            onChange={(e) => setLength(e.target.value)}
            disabled={isGenerating || disabled}
            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm text-zinc-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50 dark:focus:border-blue-400 dark:disabled:bg-zinc-900"
          >
            <option value="">Any length</option>
            <option value="short">Short</option>
            <option value="medium">Medium</option>
            <option value="long">Long</option>
          </select>
        </div>

        <div>
          <label htmlFor="ai-section" className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
            Section Type (optional)
          </label>
          <select
            id="ai-section"
            value={sectionType}
            onChange={(e) => setSectionType(e.target.value)}
            disabled={isGenerating || disabled}
            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm text-zinc-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50 dark:focus:border-blue-400 dark:disabled:bg-zinc-900"
          >
            <option value="">Any section</option>
            <option value="intro">Introduction</option>
            <option value="body">Body Content</option>
            <option value="conclusion">Conclusion</option>
            <option value="header">Header</option>
            <option value="footer">Footer</option>
          </select>
        </div>
      </div>

      {/* Generate Button */}
      <button
        type="submit"
        disabled={!prompt.trim() || isGenerating || disabled}
        className="w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-zinc-300 disabled:text-zinc-500 dark:bg-blue-500 dark:hover:bg-blue-600 dark:disabled:bg-zinc-700 dark:disabled:text-zinc-400"
      >
        {isGenerating ? "Generating..." : "Generate"}
      </button>
    </form>
  );
}
