"use client";

import { CheckCircle2, CircleDashed, Layers3 } from "lucide-react";
import type { SubtitleLine, WordCard } from "@/lib/types";

type WordCardPanelProps = {
  activeLine: SubtitleLine;
  wordCards: WordCard[];
};

export function WordCardPanel({ activeLine, wordCards }: WordCardPanelProps) {
  const cards = wordCards.filter((card) =>
    activeLine.wordCardIds.includes(card.id),
  );

  return (
    <section className="rounded-lg border border-[#e5deef] bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase text-[#7c3aed]">
            word cards
          </p>
          <h2 className="mt-1 text-lg font-black">单词卡</h2>
        </div>
        <span className="grid size-9 place-items-center rounded-lg bg-[#f0fdf4] text-[#15803d]">
          <Layers3 size={18} />
        </span>
      </div>

      <div className="mt-4 space-y-3">
        {cards.map((card) => (
          <article
            key={card.id}
            className="rounded-lg border border-[#eee8f5] bg-[#fbfaff] p-3"
          >
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-base font-black text-[#171421]">
                {card.term}
              </h3>
              <span className="flex items-center gap-1 rounded-md bg-white px-2 py-1 text-xs font-black text-[#62586f]">
                {card.status === "known" ? (
                  <CheckCircle2 size={14} className="text-[#16a34a]" />
                ) : (
                  <CircleDashed size={14} className="text-[#7c3aed]" />
                )}
                {card.status}
              </span>
            </div>
            <p className="mt-2 text-sm leading-6 text-[#62586f]">
              {card.meaning}
            </p>
            <p className="mt-2 rounded-md bg-white px-3 py-2 text-sm font-semibold leading-6 text-[#352a42]">
              {card.example}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}
