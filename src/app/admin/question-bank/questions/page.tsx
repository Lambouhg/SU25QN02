"use client";
import React, { useEffect, useMemo, useState } from "react";
import { AlertCircle, FileText, Filter, Trash2 } from "lucide-react";
import {
  LoadingSpinner,
  PaginationComponent,
  FilterSidebar,
  QuestionCard,
  QuestionTable,
  SearchControls,
  Header,
  QuestionFormModal,
  QuestionBankQuickActions
} from "@/components/admin/questionsManager";

type QuestionOption = { text: string; isCorrect?: boolean; order?: number; metadata?: unknown };
type QuestionItem = {
  id: string;
  type: string;
  stem: string;
  explanation?: string | null;
  level?: string | null;
  topics: string[];
  fields: string[];
  skills: string[];
  category?: string | null;
  tags?: string[];
  estimatedTime?: number | null;
  sourceAuthor?: string | null;
  difficulty?: string | null;
  options: QuestionOption[];
  updatedAt: string;
};

type Paged<T> = { data: T[]; page: number; pageSize: number; total: number };



export default function AdminQuestionsPage() {
  const [items, setItems] = useState<QuestionItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [filterOpen, setFilterOpen] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // Filter states
  const [filters, setFilters] = useState({
    type: "",
    level: "",
    topics: "",
    fields: "",
    skills: "",
    category: "",
    tags: "",
    difficulty: ""
  });

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<QuestionItem | null>(null);
  
  // Bulk selection states
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [bulkDeleteLoading, setBulkDeleteLoading] = useState(false);

  const query = useMemo(() => {
    const p = new URLSearchParams();
    if (search) p.set("search", search);
    if (filters.type) p.set("type", filters.type);
    if (filters.level) p.set("level", filters.level);
    if (filters.topics) p.set("topics", filters.topics);
    if (filters.fields) p.set("fields", filters.fields);
    if (filters.skills) p.set("skills", filters.skills);
    if (filters.category) p.set("category", filters.category);
    
    // Add pagination parameters
    p.set("page", currentPage.toString());
    p.set("pageSize", pageSize.toString());
    if (filters.tags) p.set("tags", filters.tags);
    if (filters.difficulty) p.set("difficulty", filters.difficulty);
    return p.toString();
  }, [search, filters, currentPage, pageSize]);

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/qb2/questions?${query}`, { cache: "no-store" });
      const json: Paged<QuestionItem> = await res.json();
      if (!res.ok) throw new Error(((json as unknown) as { error?: string })?.error || "Failed to load");
      setItems(json.data);
      setTotalItems(json.total);
      setTotalPages(Math.ceil(json.total / json.pageSize));
      setLastUpdated(new Date()); // Set update time when data successfully loads
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

  // Reset to page 1 when search or filters change
  useEffect(() => {
    if (currentPage !== 1) {
      setCurrentPage(1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, filters]);

  // Keyboard navigation for pagination
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return; // Don't handle shortcuts when typing in input fields
      }
      
      if (e.key === 'ArrowLeft' && e.ctrlKey && currentPage > 1) {
        e.preventDefault();
        setCurrentPage(prev => prev - 1);
      } else if (e.key === 'ArrowRight' && e.ctrlKey && currentPage < totalPages) {
        e.preventDefault();
        setCurrentPage(prev => prev + 1);
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [currentPage, totalPages]);

  function openCreate() {
    setEditing(null);
    setFormOpen(true);
  }

  function openEdit(row: QuestionItem) {
    setEditing(row);
    setFormOpen(true);
  }

  // Wrapper function for component compatibility
  function handleEdit(question: { id: string }) {
    // Find the original question from items array
    const originalQuestion = items.find(item => item.id === question.id);
    if (originalQuestion) {
      openEdit(originalQuestion);
    }
  }

  // Convert QuestionItem to form data
  const getInitialFormData = (question?: QuestionItem) => {
    if (!question) return {};
    
    return {
      stem: question.stem,
      explanation: question.explanation || "",
      type: question.type,
      level: question.level || "",
      difficulty: question.difficulty || "",
      category: question.category || "",
      topics: question.topics?.join(", ") || "",
      fields: question.fields?.join(", ") || "",
      skills: question.skills?.join(", ") || "",
      tags: (question.tags || []).join(", "),
      options: (question.options || []).map((o) => ({ 
        text: o.text, 
        isCorrect: !!o.isCorrect, 
        order: o.order 
      }))
    };
  };

  async function handleFormSubmit(formData: {
    type: string;
    stem: string;
    explanation?: string;
    level?: string;
    topics: string;
    fields: string;
    skills: string;
    category?: string;
    tags: string;
    difficulty?: string;
    options: { text: string; isCorrect?: boolean; order?: number }[];
  }) {
    const payload = {
      type: formData.type,
      stem: formData.stem,
      explanation: formData.explanation || null,
      level: formData.level || null,
      topics: formData.topics
        .split(",")
        .map((s: string) => s.trim())
        .filter(Boolean),
      fields: formData.fields
        .split(",")
        .map((s: string) => s.trim())
        .filter(Boolean),
      skills: formData.skills
        .split(",")
        .map((s: string) => s.trim())
        .filter(Boolean),
      category: formData.category || null,
      tags: formData.tags
        .split(",")
        .map((s: string) => s.trim())
        .filter(Boolean),
      difficulty: formData.difficulty || null,
      options: formData.options.map((o, idx: number) => ({ text: o.text, isCorrect: !!o.isCorrect, order: o.order ?? idx })),
    };

    const method = editing ? "PUT" : "POST";
    const url = editing ? `/api/admin/qb2/questions/${editing.id}` : "/api/admin/qb2/questions";

    const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    const json = await res.json();
    if (!res.ok) throw new Error(json?.error || "Save failed");
    setFormOpen(false);
    await load();
  }

  async function remove(id: string) {
    if (!confirm("Delete this question?")) return;
    const res = await fetch(`/api/admin/qb2/questions/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const j = await res.json();
      alert(j?.error || "Delete failed");
      return;
    }
    await load();
  }

  // Bulk selection handlers
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedItems(new Set(items.map(item => item.id)));
    } else {
      setSelectedItems(new Set());
    }
  };

  const handleSelectItem = (id: string, checked: boolean) => {
    const newSelection = new Set(selectedItems);
    if (checked) {
      newSelection.add(id);
    } else {
      newSelection.delete(id);
    }
    setSelectedItems(newSelection);
  };

  // Bulk delete handler
  const handleBulkDelete = async () => {
    if (selectedItems.size === 0) return;
    
    const confirmMessage = `Are you sure you want to delete ${selectedItems.size} question(s)? This action cannot be undone.`;
    if (!confirm(confirmMessage)) return;

    setBulkDeleteLoading(true);
    try {
      const response = await fetch('/api/admin/qb2/questions/bulk-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questionIds: Array.from(selectedItems) })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to delete questions');
      }

      alert(result.message || `Successfully deleted ${result.deletedCount} question(s).`);
      
      // Clear selection and reload
      setSelectedItems(new Set());
      await load();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred during bulk delete operation.';
      alert(errorMessage);
      console.error('Bulk delete error:', error);
    } finally {
      setBulkDeleteLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 relative z-0">
      {/* Quick Actions */}
      <div className="px-6 pt-6 pb-2">
        <QuestionBankQuickActions />
      </div>

      {/* Header */}
      <Header
        totalItems={totalItems}
        itemsLength={items.length}
        loading={loading}
        onRefresh={load}
        onCreateQuestion={openCreate}
      />

      <div className="flex">
        {/* Filter Sidebar */}
        <FilterSidebar 
          isOpen={filterOpen}
          onClose={() => setFilterOpen(false)}
          filters={filters}
          onFilterChange={handleFilterChange}
        />

        {/* Main Content */}
        <div className="flex-1 p-6 max-w-7xl mx-auto">
          {/* Search & Controls */}
          <SearchControls
            search={search}
            onSearchChange={setSearch}
            filters={filters}
            onFilterChange={handleFilterChange}
            filterOpen={filterOpen}
            onFilterToggle={() => setFilterOpen(!filterOpen)}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
          />

          {/* Error State */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-red-600" />
                <span className="text-red-800 font-medium">An error occurred</span>
              </div>
              <p className="text-red-700 mt-1">{error}</p>
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="flex items-center justify-center py-16">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
                  <LoadingSpinner size="lg" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Loading Questions</h3>
                <p className="text-gray-600">Please wait while we fetch your questions...</p>
              </div>
            </div>
          )}

          {/* Content */}
          {!loading && !error && (
            <>
              {/* Enhanced Stats Bar with Bulk Actions */}
              <div className="mb-6 bg-white rounded-xl border p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-6">
                    <p className="text-gray-600">
                      Showing <span className="font-bold text-gray-900">{items.length}</span> questions
                    </p>
                    {selectedItems.size > 0 && (
                      <p className="text-sm text-blue-600 font-medium">
                        {selectedItems.size} selected
                      </p>
                    )}
                    {Object.values(filters).some(v => v) && (
                      <p className="text-sm text-blue-600">
                        <Filter className="w-4 h-4 inline mr-1" />
                        Filtered results
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    {selectedItems.size > 0 && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setSelectedItems(new Set())}
                          className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                        >
                          Clear Selection
                        </button>
                        <button
                          onClick={handleBulkDelete}
                          disabled={bulkDeleteLoading}
                          className="px-3 py-1 text-sm text-white bg-red-600 hover:bg-red-700 disabled:bg-red-400 disabled:cursor-not-allowed rounded-md transition-colors flex items-center gap-1"
                        >
                          {bulkDeleteLoading ? (
                            <>
                              <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin"></div>
                              Deleting...
                            </>
                          ) : (
                            <>
                              <Trash2 className="w-3 h-3" />
                              Delete ({selectedItems.size})
                            </>
                          )}
                        </button>
                      </div>
                    )}
                    <div className="text-sm text-gray-500">
                      {lastUpdated ? `Last updated: ${lastUpdated.toLocaleTimeString()}` : 'Last updated: Not yet loaded'}
                    </div>
                  </div>
                </div>
                
                {/* Bulk Selection Controls */}
                {items.length > 0 && (
                  <div className="mt-3 pt-3 border-t flex items-center gap-4">
                    <label className="flex items-center gap-2 text-sm text-gray-600">
                      <input
                        type="checkbox"
                        checked={selectedItems.size === items.length && items.length > 0}
                        onChange={(e) => handleSelectAll(e.target.checked)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      Select all on this page
                    </label>
                    <span className="text-gray-400">|</span>
                    <button
                      onClick={() => setSelectedItems(new Set())}
                      className="text-sm text-gray-600 hover:text-gray-800 transition-colors"
                    >
                      Deselect all
                    </button>
                  </div>
                )}
              </div>

              {/* Questions Display */}
              {items.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-xl border-2 border-dashed border-gray-300">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
                    <FileText className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No questions found</h3>
                  <p className="text-gray-600 mb-6 max-w-md mx-auto">
                    {Object.values(filters).some(v => v) || search 
                      ? "No questions match your current filters. Try adjusting your search criteria."
                      : "Get started by creating your first question to build your question bank."
                    }
                  </p>
                  <div className="flex items-center justify-center gap-3">
                    {(Object.values(filters).some(v => v) || search) && (
                      <button
                        onClick={() => {
                          setSearch("");
                          setFilters({ type: "", level: "", topics: "", fields: "", skills: "", category: "", tags: "", difficulty: "" });
                        }}
                        className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        Clear Filters
                      </button>
                    )}
                    <button
                      onClick={openCreate}
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Create First Question
                    </button>
                  </div>
                </div>
              ) : (
                <div className={viewMode === 'grid' ? 
                  "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6" : 
                  ""
                }>
                  {viewMode === 'grid' ? (
                    items.map((question) => (
                      <QuestionCard 
                        key={question.id} 
                        question={{
                          ...question,
                          explanation: question.explanation || undefined,
                          category: question.category || undefined,
                          level: question.level || undefined,
                          difficulty: question.difficulty || undefined,
                          options: question.options?.map(opt => ({
                            id: opt.text, // Use text as id fallback
                            text: opt.text,
                            isCorrect: !!opt.isCorrect
                          })) || []
                        }}
                        onEdit={handleEdit}
                        onDelete={remove}
                        isSelected={selectedItems.has(question.id)}
                        onSelect={handleSelectItem}
                      />
                    ))
                  ) : (
                    <QuestionTable 
                      questions={items.map(question => ({
                        ...question,
                        explanation: question.explanation || undefined,
                        category: question.category || undefined,
                        level: question.level || undefined,
                        difficulty: question.difficulty || undefined,
                        options: question.options?.map(opt => ({
                          id: opt.text, // Use text as id fallback
                          text: opt.text,
                          isCorrect: !!opt.isCorrect
                        })) || []
                      }))}
                      onEdit={handleEdit}
                      onDelete={remove}
                      selectedItems={selectedItems}
                      onSelectItem={handleSelectItem}
                      onSelectAll={handleSelectAll}
                    />
                  )}
                </div>
              )}

              {/* Pagination Component */}
              {!error && totalItems > 0 && (
                <div className="mt-8">
                  {loading ? (
                    <div className="bg-white rounded-lg border p-4">
                      <div className="flex items-center justify-center">
                        <LoadingSpinner size="sm" />
                        <span className="ml-2 text-sm text-gray-600">Loading...</span>
                      </div>
                    </div>
                  ) : (
                    <PaginationComponent
                      currentPage={currentPage}
                      totalPages={totalPages}
                      totalItems={totalItems}
                      pageSize={pageSize}
                      onPageChange={setCurrentPage}
                      onPageSizeChange={setPageSize}
                    />
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <QuestionFormModal
        isOpen={formOpen}
        onClose={() => {
          setFormOpen(false);
          setEditing(null); // Reset editing state when closing modal
        }}
        onSubmit={handleFormSubmit}
        initialData={editing ? getInitialFormData(editing) : getInitialFormData(undefined)}
        isEditing={!!editing}
      />
    </div>
  );
}