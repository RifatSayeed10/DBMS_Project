import React, { useEffect, useState } from "react";
import Navbar from "./components/Navbar";
import HomeView from "./components/HomeView";
import PapersView from "./components/PapersView";
import TopicsView from "./components/TopicsView";
import ResearchersView from "./components/ResearchersView";
import AboutView from "./components/AboutView";
import AuthView from "./components/AuthView";
import AdminView from "./components/AdminView";
import ProfileView from "./components/ProfileView";
import ChatView from "./components/ChatView";
import { User, Paper, Topic, Researcher, SiteBranding } from "./types";
import { api } from "./lib/api";
import { Archive, HelpCircle } from "lucide-react";

export default function App() {
  const [currentTab, setCurrentTab] = useState<string>("home");
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    return (localStorage.getItem("site-theme") as "light" | "dark") || "light";
  });

  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    localStorage.setItem("site-theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  };
  // Query routing across views
  const [papersQuery, setPapersQuery] = useState("");
  const [selectedResId, setSelectedResId] = useState<string | undefined>(undefined);

  // Core collections State
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [papers, setPapers] = useState<Paper[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [researchers, setResearchers] = useState<Researcher[]>([]);
  const [siteBranding, setSiteBranding] = useState<SiteBranding | null>(null);
  const [loading, setLoading] = useState(true);

  // Trigger self-healing sync of local custom papers
  const syncCustomPapers = async (serverPapers: Paper[]) => {
    const localPapersStr = localStorage.getItem("research_archive_custom_papers");
    if (!localPapersStr) return;
    try {
      const localPapers = JSON.parse(localPapersStr);
      if (!Array.isArray(localPapers) || localPapers.length === 0) return;

      const token = localStorage.getItem("research_archive_token");
      if (!token) return;

      const missingPapers = localPapers.filter(
        (lp: any) => !serverPapers.some((sp: any) => sp.title.toLowerCase() === lp.title.toLowerCase())
      );

      if (missingPapers.length > 0) {
        console.log(`[Self-Healing] Re-syncing ${missingPapers.length} missing user-uploaded research papers to database...`);
        for (const paper of missingPapers) {
          try {
            const fallbackFileUrl = paper.fileUrl || "/sample-papers/swarm_intelligence_navigation.pdf";
            
            await api.createPaper({
              title: paper.title,
              authors: paper.authors,
              year: paper.year,
              pages: paper.pages || 10,
              categories: paper.categories,
              summary: paper.summary,
              fileUrl: fallbackFileUrl,
              researcherId: paper.researcherId,
              coverImage: paper.coverImage,
              price: paper.price || 0,
              status: paper.status || "Active"
            });
          } catch (err) {
            console.error("[Self-Healing] Failed to sync paper:", paper.title, err);
          }
        }
        const freshPapers = await api.getPapers();
        setPapers(freshPapers);
      }
    } catch (err) {
      console.warn("[Self-Healing] Sync engine error:", err);
    }
  };

  // Initialize and check token
  useEffect(() => {
    const initializePortal = async () => {
      setLoading(true);
      let pData: Paper[] = [];
      
      // Fetch core collections & branding in parallel
      try {
        const [loadedPapers, tData, rData, bData] = await Promise.all([
          api.getPapers(),
          api.getTopics(),
          api.getResearchers(),
          api.getBranding().catch((e) => {
            console.warn("Branding load fallback:", e);
            return null;
          })
        ]);
        pData = loadedPapers;
        setPapers(pData);
        setTopics(tData);
        setResearchers(rData);
        if (bData) {
          setSiteBranding(bData);
        }
      } catch (err) {
        console.error("Initialization failed reading remote assets", err);
      }

      // Resolve user token
      const token = localStorage.getItem("research_archive_token");
      let userProfile = null;
      if (token) {
        try {
          userProfile = await api.getMe();
          setCurrentUser(userProfile);
        } catch (err) {
          console.warn("Stored login validation expired, signature deleted");
          localStorage.removeItem("research_archive_token");
        }
      }

      // Trigger self-healing sync if logged in
      if (token && userProfile && pData.length > 0) {
        await syncCustomPapers(pData);
      }

      setLoading(false);
    };

    initializePortal();
  }, []);

  const refreshData = async () => {
    try {
      const [pData, tData, rData] = await Promise.all([
        api.getPapers(),
        api.getTopics(),
        api.getResearchers()
      ]);
      setPapers(pData);
      setTopics(tData);
      setResearchers(rData);

      // Recheck profile details to synchronize bookmarks & downloads
      const token = localStorage.getItem("research_archive_token");
      if (token) {
        const userProfile = await api.getMe();
        setCurrentUser(userProfile);
      }
    } catch (err) {
      console.warn("Synchronized reload breakdown", err);
    }
  };

  const refreshBranding = async () => {
    try {
      const bData = await api.getBranding();
      if (bData) {
        setSiteBranding(bData);
      }
    } catch (err) {
      console.warn("Could not reload active brand settings", err);
    }
  };

  const handleHomeSearch = (query: string) => {
    setPapersQuery(query);
    setCurrentTab("papers");
  };

  const handleSelectPaperFromHome = (paper: Paper) => {
    setPapersQuery(paper.title);
    setCurrentTab("papers");
  };

  const handleSelectResearcherFromHome = (resId: string) => {
    setSelectedResId(resId);
    setCurrentTab("researchers");
  };

  const handleSelectTopicFromTopics = (topicName: string) => {
    setPapersQuery(topicName);
    setCurrentTab("papers");
  };

  const handleAuthSuccess = (user: User, token: string) => {
    setCurrentUser(user);
    // Trigger self-healing sync of custom papers after login
    api.getPapers().then(pData => {
      syncCustomPapers(pData);
    }).catch(err => {
      console.warn("Could not sync custom papers on login success:", err);
    });
    // Force direct landing into personal profile downloads dashboard on success!
    setCurrentTab("profile");
  };

  const handleLogout = () => {
    localStorage.removeItem("research_archive_token");
    setCurrentUser(null);
    setCurrentTab("home");
  };

  const handleNavigateToAuth = (tabName: "signin" | "register") => {
    setCurrentTab(tabName);
  };

  // Render view router helper
  const renderViewContent = () => {
    if (loading) {
      return (
        <div className="flex flex-col items-center justify-center py-24 text-center select-none" id="loading-spinner">
          <div className="h-10 w-10 animate-spin rounded-full border-3 border-brand-500 border-t-transparent"></div>
          <span className="mt-4 font-mono text-xs font-semibold text-stone-550 uppercase tracking-widest leading-none">
            Resolving Repo Assets...
          </span>
        </div>
      );
    }

    switch (currentTab) {
      case "home":
        return (
          <HomeView
            papers={papers}
            researchers={researchers}
            topics={topics}
            onSearch={handleHomeSearch}
            onSelectPaper={handleSelectPaperFromHome}
            onSelectResearcher={handleSelectResearcherFromHome}
            theme={theme}
            onToggleTheme={toggleTheme}
            onNavigateToAuth={handleNavigateToAuth}
          />
        );
      case "papers":
        return (
          <PapersView
            papers={papers}
            topics={topics}
            researchers={researchers}
            currentUser={currentUser}
            initialQuery={papersQuery}
            onRefreshData={refreshData}
            onNavigateToAuth={handleNavigateToAuth}
            onUpdateCurrentUser={(usr) => setCurrentUser(usr)}
          />
        );
      case "topics":
        return (
          <TopicsView
            topics={topics}
            papers={papers}
            currentUser={currentUser}
            onRefreshData={refreshData}
            onSelectTopic={handleSelectTopicFromTopics}
          />
        );
      case "researchers":
        return (
          <ResearchersView
            researchers={researchers}
            papers={papers}
            currentUser={currentUser}
            selectedResearcherId={selectedResId}
            onRefreshData={refreshData}
            onSelectPaper={(p) => {
              setPapersQuery(p.title);
              setCurrentTab("papers");
            }}
          />
        );
      case "profile":
        return (
          <ProfileView
            currentUser={currentUser}
            onRefreshCurrentUser={refreshData}
            papers={papers}
            topics={topics}
            researchers={researchers}
            onSelectPaper={(p) => {
              setPapersQuery(p.title);
              setCurrentTab("papers");
            }}
            onNavigateToAuth={handleNavigateToAuth}
          />
        );
      case "chat":
        return <ChatView currentUser={currentUser} />;
      case "about":
        return <AboutView />;
      case "signin":
        return (
          <AuthView
            initialTab="signin"
            onAuthSuccess={handleAuthSuccess}
            onToggleTab={(tab) => setCurrentTab(tab)}
          />
        );
      case "register":
        return (
          <AuthView
            initialTab="register"
            onAuthSuccess={handleAuthSuccess}
            onToggleTab={(tab) => setCurrentTab(tab)}
          />
        );
      case "admin":
        return (
          <AdminView
            currentUser={currentUser}
            papers={papers}
            topics={topics}
            onRefreshData={refreshData}
            branding={siteBranding}
            onRefreshBranding={refreshBranding}
          />
        );
      default:
        return (
          <div className="py-12 text-center">
            <HelpCircle className="mx-auto h-12 w-12 text-slate-350" />
            <h2 className="font-display text-md font-bold text-slate-805 mt-2">Invalid Tab reference occurred</h2>
            <button
              onClick={() => setCurrentTab("home")}
              className="mt-3 text-xs font-semibold text-blue-600 hover:underline"
            >
              Return Home
            </button>
          </div>
        );
    }
  };

  const currentSiteTitle = siteBranding?.siteName || "Research Archive";

  return (
    <div className="flex min-h-screen flex-col bg-stone-50 text-stone-900 transition-colors duration-200">
      {/* Dynamic Header navbar */}
      <Navbar
        currentTab={currentTab}
        onChangeTab={(tabId) => {
          // Clear query passing if moving explicitly to primary tabs
          if (tabId !== "papers") setPapersQuery("");
          if (tabId !== "researchers") setSelectedResId(undefined);
          setCurrentTab(tabId);
        }}
        currentUser={currentUser}
        onLogout={handleLogout}
        branding={siteBranding}
        theme={theme}
        onToggleTheme={toggleTheme}
      />

      {/* Main Container */}
      <main className="flex-grow mx-auto max-w-7xl w-full px-4 sm:px-6 lg:px-8 py-8">
        {renderViewContent()}
      </main>

      {/* Architectural honest Footer */}
      <footer className="bg-white border-t border-slate-200/80 py-8 text-xs text-slate-400 font-sans" id="archive-footer">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          
          <div className="flex items-center gap-2 select-none">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-900 text-white shadow-xs">
              <Archive className="h-4 w-4 text-white" />
            </div>
            <div className="text-left">
              <span className="font-display font-medium text-slate-700">{currentSiteTitle}</span>
              <span className="block text-[8px] font-mono leading-none tracking-wide text-slate-350 mt-0.5">
                SECURE DISSOSIER CATALOGUE PORTAL • v2.0
              </span>
            </div>
          </div>

          <div className="flex items-center gap-5 font-medium select-none">
            <button onClick={() => setCurrentTab("papers")} className="hover:text-slate-705 cursor-pointer">Digital Catalog</button>
            <button onClick={() => setCurrentTab("topics")} className="hover:text-slate-705 cursor-pointer">Trending Topics</button>
            <button onClick={() => setCurrentTab("researchers")} className="hover:text-slate-705 cursor-pointer">Researchers</button>
          </div>

          <div className="flex items-center gap-1 font-mono text-[9px]" title="Timezone Coordinate">
            <span>2026 UTC Portal System •</span>
            <span className="font-bold text-slate-605">ACTIVE CLIENT CONNECTION</span>
          </div>

        </div>
      </footer>
    </div>
  );
}
