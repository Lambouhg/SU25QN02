"use client";

import React, { useMemo, useState } from "react";

type AnswerItem = { content: string; isCorrect?: boolean };
interface GeneratedEditable {
  question: string;
  answers: AnswerItem[];
  fields: string[]; // category
  topics: string[]; // skill
  levels: string[]; // job role level
  explanation?: string;
}

// API payload shape returned from /api/questions/generate
interface ApiGeneratedItem {
  question: string;
  answers?: AnswerItem[];
  fields?: string[];
  topics?: string[];
  levels?: string[];
  explanation?: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  fields: string[]; // categories
  topics: string[]; // skills
  onGenerated: () => void;
  topicsByField?: Record<string, string[]>; // skills by category
  levelsOptions?: string[]; // levels from job roles
}

export default function AIQuestionGenerator({ open, onClose, fields, topics, onGenerated, topicsByField = {}, levelsOptions = ['Junior','Mid','Senior'] }: Props) {
  const [field, setField] = useState("");
  const [topic, setTopic] = useState("");
  const [level, setLevel] = useState(levelsOptions[0] || "Junior");
  const [count, setCount] = useState(5);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [generated, setGenerated] = useState<GeneratedEditable[] | null>(null);
  const [saving, setSaving] = useState(false);

  const filteredTopics = useMemo(() => {
    if (!field) return topics;
    const list = topicsByField[field];
    return (list && list.length > 0) ? list : topics;
  }, [field, topicsByField, topics]);

  const canRequest = field && topic && level && count > 0 && count <= 50;

  const handleGenerate = async () => {
    if (!canRequest) return;
    setLoading(true);
    setError(null);
    setGenerated(null);
    try {
      const res = await fetch('/api/questions/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ field, topic, level, count })
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error || 'Failed to generate');
        return;
      }
      const list: ApiGeneratedItem[] = (data?.data as ApiGeneratedItem[]) ?? [];
      const items: GeneratedEditable[] = list.map((q) => ({
        question: q.question,
        answers: Array.isArray(q.answers) ? q.answers : [],
        fields: q.fields && q.fields.length ? q.fields : [field],
        topics: q.topics && q.topics.length ? q.topics : [topic],
        levels: q.levels && q.levels.length ? q.levels : [level],
        explanation: q.explanation || ''
      }));
      setGenerated(items);
    } catch {
      setError('Failed to generate');
    } finally {
      setLoading(false);
    }
  };

  const updateAnswer = (qi: number, ai: number, patch: Partial<AnswerItem>) => {
    if (!generated) return;
    setGenerated(prev => {
      if (!prev) return prev;
      const clone = [...prev];
      const q = { ...clone[qi] };
      const ans = q.answers.map((a, i) => (i === ai ? { ...a, ...patch } : a));
      clone[qi] = { ...q, answers: ans };
      return clone;
    });
  };

  const setOnlyCorrect = (qi: number, ai: number) => {
    if (!generated) return;
    setGenerated(prev => {
      if (!prev) return prev;
      const clone = [...prev];
      const q = { ...clone[qi] };
      const ans = q.answers.map((a, i) => ({ ...a, isCorrect: i === ai }));
      clone[qi] = { ...q, answers: ans };
      return clone;
    });
  };

  const addAnswer = (qi: number) => {
    if (!generated) return;
    setGenerated(prev => {
      if (!prev) return prev;
      const clone = [...prev];
      const q = { ...clone[qi] };
      clone[qi] = { ...q, answers: [...q.answers, { content: "", isCorrect: false }] };
      return clone;
    });
  };

  const removeAnswer = (qi: number, ai: number) => {
    if (!generated) return;
    setGenerated(prev => {
      if (!prev) return prev;
      const clone = [...prev];
      const q = { ...clone[qi] };
      clone[qi] = { ...q, answers: q.answers.filter((_, i) => i !== ai) };
      return clone;
    });
  };

  const updateQuestion = (qi: number, patch: Partial<GeneratedEditable>) => {
    if (!generated) return;
    setGenerated(prev => {
      if (!prev) return prev;
      const clone = [...prev];
      clone[qi] = { ...clone[qi], ...patch };
      return clone;
    });
  };

  const duplicateQuestion = (qi: number) => {
    if (!generated) return;
    setGenerated(prev => {
      if (!prev) return prev;
      const clone = [...prev];
      clone.splice(qi + 1, 0, JSON.parse(JSON.stringify(clone[qi])) as GeneratedEditable);
      return clone;
    });
  };

  const removeQuestion = (qi: number) => {
    if (!generated) return;
    setGenerated(prev => {
      if (!prev) return prev;
      return prev.filter((_, i) => i !== qi);
    });
  };

  const validToSave = (generated ?? []).every(q => q.question.trim() && q.answers.some(a => a.isCorrect) && q.answers.every(a => a.content.trim()));

  const handleSaveAll = async () => {
    if (!generated || generated.length === 0) return;
    if (!validToSave) { setError('Each question needs text, non-empty answers and at least one correct answer.'); return; }
    setSaving(true);
    setError(null);
    try {
      for (const q of generated) {
        await fetch('/api/questions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(q)
        });
      }
      onGenerated();
      onClose();
    } catch {
      setError('Failed to save questions');
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  // Helper: letter label for answers
  const letters = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];

  return (
    <div className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-5xl border overflow-hidden">
        {/* Header */}
        <div className="relative bg-gradient-to-r from-indigo-600 to-violet-600 text-white px-6 py-5">
          <h3 className="text-lg font-semibold">AI Question Generator</h3>
          <p className="text-xs/relaxed opacity-90">Draft questions with AI, review and edit before saving to your bank</p>
          <button onClick={onClose} aria-label="Close" className="absolute right-4 top-4 rounded-md bg-white/10 hover:bg-white/20 px-2 py-1">✕</button>
          {(loading || saving) && (
            <div className="absolute left-0 right-0 -bottom-0.5 h-1 bg-white/20">
              <div className={`h-full ${loading ? 'bg-amber-300' : 'bg-emerald-300'} animate-[progress_1.2s_ease-in-out_infinite]`} style={{ width: '45%' }} />
            </div>
          )}
        </div>

        {/* Body */}
        <div className="p-6">
          {!generated ? (
            // Configure step
            <div className="space-y-6">
              <div className="text-sm text-gray-600">Step 1 of 2 · Configure generation</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium mb-1">Field</label>
                  <select aria-label="Field" className="w-full border rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" value={field} onChange={(e) => { setField(e.target.value); setTopic(""); }}>
                    <option value="">Select field</option>
                    {fields.map((f) => (<option key={f} value={f}>{f}</option>))}
                  </select>
                  <p className="mt-1 text-xs text-gray-500">Choose the broader area the topic belongs to.</p>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Topic</label>
                  <select aria-label="Topic" className="w-full border rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" value={topic} onChange={(e) => setTopic(e.target.value)}>
                    <option value="">Select topic</option>
                    {filteredTopics.map((t) => (<option key={t} value={t}>{t}</option>))}
                  </select>
                  <p className="mt-1 text-xs text-gray-500">Topics are filtered by the selected field.</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium mb-1">Level</label>
                  <div className="flex items-center gap-2">
                    {levelsOptions.map(opt => (
                      <button key={opt} type="button" onClick={() => setLevel(opt)} className={`px-3 py-1.5 rounded-full text-sm border transition ${level === opt ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}>{opt}</button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Count: <span className="font-semibold">{count}</span></label>
                  <input aria-label="Count" type="range" min={1} max={50} value={count} onChange={(e) => setCount(Number(e.target.value))} className="w-full accent-indigo-600" />
                  <p className="mt-1 text-xs text-gray-500">1–50 questions per request</p>
                </div>
              </div>
              {error && <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">{error}</div>}
              <div className="flex justify-end gap-2">
                <button onClick={onClose} className="px-3 py-2 border rounded-lg hover:bg-gray-50">Cancel</button>
                <button disabled={!canRequest || loading} onClick={handleGenerate} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg disabled:opacity-50 shadow-sm">{loading ? 'Generating…' : 'Generate'}</button>
              </div>
            </div>
          ) : (
            // Review step
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="text-sm text-gray-600">Step 2 of 2 · Review & edit</div>
                  <span className="text-xs bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-full">{generated.length} items</span>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setGenerated(null)} className="px-3 py-2 border rounded-lg hover:bg-gray-50">Back</button>
                  <button disabled={!validToSave || saving} onClick={handleSaveAll} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg disabled:opacity-50 shadow-sm">{saving ? 'Saving…' : 'Save All'}</button>
                </div>
              </div>

              {error && <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">{error}</div>}

              <div className="max-h-[60vh] overflow-auto space-y-4 pr-1">
                {generated.map((q, qi) => {
                  const hasCorrect = q.answers.some(a => a.isCorrect);
                  return (
                    <div key={qi} className={`rounded-xl p-4 border ${hasCorrect ? 'border-gray-200' : 'border-red-300'} bg-white`}>
                      {/* Card header */}
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full">Q{qi + 1}</span>
                          {!hasCorrect && <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">Needs correct answer</span>}
                        </div>
                        <div className="flex items-center gap-2">
                          <button type="button" onClick={() => duplicateQuestion(qi)} className="text-sm px-2 py-1 border rounded-md hover:bg-gray-50">Duplicate</button>
                          <button type="button" onClick={() => removeQuestion(qi)} className="text-sm px-2 py-1 bg-red-600 text-white rounded-md hover:bg-red-700">Remove</button>
                        </div>
                      </div>

                      <label className="block text-sm font-medium mb-1">Question</label>
                      <textarea aria-label={`Question ${qi+1}`} className="w-full border rounded-lg p-2 mb-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" rows={2} value={q.question} onChange={(e) => updateQuestion(qi, { question: e.target.value })} />

                      <div className="mb-3">
                        <div className="flex items-center justify-between mb-2">
                          <label className="block text-sm font-medium">Answers</label>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-500">Tip: click Only to set single-correct</span>
                            <button type="button" onClick={() => addAnswer(qi)} className="text-sm text-indigo-600 hover:text-indigo-700">+ Add</button>
                          </div>
                        </div>
                        <div className="space-y-2">
                          {q.answers.map((a, ai) => (
                            <div key={ai} className="flex items-center gap-2">
                              <span className={`shrink-0 w-6 h-6 rounded-full text-xs flex items-center justify-center border ${a.isCorrect ? 'bg-green-600 text-white border-green-600' : 'bg-gray-100 text-gray-700 border-gray-300'}`}>{letters[ai] || ai + 1}</span>
                              <input aria-label={`Answer ${ai+1}`} className="flex-1 border rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" value={a.content} onChange={(e) => updateAnswer(qi, ai, { content: e.target.value })} />
                              <label className="flex items-center gap-1 text-sm select-none">
                                <input type="checkbox" checked={!!a.isCorrect} onChange={() => updateAnswer(qi, ai, { isCorrect: !a.isCorrect })} />
                                Correct
                              </label>
                              <button type="button" onClick={() => setOnlyCorrect(qi, ai)} className="text-xs px-2 py-1 border rounded-md hover:bg-gray-50">Only</button>
                              <button type="button" onClick={() => removeAnswer(qi, ai)} className="text-sm text-red-600 hover:text-red-700">Remove</button>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div>
                          <label className="block text-sm font-medium mb-1">Fields</label>
                          <input aria-label="Fields" className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" value={q.fields.join(', ')} onChange={(e) => updateQuestion(qi, { fields: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })} />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">Topics</label>
                          <input aria-label="Topics" className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" value={q.topics.join(', ')} onChange={(e) => updateQuestion(qi, { topics: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })} />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">Levels</label>
                          <input aria-label="Levels" className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" value={q.levels.join(', ')} onChange={(e) => updateQuestion(qi, { levels: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })} />
                        </div>
                      </div>

                      <div className="mt-3">
                        <label className="block text-sm font-medium mb-1">Explanation</label>
                        <textarea aria-label="Explanation" className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" rows={2} value={q.explanation || ''} onChange={(e) => updateQuestion(qi, { explanation: e.target.value })} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
