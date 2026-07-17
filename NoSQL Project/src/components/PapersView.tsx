import React, { useRef } from "react";
import { 
  Search, Filter, BookOpen, Bookmark, BookmarkCheck, ThumbsUp, Eye, Upload, 
  FileText, ChevronRight, Download, Calendar, Users, X, ArrowLeft, Heart, 
  FileDown, Paperclip, CreditCard, ShoppingBag, BadgeAlert, CheckCircle2, DollarSign
} from "lucide-react";
import { Paper, Topic, Researcher, User } from "../types";
import { api } from "../lib/api";
import { getTaxonomyColor } from "../lib/taxonomyColors";

interface PapersViewProps {
  papers: Paper[];
  topics: Topic[];
  researchers: Researcher[];
  currentUser: User | null;
  initialQuery?: string;
  onRefreshData: () => void;
  onNavigateToAuth: (tab: "signin" | "register") => void;
  onUpdateCurrentUser: (user: User | null) => void;
}

export default function PapersView({
  papers = [],
  topics = [],
  researchers = [],
  currentUser,
  initialQuery = "",
  onRefreshData,
  onNavigateToAuth,
  onUpdateCurrentUser
}: PapersViewProps) {
  const [searchQuery, setSearchQuery] = React.useState(initialQuery);
  const [selectedTopic, setSelectedTopic] = React.useState<string>("All");
  
  // Custom Filters matching spec: Topic, Popularity, Year, Price, Status
  const [popularitySort, setPopularitySort] = React.useState<string>("Newest"); // "Newest", "Oldest"
  const [selectedYear, setSelectedYear] = React.useState<string>("All");
  const [selectedPriceType, setSelectedPriceType] = React.useState<string>("All"); // "All", "Free", "Paid"
  const [selectedStatus, setSelectedStatus] = React.useState<string>("Active"); // For managers
  
  const [viewBookmarksOnly, setViewBookmarksOnly] = React.useState(false);
  const [selectedPaper, setSelectedPaper] = React.useState<Paper | null>(null);

  // Upload Paper Form State
  const [uploadOpen, setUploadOpen] = React.useState(false);
  const [submitTitle, setSubmitTitle] = React.useState("");
  const [submitAuthors, setSubmitAuthors] = React.useState("");
  const [submitYear, setSubmitYear] = React.useState(new Date().getFullYear());
  const [submitPages, setSubmitPages] = React.useState(8);
  const [submitCategory, setSubmitCategory] = React.useState("");
  const [submitSummary, setSubmitSummary] = React.useState("");
  const [submitPrice, setSubmitPrice] = React.useState("0.00");
  const [submitResearcherId, setSubmitResearcherId] = React.useState("");
  
  // Upload file state
  const [pdfFile, setPdfFile] = React.useState<File | null>(null);
  const [pdfBase64, setPdfBase64] = React.useState<string>("");
  const [pdfName, setPdfName] = React.useState<string>("");
  const [uploading, setUploading] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState("");
  const [successMsg, setSuccessMsg] = React.useState("");

  // Simulated purchase state inside details
  const [purchaseLoading, setPurchaseLoading] = React.useState(false);
  const [purchaseSuccess, setPurchaseSuccess] = React.useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (initialQuery) {
      setSearchQuery(initialQuery);
    }
  }, [initialQuery]);

  React.useEffect(() => {
    if (topics.length > 0 && !submitCategory) {
      setSubmitCategory(topics[0].name);
    }
  }, [topics]);

  // Derive unique years dynamically for filter dropdown
  const uniqueYears = React.useMemo(() => {
    const years = papers.map((p) => String(p.year));
    return ["All", ...Array.from(new Set(years)).sort((a,b) => b.localeCompare(a))];
  }, [papers]);

  // Is current logged user admin or editor?
  const isManager = currentUser && (currentUser.role === "admin" || currentUser.role === "editor");

  // Filtering Logic
  const filteredPapers = React.useMemo(() => {
    return papers
      .filter((paper) => {
        // 1. Search Query Search
        const query = searchQuery.toLowerCase().trim();
        const matchesSearch =
          !query ||
          paper.title.toLowerCase().includes(query) ||
          paper.summary.toLowerCase().includes(query) ||
          paper.authors.some((a) => a.toLowerCase().includes(query));

        // 2. Topic Filter
        const matchesTopic = selectedTopic === "All" || paper.categories.includes(selectedTopic);

        // 3. Bookmarks isolated views
        const matchesBookmark = !viewBookmarksOnly || (currentUser && currentUser.bookmarks.includes(paper.id));

        // 4. Year filter
        const matchesYear = selectedYear === "All" || String(paper.year) === selectedYear;

        // 5. Price filter
        const matchesPrice =
          selectedPriceType === "All" ||
          (selectedPriceType === "Free" && paper.price === 0) ||
          (selectedPriceType === "Paid" && paper.price > 0);

        // 6. Status filter (Default is Active for normal users. Admins can view Inactive)
        const isPaperActive = paper.status === "Active";
        const matchesStatus = isManager 
          ? (selectedStatus === "All" || paper.status === selectedStatus)
          : isPaperActive;

        return matchesSearch && matchesTopic && matchesBookmark && matchesYear && matchesPrice && matchesStatus;
      })
      .sort((a, b) => {
        if (popularitySort === "Oldest") return a.year - b.year;
        return b.year - a.year; // Default Newest
      });
  }, [papers, searchQuery, selectedTopic, viewBookmarksOnly, selectedYear, selectedPriceType, selectedStatus, popularitySort, currentUser, isManager]);

  // Related Papers recommendation logic
  const relatedPapers = React.useMemo(() => {
    if (!selectedPaper) return [];
    return papers
      .filter(p => p.id !== selectedPaper.id && p.status === "Active" && p.categories.some(c => selectedPaper.categories.includes(c)))
      .slice(0, 3);
  }, [selectedPaper, papers]);

  // File loading methods
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndLoadFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      validateAndLoadFile(e.target.files[0]);
    }
  };

  const validateAndLoadFile = (file: File) => {
    if (file.type !== "application/pdf" && !file.name.endsWith(".pdf")) {
      setErrorMsg("Validation restriction: Only valid PDF documents can be loaded.");
      return;
    }
    if (file.size > 15 * 1024 * 1024) {
      setErrorMsg("Payload warning: Size exceeds 15MB limit.");
      return;
    }
    setErrorMsg("");
    setPdfFile(file);
    setPdfName(file.name);

    const reader = new FileReader();
    reader.onload = () => {
      setPdfBase64(reader.result as string);
    };
    reader.onerror = () => {
      setErrorMsg("Failed to read binary stream.");
    };
    reader.readAsDataURL(file);
  };

  const handlePaperSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    if (!submitTitle || !submitAuthors || !submitSummary) {
      setErrorMsg("All mandatory labels must be filled.");
      return;
    }
    if (!pdfBase64) {
      setErrorMsg("Drag and drop or select a PDF manuscript file first.");
      return;
    }

    setUploading(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const uploadRes = await api.uploadFile(pdfName || "manuscript.pdf", "application/pdf", pdfBase64);
      const fileUrl = uploadRes.fileUrl;
      const parsedAuthors = submitAuthors.split(",").map(a => a.trim()).filter(Boolean);

      const payload: Partial<Paper> = {
        title: submitTitle.trim(),
        authors: parsedAuthors,
        year: Number(submitYear),
        pages: Number(submitPages),
        price: Number(submitPrice) || 0,
        status: "Active", // Initial submission goes Active
        categories: [submitCategory || topics[0]?.name || "Unassigned"],
        summary: submitSummary.trim(),
        fileUrl: fileUrl,
      };

      if (submitResearcherId) {
        payload.researcherId = submitResearcherId;
      }

      await api.createPaper(payload);

      // Save to localStorage so that if the container restarts and clears the server DB, we can restore it!
      try {
        const localPapers = JSON.parse(localStorage.getItem("research_archive_custom_papers") || "[]");
        if (!localPapers.some((p: any) => p.title.toLowerCase() === payload.title.toLowerCase())) {
          localPapers.push(payload);
          localStorage.setItem("research_archive_custom_papers", JSON.stringify(localPapers));
        }
      } catch (e) {
        console.warn("Could not backup paper to localStorage:", e);
      }

      setSuccessMsg("Manuscript uploaded & indexed successfully!");
      setSubmitTitle("");
      setSubmitAuthors("");
      setSubmitSummary("");
      setSubmitPrice("0.00");
      setPdfFile(null);
      setPdfBase64("");
      setPdfName("");

      onRefreshData();
      setTimeout(() => {
        setUploadOpen(false);
        setSuccessMsg("");
      }, 1500);

    } catch (err: any) {
      setErrorMsg(err.message || "Failed to finalize indexing details.");
    } finally {
      setUploading(false);
    }
  };

  const handleLike = async (paperId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await api.likePaper(paperId);
      onRefreshData();
      if (selectedPaper && selectedPaper.id === paperId) {
        setSelectedPaper(prev => prev ? { ...prev, likes: prev.likes + 1 } : null);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleBookmarkToggle = async (paperId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentUser) {
      onNavigateToAuth("signin");
      return;
    }
    try {
      const isBookmarked = currentUser.bookmarks.includes(paperId);
      let updatedUser;
      if (isBookmarked) {
        updatedUser = await api.unbookmarkPaper(paperId);
      } else {
        updatedUser = await api.bookmarkPaper(paperId);
      }
      onUpdateCurrentUser(updatedUser);
      onRefreshData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleOpenPaperDetails = async (paper: Paper) => {
    setSelectedPaper(paper);
    setPurchaseSuccess(false);
    // Trigger view increment
    try {
      await api.viewPaper(paper.id);
      onRefreshData();
    } catch (err) {
      console.warn("View registration warning", err);
    }
  };

  const handlePurchaseSimulated = async () => {
    if (!currentUser) {
      onNavigateToAuth("signin");
      return;
    }
    if (!selectedPaper) return;
    setPurchaseLoading(true);
    setErrorMsg("");

    try {
      const updatedUser = await api.purchasePaper(selectedPaper.id);
      onUpdateCurrentUser(updatedUser);
      setPurchaseSuccess(true);
      onRefreshData();
    } catch (err: any) {
      setErrorMsg(err.message || "Simulated gateway decline.");
    } finally {
      setPurchaseLoading(false);
    }
  };

  const userHasUnlockedPaper = (paperId: string) => {
    return true; // All publications are fully unlocked and accessible to any visitor
  };

  return (
    <div className="space-y-8 pb-16 page-transition-enter page-transition-enter-active">
      
      {/* 1. SECTION HEADER */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-stone-200 pb-5">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-stone-900">
            Scholarly Publications Archive
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 font-sans mt-1">
            Browse through peer-reviewed academic publications, indices, and download digital manuscript replicas.
          </p>
        </div>

        {/* Floating Top Actions */}
        <div className="flex flex-wrap items-center gap-3">
          {currentUser && (
            <button
              onClick={() => setViewBookmarksOnly(!viewBookmarksOnly)}
              className={`flex items-center gap-2 rounded-sm border px-4 py-2.5 font-sans text-xs font-bold transition-all cursor-pointer select-none ${
                viewBookmarksOnly
                  ? "bg-brand-500 border-brand-600 text-white shadow-xs"
                  : "bg-white border-stone-200 text-stone-700 hover:bg-stone-50"
              }`}
            >
              <Bookmark className={`h-4 w-4 ${viewBookmarksOnly ? "fill-white text-white" : "text-stone-400"}`} />
              {viewBookmarksOnly ? "Showing Bookmarks" : "View Bookmarks"}
            </button>
          )}

          <button
            onClick={() => {
              if (!currentUser) {
                onNavigateToAuth("signin");
              } else {
                setUploadOpen(!uploadOpen);
              }
            }}
            className="flex items-center gap-2 rounded-sm bg-brand-500 px-4.5 py-2.5 font-sans text-xs font-bold text-white shadow-xs hover:bg-brand-600 transition cursor-pointer select-none"
            id="btn-upload-init"
          >
            <Upload className="h-4 w-4" />
            Upload Manuscript
          </button>
        </div>
      </div>

      {/* 2. UPLOAD MODAL INBOUND DRAWER */}
      {uploadOpen && currentUser && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-md space-y-5 animate-slideDown" id="upload-panel">
          
          <div className="flex items-center justify-between border-b border-slate-100 pb-4 select-none">
            <h3 className="font-display text-sm font-bold text-slate-800 flex items-center gap-2">
              <Upload className="h-4.5 w-4.5 text-violet-600" />
              Inbound Document Metadata Submission
            </h3>
            <button
              onClick={() => {
                setUploadOpen(false);
                setErrorMsg("");
              }}
              className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-705 transition cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <form onSubmit={handlePaperSubmit} className="grid grid-cols-1 gap-6 md:grid-cols-2">
            
            {/* Left Inputs */}
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-1">
                  Document Title *
                </label>
                <input
                  type="text"
                  required
                  value={submitTitle}
                  onChange={(e) => setSubmitTitle(e.target.value)}
                  placeholder="e.g. Swarm Intelligence in Autonomous Routing Models"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs outline-none focus:bg-white focus:ring-1 focus:ring-violet-500 font-sans"
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-0.5">
                  Authors *
                </label>
                <span className="block text-[9px] text-slate-400 font-light font-sans mb-1.5">Comma-separated list (e.g. Dr. Jane Doe, Dr. Alice Blue)</span>
                <input
                  type="text"
                  required
                  value={submitAuthors}
                  onChange={(e) => setSubmitAuthors(e.target.value)}
                  placeholder="Elena Rostova, Li Wei, Sophia Al-Jamil"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs outline-none focus:bg-white focus:ring-1 focus:ring-violet-500 font-sans"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-1">Year *</label>
                  <input
                    type="number"
                    required
                    value={submitYear}
                    onChange={(e) => setSubmitYear(Number(e.target.value))}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs outline-none focus:bg-white focus:ring-1 focus:ring-violet-500 text-center font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-1">Page Length</label>
                  <input
                    type="number"
                    value={submitPages}
                    onChange={(e) => setSubmitPages(Number(e.target.value))}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs outline-none focus:bg-white focus:ring-1 focus:ring-violet-500 text-center font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-1">Price ($)</label>
                  <input
                    type="text"
                    value={submitPrice}
                    onChange={(e) => setSubmitPrice(e.target.value)}
                    placeholder="0.00"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs outline-none focus:bg-white focus:ring-1 focus:ring-violet-500 text-center font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-1">Category *</label>
                  <select
                    value={submitCategory}
                    onChange={(e) => setSubmitCategory(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs outline-none focus:bg-white focus:ring-1 focus:ring-violet-500"
                  >
                    {topics.map((t) => (
                      <option key={t.id} value={t.name}>{t.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-1">Affiliated Researcher</label>
                  <select
                    value={submitResearcherId}
                    onChange={(e) => setSubmitResearcherId(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs outline-none focus:bg-white focus:ring-1 focus:ring-violet-500 truncate"
                  >
                    <option value="">-- None --</option>
                    {researchers.map((res) => (
                      <option key={res.id} value={res.id}>{res.name}</option>
                    ))}
                  </select>
                </div>
              </div>

            </div>

            {/* Right inputs & PDF files drag drop */}
            <div className="space-y-4 flex flex-col justify-between">
              
              <div>
                <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-1">Executive summary / abstract *</label>
                <textarea
                  required
                  rows={4}
                  value={submitSummary}
                  onChange={(e) => setSubmitSummary(e.target.value)}
                  placeholder="Provide research goals, parameters, experimental testing details, and final telemetry metrics..."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs outline-none focus:bg-white focus:ring-1 focus:ring-violet-500 resize-none font-sans leading-relaxed"
                />
              </div>

              {/* Drag n Drop upload bounds */}
              <div>
                <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-1">Manuscript file (PDF format only) *</label>
                <div
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className="flex flex-col items-center justify-center border-2 border-dashed border-slate-200 bg-slate-50 p-4 rounded-xl cursor-pointer hover:bg-slate-100 hover:border-violet-300 transition-all text-center group font-sans"
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                    accept="application/pdf"
                    className="hidden"
                  />
                  {pdfFile ? (
                    <div className="space-y-1">
                      <div className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-green-50 text-green-700">
                        <FileText className="h-5 w-5" />
                      </div>
                      <p className="font-mono text-[11px] font-bold text-slate-800 truncate max-w-[200px]">
                        {pdfFile.name}
                      </p>
                      <p className="text-[9px] text-slate-400">
                        {(pdfFile.size / (1024 * 1024)).toFixed(2)} MB • Click to replace
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <div className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-500 group-hover:bg-violet-50 group-hover:text-violet-600 transition-colors">
                        <Paperclip className="h-4 w-4" />
                      </div>
                      <p className="text-[11px] font-semibold text-slate-600">
                        Drag and drop your PDF manuscript here
                      </p>
                      <p className="text-[9px] text-slate-400 font-light">
                        15MB payload cap limit • Only .pdf files allowed
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Submit triggers */}
              <div className="space-y-2 select-none">
                {errorMsg && (
                  <div className="rounded-xl bg-red-50 p-3 text-red-700 text-xs font-semibold">
                    {errorMsg}
                  </div>
                )}
                {successMsg && (
                  <div className="rounded-xl bg-green-50 p-3 text-green-755 text-xs font-semibold">
                    {successMsg}
                  </div>
                )}

                <div className="flex gap-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      setUploadOpen(false);
                      setErrorMsg("");
                    }}
                    className="w-1/3 rounded-xl border border-slate-200 bg-white py-2 font-display text-xs font-semibold text-slate-605 hover:bg-slate-50 transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={uploading}
                    className="flex-1 rounded-xl bg-slate-900 text-white font-bold text-xs py-2 hover:bg-slate-850 cursor-pointer disabled:bg-slate-300"
                  >
                    {uploading ? "Analyzing & Uploading PDF..." : "Index Manuscript"}
                  </button>
                </div>
              </div>

            </div>

          </form>

        </div>
      )}

      {/* 3. MULTI-FILTER BAR (Topic, Popularity, Year, Price, Status) */}
      <section className="bg-white border border-stone-200 rounded-sm p-5 shadow-3xs space-y-4 select-none" id="papers-filter-bench">
        
        {/* Row 1: Search & sorting */}
        <div className="flex flex-col gap-3.5 md:flex-row md:items-center">
          
          {/* Text Search input */}
          <div className="flex-1 relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by publication title, summary keyword, or matching author..."
              className="w-full rounded-sm border border-stone-300 bg-stone-50/30 pl-10 pr-8 py-2.5 text-xs outline-none focus:bg-white focus:border-brand-500 focus:ring-1 focus:ring-brand-500 font-sans"
            />
            <Search className="absolute left-3.5 top-3 h-4.5 w-4.5 text-stone-400" />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery("")}
                className="absolute right-3.5 top-2.5 text-stone-400 hover:text-stone-600 font-sans text-xs font-bold"
              >
                ×
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            
            {/* Sorting criteria */}
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-semibold text-stone-400 uppercase tracking-widest font-mono">Sort:</span>
              <select
                value={popularitySort}
                onChange={(e) => setPopularitySort(e.target.value)}
                className="rounded-sm border border-stone-300 bg-white px-2.5 py-1.5 text-xs outline-none font-medium text-stone-700 focus:border-brand-500"
              >
                <option value="Newest">Newest</option>
                <option value="Oldest">Oldest</option>
              </select>
            </div>

            {/* Year filters */}
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-semibold text-stone-400 uppercase tracking-widest font-mono">Year:</span>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="rounded-sm border border-stone-300 bg-white px-2.5 py-1.5 text-xs outline-none font-medium text-stone-700 focus:border-brand-500"
              >
                {uniqueYears.map((yr) => (
                  <option key={yr} value={yr}>{yr}</option>
                ))}
              </select>
            </div>

            {/* Price paid/free filters */}
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-semibold text-stone-400 uppercase tracking-widest font-mono">Type:</span>
              <select
                value={selectedPriceType}
                onChange={(e) => setSelectedPriceType(e.target.value)}
                className="rounded-sm border border-stone-300 bg-white px-2.5 py-1.5 text-xs outline-none font-medium text-stone-700 focus:border-brand-500"
              >
                <option value="All">All Publications</option>
                <option value="Free">Free Document</option>
                <option value="Paid">Premium Document</option>
              </select>
            </div>

            {/* Status Filter for Admins / Editors */}
            {isManager && (
              <div className="flex items-center gap-1.5 border-l border-stone-200 pl-2">
                <span className="text-[10px] font-bold text-amber-700 uppercase tracking-widest font-mono">Status:</span>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="rounded-sm border border-amber-300 bg-amber-50/55 px-2.5 py-1.5 text-xs outline-none font-semibold text-amber-800"
                >
                  <option value="All">All States</option>
                  <option value="Active">Active Index</option>
                  <option value="Inactive">Inactive/Draft</option>
                </select>
              </div>
            )}

          </div>

        </div>

        {/* Row 2: Horizontal Topic pill tags */}
        <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-stone-150">
          <button
            onClick={() => setSelectedTopic("All")}
            className={`rounded-sm px-3.5 py-1.5 font-sans text-[11px] font-semibold transition-all cursor-pointer ${
              selectedTopic === "All"
                ? "bg-brand-500 text-white shadow-xs border border-brand-600"
                : "bg-stone-50 text-stone-600 border border-stone-200 hover:bg-stone-100"
            }`}
          >
            All Fields
          </button>
          
          {topics.map((t) => (
            <button
              key={t.id}
              onClick={() => setSelectedTopic(t.name)}
              className={`rounded-sm px-3.5 py-1.5 font-sans text-[11px] font-semibold transition-all cursor-pointer ${
                selectedTopic === t.name
                  ? "bg-brand-500 text-white shadow-xs border border-brand-600"
                  : "bg-stone-50 text-stone-600 border border-stone-200 hover:bg-stone-100"
              }`}
            >
              {t.name}
            </button>
          ))}
        </div>

      </section>

      {/* 4. PAPERS DIRECTORY GRID (With desktop-first responsiveness and mobile swipe-scroll card structure) */}
      <section className="space-y-4">
        
        <div className="flex items-center justify-between select-none">
          <span className="font-mono text-xs font-semibold text-slate-450 uppercase tracking-widest">
            Results Found: {filteredPapers.length} Publications
          </span>
         
          {viewBookmarksOnly && (
            <button
              onClick={() => setViewBookmarksOnly(false)}
              className="text-xs text-violet-600 hover:underline cursor-pointer"
            >
              Clear Bookmark Filter
            </button>
          )}
        </div>

        {filteredPapers.length === 0 ? (
          <div className="rounded-3xl border border-slate-100 bg-white p-16 text-center shadow-xs" id="empty-papers">
            <BookOpen className="mx-auto h-12 w-12 text-slate-300 mb-4 animate-pulse" />
            <h3 className="font-display text-md font-bold text-slate-800">
              No index matches found
            </h3>
            <p className="text-xs text-slate-450 mt-1.5 max-w-sm mx-auto leading-relaxed">
              No materials match your query. Try resetting filters or adjusting search parameters.
            </p>
          </div>
        ) : (
          /* Mobile shows single scrollable list. Desktop wraps tightly on 3 columns */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6" id="papers-grid">
            {filteredPapers.map((paper, index) => {
              const isSaved = currentUser && currentUser.bookmarks.includes(paper.id);
              const isUnlocked = userHasUnlockedPaper(paper.id);
              const paperCover = paper.coverImage || "https://images.unsplash.com/photo-1518156677180-95a2893f3e9f?w=420&auto=format&fit=crop&q=80";

              const cardGradients = [
                "border-stone-200 bg-white hover:border-brand-500 shadow-3xs hover:shadow-2xs",
                "border-stone-200 bg-white hover:border-brand-500 shadow-3xs hover:shadow-2xs",
                "border-stone-200 bg-white hover:border-brand-500 shadow-3xs hover:shadow-2xs",
                "border-stone-200 bg-white hover:border-brand-500 shadow-3xs hover:shadow-2xs",
                "border-stone-200 bg-white hover:border-brand-500 shadow-3xs hover:shadow-2xs",
                "border-stone-200 bg-white hover:border-brand-500 shadow-3xs hover:shadow-2xs"
              ];

              const tagPills = [
                "bg-brand-500 text-white",
                "bg-brand-500 text-white",
                "bg-brand-500 text-white",
                "bg-brand-500 text-white",
                "bg-brand-500 text-white",
                "bg-brand-500 text-white"
              ];

              const titleHoverColors = [
                "group-hover:text-brand-500",
                "group-hover:text-brand-500",
                "group-hover:text-brand-500",
                "group-hover:text-brand-500",
                "group-hover:text-brand-500",
                "group-hover:text-brand-500"
              ];

              const pricePills = [
                "bg-stone-50 text-stone-850 border border-stone-250",
                "bg-stone-50 text-stone-850 border border-stone-250",
                "bg-stone-50 text-stone-850 border border-stone-250",
                "bg-stone-50 text-stone-850 border border-stone-250",
                "bg-stone-50 text-stone-850 border border-stone-250",
                "bg-stone-50 text-stone-850 border border-stone-250"
              ];

              const currentCardStyle = cardGradients[index % cardGradients.length];
              const currentTagStyle = tagPills[index % tagPills.length];
              const currentTitleColor = titleHoverColors[index % titleHoverColors.length];
              const currentPriceStyle = pricePills[index % pricePills.length];

              return (
                <div
                  key={paper.id}
                  onClick={() => handleOpenPaperDetails(paper)}
                  className={`group relative rounded-sm border overflow-hidden shadow-xs hover:shadow-xs hover:translate-y-[-2px] transition-all duration-250 flex flex-col h-[280px] cursor-pointer ${currentCardStyle}`}
                >
                  {/* Metadata Header Bar (Academic textual replacement) */}
                  <div className="p-4.5 pb-2.5 flex items-center justify-between select-none border-b border-stone-100 bg-stone-50/40">
                    <div className="flex flex-wrap gap-1">
                      {paper.categories.slice(0, 1).map((c, i) => {
                        const col = getTaxonomyColor(c);
                        return (
                          <span 
                            key={i} 
                            className={`rounded-xs text-[9px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 border ${col.bg} ${col.text} ${col.border}`}
                          >
                            {c}
                          </span>
                        );
                      })}
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono text-stone-500 font-semibold tracking-wider">
                        {paper.year} • {paper.pages}p.
                      </span>

                      {/* Status indicator */}
                      {isManager && (
                        <span className={`text-[8px] font-mono font-bold px-1.5 py-0.5 rounded-xs uppercase tracking-wider ${
                          paper.status === "Active" ? "bg-emerald-600 text-white" : "bg-amber-600 text-white"
                        }`}>
                          {paper.status}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Body Info */}
                  <div className="p-4.5 flex-1 flex flex-col justify-between space-y-3.5">
                    
                    <div className="space-y-1.5 text-left">
                      <h3 className={`font-display text-xs sm:text-[13px] font-bold text-stone-850 leading-snug transition-colors line-clamp-2 ${currentTitleColor}`} title={paper.title}>
                        {paper.title}
                      </h3>
                      <p className="text-[10px] font-medium text-stone-500 truncate font-sans" title={paper.authors.join(", ")}>
                        By {paper.authors.join(", ")}
                      </p>
                      <p className="text-[11px] text-stone-600 line-clamp-3 font-light font-sans !leading-relaxed">
                        {paper.summary}
                      </p>
                    </div>

                    {/* Stats details & Bookmarking */}
                    <div className="flex items-center justify-between font-sans border-t border-stone-100 pt-3 mt-auto">
                      
                      <div className="text-[10px] font-mono text-stone-450 uppercase">
                        Access: <span className="font-bold text-emerald-700">Free</span>
                      </div>

                      <div className="flex items-center gap-2">
                        {/* Bookmark Button */}
                        <button
                          onClick={(e) => handleBookmarkToggle(paper.id, e)}
                          className="p-1 rounded-sm text-stone-400 hover:bg-stone-50 hover:text-amber-500 transition cursor-pointer"
                        >
                          {isSaved ? (
                            <BookmarkCheck className="h-4.5 w-4.5 text-amber-500 fill-amber-500 animate-pulse" />
                          ) : (
                            <Bookmark className="h-4.5 w-4.5 text-stone-350" />
                          )}
                        </button>
                        
                        {/* Cost visual or direct unlocked tag */}
                        <span className="rounded-xs bg-stone-100 border border-stone-250 text-stone-700 font-mono font-bold text-[9px] px-2 py-0.5 uppercase tracking-wider">
                          OPEN ACCESS
                        </span>
                      </div>

                    </div>

                  </div>

                </div>
              );
            })}
          </div>
        )}

      </section>

      {/* 5. HEAVY WEIGHT DETAILS MODAL WINDOW WITH RECOMMENDATIONS */}
      {selectedPaper && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs select-none animate-fadeIn" id="paper-details-modal">
          <div className="relative w-full max-w-2xl rounded-3xl bg-white shadow-2xl border border-slate-100 flex flex-col justify-between max-h-[92vh] overflow-hidden">
            
            {/* Header branding in modal */}
            <div className="sticky top-0 bg-slate-50 p-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BookOpen className="h-4.5 w-4.5 text-violet-600 animate-pulse" />
                <span className="font-mono text-[9px] font-extrabold text-slate-400 uppercase tracking-widest leading-none">
                  SECURE RESEARCH COMPLIANCE LOCK
                </span>
              </div>
              <button
                onClick={() => {
                  setSelectedPaper(null);
                  setPurchaseSuccess(false);
                  setErrorMsg("");
                }}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-205 hover:text-slate-705 transition cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Scroll content area */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1 max-h-[calc(92--vh-120px)]">
              
              {/* Category tags */}
              <div className="flex flex-wrap items-center gap-1.5">
                {selectedPaper.categories.map((c, i) => {
                  const col = getTaxonomyColor(c);
                  return (
                    <span key={i} className={`rounded-full font-mono text-[9px] font-bold uppercase tracking-wider px-3 py-1 border ${col.bg} ${col.text} ${col.border}`}>
                      {c}
                    </span>
                  );
                })}
                
                <span className="ml-auto font-mono text-[10px] text-slate-400">
                  REF NO: {selectedPaper.id.toUpperCase()}
                </span>
              </div>

              {/* Title */}
              <h2 className="font-display text-lg sm:text-xl font-extrabold text-slate-900 leading-snug text-left select-text">
                {selectedPaper.title}
              </h2>

              {/* Authors & Year details */}
              <div className="grid grid-cols-2 gap-4 text-xs select-text">
                <div className="flex items-start gap-2">
                  <Users className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="block font-semibold text-slate-500 uppercase tracking-wide text-[9px]">Authors</span>
                    <p className="text-slate-700 font-medium mt-0.5 leading-snug">{selectedPaper.authors.join(", ")}</p>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <Calendar className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="block font-semibold text-slate-500 uppercase tracking-wide text-[9px]">Year of Publication</span>
                    <p className="text-slate-700 font-medium font-mono mt-0.5">{selectedPaper.year} ({selectedPaper.pages} pages)</p>
                  </div>
                </div>
              </div>

              {/* Abstract executive summaries */}
              <div className="rounded-2xl bg-slate-50 p-4.5 border border-slate-100 select-text">
                <h4 className="font-display text-[10px] font-bold text-slate-800 uppercase tracking-wider mb-2.5">
                  Executive Summary / Abstract
                </h4>
                <p className="text-[11px] sm:text-xs text-slate-650 leading-relaxed font-light font-sans text-justify text-slate-600">
                  {selectedPaper.summary}
                </p>
              </div>

              {/* Access Banner */}
              <div className="rounded-xl border border-emerald-100 p-3 bg-emerald-50/50 text-center select-none">
                <span className="block font-sans text-xs font-bold text-emerald-700 uppercase tracking-wider">
                  ✦ Open Access • Free Download Approved ✦
                </span>
              </div>

              {/* RELATED PAPERS RECOMMENDATION SECTION */}
              {relatedPapers.length > 0 && (
                <div className="pt-4 border-t border-slate-100 space-y-3.5 select-none text-left">
                  <div className="flex items-center gap-1.5">
                    <BookOpen className="h-4 w-4 text-violet-500 animate-bounce" />
                    <h4 className="font-display text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">
                      Related Papers Recommended Inside Theme
                    </h4>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {relatedPapers.map((rel) => (
                      <button
                        key={rel.id}
                        onClick={() => {
                          handleOpenPaperDetails(rel);
                        }}
                        className="flex flex-col justify-between text-left p-3 rounded-2xl bg-slate-50 border border-slate-100 hover:border-violet-200 transition-all cursor-pointer"
                      >
                        <div>
                          {(() => {
                            const col = getTaxonomyColor(rel.categories[0]);
                            return (
                              <span className={`font-mono text-[8px] font-bold block uppercase mb-1.5 px-1.5 py-0.5 rounded-xs border inline-block ${col.bg} ${col.text} ${col.border}`}>
                                {rel.categories[0]}
                              </span>
                            );
                          })()}
                          <h5 className="font-display text-[11px] font-bold text-slate-800 line-clamp-2 leading-snug">
                            {rel.title}
                          </h5>
                        </div>
                        <span className="block text-[9px] font-sans text-slate-400 mt-2 truncate">
                          By {rel.authors[0]} ({rel.year})
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

            </div>

            {/* Footer triggers (Including Simulated dynamic PDF checkout/expiry alerts) */}
            <div className="sticky bottom-0 bg-slate-50 p-4 border-t border-slate-100 select-none">
              
              <div className="flex items-center justify-between flex-wrap gap-4">
                
                <div className="text-left font-mono text-[9px] text-slate-400 font-semibold max-w-xs leading-relaxed">
                  <span className="text-emerald-600 font-bold uppercase text-[9px] bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded tracking-wide flex items-center gap-1">
                    <CheckCircle2 className="h-3.5 w-3.5" /> OPEN ACCESS MANUSCRIPT • APPROVED UNLOCKED
                  </span>
                </div>

                {/* Confirming download/checkout */}
                <div className="flex items-center gap-2 ml-auto">
                  <button
                    onClick={(e) => handleBookmarkToggle(selectedPaper.id, e)}
                    className="p-2.5 rounded-xl border border-slate-205 text-slate-650 hover:bg-slate-100 transition cursor-pointer"
                    title="Bookmark File"
                  >
                    <Bookmark className="h-4 w-4 text-slate-500" />
                  </button>
                  <a
                    href={`/api/download?url=${encodeURIComponent(selectedPaper.fileUrl)}&title=${encodeURIComponent(selectedPaper.title)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    download={`${selectedPaper.title}.pdf`}
                    className="flex items-center gap-1.5 rounded-xl bg-violet-600 px-5 py-2.5 font-display text-xs font-bold text-white hover:bg-violet-700 transition active:scale-97 cursor-pointer"
                  >
                    <Download className="h-4 w-4" />
                    Download PDF Document
                  </a>
                </div>

              </div>

              {/* Purchase Gateway Success feedback */}
              {purchaseSuccess && (
                <div className="mt-3 rounded-xl bg-green-50 p-3 text-green-700 text-xs font-semibold animate-fadeIn flex items-start gap-2 text-left">
                  <CheckCircle2 className="h-4.5 w-4.5 shrink-0 mt-0.5 text-green-600" />
                  <div>
                    <span className="block font-bold">Simulated Transaction Confirmed!</span>
                    <p className="text-[10px] font-normal leading-relaxed text-green-600/90 mt-0.5">Your receipt has been added to your profile order summary history securely. Dynamic PDF keys are now live.</p>
                  </div>
                </div>
              )}

              {errorMsg && (
                <div className="mt-2 rounded-xl bg-red-50 p-2.5 text-red-650 text-xs font-semibold text-center leading-normal">
                  {errorMsg}
                </div>
              )}

            </div>

          </div>
        </div>
      )}

    </div>
  );
}
