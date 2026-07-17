import React from "react";
import { Hash, Tag, BookOpen, Plus, Trash2, Edit3, HelpCircle, FileText, LayoutGrid } from "lucide-react";
import { Topic, Paper, User } from "../types";
import { api } from "../lib/api";
import { getTaxonomyColor } from "../lib/taxonomyColors";

interface TopicsViewProps {
  topics: Topic[];
  papers: Paper[];
  currentUser: User | null;
  onRefreshData: () => void;
  onSelectTopic: (topicName: string) => void;
}

export default function TopicsView({
  topics,
  papers,
  currentUser,
  onRefreshData,
  onSelectTopic
}: TopicsViewProps) {
  const [name, setName] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [errorMsg, setErrorMsg] = React.useState("");
  const [successMsg, setSuccessMsg] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  const isAdmin = currentUser && currentUser.role === "admin";

  const handleCreateTopic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !description) return;
    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      await api.createTopic({ name: name.trim(), description: description.trim() });
      setName("");
      setDescription("");
      setSuccessMsg("Taxonomy category added successfully!");
      onRefreshData();
      setTimeout(() => setSuccessMsg(""), 1600);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to catalog tag");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTopic = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to delete this taxonomy category?")) return;
    try {
      await api.deleteTopic(id);
      onRefreshData();
    } catch (err: any) {
      alert("Error removing topic");
    }
  };

  return (
    <div className="space-y-8 pb-16 page-transition-enter page-transition-enter-active">
      
      {/* Title block */}
      <div className="border-b border-stone-200 pb-5">
        <h1 className="font-sans text-3xl font-bold tracking-tight text-stone-900">
          Topics & Taxonomy classes
        </h1>
        <p className="text-sm text-stone-500 mt-1">
          Review general sectors of literature and browse corresponding papers cataloged within each bucket.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        
        {/* Topic lists bento grid (Left 2 columns on desk) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs font-semibold text-stone-500">
              {topics.length} Catalog categories registered
            </span>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2" id="topics-list-bento">
            {topics.map((topic) => {
              const count = papers.filter(p => p.categories.includes(topic.name)).length;
              const col = getTaxonomyColor(topic.name);

              return (
                <div
                  key={topic.id}
                  onClick={() => onSelectTopic(topic.name)}
                  className={`group relative rounded-sm border bg-white dark:bg-stone-900 p-5.5 cursor-pointer shadow-3xs transition-all flex flex-col justify-between border-stone-200 dark:border-stone-800 hover:translate-y-[-2px]`}
                  style={{ borderColor: "var(--color-slate-200)" }}
                  onMouseEnter={(e) => {
                    const el = e.currentTarget;
                    if (col.rawText.includes("red")) el.style.borderColor = "#ef4444";
                    else if (col.rawText.includes("sky")) el.style.borderColor = "#0ea5e9";
                    else if (col.rawText.includes("purple")) el.style.borderColor = "#a855f7";
                    else if (col.rawText.includes("emerald")) el.style.borderColor = "#10b981";
                    else if (col.rawText.includes("amber")) el.style.borderColor = "#f59e0b";
                    else if (col.rawText.includes("orange")) el.style.borderColor = "#f97316";
                    else if (col.rawText.includes("fuchsia")) el.style.borderColor = "#d946ef";
                    else if (col.rawText.includes("rose")) el.style.borderColor = "#f43f5e";
                    else if (col.rawText.includes("cyan")) el.style.borderColor = "#06b6d4";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "";
                  }}
                >
                  <div>
                    <div className="flex items-start justify-between">
                      <div className={`flex h-9 w-9 items-center justify-center rounded-sm border ${col.bg} ${col.text} ${col.border}`}>
                        <Tag className="h-4.5 w-4.5" />
                      </div>

                      <div className="flex items-center gap-1">
                        <span className={`font-mono text-[10px] font-bold px-2 py-0.5 rounded-sm border ${col.bg} ${col.text} ${col.border}`}>
                          {count} papers
                        </span>
                        
                        {isAdmin && (
                          <button
                            onClick={(e) => handleDeleteTopic(topic.id, e)}
                            className="p-1 rounded-sm text-stone-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition"
                            title="Delete category"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    <h3 className={`font-sans text-base font-bold text-stone-900 dark:text-stone-100 mt-4 transition-colors`}>
                      {topic.name}
                    </h3>

                    <p className="text-xs text-stone-600 dark:text-stone-400 mt-1.5 line-clamp-3 font-light leading-relaxed">
                      {topic.description}
                    </p>
                  </div>

                  <div className="mt-5 flex items-center justify-end">
                    <span className={`flex items-center gap-1 font-sans text-[11px] font-bold text-stone-500 dark:text-stone-400 group-hover:translate-x-1 transition-all ${col.text}`}>
                      Browse Papers
                      <Plus className="h-3.5 w-3.5 rotate-45" />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Admin controls bar */}
        <div className="lg:col-span-1">
          {isAdmin ? (
            <div className="rounded-sm border border-stone-200 bg-white p-5 shadow-3xs space-y-4" id="admin-create-topic-form">
              <div className="flex items-center gap-2 border-b border-stone-150 pb-3">
                <Plus className="h-4.5 w-4.5 text-brand-600" />
                <h3 className="font-serif text-sm font-bold text-stone-800 uppercase tracking-wide">
                  Add New Taxonomy
                </h3>
              </div>

              <form onSubmit={handleCreateTopic} className="space-y-4">
                <div>
                  <label className="block text-[11px] font-semibold text-stone-500 uppercase mb-1">
                    Label Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Cybersecurity & Cryptography"
                    className="w-full rounded-sm border border-stone-300 bg-stone-50/40 px-3 py-2 text-xs outline-none focus:bg-white focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all font-sans"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-stone-500 uppercase mb-1">
                    Abstract Description *
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Detailed explanation tracking computational algorithms, secure network structures..."
                    className="w-full rounded-sm border border-stone-300 bg-stone-50/40 px-3 py-2 text-xs outline-none focus:bg-white focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all resize-none"
                  ></textarea>
                </div>

                {errorMsg && <p className="text-xs text-red-600 bg-red-50 p-2 rounded-sm">{errorMsg}</p>}
                {successMsg && <p className="text-xs text-green-700 bg-green-50 p-2 rounded-sm">{successMsg}</p>}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-sm bg-brand-500 hover:bg-brand-600 py-2.5 text-xs font-semibold text-white transition cursor-pointer"
                >
                  {loading ? "Cataloging Topic..." : "Catalog Taxonomic Topic"}
                </button>
              </form>
            </div>
          ) : (
            <div className="rounded-sm bg-stone-50 border border-stone-200 p-5 space-y-3">
              <h4 className="font-sans text-xs font-bold text-stone-850 uppercase tracking-wide flex items-center gap-1">
                <HelpCircle className="h-4 w-4 text-stone-500" />
                Index Help
              </h4>
              <p className="text-xs text-stone-650 leading-relaxed font-light">
                Topics are structural indices cataloged on our systems. Clicking a card will redirect you to the literature index pre-filtered to isolate papers of that exact domain.
              </p>
              <p className="text-xs text-stone-400 font-sans">
                * To propose brand-new taxonomy topics, please reach out to academic administrators at admin@archive.org or authenticating as an admin user.
              </p>
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
