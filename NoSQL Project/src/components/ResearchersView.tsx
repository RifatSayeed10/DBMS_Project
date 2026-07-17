import React from "react";
import { Users, Mail, Globe, MapPin, Briefcase, Plus, BookOpen, ChevronRight, X, ArrowUpRight, Award, Trash2 } from "lucide-react";
import { Researcher, Paper, User } from "../types";
import { api } from "../lib/api";
import { getTaxonomyColor, getResearcherColor } from "../lib/taxonomyColors";

interface ResearchersViewProps {
  researchers: Researcher[];
  papers: Paper[];
  currentUser: User | null;
  selectedResearcherId?: string;
  onRefreshData: () => void;
  onSelectPaper: (paper: Paper) => void;
}

export default function ResearchersView({
  researchers,
  papers,
  currentUser,
  selectedResearcherId,
  onRefreshData,
  onSelectPaper
}: ResearchersViewProps) {
  const [selectedRes, setSelectedRes] = React.useState<Researcher | null>(null);

  // Form State
  const [formOpen, setFormOpen] = React.useState(false);
  const [name, setName] = React.useState("");
  const [affiliation, setAffiliation] = React.useState("");
  const [position, setPosition] = React.useState("");
  const [bio, setBio] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [website, setWebsite] = React.useState("");
  const [photoUrl, setPhotoUrl] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState("");
  const [successMsg, setSuccessMsg] = React.useState("");

  const isAdmin = currentUser && currentUser.role === "admin";

  // Pre-load researcher detail if passed down
  React.useEffect(() => {
    if (selectedResearcherId) {
      const match = researchers.find(r => r.id === selectedResearcherId);
      if (match) setSelectedRes(match);
    }
  }, [selectedResearcherId, researchers]);

  const handleCreateResearcher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !affiliation) return;
    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    const fallbackPhoto = "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80";

    try {
      await api.createResearcher({
        name,
        affiliation,
        position: position || "Fellow Investigator",
        bio,
        email,
        website,
        profilePhoto: photoUrl.trim() || fallbackPhoto
      });

      setName("");
      setAffiliation("");
      setPosition("");
      setBio("");
      setEmail("");
      setWebsite("");
      setPhotoUrl("");
      setSuccessMsg("Scholar profile successfully cataloged!");
      onRefreshData();
      setTimeout(() => {
        setFormOpen(false);
        setSuccessMsg("");
      }, 1500);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to catalog investigator");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteResearcher = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to delete this researcher's profile?")) return;
    try {
      await api.deleteResearcher(id);
      if (selectedRes && selectedRes.id === id) {
        setSelectedRes(null);
      }
      onRefreshData();
    } catch (err: any) {
      alert("Error removing scholar profile");
    }
  };

  return (
    <div className="space-y-8 pb-16 page-transition-enter page-transition-enter-active">
      
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-stone-200 pb-5 gap-4">
        <div>
          <h1 className="font-serif text-3xl font-bold tracking-tight text-stone-900">
            Research Investigators
          </h1>
          <p className="text-sm text-stone-500 mt-1">
            Browse profile directories, publication tallies, and scientific backgrounds for authorized contributors.
          </p>
        </div>

        {currentUser && (
          <button
            onClick={() => setFormOpen(!formOpen)}
            className="flex items-center gap-1.5 rounded-sm bg-brand-500 px-4 py-2.5 font-sans text-sm font-semibold text-white hover:bg-brand-600 transition cursor-pointer"
          >
            <Plus className="h-4.5 w-4.5" />
            Integrate Profile
          </button>
        )}
      </div>

      {/* Integrate Profile Drawer form */}
      {formOpen && currentUser && (
        <div className="rounded-sm border border-stone-250 bg-white p-6 shadow-3xs space-y-5" id="integrate-res-form">
          <div className="flex items-center justify-between border-b border-stone-150 pb-3">
            <h3 className="font-serif text-base font-bold text-stone-800 flex items-center gap-2">
              <Users className="h-5 w-5 text-brand-600" />
              Investigator Integration Request
            </h3>
            <button onClick={() => setFormOpen(false)} className="text-stone-400 hover:text-stone-700">
              <X className="h-5 w-5" />
            </button>
          </div>

          <form onSubmit={handleCreateResearcher} className="grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-3">
            <div>
              <label className="block text-[10px] font-semibold text-stone-500 uppercase mb-1">
                Full Legal Name *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Dr. Jordan Henderson"
                className="w-full rounded-sm border border-stone-300 bg-stone-50/40 px-3 py-2 text-xs outline-none focus:bg-white focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
              />
            </div>

            <div>
              <label className="block text-[10px] font-semibold text-stone-500 uppercase mb-1">
                Parent Affiliation / Tech Node *
              </label>
              <input
                type="text"
                required
                value={affiliation}
                onChange={(e) => setAffiliation(e.target.value)}
                placeholder="MIT Lincoln Laboratory"
                className="w-full rounded-sm border border-stone-300 bg-stone-50/40 px-3 py-2 text-xs outline-none focus:bg-white focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
              />
            </div>

            <div>
              <label className="block text-[10px] font-semibold text-stone-500 uppercase mb-1">
                Academic Position / Title
              </label>
              <input
                type="text"
                value={position}
                onChange={(e) => setPosition(e.target.value)}
                placeholder="Senior Research Fellow"
                className="w-full rounded-sm border border-stone-300 bg-stone-50/40 px-3 py-2 text-xs outline-none focus:bg-white focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
              />
            </div>

            <div>
              <label className="block text-[10px] font-semibold text-stone-500 uppercase mb-1">
                Contact Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="jordan.h@mit.edu"
                className="w-full rounded-sm border border-stone-300 bg-stone-50/40 px-3 py-2 text-xs outline-none focus:bg-white focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
              />
            </div>

             <div>
              <label className="block text-[10px] font-semibold text-stone-500 uppercase mb-1">
                Website Link
              </label>
              <input
                type="url"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="https://example.mit.edu/jordan"
                className="w-full rounded-sm border border-stone-300 bg-stone-50/40 px-3 py-2 text-xs outline-none focus:bg-white focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
              />
            </div>

            <div>
              <label className="block text-[10px] font-semibold text-stone-500 uppercase mb-1">
                Portrait Photo JPG URI
              </label>
              <input
                type="url"
                value={photoUrl}
                onChange={(e) => setPhotoUrl(e.target.value)}
                placeholder="e.g. Unsplash URL"
                className="w-full rounded-sm border border-stone-300 bg-stone-50/40 px-3 py-2 text-xs outline-none focus:bg-white focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
              />
            </div>

            <div className="sm:col-span-2 md:col-span-3">
              <label className="block text-[10px] font-semibold text-stone-500 uppercase mb-1">
                Academic Bio Summary
              </label>
              <textarea
                rows={3}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Detail research projects, focus areas, achievements, and structural methodologies..."
                className="w-full rounded-sm border border-stone-300 bg-stone-50/40 px-3.5 py-2 text-xs outline-none focus:bg-white focus:border-brand-500 focus:ring-1 focus:ring-brand-500 resize-none"
              ></textarea>
            </div>

            <div className="sm:col-span-2 md:col-span-3 flex justify-end gap-3 pt-2">
              {errorMsg && <span className="text-xs text-red-600 bg-red-50 p-2 rounded-sm mr-auto leading-tight">{errorMsg}</span>}
              {successMsg && <span className="text-xs text-green-700 bg-green-50 p-2 rounded-sm mr-auto leading-tight">{successMsg}</span>}
              
              <button
                type="button"
                onClick={() => setFormOpen(false)}
                className="rounded-sm border border-stone-200 bg-white px-5 py-2 text-xs font-semibold text-stone-750 hover:bg-stone-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="rounded-sm bg-brand-500 px-6 py-2 text-xs font-semibold text-white hover:bg-brand-600 cursor-pointer"
              >
                {loading ? "Integrating..." : "Publish Profile Card"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Main Workspace Layout (Left Grid list - Right Details Inspect) */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        
        {/* Scholar list grid (2 columns on desk) */}
        <div className={`${selectedRes ? "lg:col-span-2" : "lg:col-span-3"} space-y-4`}>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-3" id="researchers-grid-layout">
            {researchers.map((res) => {
              const isInspected = selectedRes && selectedRes.id === res.id;
              const researcherPapers = papers.filter(p => p.researcherId === res.id || p.authors.includes(res.name));
              const resCategories = Array.from(new Set(researcherPapers.flatMap(p => p.categories))).slice(0, 2);
              const resCol = getResearcherColor(res.name);

              return (
                <div
                  key={res.id}
                  onClick={() => setSelectedRes(res)}
                  className={`group relative rounded-sm border p-6 cursor-pointer hover:shadow-2xs transition-all flex flex-col justify-between ${
                    isInspected
                      ? "bg-stone-50/70 dark:bg-stone-900/40 shadow-3xs"
                      : "bg-white dark:bg-stone-900 shadow-3xs"
                  }`}
                  style={{
                    borderColor: isInspected
                      ? (resCol.rawText.includes("red") ? "#ef4444" : resCol.rawText.includes("sky") ? "#0ea5e9" : resCol.rawText.includes("purple") ? "#a855f7" : resCol.rawText.includes("emerald") ? "#10b981" : resCol.rawText.includes("amber") ? "#f59e0b" : resCol.rawText.includes("orange") ? "#f97316" : resCol.rawText.includes("fuchsia") ? "#d946ef" : resCol.rawText.includes("rose") ? "#f43f5e" : "#000")
                      : "var(--color-slate-200)"
                  }}
                  onMouseEnter={(e) => {
                    if (!isInspected) {
                      const el = e.currentTarget;
                      if (resCol.rawText.includes("red")) el.style.borderColor = "#ef4444";
                      else if (resCol.rawText.includes("sky")) el.style.borderColor = "#0ea5e9";
                      else if (resCol.rawText.includes("purple")) el.style.borderColor = "#a855f7";
                      else if (resCol.rawText.includes("emerald")) el.style.borderColor = "#10b981";
                      else if (resCol.rawText.includes("amber")) el.style.borderColor = "#f59e0b";
                      else if (resCol.rawText.includes("orange")) el.style.borderColor = "#f97316";
                      else if (resCol.rawText.includes("fuchsia")) el.style.borderColor = "#d946ef";
                      else if (resCol.rawText.includes("rose")) el.style.borderColor = "#f43f5e";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isInspected) {
                      e.currentTarget.style.borderColor = "var(--color-slate-200)";
                    }
                  }}
                >
                  <div className="space-y-4">
                    {/* Top avatar and badge details */}
                    <div className="flex items-center justify-between">
                      <div className="relative inline-block pb-1">
                        <img
                          src={res.profilePhoto || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80"}
                          alt={res.name}
                          referrerPolicy="no-referrer"
                          className={`h-16 w-16 rounded-sm object-cover border shadow-3xs bg-stone-50 ${resCol.border}`}
                        />
                      </div>
                    </div>

                    <div className="space-y-1 text-left">
                      <h3 className="font-sans text-sm font-extrabold text-stone-900 dark:text-stone-100 transition-colors line-clamp-1">
                        {res.name}
                      </h3>
                      <div className="flex items-center gap-1.5 text-[11px] font-medium text-stone-850 dark:text-stone-300">
                        <Award className="h-3.5 w-3.5 opacity-70 text-stone-500 shrink-0" />
                        <span className="truncate">{res.position}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[11px] text-stone-500 dark:text-stone-400">
                        <MapPin className="h-3.5 w-3.5 opacity-60 text-stone-400 shrink-0" />
                        <span className="truncate" title={res.affiliation}>{res.affiliation}</span>
                      </div>
                    </div>

                    {/* Show categories they publish in */}
                    {resCategories.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-1 justify-start">
                        {resCategories.map((cat, ci) => {
                          const col = getTaxonomyColor(cat);
                          return (
                            <span
                              key={ci}
                              className={`text-[9.5px] font-mono font-bold px-2 py-0.5 rounded-sm border ${col.bg} ${col.text} ${col.border}`}
                            >
                              {cat}
                            </span>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  <div className="mt-4 border-t border-stone-150 dark:border-stone-850 pt-3 flex items-center justify-between text-[11px] text-stone-400">
                    <span className="font-mono text-[9px] text-stone-400 font-bold">ID: {res.id.toUpperCase()}</span>
                    
                    <div className="flex items-center gap-1.5">
                      {isAdmin && (
                        <button
                          onClick={(e) => handleDeleteResearcher(res.id, e)}
                          className="p-1 rounded-sm text-stone-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition cursor-pointer"
                          title="Delete researcher profile"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                      <span className={`font-sans font-bold text-xs ${resCol.text}`}>
                        Inspect →
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Profiler Investigator dossier inspection details (Right 1 column on desk) */}
        {selectedRes && (() => {
          const resCol = getResearcherColor(selectedRes.name);
          return (
            <div className={`rounded-sm border bg-white dark:bg-stone-900 p-5 shadow-3xs space-y-5 lg:col-span-1 page-transition-enter page-transition-enter-active`} style={{ borderColor: "var(--color-slate-250)" }} id="profile-inspect-panel">
              <div className="flex items-center justify-between border-b border-stone-200 dark:border-stone-800 pb-3">
                <span className={`font-sans text-xs font-bold uppercase tracking-widest select-none ${resCol.text}`}>
                  Investigator Biography
                </span>
                <button
                  onClick={() => setSelectedRes(null)}
                  className="rounded-sm p-1 text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-800 hover:text-stone-700 transition cursor-pointer"
                  title="Collapse Panel"
                >
                  <X className="h-4.5 w-4.5" />
                </button>
              </div>

              {/* Profile banner */}
              <div className="flex items-start gap-4">
                <img
                  src={selectedRes.profilePhoto}
                  alt={selectedRes.name}
                  referrerPolicy="no-referrer"
                  className={`h-16 w-16 rounded-sm object-cover shrink-0 border-2 shadow-3xs ${resCol.border}`}
                />
                <div className="min-w-0">
                  <h3 className="font-sans text-base font-extrabold text-stone-900 dark:text-stone-100 leading-tight">
                    {selectedRes.name}
                  </h3>
                  <span className={`block text-xs font-semibold leading-normal ${resCol.text}`}>
                    {selectedRes.position}
                  </span>
                  <span className="block text-[10px] text-stone-450 font-mono flex items-center gap-1 mt-1 leading-none">
                    <MapPin className="h-3 w-3" />
                    {selectedRes.affiliation}
                  </span>
                </div>
              </div>

              {/* Biography */}
              <div className={`space-y-1.5 p-3 rounded-sm border ${resCol.bg} ${resCol.border}`}>
                <span className="block font-sans text-[10px] font-bold text-stone-400 uppercase tracking-widest select-none">
                  Profile statement
                </span>
                <p className="text-xs text-stone-650 dark:text-stone-300 leading-relaxed font-light font-sans">
                  {selectedRes.bio || "No expanded biography provided for this scholar profile."}
                </p>
              </div>

              {/* Contact links and buttons */}
              <div className="grid grid-cols-2 gap-2 text-[11px] font-mono font-medium">
                {selectedRes.email && (
                  <a
                    href={`mailto:${selectedRes.email}`}
                    className="flex items-center justify-center gap-1.5 rounded-sm border border-stone-200 dark:border-stone-800 p-2 hover:bg-stone-50 dark:hover:bg-stone-800 text-stone-600 dark:text-stone-300"
                  >
                    <Mail className="h-3.5 w-3.5 text-stone-450" />
                    Send Email
                  </a>
                )}
                {selectedRes.website && (
                  <a
                    href={selectedRes.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-1.5 rounded-sm border border-stone-200 dark:border-stone-800 p-2 hover:bg-stone-50 dark:hover:bg-stone-800 text-stone-600 dark:text-stone-300"
                  >
                    <Globe className="h-3.5 w-3.5 text-stone-450" />
                    Website
                    <ArrowUpRight className={`h-3 w-3 ${resCol.text}`} />
                  </a>
                )}
              </div>

              {/* Papers List by this Investigator */}
              <div className="space-y-2 border-t border-stone-200 dark:border-stone-800 pt-4">
                <h4 className="font-serif text-xs font-bold text-stone-800 dark:text-stone-200 uppercase tracking-wide flex items-center gap-1">
                  <BookOpen className="h-4 w-4 text-stone-550" />
                  Authored manuscripts ({papers.filter(p => p.researcherId === selectedRes.id || p.authors.includes(selectedRes.name)).length})
                </h4>

                <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                  {papers
                    .filter(p => p.researcherId === selectedRes.id || p.authors.includes(selectedRes.name))
                    .map(p => (
                      <button
                        key={p.id}
                        onClick={() => onSelectPaper(p)}
                        className="group flex w-full flex-col justify-start gap-1 p-2.5 rounded-sm bg-stone-50 dark:bg-stone-900/60 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors border border-stone-150 dark:border-stone-800 text-left"
                      >
                        <span className={`block font-sans text-[11px] font-bold text-stone-850 dark:text-stone-200 line-clamp-2 leading-tight group-hover:${resCol.text} transition-colors`}>
                          {p.title}
                        </span>
                        <span className="font-mono text-[9px] text-stone-450">
                          {p.year} • {p.pages} pages
                        </span>
                      </button>
                    ))}
                  {papers.filter(p => p.researcherId === selectedRes.id || p.authors.includes(selectedRes.name)).length === 0 && (
                    <p className="text-[11px] text-stone-450 font-sans">No publications connected to this scholar profile yet.</p>
                  )}
                </div>
              </div>

            </div>
          );
        })()}

      </div>

    </div>
  );
}
