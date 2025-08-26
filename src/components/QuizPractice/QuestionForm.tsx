"use client";

import React, { useState, useEffect, useMemo } from "react";

export interface AnswerItem {
  content: string;
  isCorrect?: boolean;
}

export interface QuestionPayload {
  id?: string;
  question: string;
  answers: AnswerItem[];
  fields: string[];
  topics: string[];
  levels: string[];
  explanation?: string;
}

interface QuestionFormProps {
  open: boolean;
  onClose: () => void;
  initial?: QuestionPayload | null;
  onSubmit: (data: QuestionPayload) => Promise<void> | void;
  fieldsOptions?: string[];
  topicsOptions?: string[];
  topicsByField?: Record<string, string[]>;
  levelsOptions?: string[]; // job role levels (e.g., Junior/Mid/Senior/Lead)
}

export default function QuestionForm({ open, onClose, initial, onSubmit, fieldsOptions = [], topicsOptions = [], topicsByField = {}, levelsOptions = ["Junior","Mid","Senior"] }: QuestionFormProps) {
  const [question, setQuestion] = useState("");
  const [answers, setAnswers] = useState<AnswerItem[]>([{ content: "", isCorrect: false }]);
  const [fields, setFields] = useState<string>("");
  const [topics, setTopics] = useState<string>("");
  const [levels, setLevels] = useState<string[]>([]); // quiz levels: junior/middle/senior
  const [explanation, setExplanation] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);

  const letters = ['A','B','C','D','E','F','G'];

  // Map job role level label to quiz level value
  const toQuizLevel = (label: string) => {
    const m = (label || '').toLowerCase();
    if (m === 'mid') return 'middle';
    if (m === 'lead') return 'senior'; // best-fit mapping
    return m; // junior/senior already fine
  };

  useEffect(() => {
    if (initial) {
      setQuestion(initial.question || "");
      setAnswers(initial.answers && Array.isArray(initial.answers) ? initial.answers : [{ content: "", isCorrect: false }]);
      setFields((initial.fields || []).join(", "));
      setTopics((initial.topics || []).join(", "));
      setLevels(initial.levels || []);
      setExplanation(initial.explanation || "");
    } else {
      setQuestion("");
      setAnswers([{ content: "", isCorrect: false }]);
      setFields("");
      setTopics("");
      setLevels([]);
      setExplanation("");
    }
  }, [initial, open]);

  const addAnswer = () => setAnswers((prev) => [...prev, { content: "", isCorrect: false }]);
  const removeAnswer = (index: number) => setAnswers((prev) => prev.filter((_, i) => i !== index));
  const updateAnswer = (index: number, patch: Partial<AnswerItem>) =>
    setAnswers((prev) => prev.map((a, i) => (i === index ? { ...a, ...patch } : a)));

  const toggleCorrect = (index: number) =>
    setAnswers((prev) => prev.map((a, i) => (i === index ? { ...a, isCorrect: !a.isCorrect } : a)));

  const setOnlyCorrect = (index: number) =>
    setAnswers((prev) => prev.map((a, i) => ({ ...a, isCorrect: i === index })));

  const splitCsv = (s: string) => s.split(",").map((x) => x.trim()).filter(Boolean);

  const validity = useMemo(() => {
    const trimmedAnswers = answers.filter(a => a.content.trim());
    return {
      hasMinAnswers: trimmedAnswers.length >= 2,
      hasCorrect: trimmedAnswers.some(a => a.isCorrect),
      hasQuestion: question.trim().length > 0,
      hasLevel: levels.length > 0,
    };
  }, [answers, question, levels]);

  const canSubmit = validity.hasQuestion && validity.hasMinAnswers && validity.hasCorrect && validity.hasLevel;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      const payload: QuestionPayload = {
        id: initial?.id,
        question,
        answers: answers.filter((a) => a.content.trim().length > 0),
        fields: splitCsv(fields),
        topics: splitCsv(topics),
        levels,
        explanation: explanation || undefined,
      };
      await onSubmit(payload);
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  const toggleTokenInList = (currentCsv: string, token: string, setter: (v: string) => void) => {
    const arr = splitCsv(currentCsv);
    const exists = arr.includes(token);
    const next = exists ? arr.filter(x => x !== token) : [...arr, token];
    setter(next.join(", "));
  };

  const selectedFields = splitCsv(fields);
  const allowedTopics = useMemo(() => {
    if (selectedFields.length === 0) return topicsOptions;
    const set = new Set<string>();
    selectedFields.forEach(f => {
      const list = topicsByField[f];
      if (list) list.forEach(t => set.add(t));
    });
    return Array.from(set);
  }, [selectedFields, topicsByField, topicsOptions]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl border overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b bg-gradient-to-r from-indigo-50 to-white">
          <div>
            <h3 className="text-lg font-semibold">{initial ? "Edit Question" : "Create Question"}</h3>
            <p className="text-xs text-gray-500">Provide at least 2 answers and mark one as correct</p>
          </div>
          <button onClick={onClose} className="text-gray-600 hover:text-gray-800 rounded-md hover:bg-gray-100 px-2 py-1">✕</button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <div className="flex items-center justify-between">
              <label className="block text-sm font-medium mb-1">Question</label>
              <span className="text-xs text-gray-400">{question.length}/500</span>
            </div>
            <textarea maxLength={500} className={`w-full border rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${!validity.hasQuestion ? 'border-red-300' : ''}`} rows={3} value={question} onChange={(e) => setQuestion(e.target.value)} placeholder="E.g. What is the difference between var, let and const?" />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-medium">Answers</label>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                {!validity.hasMinAnswers && <span className="text-red-600">Need ≥ 2 answers</span>}
                {!validity.hasCorrect && <span className="text-red-600">Mark a correct answer</span>}
                <button type="button" onClick={addAnswer} className="text-sm text-indigo-600 hover:text-indigo-700">+ Add</button>
              </div>
            </div>
            <div className="space-y-2">
              {answers.map((ans, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className={`shrink-0 w-6 h-6 rounded-full text-xs flex items-center justify-center border ${ans.isCorrect ? 'bg-green-600 text-white border-green-600' : 'bg-gray-100 text-gray-700 border-gray-300'}`}>{letters[i] || i + 1}</span>
                  <input className={`flex-1 border rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500`} placeholder={`Answer #${i + 1}`} value={ans.content} onChange={(e) => updateAnswer(i, { content: e.target.value })} />
                  <label className="flex items-center gap-1 text-sm">
                    <input type="checkbox" checked={!!ans.isCorrect} onChange={() => toggleCorrect(i)} />
                    Correct
                  </label>
                  <button type="button" onClick={() => setOnlyCorrect(i)} className="text-xs px-2 py-1 border rounded-md hover:bg-gray-50">Only</button>
                  <button type="button" onClick={() => removeAnswer(i)} className="text-sm text-red-600">Remove</button>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">Fields (comma separated)</label>
              <input className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" value={fields} onChange={(e) => setFields(e.target.value)} placeholder="E.g. Frontend Development" />
              {fieldsOptions.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {fieldsOptions.map(opt => (
                    <button key={opt} type="button" onClick={() => toggleTokenInList(fields, opt, setFields)} className={`text-xs px-2 py-1 rounded-full border ${splitCsv(fields).includes(opt) ? 'bg-blue-600 text-white border-blue-600' : 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100'}`}>{opt}</button>
                  ))}
                </div>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Topics (comma separated)</label>
              <input className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" value={topics} onChange={(e) => setTopics(e.target.value)} placeholder="E.g. React, TypeScript" />
              {(allowedTopics.length > 0 ? allowedTopics : topicsOptions).length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {(allowedTopics.length > 0 ? allowedTopics : topicsOptions).map(opt => (
                    <button key={opt} type="button" onClick={() => toggleTokenInList(topics, opt, setTopics)} className={`text-xs px-2 py-1 rounded-full border ${splitCsv(topics).includes(opt) ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100'}`}>{opt}</button>
                  ))}
                </div>
              )}
              {selectedFields.length > 0 && <p className="mt-1 text-xs text-gray-500">Topics filtered by selected field(s).</p>}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Levels</label>
            <div className="flex items-center gap-3 text-sm flex-wrap">
              {levelsOptions.map((label) => {
                const key = toQuizLevel(label);
                const active = levels.includes(key);
                return (
                  <button
                    key={label}
                    type="button"
                    onClick={() => setLevels(prev => active ? prev.filter(x=>x!==key) : [...prev, key])}
                    className={`px-3 py-1.5 rounded-full border transition ${active ? 'bg-green-600 text-white border-green-600' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
            {!validity.hasLevel && <p className="mt-1 text-xs text-red-600">Select at least one level.</p>}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Explanation (optional)</label>
            <textarea className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" rows={2} value={explanation} onChange={(e) => setExplanation(e.target.value)} placeholder="Explain the concept behind the correct answer" />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="px-3 py-2 border rounded-lg hover:bg-gray-50">Cancel</button>
            <button disabled={submitting || !canSubmit} type="submit" className="px-3 py-2 bg-indigo-600 text-white rounded-lg disabled:opacity-50 hover:bg-indigo-700 shadow-sm">
              {submitting ? "Saving..." : initial ? "Update" : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
