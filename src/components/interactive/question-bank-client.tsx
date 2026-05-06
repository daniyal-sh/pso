"use client";

import { useMemo, useState } from "react";
import { Icon } from "@/components/icon";
import { Badge } from "@/components/sections/common";
import { questionTopics, sampleQuestions } from "@/lib/data";
import { cn } from "@/lib/utils";

const tabs = ["MCQs", "Long Problems", "Solved Sets", "Bookmarked", "Community Solutions"];
const difficulties = [
  { label: "Easy", count: "12,315", color: "bg-emerald" },
  { label: "Medium", count: "45,672", color: "bg-gold" },
  { label: "Hard", count: "26,890", color: "bg-red-500" },
];
const examTypes = ["NSTC", "INO", "IOP", "IPhO", "Other Olympiads"];

export function QuestionBankClient() {
  const [topic, setTopic] = useState(questionTopics[0].title);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showSolution, setShowSolution] = useState(false);
  const question = sampleQuestions[questionIndex];

  const filteredTopics = useMemo(() => questionTopics, []);

  function pickQuestion(index: number) {
    setQuestionIndex(index);
    setSelectedAnswer(null);
    setShowSolution(false);
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[260px_1fr_320px]">
      <aside className="card-surface rounded-md p-5">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-sm font-black uppercase text-charcoal">Filters</h2>
          <button className="text-xs font-black text-emerald" type="button">
            Clear all
          </button>
        </div>

        <div className="space-y-5">
          <label className="block">
            <span className="text-sm font-bold text-charcoal">Subject</span>
            <select className="mt-2 w-full rounded-md border border-navy/10 bg-white px-3 py-2 text-sm font-semibold text-charcoal">
              <option>All Subjects</option>
              <option>Physics</option>
              <option>Chemistry</option>
              <option>Mathematics</option>
            </select>
          </label>
          <label className="flex items-center gap-2 rounded-md border border-navy/10 bg-white px-3 py-2 text-sm text-charcoal/60">
            <input className="min-w-0 flex-1 bg-transparent outline-none" placeholder="Search topics..." />
            <Icon name="search" className="h-4 w-4" />
          </label>
          <label className="block">
            <span className="text-sm font-bold text-charcoal">Topic</span>
            <select className="mt-2 w-full rounded-md border border-navy/10 bg-white px-3 py-2 text-sm font-semibold text-charcoal" value={topic} onChange={(event) => setTopic(event.target.value)}>
              {questionTopics.map((item) => (
                <option key={item.title}>{item.title}</option>
              ))}
            </select>
          </label>
          <div>
            <h3 className="text-sm font-bold text-charcoal">Difficulty</h3>
            <div className="mt-2 space-y-2">
              {difficulties.map((difficulty) => (
                <label key={difficulty.label} className="flex items-center justify-between text-sm text-charcoal/75">
                  <span className="flex items-center gap-2">
                    <span className={cn("h-3 w-3 rounded-sm", difficulty.color)} />
                    {difficulty.label}
                  </span>
                  <span>{difficulty.count}</span>
                </label>
              ))}
            </div>
          </div>
          <div>
            <h3 className="text-sm font-bold text-charcoal">Exam Type</h3>
            <div className="mt-2 space-y-2">
              {examTypes.map((exam, index) => (
                <label key={exam} className="flex items-center justify-between text-sm text-charcoal/75">
                  <span className="flex items-center gap-2">
                    <input type="checkbox" defaultChecked={index === 0} />
                    {exam}
                  </span>
                  <span>{[34210, 12045, 10510, 8230, 20315][index].toLocaleString()}</span>
                </label>
              ))}
            </div>
          </div>
          <button className="w-full rounded-md bg-emerald px-4 py-3 text-sm font-black text-white shadow-lg shadow-emerald/20" type="button">
            Apply Filters
          </button>
        </div>
      </aside>

      <section className="space-y-5">
        <div className="card-surface overflow-hidden rounded-md">
          <div className="grid border-b border-navy/10 sm:grid-cols-5">
            {tabs.map((tab, index) => (
              <button
                key={tab}
                type="button"
                className={cn(
                  "flex min-h-12 items-center justify-center gap-2 border-r border-navy/10 px-3 text-sm font-black text-charcoal last:border-r-0",
                  index === 0 && "bg-emerald text-white",
                )}
              >
                <Icon name={index === 0 ? "list-checks" : index === 1 ? "book-open" : "bookmark"} className="h-4 w-4" />
                {tab}
              </button>
            ))}
          </div>
          <div className="p-5">
            <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm font-semibold text-charcoal/70">Showing 1-12 of 12,560 questions</p>
              <select className="rounded-md border border-navy/10 bg-white px-3 py-2 text-sm font-bold text-charcoal">
                <option>Most Relevant</option>
                <option>Newest</option>
                <option>Hardest</option>
              </select>
            </div>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {filteredTopics.slice(0, 4).map((item) => (
                <button
                  key={item.title}
                  onClick={() => setTopic(item.title)}
                  type="button"
                  className={cn("rounded-md border p-4 text-left transition", item.title === topic ? "border-emerald bg-mint" : "border-navy/10 bg-white")}
                >
                  <Icon name={item.icon} className="h-8 w-8 text-emerald" />
                  <h3 className="mt-3 font-black text-charcoal">{item.title}</h3>
                  <p className="text-sm text-charcoal/70">{item.subject}</p>
                  <div className="mt-3 grid grid-cols-3 gap-2 text-xs text-charcoal/70">
                    <span>{item.questions} Questions</span>
                    <span>{item.attempts} Attempts</span>
                    <span>Avg. {item.average}</span>
                  </div>
                  <div className="mt-3 h-2 rounded-full bg-cool">
                    <div className="h-2 w-3/4 rounded-full bg-emerald" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="card-surface rounded-md p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-sm font-black uppercase text-charcoal">Question Preview</h2>
            <span className="text-sm font-bold text-charcoal/60">Q. ID: {question.id}</span>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {[question.subject, question.topic, question.difficulty, question.exam].map((tag) => (
              <Badge key={tag}>{tag}</Badge>
            ))}
          </div>
          <p className="mt-5 text-base leading-8 text-charcoal">{question.prompt}</p>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {question.options.map((option, index) => {
              const chosen = selectedAnswer === index;
              const correct = showSolution && question.answer === index;
              return (
                <button
                  key={option}
                  onClick={() => setSelectedAnswer(index)}
                  type="button"
                  className={cn(
                    "flex min-h-12 items-center gap-3 rounded-md border px-4 text-left text-sm font-bold transition",
                    chosen ? "border-emerald bg-mint text-emerald" : "border-navy/10 bg-white text-charcoal",
                    correct && "border-emerald bg-emerald text-white",
                  )}
                >
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-navy/5 text-xs font-black">{String.fromCharCode(65 + index)}</span>
                  {option}
                </button>
              );
            })}
          </div>
          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm font-semibold text-charcoal/70">
              Solved by 1,842 students. Your success rate: <span className="font-black text-emerald">72%</span>
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowSolution((value) => !value)}
                className="inline-flex items-center gap-2 rounded-md border border-navy/10 bg-white px-5 py-2.5 text-sm font-black text-charcoal"
                type="button"
              >
                <Icon name="eye" className="h-4 w-4" />
                {showSolution ? "Hide Solution" : "View Solution"}
              </button>
              <button
                onClick={() => pickQuestion((questionIndex + 1) % sampleQuestions.length)}
                className="inline-flex items-center gap-2 rounded-md bg-emerald px-5 py-2.5 text-sm font-black text-white"
                type="button"
              >
                Solve Now
                <Icon name="chevron" className="h-4 w-4" />
              </button>
            </div>
          </div>
          {showSolution && (
            <div className="mt-5 rounded-md border border-emerald/20 bg-mint p-4">
              <h3 className="font-black text-emerald">Solution</h3>
              <p className="mt-2 text-sm leading-7 text-charcoal/80">{question.solution}</p>
            </div>
          )}
        </div>
      </section>

      <aside className="space-y-5">
        <div className="card-surface rounded-md p-5">
          <h2 className="flex items-center gap-2 text-sm font-black uppercase text-charcoal">
            <Icon name="sparkles" className="h-5 w-5 text-gold" /> Your Streak
          </h2>
          <div className="mt-4 text-5xl font-black text-emerald">12 days</div>
          <p className="mt-1 text-sm font-semibold text-charcoal/70">Keep it going.</p>
          <div className="mt-5 grid grid-cols-7 gap-2">
            {"MTWTFSS".split("").map((day) => (
              <div key={day} className="text-center text-xs font-black text-charcoal/60">
                <span>{day}</span>
                <span className="mt-2 flex h-7 w-7 items-center justify-center rounded-full bg-emerald text-white">
                  <Icon name="check" className="h-3 w-3" />
                </span>
              </div>
            ))}
          </div>
          <div className="mt-5 h-2 rounded-full bg-cool">
            <div className="h-2 w-[86%] rounded-full bg-emerald" />
          </div>
        </div>

        <div className="card-surface rounded-md p-5">
          <h2 className="flex items-center gap-2 text-sm font-black uppercase text-charcoal">
            <Icon name="trophy" className="h-5 w-5 text-gold" /> Top Practitioners
          </h2>
          <div className="mt-4 space-y-3">
            {["Ahmad R.", "Zainab K.", "Muhammad H.", "Sarah A.", "Ali M."].map((name, index) => (
              <div key={name} className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 font-bold text-charcoal">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-mint text-xs text-emerald">{index + 1}</span>
                  {name}
                </span>
                <span className="font-black text-charcoal/70">{4250 - index * 390} pts</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card-surface rounded-md p-5">
          <h2 className="text-sm font-black uppercase text-charcoal">Recent community solutions</h2>
          <div className="mt-4 space-y-3 text-sm">
            {["Kinematics - Projectile Motion", "Stoichiometry - Limiting Reagent", "Number Theory - Congruences"].map((item) => (
              <div key={item} className="flex items-center gap-3">
                <Icon name="book-open" className="h-5 w-5 text-emerald" />
                <div>
                  <p className="font-bold text-charcoal">{item}</p>
                  <p className="text-xs text-charcoal/60">Solved by community</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </aside>
    </div>
  );
}
