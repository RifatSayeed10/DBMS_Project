import React from "react";
import { 
  Search, BookOpen, Users, Tag, ArrowRight, Eye, ThumbsUp, 
  Cpu, Layers, Network, Eye as EyeIcon, MessageSquare, ShieldCheck, 
  HelpCircle, Send, CheckCircle, Quote, Star, Sparkles, LogIn, UserPlus,
  Sun, Moon
} from "lucide-react";
import { Paper, Researcher, Topic } from "../types";
import { api } from "../lib/api";
import { getTaxonomyColor, getResearcherColor } from "../lib/taxonomyColors";

interface HomeViewProps {
  papers: Paper[];
  researchers: Researcher[];
  topics: Topic[];
  onSearch: (query: string) => void;
  onSelectPaper: (paper: Paper) => void;
  onSelectResearcher: (resId: string) => void;
  onNavigateToAuth?: (tab: "signin" | "register") => void; // Link redirection
  theme?: "light" | "dark";
  onToggleTheme?: () => void;
}

export default function HomeView({
  papers,
  researchers,
  topics,
  onSearch,
  onSelectPaper,
  onSelectResearcher,
  onNavigateToAuth,
  theme = "light",
  onToggleTheme
}: HomeViewProps) {
  const [localSearch, setLocalSearch] = React.useState("");
  
  // Testimonial & Contact State
  const [contactName, setContactName] = React.useState("");
  const [contactEmail, setContactEmail] = React.useState("");
  const [contactMsg, setContactMsg] = React.useState("");
  const [contactSuccess, setContactSuccess] = React.useState("");
  const [contactLoading, setContactLoading] = React.useState(false);

  // Search Submit
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(localSearch);
  };

  // Contact Message Submit
  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactName || !contactEmail || !contactMsg) return;
    setContactLoading(true);
    try {
      await api.sendContactMessage(contactName, contactEmail, contactMsg);
      setContactSuccess("Your support message was registered successfully! A simulation validation was dispatched.");
      setContactName("");
      setContactEmail("");
      setContactMsg("");
      setTimeout(() => setContactSuccess(""), 5000);
    } catch (err) {
      console.error(err);
    } finally {
      setContactLoading(false);
    }
  };

  // Sort papers by views/likes for "Recent Papers" or featured
  const activePapers = papers.filter(p => p.status === "Active");
  const recentPapers = activePapers.slice(0, 4);

  // Dynamic counts reflecting real content from the database
  const statPapersCount = activePapers.length.toString();
  const statResearchersCount = researchers.length.toString();
  const statTopicsCount = topics.length.toString();

  // Create dynamic display topics from the database content with beautiful UI styling
  const icons = [Cpu, Layers, Network, EyeIcon, MessageSquare, ShieldCheck];
  const bgs = [
    "bg-stone-50 text-brand-500 border-stone-200",
    "bg-stone-50 text-brand-500 border-stone-200",
    "bg-stone-50 text-brand-500 border-stone-200",
    "bg-stone-50 text-brand-500 border-stone-200",
    "bg-stone-50 text-brand-500 border-stone-200",
    "bg-stone-50 text-brand-500 border-stone-200"
  ];
  const cardGradients = [
    "bg-white hover:bg-brand-50/45 border-stone-200 hover:border-brand-500 shadow-2xs transition-all duration-200",
    "bg-white hover:bg-brand-50/45 border-stone-200 hover:border-brand-500 shadow-2xs transition-all duration-200",
    "bg-white hover:bg-brand-50/45 border-stone-200 hover:border-brand-500 shadow-2xs transition-all duration-200",
    "bg-white hover:bg-brand-50/45 border-stone-200 hover:border-brand-500 shadow-2xs transition-all duration-200",
    "bg-white hover:bg-brand-50/45 border-stone-200 hover:border-brand-500 shadow-2xs transition-all duration-200",
    "bg-white hover:bg-brand-50/45 border-stone-200 hover:border-brand-500 shadow-2xs transition-all duration-200"
  ];

  const displayTopics = topics.slice(0, 6).map((topic, i) => {
    const paperCount = activePapers.filter(p => p.categories.includes(topic.name)).length;
    return {
      title: topic.name,
      count: `${paperCount} ${paperCount === 1 ? "paper" : "papers"}`,
      icon: icons[i % icons.length],
      bg: bgs[i % bgs.length],
      cardBg: cardGradients[i % cardGradients.length]
    };
  });

  return (
    <div className="space-y-16 pb-16 page-transition-enter page-transition-enter-active">
      
      {/* 1. TYPOGRAPHIC ACADEMIC HERO SECTION */}
      <section className="relative overflow-hidden rounded-sm bg-brand-50/20 border border-brand-100 px-6 py-10 sm:px-12 sm:py-16 shadow-xs" id="home-hero">
        <div className="absolute right-0 top-0 -z-10 h-64 w-64 rounded-full bg-brand-100/40 blur-3xl"></div>
        <div className="absolute left-10 bottom-0 -z-10 h-48 w-48 rounded-full bg-emerald-50/45 blur-2xl"></div>

        <div className="flex flex-col items-center justify-center text-center max-w-3xl mx-auto space-y-6 animate-fadeIn">
          
          <div className="flex flex-wrap items-center justify-center gap-3">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-violet-100 px-3.5 py-1.5 text-xs font-semibold text-violet-700 select-none shadow-3xs">
              <Sparkles className="h-3.5 w-3.5 text-violet-500 animate-pulse" />
              <span>Free Academic Self-Publishing Enabled</span>
            </div>
          </div>

          <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl text-slate-900 tracking-tight leading-tight font-extrabold">
            Explore <span className="text-transparent bg-clip-text bg-linear-to-r from-violet-600 to-indigo-600">Research.</span> <br />
            Expand <span className="text-transparent bg-clip-text bg-linear-to-r from-indigo-500 to-emerald-500">Knowledge.</span>
          </h1>

          <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-xl mx-auto">
            A modern, colorful platform to discover, share, and archive peer-reviewed publications. Both students and teachers can publish papers and chat in real-time.
          </p>

          {/* Centered Search Form */}
          <form onSubmit={handleSearchSubmit} className="w-full max-w-xl pt-2" id="hero-search-form">
            <div className="relative flex items-center bg-white rounded-full p-1.5 border border-violet-100 shadow-md">
              <div className="pl-3 text-slate-400 shrink-0">
                <Search className="h-5 w-5" />
              </div>
              <input
                type="text"
                value={localSearch}
                onChange={(e) => setLocalSearch(e.target.value)}
                placeholder="Search for papers, topics, researchers..."
                className="w-full bg-transparent border-none outline-none text-xs font-medium text-slate-800 placeholder-slate-450 pl-2 pr-28 py-2 font-sans"
                id="hero-input"
              />
              <button
                type="submit"
                className="absolute right-1.5 rounded-full bg-violet-650 hover:bg-violet-700 px-6 py-2 text-xs font-bold text-white transition-all shadow-sm cursor-pointer select-none"
              >
                Search
              </button>
            </div>
          </form>

          {/* Counts Badges */}
          <div className="pt-4 flex flex-wrap items-center justify-center gap-6 select-none border-t border-slate-100 w-full max-w-md mx-auto">
            {[
              { qty: statPapersCount, label: "Papers", icon: BookOpen, color: "text-violet-500 bg-violet-50" },
              { qty: statResearchersCount, label: "Researchers", icon: Users, color: "text-blue-500 bg-blue-50" },
              { qty: statTopicsCount, label: "Topics", icon: Tag, color: "text-amber-500 bg-amber-50" },
            ].map((badge, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className={`p-1.5 rounded-lg ${badge.color}`}>
                  <badge.icon className="h-4 w-4" />
                </div>
                <div>
                  <span className="block font-mono text-sm font-bold text-slate-800 leading-none">
                    {badge.qty}
                  </span>
                  <span className="block text-[10px] text-slate-400 font-medium uppercase tracking-wider mt-0.5">
                    {badge.label}
                  </span>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* 2. BROWSE BY TOPICS */}
      <section className="space-y-6" id="home-browse-topics">
        <div className="flex items-center justify-between select-none">
          <h2 className="font-display text-lg font-bold text-stone-900">
            Browse by Topics
          </h2>
          <button 
            onClick={() => onSearch("")}
            className="flex items-center gap-1 font-display text-xs font-semibold text-brand-500 hover:text-brand-600 hover:underline transition-colors cursor-pointer"
          >
            View all topics 
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {displayTopics.map((top, idx) => (
            <button
              key={idx}
              onClick={() => {
                onSearch(top.title);
              }}
              className={`flex items-center gap-4 rounded-sm border p-4 text-left transition-all hover:translate-y-[-2px] cursor-pointer select-none duration-250 ${top.cardBg}`}
            >
              <div className={`p-3 rounded-sm border ${top.bg}`}>
                <top.icon className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-display text-xs font-bold text-stone-850">
                  {top.title}
                </h3>
                <span className="font-mono text-[9px] font-bold text-stone-400 uppercase tracking-wider">
                  {top.count}
                </span>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* 3. RECENT PAPERS & TOP INVESTIGATORS BENTO GRID */}
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-12">
        
        {/* RECENT PAPERS COLUMN (Left 8/12) */}
        <section className="lg:col-span-8 space-y-6" id="home-recent-papers">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-display text-lg font-bold text-stone-900">
                Recent Publications
              </h2>
              <p className="text-xs text-stone-400 font-serif">Curated acquisitions added within the active catalog directory.</p>
            </div>
            <button 
              onClick={() => onSearch("")}
              className="flex items-center gap-1 font-display text-xs font-semibold text-brand-500 hover:text-brand-600 hover:underline cursor-pointer"
            >
              View entire library
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>

          {recentPapers.length === 0 ? (
            <div className="rounded-sm border border-dashed border-stone-200 bg-white p-8 text-center text-stone-400 text-xs font-serif">
              No recent Publications listed inside platform index.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              {recentPapers.map((paper) => (
                <div 
                  key={paper.id}
                  className="group relative rounded-sm border border-stone-200 bg-white overflow-hidden shadow-2xs hover:border-brand-500 hover:shadow-xs transition-all duration-300 flex flex-col h-full"
                >
                  {/* Metadata Header Bar (Academic textual replacement) */}
                  <div className="p-4 pb-2.5 flex items-center justify-between select-none border-b border-stone-100 bg-stone-50/40">
                    {(() => {
                      const col = getTaxonomyColor(paper.categories[0]);
                      return (
                        <span className={`rounded-xs border px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider ${col.bg} ${col.text} ${col.border}`}>
                          {paper.categories[0]}
                        </span>
                      );
                    })()}
                    <span className="text-[10px] font-mono text-stone-500 font-semibold tracking-wider">
                      {paper.year}
                    </span>
                  </div>

                  {/* Body details */}
                  <div className="p-4 flex-grow flex flex-col justify-between space-y-3.5">
                    
                    <div className="space-y-1">
                      <h3 className="font-display text-xs font-bold text-stone-850 leading-snug group-hover:text-brand-500 transition-colors line-clamp-2" title={paper.title}>
                        {paper.title}
                      </h3>
                      <p className="text-[10px] text-stone-400 font-sans truncate max-w-full">
                        By {paper.authors.join(", ")}
                      </p>
                    </div>

                    <div className="flex items-center justify-between font-mono text-[10px] text-stone-450 select-none pt-2 border-t border-stone-100 mt-auto">
                      <span>{paper.pages} pages</span>
                      {paper.price > 0 ? (
                        <span className="font-bold text-brand-500 font-mono">${paper.price.toFixed(2)}</span>
                      ) : (
                        <span className="text-emerald-700 font-bold font-mono tracking-widest uppercase text-[9px] bg-emerald-50 px-1.5 rounded-xs">FREE</span>
                      )}
                    </div>

                    <div className="flex items-center justify-end text-[11px] pt-1">
                      <button 
                        onClick={() => onSelectPaper(paper)}
                        className="rounded-sm bg-stone-900 hover:bg-brand-500 px-3.5 py-1 font-sans text-[10px] font-semibold text-white transition-all cursor-pointer"
                      >
                        Details
                      </button>
                    </div>

                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* TOP INVESTIGATORS SIDE PANEL (Right 4/12) */}
        <section className="lg:col-span-4 space-y-6" id="home-investigators-panel">
          <div>
            <h2 className="font-display text-lg font-bold text-stone-900 select-none">
              Top Researchers
            </h2>
            <p className="text-xs text-stone-400 font-serif">Distinguished investigators logged within the repository.</p>
          </div>

          <div className="space-y-3">
            {researchers.length === 0 ? (
              <div className="rounded-sm border border-dashed border-stone-200 bg-white p-6 text-center text-stone-400 text-xs font-serif">
                No researchers registered in system. Add researchers in Admin view to appear here.
              </div>
            ) : (
              researchers.slice(0, 5).map((res) => {
                const resCol = getResearcherColor(res.name);
                return (
                  <div
                    key={res.id}
                    className="flex items-center gap-3 rounded-sm border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-3.5 transition-all"
                    onMouseEnter={(e) => {
                      const el = e.currentTarget;
                      if (resCol.rawText.includes("red")) el.style.borderColor = "#ef4444";
                      else if (resCol.rawText.includes("sky")) el.style.borderColor = "#0ea5e9";
                      else if (resCol.rawText.includes("purple")) el.style.borderColor = "#a855f7";
                      else if (resCol.rawText.includes("emerald")) el.style.borderColor = "#10b981";
                      else if (resCol.rawText.includes("amber")) el.style.borderColor = "#f59e0b";
                      else if (resCol.rawText.includes("orange")) el.style.borderColor = "#f97316";
                      else if (resCol.rawText.includes("fuchsia")) el.style.borderColor = "#d946ef";
                      else if (resCol.rawText.includes("rose")) el.style.borderColor = "#f43f5e";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = "var(--color-slate-200)";
                    }}
                  >
                    <img
                      src={res.profilePhoto}
                      alt={res.name}
                      referrerPolicy="no-referrer"
                      className={`h-10 w-10 rounded-sm object-cover border-2 shrink-0 ${resCol.border}`}
                    />
                    <div className="flex-grow min-w-0 select-text">
                      <button
                        onClick={() => onSelectResearcher(res.id)}
                        className={`block font-display text-xs font-bold text-stone-850 dark:text-stone-100 hover:underline text-left truncate w-full hover:${resCol.text}`}
                      >
                        {res.name}
                      </button>
                      <span className="block text-[10px] text-stone-400 font-serif truncate leading-none mt-0.5">
                        {res.affiliation}
                      </span>
                    </div>
                    <div className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-sm border ${resCol.bg} ${resCol.text} ${resCol.border}`}>
                      {res.paperCount || 2} papers
                    </div>
                  </div>
                );
              })
            )}
          </div>

        </section>

      </div>

      {/* 4. JOIN OUR RESEARCH COMMUNITY - OXFORD CRIMSON BANNER */}
      <section className="relative overflow-hidden rounded-sm bg-brand-500 border border-brand-600 p-8 sm:p-12 text-white shadow-xs text-center space-y-5" id="home-community-banner">
        <div className="absolute inset-0 select-none bg-[radial-gradient(circle_at_50%_120%,rgba(255,255,255,0.06),transparent)]"></div>
        <h2 className="relative font-display text-2xl font-bold sm:text-3xl tracking-tight leading-tight select-none">
          Join Our Research Community
        </h2>
        <p className="relative mx-auto max-w-xl text-xs sm:text-sm text-brand-100 font-sans leading-relaxed">
          "Share your research, collaborate with leading scholars worldwide, and syndicate your manuscripts into our indexed academic database."
        </p>
        
        <div className="relative pt-2 flex flex-wrap justify-center gap-3.5 z-10">
          <button 
            onClick={() => onNavigateToAuth ? onNavigateToAuth("signin") : onSearch("")}
            className="flex items-center gap-1.5 rounded-sm border border-brand-200/30 bg-white/10 px-5 py-2.5 font-sans text-xs font-semibold text-white hover:bg-white/20 transition-all cursor-pointer select-none"
          >
            <LogIn className="h-4 w-4" />
            Sign In
          </button>
          <button 
            onClick={() => onNavigateToAuth ? onNavigateToAuth("register") : onSearch("")}
            className="flex items-center gap-1.5 rounded-sm bg-white px-5 py-2.5 font-sans text-xs font-bold text-brand-700 hover:bg-brand-50 transition-all cursor-pointer shadow-xs select-none"
          >
            <UserPlus className="h-4 w-4" />
            Register Now
          </button>
        </div>
      </section>

      {/* 5. USER SUPPORT CONTACT MESSAGE BAR */}
      <section className="grid grid-cols-1 gap-10 lg:grid-cols-2 bg-white rounded-sm p-6.5 sm:p-8 border border-stone-200 shadow-3xs" id="home-contact-faq">
        
        {/* Left Side: Testimonial & Contact */}
        <div className="space-y-6">
          <div className="select-none">
            <h3 className="font-display text-md font-bold text-stone-900">
              Submit Inquiry
            </h3>
            <p className="text-xs text-stone-400 font-serif mt-0.5">Need assistance publishing or indexing? Let our administration assist.</p>
          </div>

          <form onSubmit={handleContactSubmit} className="space-y-3" id="contact-form">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-semibold text-stone-500 uppercase tracking-wider mb-1">Your Name</label>
                <input 
                  type="text" 
                  required
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  placeholder="e.g. Jane Smith"
                  className="w-full rounded-sm border border-stone-250 px-3 py-2 text-xs outline-none focus:border-brand-500 focus:bg-stone-50"
                />
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-stone-500 uppercase tracking-wider mb-1">Your Email</label>
                <input 
                  type="email" 
                  required
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  placeholder="e.g. smith@mit.edu"
                  className="w-full rounded-sm border border-stone-250 px-3 py-2 text-xs outline-none focus:border-brand-500 focus:bg-stone-50"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-semibold text-stone-500 uppercase tracking-wider mb-1">Message Body</label>
              <textarea 
                rows={3}
                required
                value={contactMsg}
                onChange={(e) => setContactMsg(e.target.value)}
                placeholder="What indices can we help troubleshoot?"
                className="w-full rounded-sm border border-stone-250 px-3 py-2 text-xs outline-none focus:border-brand-500 focus:bg-stone-50 resize-none font-sans"
              />
            </div>

            {contactSuccess && (
              <div className="flex items-start gap-2 rounded-sm bg-green-50 p-3 border border-green-200 text-green-700 animate-fadeIn" id="contact-success">
                <CheckCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span className="text-[11px] leading-relaxed font-medium">{contactSuccess}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={contactLoading}
              className="rounded-sm bg-stone-900 hover:bg-brand-500 text-white font-semibold text-xs py-2.5 px-5.5 transition-all flex items-center gap-1.5 cursor-pointer disabled:bg-stone-300"
            >
              <Send className="h-3.5 w-3.5" />
              {contactLoading ? "Sending..." : "Send Message"}
            </button>
          </form>
        </div>

        {/* Right Side: FAQs */}
        <div className="space-y-6">
          <div className="select-none">
            <h3 className="font-display text-base font-bold text-stone-900 flex items-center gap-1.5">
              <HelpCircle className="h-5 w-5 text-brand-500" />
              Frequently Asked Questions
            </h3>
            <p className="text-xs text-stone-500 font-serif mt-1">Quick answers regarding self-publishing, instant downloads, and scientific cooperation.</p>
          </div>

          <div className="space-y-3">
            {[
              { 
                q: "Can students and researchers upload research papers directly?", 
                a: "Absolutely! After registering or logging in, any student or researcher can access the 'Upload & Publish Paper' wizard on their Scholar Dashboard, upload a manuscript, and index it live." 
              },
              { 
                q: "How does the live scholastic help chat work?", 
                a: "Our platform provides instant live chat sessions. All online researchers can message administrators or peer scholars, offering real-time academic discussion and quick peer reviews." 
              },
              { 
                q: "How can I check or download an indexed document?", 
                a: "You can download papers instantly. Select any publication in the Library; free assets open immediately, while premium assets can be simulated to add directly to your Downloads profile tab." 
              },
              { 
                q: "How are the categories and topics organized?", 
                a: "Publications are classified under dynamic fields like Artificial Intelligence, Cryptography, and Big Data. Editors can expand this taxonomy via the management dashboards." 
              },
            ].map((faq, index) => (
              <details 
                key={index} 
                className="group rounded-sm border border-stone-200 bg-stone-50/50 p-3.5 text-xs transition-all pointer-events-auto cursor-pointer focus:bg-white [&_summary::-webkit-details-marker]:hidden"
              >
                <summary className="flex items-center justify-between font-bold text-stone-800 list-none outline-none">
                  <span className="group-open:text-brand-700 transition-colors">{faq.q}</span>
                  <span className="flex h-5 w-5 items-center justify-center rounded-xs bg-stone-200/50 text-stone-600 group-open:bg-brand-500 group-open:text-white transition-all transform group-open:rotate-45 font-mono text-sm leading-none">+</span>
                </summary>
                <p className="mt-2 text-[11px] text-stone-600 font-sans leading-relaxed border-t border-stone-200 pt-2 cursor-text">
                  {faq.a}
                </p>
              </details>
            ))}
          </div>

        </div>

      </section>

    </div>
  );
}
