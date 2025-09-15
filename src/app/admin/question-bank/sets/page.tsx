"use client";
import React, { useEffect, useState, useMemo } from "react";
import { Plus, Search, Filter, Users, Settings, Trash2, AlertCircle } from "lucide-react";

type QuestionItem = { id: string; stem: string; type?: string; level?: string | null };
type SetItem = { questionId: string; order?: number; section?: string; weight?: number; isRequired?: boolean; timeSuggestion?: number | null; question?: QuestionItem };
type QuestionSet = { id: string; name: string; status: string; version: number; level?: string | null; skills?: string[]; items: SetItem[] };
type Paged<T> = { data: T[]; page: number; pageSize: number; total: number };

export default function AdminQuestionSetsPage() {
  const [sets, setSets] = useState<QuestionSet[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const query = useMemo(() => {
    const p = new URLSearchParams();
    if (search) p.set("search", search);
    return p.toString();
  }, [search]);

  const [formOpen, setFormOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [level, setLevel] = useState("");
  const [setSkills, setSetSkills] = useState<string>("");
  const [status, setStatus] = useState("draft");
  const [formError, setFormError] = useState<string | null>(null);

  const [editing, setEditing] = useState<QuestionSet | null>(null);
  const [items, setItems] = useState<SetItem[]>([]);
  const [itemsOpen, setItemsOpen] = useState(false);
  // Question picker
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerSearch, setPickerSearch] = useState("");
  const [pickerType, setPickerType] = useState("");
  const [pickerLevel, setPickerLevel] = useState("");
  const [pickerPage, setPickerPage] = useState(1);
  const [pickerSkills, setPickerSkills] = useState("");
  const [pickerList, setPickerList] = useState<QuestionItem[]>([]);
  const [pickerTotal, setPickerTotal] = useState<number>(0);
  const [pickerSel, setPickerSel] = useState<Record<string, boolean>>({});

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/qb2/question-sets?${query}`, { cache: "no-store" });
      const json: Paged<QuestionSet> = await res.json();
      if (!res.ok) {
        const errMsg = (json as unknown as { error?: string })?.error || "Failed to load";
        throw new Error(errMsg);
      }
      setSets(json.data);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  async function submitCreate() {
    // simple validation
    const normalizedLevel = level.trim().toLowerCase();
    if (!name.trim()) { setFormError("Name là bắt buộc"); return; }
    if (normalizedLevel && !["junior","middle","senior"].includes(normalizedLevel)) { setFormError("Level phải là junior/middle/senior hoặc để trống"); return; }
    setFormError(null);

    const payload: { name: string; level?: string; skills?: string[]; description?: string; status?: string } = { name };
    if (level) payload.level = level;
    if (setSkills) payload.skills = setSkills.split(",").map(s=>s.trim()).filter(Boolean);
    if (description) payload.description = description;
    if (status) payload.status = status;
    const res = await fetch("/api/admin/qb2/question-sets", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    const j = await res.json();
    if (!res.ok) {
      alert((j as { error?: string })?.error || "Create failed");
      return;
    }
    setFormOpen(false);
    await load();
  }

  async function remove(id: string) {
    const confirmMessage = "Are you sure you want to delete this question set?\n\nThis will also delete:\n• All quiz attempts using this set\n• All question associations in this set\n\nThis action cannot be undone.";
    
    if (!confirm(confirmMessage)) return;
    
    try {
      const res = await fetch(`/api/admin/qb2/question-sets/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const j = await res.json();
        alert((j as { error?: string })?.error || "Delete failed");
        return;
      }
      
      const result = await res.json();
      if (result.deleted) {
        const { quizAttempts, questionLinks } = result.deleted;
        let message = "Question set deleted successfully!";
        if (quizAttempts > 0 || questionLinks > 0) {
          message += `\n\nAlso deleted:\n`;
          if (quizAttempts > 0) message += `• ${quizAttempts} quiz attempt(s)\n`;
          if (questionLinks > 0) message += `• ${questionLinks} question link(s)\n`;
        }
        alert(message);
      }
      
      await load();
    } catch (error) {
      console.error("Delete error:", error);
      alert("An unexpected error occurred while deleting the question set. Please try again.");
    }
  }

  async function openItems(set: QuestionSet) {
    setEditing(set);
    const res = await fetch(`/api/admin/qb2/question-sets/${set.id}/items`, { cache: "no-store" });
    const j = await res.json();
    setItems((j as { data?: SetItem[] })?.data || []);
    setItemsOpen(true);
  }

  function updateItem(idx: number, patch: Partial<SetItem>) {
    setItems((prev) => prev.map((it, i) => (i === idx ? { ...it, ...patch } : it)));
  }

  function addItem() {
    setItems((prev) => [...prev, { questionId: "", order: prev.length }]);
  }

  function removeItem(idx: number) {
    setItems((prev) => prev.filter((_, i) => i !== idx));
  }

  async function saveItems() {
    if (!editing) return;
    const payload = items.map((it, idx) => ({
      questionId: it.questionId,
      order: it.order ?? idx,
      section: it.section || null,
      weight: it.weight ?? 1,
      isRequired: it.isRequired ?? true,
      timeSuggestion: it.timeSuggestion ?? null,
    }));
    const res = await fetch(`/api/admin/qb2/question-sets/${editing.id}/items`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    const j = await res.json();
    if (!res.ok) {
      alert((j as { error?: string })?.error || "Save failed");
      return;
    }
    setItemsOpen(false);
    await load();
  }

  // Picker helpers
  async function loadPicker() {
    console.log("loadPicker called with pickerPage:", pickerPage);
    const p = new URLSearchParams();
    p.set("page", String(pickerPage));
    p.set("pageSize", "10");
    if (pickerSearch) p.set("search", pickerSearch);
    if (pickerType) p.set("type", pickerType);
    if (pickerLevel) p.set("level", pickerLevel);
    if (pickerSkills) p.set("skills", pickerSkills);
    
    const url = `/api/admin/qb2/questions?${p.toString()}`;
    console.log("Fetching:", url);
    
    const res = await fetch(url, { cache: "no-store" });
    const j = await res.json();
    
    console.log("Response status:", res.status);
    console.log("Response data:", j);
    
    if (res.ok) {
      setPickerList(((j as { data?: QuestionItem[] })?.data) || []);
      setPickerTotal(((j as { total?: number })?.total) || 0);
      console.log("Loaded questions:", ((j as { data?: QuestionItem[] })?.data)?.length || 0);
    } else {
      console.error("Failed to load questions:", j);
      alert((j as { error?: string })?.error || "Failed to load questions from question bank");
    }
  }

  useEffect(() => {
    console.log("useEffect triggered - pickerOpen:", pickerOpen);
    if (pickerOpen) {
      console.log("Loading picker...");
      loadPicker();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pickerOpen, pickerPage]);

  function applyPicked() {
    const chosen = pickerList.filter((q) => pickerSel[q.id]);
    if (!chosen.length) { 
      alert("Please select at least one question to add.");
      return; 
    }
    
    // Add selected questions to items
    setItems((prev) => [
      ...prev,
      ...chosen.map((q, i) => ({
        questionId: q.id,
        order: (prev.length + i),
        weight: 1,
        isRequired: true,
        question: q // Include the full question object for display
      })),
    ]);
    
    // Clear selections but keep modal open
    setPickerSel({});
    
    // Show success message
    const count = chosen.length;
    alert(`✅ Successfully added ${count} question${count > 1 ? 's' : ''} to the set!`);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="p-6 space-y-6 max-w-7xl mx-auto">
        {/* Enhanced Header */}
        <div className="bg-white rounded-xl border shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Users className="w-8 h-8 text-green-600" />
                </div>
                Question Sets Management
              </h1>
              <p className="text-gray-600 mt-2">Create and manage curated question collections for specific roles and scenarios</p>
            </div>
            <button 
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 transition-all duration-300 shadow-md hover:shadow-lg transform hover:scale-105" 
              onClick={() => {
                setFormOpen(true);
                setName("");
                setLevel("");
                setSetSkills("");
                setDescription("");
                setStatus("draft");
                setFormError(null);
              }}
            >
              <Plus className="w-5 h-5" />
              Create Question Set
            </button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-xl border shadow-sm p-6">
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">Search Question Sets</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input 
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors" 
                  placeholder="Search by name, skills, or description..."
                  value={search} 
                  onChange={(e) => setSearch(e.target.value)} 
                />
              </div>
            </div>
            <button 
              className="flex items-center gap-2 px-4 py-3 bg-green-50 border border-green-200 text-green-700 rounded-lg hover:bg-green-100 transition-colors" 
              onClick={load} 
              disabled={loading}
            >
              <Filter className="w-4 h-4" />
              {loading ? 'Loading...' : 'Search'}
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <span className="text-red-800 font-medium">Error</span>
            </div>
            <p className="text-red-700 mt-1">{error}</p>
          </div>
        )}

        {/* Question Sets Table */}
        <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h2 className="text-lg font-semibold text-gray-900">Question Sets ({sets.length})</h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name & ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Level</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Skills</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Questions</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Version</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sets.map((s) => (
                  <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{s.name}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        s.status === 'published' ? 'bg-green-100 text-green-800' :
                        s.status === 'draft' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {s.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {s.level ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                          {s.level}
                        </span>
                      ) : (
                        <span className="text-gray-400 text-sm">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {(s.skills||[]).slice(0,2).map((skill, idx) => (
                          <span key={idx} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                            {skill}
                          </span>
                        ))}
                        {(s.skills||[]).length > 2 && (
                          <span className="text-xs text-gray-500">+{(s.skills||[]).length - 2} more</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-900">{s.items?.length ?? 0}</span>
                        <span className="text-xs text-gray-500">questions</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-900">v{s.version}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button 
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-sm bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors" 
                          onClick={() => openItems(s)}
                        >
                          <Settings className="w-4 h-4" />
                          Manage Items
                        </button>
                        <button 
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-sm bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors" 
                          onClick={() => remove(s.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {sets.length === 0 && (
            <div className="text-center py-12">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
                <Users className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No question sets found</h3>
              <p className="text-gray-600 mb-6">Create your first question set to organize questions by role and skill level</p>
              <button
                onClick={() => {
                  setFormOpen(true);
                  setName("");
                  setLevel("");
                  setSetSkills("");
                  setDescription("");
                  setStatus("draft");
                  setFormError(null);
                }}
                className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Create Question Set
              </button>
            </div>
          )}
        </div>
      </div>

      {formOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Create Question Set</h2>
              <button 
                className="text-gray-400 hover:text-gray-600 transition-colors"
                onClick={() => setFormOpen(false)}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Name *</label>
                <input 
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter question set name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Level</label>
                <select 
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                  value={level} 
                  onChange={(e) => setLevel(e.target.value)}
                >
                  <option value="">Select level</option>
                  <option value="junior">Junior</option>
                  <option value="middle">Middle</option>
                  <option value="senior">Senior</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Skills</label>
                <input 
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors" 
                  value={setSkills} 
                  onChange={(e) => setSetSkills(e.target.value)}
                  placeholder="React, JavaScript, TypeScript (comma separated)"
                />
                <p className="text-sm text-gray-500 mt-1">Enter skills separated by commas</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description (optional)</label>
                <textarea 
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors min-h-[80px]" 
                  value={description} 
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe the purpose and content of this question set"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select 
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors" 
                  value={status} 
                  onChange={(e) => setStatus(e.target.value)}
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
              {formError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-red-600" />
                    <span className="text-red-800 text-sm font-medium">{formError}</span>
                  </div>
                </div>
              )}
            </div>
            <div className="flex justify-end gap-3 p-6 bg-gray-50 border-t border-gray-200">
              <button 
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors" 
                onClick={() => setFormOpen(false)}
              >
                Cancel
              </button>
              <button 
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors" 
                onClick={submitCreate}
              >
                Create Question Set
              </button>
            </div>
          </div>
        </div>
      )}

      {itemsOpen && editing && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-7xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-green-50 to-emerald-50">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Manage Questions</h2>
                <p className="text-sm text-gray-600 mt-1">
                  <span className="font-medium">{editing.name}</span> • {items.length} question(s)
                </p>
              </div>
              <button 
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                onClick={() => setItemsOpen(false)}
              >
                <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-auto p-6 space-y-4">
              {items.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-gray-400 text-4xl mb-4">📝</div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No questions yet</h3>
                  <p className="text-gray-600 mb-6">Add questions to this set to get started</p>
                  <div className="flex gap-3 justify-center">
                    <button 
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                      onClick={() => {
                        console.log("Choose from Question Bank clicked");
                        setPickerOpen(true);
                      }}
                    >
                      📚 Choose from Question Bank
                    </button>
                    <button 
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                      onClick={addItem}
                    >
                      ➕ Add Manual Item
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  {items.map((it, idx) => (
                    <div key={idx} className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                      <div className="grid grid-cols-12 gap-4 items-start">
                        {/* Question Display */}
                        <div className="col-span-6">
                          <label className="block text-sm font-medium text-gray-700 mb-2">Question Content</label>
                          <div className="p-3 bg-white rounded-lg border min-h-[80px]">
                            {it.question?.stem ? (
                              <div className="text-sm text-gray-900">{it.question.stem}</div>
                            ) : (
                              <div className="text-gray-500 italic text-sm">
                                Question ID: {it.questionId}
                                <br />
                                <span className="text-xs text-red-500">⚠️ Question not found in database</span>
                              </div>
                            )}
                          </div>
                          {it.question && (
                            <div className="flex items-center gap-2 mt-2">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                it.question.type === 'single_choice' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
                              }`}>
                                {it.question.type === 'single_choice' ? 'Single Choice' : 'Multiple Choice'}
                              </span>
                              {it.question.level && (
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  it.question.level === 'junior' ? 'bg-green-100 text-green-700' :
                                  it.question.level === 'middle' ? 'bg-yellow-100 text-yellow-700' :
                                  'bg-red-100 text-red-700'
                                }`}>
                                  {it.question.level}
                                </span>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Settings */}
                        <div className="col-span-5 grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Order</label>
                            <input 
                              type="number" 
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm" 
                              value={it.order ?? idx} 
                              onChange={(e) => updateItem(idx, { order: Number(e.target.value) })} 
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Weight</label>
                            <input 
                              type="number" 
                              step="0.1" 
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm" 
                              value={it.weight ?? 1} 
                              onChange={(e) => updateItem(idx, { weight: Number(e.target.value) })} 
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Section</label>
                            <input 
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm" 
                              placeholder="Optional section name"
                              value={it.section || ''} 
                              onChange={(e) => updateItem(idx, { section: e.target.value })} 
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Time (min)</label>
                            <input 
                              type="number" 
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm" 
                              placeholder="Auto"
                              value={it.timeSuggestion ?? ''} 
                              onChange={(e) => updateItem(idx, { timeSuggestion: e.target.value ? Number(e.target.value) : null })} 
                            />
                          </div>
                          <div className="col-span-2 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <input 
                                type="checkbox" 
                                id={`required-${idx}`}
                                checked={!!it.isRequired} 
                                onChange={(e) => updateItem(idx, { isRequired: e.target.checked })}
                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                              />
                              <label htmlFor={`required-${idx}`} className="text-sm font-medium text-gray-700">Required</label>
                            </div>
                            <button 
                              className="px-3 py-1.5 text-sm bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors font-medium"
                              onClick={() => removeItem(idx)}
                            >
                              🗑️ Remove
                            </button>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="col-span-1 flex justify-end">
                          <div className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                            #{idx + 1}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Add buttons */}
                  <div className="flex gap-3 pt-4 border-t border-gray-200">
                    <button 
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                      onClick={() => {
                        console.log("Choose from Question Bank clicked");
                        setPickerOpen(true);
                      }}
                    >
                      📚 Choose from Question Bank
                    </button>
                    <button 
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                      onClick={addItem}
                    >
                      ➕ Add Manual Item
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-gray-200 bg-gray-50 px-6 py-4 flex justify-end gap-3">
              <button 
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                onClick={() => setItemsOpen(false)}
              >
                Cancel
              </button>
              <button 
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                onClick={saveItems}
              >
                💾 Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {pickerOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Select Questions from Bank</h2>
                <p className="text-sm text-gray-600 mt-1">Choose questions to add to your question set</p>
              </div>
              <button 
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                onClick={() => setPickerOpen(false)}
              >
                <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Filters */}
            <div className="p-6 border-b border-gray-100 bg-gray-50">
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Search Questions</label>
                  <input 
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors" 
                    placeholder="Search by question content..."
                    value={pickerSearch} 
                    onChange={(e) => setPickerSearch(e.target.value)} 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Question Type</label>
                  <select 
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    value={pickerType} 
                    onChange={(e) => setPickerType(e.target.value)}
                  >
                    <option value="">All Types</option>
                    <option value="single_choice">Single Choice</option>
                    <option value="multiple_choice">Multiple Choice</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Difficulty Level</label>
                  <select 
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    value={pickerLevel} 
                    onChange={(e) => setPickerLevel(e.target.value)}
                  >
                    <option value="">All Levels</option>
                    <option value="junior">Junior</option>
                    <option value="middle">Middle</option>
                    <option value="senior">Senior</option>
                  </select>
                </div>
                <div className="flex items-end">
                  <button 
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                    onClick={() => { setPickerPage(1); loadPicker(); }}
                  >
                    🔍 Search
                  </button>
                </div>
              </div>
              
              {/* Skills filter in separate row */}
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Skills (comma separated)</label>
                <input 
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors" 
                  placeholder="React, JavaScript, TypeScript..."
                  value={pickerSkills} 
                  onChange={(e) => setPickerSkills(e.target.value)} 
                />
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-hidden flex flex-col">
              {/* Stats bar */}
              <div className="px-6 py-3 bg-blue-50 border-b border-blue-100">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-blue-700">
                    <span className="font-medium">{pickerTotal}</span> questions found • 
                    <span className="font-medium">{Object.values(pickerSel).filter(Boolean).length}</span> selected
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                      onClick={() => {
                        const newSel: Record<string, boolean> = {};
                        pickerList.forEach(q => newSel[q.id] = true);
                        setPickerSel(newSel);
                      }}
                    >
                      Select All on Page
                    </button>
                    <span className="text-gray-300">|</span>
                    <button 
                      className="text-sm text-gray-600 hover:text-gray-800 font-medium"
                      onClick={() => setPickerSel({})}
                    >
                      Clear Selection
                    </button>
                  </div>
                </div>
              </div>

              {/* Questions list */}
              <div className="flex-1 overflow-auto">
                <div className="divide-y divide-gray-100">
                  {pickerList.map((q) => (
                    <div 
                      key={q.id} 
                      className={`p-4 hover:bg-gray-50 transition-colors cursor-pointer ${
                        pickerSel[q.id] ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                      }`}
                      onClick={() => setPickerSel(prev => ({ ...prev, [q.id]: !prev[q.id] }))}
                    >
                      <div className="flex items-start gap-3">
                        <input 
                          type="checkbox" 
                          checked={!!pickerSel[q.id]} 
                          onChange={(e) => setPickerSel(prev => ({ ...prev, [q.id]: e.target.checked }))}
                          className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-gray-900 mb-1 line-clamp-2">
                            {q.stem}
                          </div>
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            <span className={`px-2 py-1 rounded-full ${
                              q.type === 'single_choice' ? 'bg-green-100 text-green-700' : 'bg-purple-100 text-purple-700'
                            }`}>
                              {q.type === 'single_choice' ? 'Single Choice' : 'Multiple Choice'}
                            </span>
                            {q.level && (
                              <span className={`px-2 py-1 rounded-full ${
                                q.level === 'junior' ? 'bg-blue-100 text-blue-700' :
                                q.level === 'middle' ? 'bg-yellow-100 text-yellow-700' :
                                'bg-red-100 text-red-700'
                              }`}>
                                {q.level}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {pickerList.length === 0 && (
                  <div className="text-center py-12">
                    <div className="text-gray-400 text-lg mb-2">📝</div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No questions found</h3>
                    <p className="text-gray-600">Try adjusting your search filters or create new questions first.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-gray-200 bg-gray-50 px-6 py-4">
              <div className="flex items-center justify-between">
                {/* Pagination */}
                <div className="flex items-center gap-2">
                  <button 
                    className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed" 
                    disabled={pickerPage <= 1} 
                    onClick={() => setPickerPage(p => Math.max(1, p - 1))}
                  >
                    ← Previous
                  </button>
                  <span className="px-3 py-2 text-sm text-gray-600">
                    Page {pickerPage}
                  </span>
                  <button 
                    className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
                    onClick={() => setPickerPage(p => p + 1)}
                  >
                    Next →
                  </button>
                </div>

                {/* Action buttons */}
                <div className="flex items-center gap-3">
                  <button 
                    className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    onClick={() => setPickerOpen(false)}
                  >
                    Cancel
                  </button>
                  <button 
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={applyPicked}
                    disabled={Object.values(pickerSel).filter(Boolean).length === 0}
                  >
                    Add {Object.values(pickerSel).filter(Boolean).length} Question(s)
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

