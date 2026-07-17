import React from "react";
import { 
  ShieldCheck, Users, BookOpen, Tag, Trash2, Edit, AlertCircle, CheckCircle, 
  Search, FileText, ArrowUpRight, HelpCircle, MessagesSquare, Settings, 
  BarChart4, MessageSquare, Plus, Ban, UserCheck, ShieldAlert, Key, Globe, LayoutDashboard
} from "lucide-react";
import { User, Paper, Topic, Ticket, ContactMessage, FAQItem, SiteBranding } from "../types";
import { api } from "../lib/api";

interface AdminViewProps {
  currentUser: User | null;
  papers: Paper[];
  topics: Topic[];
  onRefreshData: () => void;
  branding: SiteBranding | null;
  onRefreshBranding: () => void;
}

type AdminSubTab = "reports" | "users" | "papers" | "topics" | "tickets" | "faq" | "branding";

export default function AdminView({
  currentUser,
  papers = [],
  topics = [],
  onRefreshData,
  branding,
  onRefreshBranding
}: AdminViewProps) {
  // Access check
  const isManager = currentUser && (currentUser.role === "admin" || currentUser.role === "editor");

  const [activeSubTab, setActiveSubTab] = React.useState<AdminSubTab>("reports");
  const [users, setUsers] = React.useState<User[]>([]);
  const [tickets, setTickets] = React.useState<Ticket[]>([]);
  const [messages, setMessages] = React.useState<ContactMessage[]>([]);
  const [faqs, setFaqs] = React.useState<FAQItem[]>([]);
  
  const [loading, setLoading] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState("");
  const [successMsg, setSuccessMsg] = React.useState("");

  // Edit / Action States
  const [editingPaper, setEditingPaper] = React.useState<Paper | null>(null);
  const [editTitle, setEditTitle] = React.useState("");
  const [editAuthors, setEditAuthors] = React.useState("");
  const [editSummary, setEditSummary] = React.useState("");
  const [editPrice, setEditPrice] = React.useState("0.00");
  const [editStatus, setEditStatus] = React.useState<"Active" | "Inactive">("Active");

  // Topic Creation
  const [newTopicName, setNewTopicName] = React.useState("");
  const [newTopicDesc, setNewTopicDesc] = React.useState("");

  // FAQ Creation / Update
  const [faqsLoading, setFaqsLoading] = React.useState(false);
  const [editingFaq, setEditingFaq] = React.useState<FAQItem | null>(null);
  const [faqQuestion, setFaqQuestion] = React.useState("");
  const [faqAnswer, setFaqAnswer] = React.useState("");

  // Ticket replying state
  const [selectedTicket, setSelectedTicket] = React.useState<Ticket | null>(null);
  const [ticketReplyText, setTicketReplyText] = React.useState("");

  // Message replying state
  const [selectedMessage, setSelectedMessage] = React.useState<ContactMessage | null>(null);
  const [messageReplyText, setMessageReplyText] = React.useState("");

  // Branding adjustment state
  const [brandName, setBrandName] = React.useState("");
  const [brandTagline, setBrandTagline] = React.useState("");
  const [brandLogo, setBrandLogo] = React.useState("");
  const [brandTheme, setBrandTheme] = React.useState("violet");

  React.useEffect(() => {
    if (isManager) {
      loadDataForActiveTab();
    }
  }, [activeSubTab, currentUser]);

  React.useEffect(() => {
    if (branding) {
      setBrandName(branding.siteName || "Research Archive");
      setBrandTagline(branding.siteTagline || "Open-access peer reviewed knowledge storage");
      setBrandLogo(branding.logoUrl || "");
      setBrandTheme(branding.themeMode || "light");
    }
  }, [branding]);

  const loadDataForActiveTab = async () => {
    setLoading(true);
    setErrorMsg("");
    try {
      if (activeSubTab === "reports" || activeSubTab === "users") {
        const u = await api.getAdminUsers();
        setUsers(u);
      }
      if (activeSubTab === "tickets") {
        const t = await api.getAdminTickets();
        const m = await api.getAdminContactMessages();
        setTickets(t);
        setMessages(m);
      }
      if (activeSubTab === "faq") {
        const f = await api.getFaqs();
        setFaqs(f);
      }
    } catch (err: any) {
      setErrorMsg("Failed to synchronize records: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const showNotification = (msg: string, err = false) => {
    if (err) {
      setErrorMsg(msg);
      setTimeout(() => setErrorMsg(""), 4000);
    } else {
      setSuccessMsg(msg);
      setTimeout(() => setSuccessMsg(""), 3000);
    }
  };

  // User Actions: Block/Unblock, Promotion
  const handleToggleBlock = async (user: User) => {
    if (user.id === currentUser?.id) {
      showNotification("You cannot block your own ongoing session.", true);
      return;
    }
    setLoading(true);
    try {
      if (user.isBlocked) {
        await api.unblockUser(user.id);
        showNotification(`Unblocked user node: ${user.name}`);
      } else {
        await api.blockUser(user.id);
        showNotification(`Blocked user profile: ${user.name}`);
      }
      const data = await api.getAdminUsers();
      setUsers(data);
    } catch (err: any) {
      showNotification(err.message || "Failed to toggle user lock status", true);
    } finally {
      setLoading(false);
    }
  };

  const handleRolePromotion = async (userId: string, newRole: "user" | "editor" | "admin") => {
    if (userId === currentUser?.id) {
      showNotification("You cannot reassign your own administration access role.", true);
      return;
    }
    setLoading(true);
    try {
      await api.updateUserRole(userId, newRole);
      showNotification(`Account role elevated to: ${newRole}`);
      const data = await api.getAdminUsers();
      setUsers(data);
    } catch (err: any) {
      showNotification(err.message || "Failed to adjust user role setting", true);
    } finally {
      setLoading(false);
    }
  };

  // Paper updates: Status, price, details
  const handleEditPaperSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPaper) return;
    setLoading(true);
    try {
      const parsedAuthors = editAuthors.split(",").map(a => a.trim()).filter(Boolean);
      await api.updatePaper(editingPaper.id, {
        title: editTitle.trim(),
        authors: parsedAuthors,
        summary: editSummary.trim(),
        price: Number(editPrice) || 0,
        status: editStatus
      });
      showNotification("Document catalog adjusted successfully!");
      setEditingPaper(null);
      onRefreshData();
    } catch (err: any) {
      showNotification(err.message || "Could not complete paper updates", true);
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePaper = async (id: string) => {
    if (!window.confirm("Confirm deletion of this document reference from permanent archive indexes?")) return;
    try {
      await api.deletePaper(id);
      showNotification("Document permanently purged from indices.");
      onRefreshData();
    } catch (err: any) {
      showNotification("Purging breakdown error: " + err.message, true);
    }
  };

  // Topic Addition
  const handleAddTopic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTopicName || !newTopicDesc) return;
    setLoading(true);
    try {
      await api.createTopic({ name: newTopicName.trim(), description: newTopicDesc.trim() });
      showNotification(`Taxonomic category created: ${newTopicName}`);
      setNewTopicName("");
      setNewTopicDesc("");
      onRefreshData();
    } catch (err: any) {
      showNotification(err.message || "Failed to append topic details", true);
    } finally {
      setLoading(false);
    }
  };

  // FAQs Add/Edit/Delete
  const handleFaqSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!faqQuestion || !faqAnswer) return;
    setFaqsLoading(true);
    try {
      if (editingFaq) {
        await api.updateFaq(editingFaq.id, { question: faqQuestion, answer: faqAnswer });
        showNotification("FAQ details adjusted successfully!");
      } else {
        await api.createFaq({ question: faqQuestion, answer: faqAnswer });
        showNotification("New official FAQ item cached!");
      }
      setEditingFaq(null);
      setFaqQuestion("");
      setFaqAnswer("");
      const f = await api.getFaqs();
      setFaqs(f);
    } catch (err: any) {
      showNotification("Could not alter FAQ items: " + err.message, true);
    } finally {
      setFaqsLoading(false);
    }
  };

  const handleDeleteFaq = async (id: string) => {
    if (!window.confirm("Permanent delete this FAQ item?")) return;
    try {
      await api.deleteFaq(id);
      showNotification("FAQ cache cleared.");
      const f = await api.getFaqs();
      setFaqs(f);
    } catch (err: any) {
      showNotification(err.message, true);
    }
  };

  // Tickets & Messages
  const handleReplyTicketSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket || !ticketReplyText) return;
    setLoading(true);
    try {
      await api.replyTicket(selectedTicket.id, ticketReplyText.trim(), "resolved");
      showNotification(`Support ticket reply posted. Status: RESOLVED.`);
      setTicketReplyText("");
      setSelectedTicket(null);
      const t = await api.getAdminTickets();
      setTickets(t);
    } catch (err: any) {
      showNotification(err.message, true);
    } finally {
      setLoading(false);
    }
  };

  const handleReplyMessageSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMessage || !messageReplyText) return;
    setLoading(true);
    try {
      await api.replyContactMessage(selectedMessage.id, messageReplyText.trim(), "resolved");
      showNotification("Contact Message answered & resolved.");
      setMessageReplyText("");
      setSelectedMessage(null);
      const m = await api.getAdminContactMessages();
      setMessages(m);
    } catch (err: any) {
      showNotification(err.message, true);
    } finally {
      setLoading(false);
    }
  };

  // Branding Customization
  const handleUpdateBrandingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.updateBranding({
        siteName: brandName.trim(),
        siteTagline: brandTagline.trim(),
        logoUrl: brandLogo.trim(),
        themeMode: brandTheme as any
      });
      showNotification("Portal branding parameters updated dynamically!");
      onRefreshBranding();
    } catch (err: any) {
      showNotification(err.message || "Failed to update brand assets", true);
    } finally {
      setLoading(false);
    }
  };

  if (!isManager) {
    return (
      <div className="mx-auto max-w-lg p-12 text-center" id="admin-unauthorized">
        <ShieldCheck className="mx-auto h-12 w-12 text-red-500 mb-3" />
        <h2 className="font-display text-lg font-bold text-slate-900">Access Restricted</h2>
        <p className="text-slate-500 text-xs mt-1">Please authenticate with an Administrator or Editor account node to proceed.</p>
      </div>
    );
  }

  // Calculate Metrics for General Reports Column
  const totalViews = papers.reduce((sum, p) => sum + (p.views || 0), 0);
  const totalLikes = papers.reduce((sum, p) => sum + (p.likes || 0), 0);
  const totalDownloads = users.reduce((sum, u) => sum + (u.downloads?.length || 0), 0);

  // Group downloads by categories for CSS Histograms
  const itemsByCategory: Record<string, { views: number; likes: number; count: number }> = {};
  papers.forEach(p => {
    const parentCat = p.categories[0] || "Unassigned";
    if (!itemsByCategory[parentCat]) {
      itemsByCategory[parentCat] = { views: 0, likes: 0, count: 0 };
    }
    itemsByCategory[parentCat].views += p.views || 0;
    itemsByCategory[parentCat].likes += p.likes || 0;
    itemsByCategory[parentCat].count += 1;
  });

  return (
    <div className="space-y-8 pb-16 page-transition-enter page-transition-enter-active text-left">
      
      {/* Admin Title Banner */}
      <div className="border-b border-slate-100 pb-5 select-none">
        <h1 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 flex items-center gap-2.5">
          <ShieldAlert className="h-8 w-8 text-violet-650" />
          Manager Office Dashboard
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Role-based secure portal. Configure site branding, query users collection, resolve support requests, or alter taxonomic structures.
        </p>
      </div>

      {/* Sub Tabs Selector Rail */}
      <div className="flex flex-wrap items-center gap-1 bg-slate-50 border border-slate-150 p-1 rounded-2xl select-none">
        {[
          { id: "reports", label: "General Reports", icon: BarChart4 },
          { id: "users", label: "User Accounts", icon: Users },
          { id: "papers", label: "Index Papers", icon: BookOpen },
          { id: "topics", label: "Topics Taxonomy", icon: Tag },
          { id: "tickets", label: "Inquiries & Tickets", icon: MessagesSquare },
          { id: "faq", label: "Official FAQs", icon: HelpCircle },
          { id: "branding", label: "Site Branding", icon: Settings },
        ].map((sub) => {
          const isActive = activeSubTab === sub.id;
          return (
            <button
              key={sub.id}
              onClick={() => {
                setActiveSubTab(sub.id as any);
                setErrorMsg("");
                setSuccessMsg("");
              }}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 font-display text-xs font-bold transition-all cursor-pointer ${
                isActive
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-400 hover:text-slate-700"
              }`}
            >
              <sub.icon className="h-4 w-4" />
              {sub.label}
            </button>
          );
        })}
      </div>

      {/* Alerts */}
      {errorMsg && (
        <div className="flex items-start gap-2 rounded-2xl bg-red-50 p-3.5 text-red-700" id="admin-error">
          <AlertCircle className="h-4.5 w-4.5 shrink-0 mt-0.5" />
          <span className="text-xs leading-relaxed font-semibold">{errorMsg}</span>
        </div>
      )}
      {successMsg && (
        <div className="flex items-start gap-2 rounded-2xl bg-green-50 p-3.5 text-green-755" id="admin-success">
          <CheckCircle className="h-4.5 w-4.5 shrink-0 mt-0.5 animate-bounce text-green-600" />
          <span className="text-xs leading-relaxed font-semibold">{successMsg}</span>
        </div>
      )}

      {/* Workspaces according to tab */}
      <div className="bg-white border border-slate-100 rounded-3xl p-5.5 sm:p-7 shadow-xs">
        
        {/* TAB 1: GENERAL REPORTS / ANALYTICS DIAGRAM */}
        {activeSubTab === "reports" && (
          <div className="space-y-6" id="workspace-reports">
            <div className="select-none">
              <h3 className="font-display text-base font-bold text-slate-900">
                Performance Analytics & Metrics
              </h3>
              <p className="text-xs text-slate-400">Review cumulative user telemetry and taxonomic activity charts.</p>
            </div>

            {/* Micro Stats Grid */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 select-none">
              {[
                { label: "Simulated Orders Unlocked", val: totalDownloads, color: "text-emerald-600 bg-emerald-50/50 border-emerald-100" },
                { label: "Total Registrant Nodes", val: users.length, color: "text-violet-600 bg-violet-50/50 border-violet-100" },
              ].map((m, idx) => (
                <div key={idx} className={`rounded-2xl border p-4 text-left ${m.color}`}>
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">{m.label}</span>
                  <p className="font-sans text-2xl font-black text-slate-850 mt-1 leading-none">{m.val}</p>
                </div>
              ))}
            </div>

            {/* Custom pure-CSS metrics bar chart illustrating activity per Category */}
            <div className="rounded-2xl border border-slate-100 p-5 space-y-4">
              <h4 className="font-display text-xs font-bold text-slate-700 uppercase tracking-widest select-none">
                Distribution Density of Papers by Classification Fields
              </h4>

              <div className="space-y-3 font-sans">
                {Object.keys(itemsByCategory).length === 0 ? (
                  <p className="text-xs text-slate-400 font-sans">No distributions recorded.</p>
                ) : (
                  Object.entries(itemsByCategory).map(([cat, stats]) => {
                    const maxCount = Math.max(...Object.values(itemsByCategory).map(s => s.count), 1);
                    const percentWidth = (stats.count / maxCount) * 100;
                    return (
                      <div key={cat} className="space-y-1">
                        <div className="flex items-center justify-between text-xs select-none">
                          <span className="font-bold text-slate-800">{cat}</span>
                          <span className="font-mono text-slate-450 font-bold">{stats.count} {stats.count === 1 ? "paper" : "papers"}</span>
                        </div>
                        <div className="h-3 w-full rounded-full bg-slate-50 border border-slate-100 overflow-hidden">
                          <div 
                            className="h-full bg-linear-to-r from-violet-500 to-indigo-600 rounded-full transition-all duration-1000"
                            style={{ width: `${percentWidth}%` }}
                          />
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

          </div>
        )}

        {/* TAB 2: USER ACCOUNTS (Role adjustments, view history, block/unblock) */}
        {activeSubTab === "users" && (
          <div className="space-y-6" id="workspace-users">
            <div className="select-none">
              <h3 className="font-display text-base font-bold text-slate-900">
                Registrant Account Management
              </h3>
              <p className="text-xs text-slate-400">View user registration metrics, elevate credentials, or dispatch security blocks.</p>
            </div>

            <div className="overflow-x-auto min-h-[220px]">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 font-display font-medium text-slate-500 border-b border-slate-150 select-none">
                    <th className="px-4 py-3">Scholar Profile</th>
                    <th className="px-4 py-3">Credentials node</th>
                    <th className="px-4 py-3">Registered Role</th>
                    <th className="px-4 py-3">Simulated Unlocks</th>
                    <th className="px-4 py-3 text-center">Status</th>
                    <th className="px-5 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-650">
                  {users.map((usr) => {
                    const isSelf = usr.id === currentUser?.id;
                    return (
                      <tr key={usr.id} className="hover:bg-slate-50/50">
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-2">
                            <span className="h-2 w-2 rounded-full bg-violet-600"></span>
                            <span className="font-bold text-slate-800">{usr.name} {isSelf && "(You)"}</span>
                          </div>
                        </td>
                        <td className="px-4 py-4 font-mono">{usr.email}</td>
                        <td className="px-4 py-4">
                          {isSelf ? (
                            <span className="rounded bg-violet-50 border border-violet-200 text-violet-700 font-bold px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider">{usr.role}</span>
                          ) : (
                            <select
                              value={usr.role}
                              onChange={(e) => handleRolePromotion(usr.id, e.target.value as any)}
                              className="rounded-lg p-1.5 bg-slate-50 border border-slate-200 font-mono text-[10px] uppercase font-bold text-slate-700 outline-none"
                            >
                              <option value="user">User</option>
                              <option value="editor">Editor</option>
                              <option value="admin">Administrator</option>
                            </select>
                          )}
                        </td>
                        <td className="px-4 py-4 font-mono text-[11px] text-slate-450 font-bold">
                          {usr.downloads?.length || 0} purchases
                        </td>
                        <td className="px-4 py-4 text-center">
                          {usr.isBlocked ? (
                            <span className="rounded bg-red-50 text-red-600 border border-red-150 font-mono text-[9px] font-bold px-2 py-0.5 uppercase">LOCKED/BLOCKED</span>
                          ) : (
                            <span className="rounded bg-green-50 text-green-700 border border-green-150 font-mono text-[9px] font-bold px-2 py-0.5 uppercase">ACTIVE</span>
                          )}
                        </td>
                        <td className="px-4 py-4 text-right">
                          <div className="flex justify-end items-center gap-1.5">
                            
                            {/* Block Toggle Button */}
                            <button
                              onClick={() => handleToggleBlock(usr)}
                              disabled={isSelf}
                              className={`p-1.5 rounded-lg border transition cursor-pointer disabled:opacity-40 ${
                                usr.isBlocked
                                  ? "bg-green-50 text-green-600 border-green-200 hover:bg-green-100"
                                  : "bg-red-50 text-red-600 border-red-200 hover:bg-red-100"
                              }`}
                              title={usr.isBlocked ? "Unlock user" : "Block user account"}
                            >
                              {usr.isBlocked ? <UserCheck className="h-4 w-4" /> : <Ban className="h-4 w-4" />}
                            </button>

                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

          </div>
        )}

        {/* TAB 3: INDEX PAPERS STATUS / ADJUSTMENTS */}
        {activeSubTab === "papers" && (
          <div className="space-y-6" id="workspace-papers">
            <div className="select-none flex items-center justify-between">
              <div>
                <h3 className="font-display text-base font-bold text-slate-900">
                  Global Publication Indexes
                </h3>
                <p className="text-xs text-slate-400">Perform direct editorial actions across indexed documents.</p>
              </div>
            </div>

            <div className="overflow-x-auto min-h-[220px]">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 font-display font-medium text-slate-500 border-b border-slate-150 select-none">
                    <th className="px-4 py-3">Document Title</th>
                    <th className="px-4 py-3">Authors Index</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 border-r-0">Price Index</th>
                    <th className="px-4 py-3 text-right">Action Gates</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-650">
                  {papers.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/50">
                      <td className="px-4 py-3.5 max-w-xs truncate font-bold text-slate-800" title={p.title}>{p.title}</td>
                      <td className="px-4 py-3.5 truncate max-w-xs">{p.authors.join(", ")}</td>
                      <td className="px-4 py-3.5">
                        <span className={`rounded-xl px-2 py-0.5 border text-[9px] font-mono font-bold uppercase select-none ${
                          p.status === "Active" 
                            ? "bg-green-50 text-green-700 border-green-150" 
                            : "bg-amber-50 text-amber-600 border-amber-150"
                        }`}>
                          {p.status}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 font-mono font-semibold">
                        {p.price > 0 ? `$${p.price.toFixed(2)}` : "Free Access"}
                      </td>
                      <td className="px-4 py-3.5 text-right space-x-1">
                        <button
                          onClick={() => {
                            setEditingPaper(p);
                            setEditTitle(p.title);
                            setEditAuthors(p.authors.join(", "));
                            setEditSummary(p.summary);
                            setEditPrice(String(p.price));
                            setEditStatus(p.status);
                          }}
                          className="p-1 text-slate-400 hover:text-slate-800 cursor-pointer"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeletePaper(p.id)}
                          className="p-1 text-red-500 hover:text-red-700 cursor-pointer"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Editing Paper popup within AdminView */}
            {editingPaper && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs select-none animate-fadeIn">
                <form onSubmit={handleEditPaperSubmit} className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl border border-slate-100 flex flex-col gap-4 text-left">
                  
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <h3 className="font-display text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                      <Edit className="h-4.5 w-4.5 text-blue-600 animate-pulse" />
                      Adjust Paper Metadata & Access Status
                    </h3>
                    <button type="button" onClick={() => setEditingPaper(null)} className="text-slate-450 hover:text-slate-700 font-sans text-lg">×</button>
                  </div>

                  <div className="space-y-3 font-sans">
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">Title</label>
                      <input
                        type="text"
                        required
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2 text-xs outline-none focus:bg-white focus:ring-1 focus:ring-violet-500"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">Price Index ($)</label>
                        <input
                          type="text"
                          required
                          value={editPrice}
                          onChange={(e) => setEditPrice(e.target.value)}
                          className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2 text-xs outline-none focus:bg-white focus:ring-1 focus:ring-violet-500 text-center font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">Status Class</label>
                        <select
                          value={editStatus}
                          onChange={(e) => setEditStatus(e.target.value as any)}
                          className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2 text-xs outline-none focus:bg-white focus:ring-1 focus:ring-violet-500 font-mono uppercase font-bold text-slate-705"
                        >
                          <option value="Active">ACTIVE</option>
                          <option value="Inactive">INACTIVE / DRAFT</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">Authors (Comma separated)</label>
                      <input
                        type="text"
                        required
                        value={editAuthors}
                        onChange={(e) => setEditAuthors(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2 text-xs outline-none focus:bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1 font-sans">Executive Summary</label>
                      <textarea
                        rows={4}
                        required
                        value={editSummary}
                        onChange={(e) => setEditSummary(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs outline-none focus:bg-white resize-none font-sans"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2.5 pt-2 select-none border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setEditingPaper(null)}
                      className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-650 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="rounded-xl bg-slate-900 px-5 py-2 text-xs font-bold text-white hover:bg-slate-805 cursor-pointer"
                    >
                      {loading ? "Re-cataloging details..." : "Save Adjustments"}
                    </button>
                  </div>

                </form>
              </div>
            )}

          </div>
        )}

        {/* TAB 4: TOPICS TAXONOMY ADD/DELETE */}
        {activeSubTab === "topics" && (
          <div className="space-y-6" id="workspace-topics">
            <div className="select-none">
              <h3 className="font-display text-base font-bold text-slate-900">
                Taxonomic Fields Management
              </h3>
              <p className="text-xs text-slate-400">Append new fields of scientific taxonomy study class labels.</p>
            </div>

            <div className="grid grid-cols-1 gap-7 lg:grid-cols-3">
              
              {/* Left Column: List Topics */}
              <div className="lg:col-span-2 overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 font-display font-medium text-slate-500 border-b border-slate-150 select-none">
                      <th className="px-4 py-3">Topic ID</th>
                      <th className="px-4 py-3">Taxonomic Label</th>
                      <th className="px-4 py-3">Active publications Count</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-650">
                    {topics.map((t) => {
                      const count = papers.filter(p => p.categories.includes(t.name)).length;
                      return (
                        <tr key={t.id} className="hover:bg-slate-50/50 font-sans">
                          <td className="px-4 py-3 font-mono font-bold text-slate-400 uppercase">{t.id}</td>
                          <td className="px-4 py-3 font-bold text-slate-850">{t.name}</td>
                          <td className="px-4 py-3 font-mono font-bold text-violet-600">{count} papers indexed</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Right Column: Add Topic */}
              <form onSubmit={handleAddTopic} className="rounded-2xl border border-slate-150 bg-slate-50/50 p-4 space-y-4">
                <h4 className="font-display text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1">
                  <Plus className="h-4.5 w-4.5 text-violet-600" />
                  Append New Study Field
                </h4>

                <div>
                  <label className="block text-[10px] font-semibold text-slate-550 uppercase mb-1">Taxonomic Label Name *</label>
                  <input
                    type="text"
                    required
                    value={newTopicName}
                    onChange={(e) => setNewTopicName(e.target.value)}
                    placeholder="e.g. Swarm Mechanics"
                    className="w-full rounded-xl border border-slate-205 bg-white p-2 text-xs outline-none focus:bg-white focus:ring-1 focus:ring-violet-500 font-sans"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-slate-550 uppercase mb-1">Contextual Description *</label>
                  <textarea
                    rows={4}
                    required
                    value={newTopicDesc}
                    onChange={(e) => setNewTopicDesc(e.target.value)}
                    placeholder="Provide taxonomy classification criteria, scope metrics and linkages..."
                    className="w-full rounded-xl border border-slate-205 bg-white p-2.5 text-xs outline-none resize-none font-sans"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs py-2 cursor-pointer transition select-none"
                >
                  {loading ? "Adding Theme..." : "Add Taxonomy field"}
                </button>
              </form>

            </div>

          </div>
        )}

        {/* TAB 5: TICKETS & MESSAGES RESOLVER */}
        {activeSubTab === "tickets" && (
          <div className="space-y-6" id="workspace-tickets">
            <div className="select-none">
              <h3 className="font-display text-base font-bold text-slate-900">
                Inquiries, Support and Tickets
              </h3>
              <p className="text-xs text-slate-400">Resolve client contact queries and direct support tickets.</p>
            </div>

            <div className="grid grid-cols-1 gap-10 md:grid-cols-2">
              
              {/* Column A: Client Support Tickets */}
              <div className="space-y-4">
                <h4 className="font-display text-xs font-bold text-slate-700 uppercase tracking-widest border-b border-slate-50 pb-2 select-none flex items-center gap-1.5">
                  <ShieldAlert className="h-4.5 w-4.5 text-violet-650" />
                  Direct Tickets Collection ({tickets.length})
                </h4>

                <div className="space-y-3">
                  {tickets.length === 0 ? (
                    <p className="text-xs text-slate-400 font-sans">No tickets lodged inside dashboard indexes.</p>
                  ) : (
                    tickets.map((t) => (
                      <div key={t.id} className="rounded-xl border border-slate-100 p-4 space-y-3.5 text-xs text-left bg-slate-50/50">
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-[9px] text-slate-400">ID: {t.id}</span>
                          <span className={`rounded-xl px-1.5 py-0.5 text-[8px] font-mono font-bold uppercase ${
                            t.status === "open" ? "bg-amber-100 text-amber-700" : "bg-emerald-50 text-emerald-700"
                          }`}>{t.status}</span>
                        </div>
                        
                        <div>
                          <strong className="block text-slate-800 underline font-display">{t.subject}</strong>
                          <p className="text-slate-505 leading-relaxed font-light mt-1 text-slate-600">{t.message}</p>
                        </div>

                        {t.reply && (
                          <div className="bg-white p-2.5 rounded-lg border border-slate-100 font-light mt-2">
                            <span className="block font-semibold text-[8px] uppercase tracking-wider text-slate-400">Your Answer:</span>
                            <p className="text-slate-600 font-sans mt-0.5">"{t.reply}"</p>
                          </div>
                        )}

                        {t.status === "open" && (
                          <button
                            onClick={() => {
                              setSelectedTicket(t);
                              setTicketReplyText("");
                            }}
                            className="rounded-lg bg-slate-900 text-white font-bold text-[10px] px-3.5 py-1.5 cursor-pointer inline-block"
                          >
                            Reply & Resolve
                          </button>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Column B: Contact messages */}
              <div className="space-y-4">
                <h4 className="font-display text-xs font-bold text-slate-700 uppercase tracking-widest border-b border-slate-50 pb-2 select-none flex items-center gap-1.5">
                  <MessagesSquare className="h-4.5 w-4.5 text-blue-600" />
                  Metadata Inquiries ({messages.length})
                </h4>

                <div className="space-y-3">
                  {messages.length === 0 ? (
                    <p className="text-xs text-slate-400 font-sans">No contact enquiries submitted yet.</p>
                  ) : (
                    messages.map((m) => (
                      <div key={m.id} className="rounded-xl border border-slate-100 p-4 space-y-3 text-xs text-left bg-slate-50/50">
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="font-bold text-slate-800 font-sans">{m.name}</span>
                            <span className="block text-[9px] text-slate-400 font-mono font-semibold" title={m.email}>{m.email}</span>
                          </div>
                          
                          <span className={`rounded-xl px-2 py-0.5 text-[8px] font-mono font-bold uppercase ${
                            m.status === "open" ? "bg-amber-100 text-amber-700" : "bg-emerald-50 text-emerald-70s"
                          }`}>{m.status}</span>
                        </div>

                        <p className="text-slate-600 leading-relaxed pt-2 border-t border-slate-50 font-sans">
                          "{m.message}"
                        </p>

                        {m.reply && (
                          <div className="bg-white p-2.5 rounded-lg border border-slate-100 font-light mt-2">
                            <span className="block font-semibold text-[8px] uppercase tracking-wider text-slate-400">Response dispatched:</span>
                            <p className="text-slate-600 font-sans mt-0.5">"{m.reply}"</p>
                          </div>
                        )}

                        {m.status === "open" && (
                          <button
                            onClick={() => {
                              setSelectedMessage(m);
                              setMessageReplyText("");
                            }}
                            className="rounded-lg bg-slate-900 text-white font-bold text-[10px] px-3.5 py-1.5 cursor-pointer inline-block"
                          >
                            Reply & Resolve Inquiry
                          </button>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>

            {/* Direct Ticket reply modal windows */}
            {selectedTicket && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs select-none">
                <form onSubmit={handleReplyTicketSubmit} className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-100 space-y-3.5 text-left">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <h4 className="font-display text-sm font-bold text-slate-800 uppercase">Write Response to direct ticket</h4>
                    <button type="button" onClick={() => setSelectedTicket(null)} className="font-sans text-slate-400 font-bold hover:text-slate-700">×</button>
                  </div>
                  
                  <div className="space-y-1.5 font-sans">
                    <span className="block text-[10px] font-semibold text-slate-450 uppercase">User Query Subject: index: {selectedTicket.subject}</span>
                    <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100 font-sans">"{selectedTicket.message}"</p>
                  </div>

                  <div>
                    <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">Reply Message *</label>
                    <textarea
                      rows={4}
                      required
                      value={ticketReplyText}
                      onChange={(e) => setTicketReplyText(e.target.value)}
                      placeholder="e.g. Verified download link is reset. Please try re-fetching the PDF now."
                      className="w-full rounded-xl border border-slate-205 p-3 text-xs outline-none focus:border-violet-500 font-sans"
                    />
                  </div>

                  <div className="flex justify-end gap-2 text-right pt-2 border-t border-slate-50 select-none">
                    <button type="button" onClick={() => setSelectedTicket(null)} className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-650 cursor-pointer">Cancel</button>
                    <button type="submit" disabled={loading} className="rounded-xl bg-slate-900 px-4.5 py-2 text-xs font-bold text-white cursor-pointer">{loading ? "Submitting response..." : "Dispatch reply"}</button>
                  </div>
                </form>
              </div>
            )}

            {/* Direct inquiry reply modal */}
            {selectedMessage && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs select-none">
                <form onSubmit={handleReplyMessageSubmit} className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-100 space-y-3.5 text-left">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <h4 className="font-display text-sm font-bold text-slate-800 uppercase">Resolve Inquiry</h4>
                    <button type="button" onClick={() => setSelectedMessage(null)} className="font-sans text-slate-400 font-bold hover:text-slate-700">×</button>
                  </div>
                  
                  <div className="space-y-1.5 font-sans">
                    <span className="block text-[10px] font-semibold text-slate-450 uppercase">From: {selectedMessage.name} ({selectedMessage.email})</span>
                    <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100 font-sans">"{selectedMessage.message}"</p>
                  </div>

                  <div>
                    <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">Reply text *</label>
                    <textarea
                      rows={4}
                      required
                      value={messageReplyText}
                      onChange={(e) => setMessageReplyText(e.target.value)}
                      placeholder="Your official message to the user..."
                      className="w-full rounded-xl border border-slate-205 p-2.5 text-xs outline-none"
                    />
                  </div>

                  <div className="flex justify-end gap-2 text-right pt-2 border-t border-slate-50 select-none">
                    <button type="button" onClick={() => setSelectedMessage(null)} className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-650 cursor-pointer">Cancel</button>
                    <button type="submit" disabled={loading} className="rounded-xl bg-slate-900 px-4.5 py-2 text-xs font-bold text-white cursor-pointer">Post Reply</button>
                  </div>
                </form>
              </div>
            )}

          </div>
        )}

        {/* TAB 6: OFFICIAL FAQS LIST */}
        {activeSubTab === "faq" && (
          <div className="space-y-6" id="workspace-faq">
            <div className="select-none flex items-center justify-between">
              <div>
                <h3 className="font-display text-base font-bold text-slate-900 text-left">
                  Configure Official FAQs System
                </h3>
                <p className="text-xs text-slate-400 text-left">Create, edit, or purge FAQs published dynamically inside platforms.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 items-start text-left">
              
              {/* Left Side: Create/Edit FAQ form (4/12) */}
              <form onSubmit={handleFaqSubmit} className="rounded-2xl border border-slate-150 p-4.5 space-y-4 lg:col-span-4 bg-slate-50">
                <h4 className="font-display text-xs font-bold text-slate-700 uppercase tracking-widest flex items-center gap-1 leading-none select-none">
                  <Plus className="h-4.5 w-4.5 text-violet-600 animate-pulse" />
                  {editingFaq ? "Adjust FAQ entry" : "Create FAQ Item"}
                </h4>

                <div>
                  <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">Question Name *</label>
                  <input
                    type="text"
                    required
                    value={faqQuestion}
                    onChange={(e) => setFaqQuestion(e.target.value)}
                    placeholder="e.g. How can I submit custom PDFs?"
                    className="w-full rounded-xl border border-slate-205 bg-white p-2.5 text-xs outline-none focus:ring-1 focus:ring-violet-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">Answer explanation *</label>
                  <textarea
                    rows={4}
                    required
                    value={faqAnswer}
                    onChange={(e) => setFaqAnswer(e.target.value)}
                    placeholder="Provide a compliant scientific answer description..."
                    className="w-full rounded-xl border border-slate-205 bg-white p-2.5 text-xs outline-none resize-none font-sans"
                  />
                </div>

                <div className="flex gap-2 font-display select-none">
                  {editingFaq && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingFaq(null);
                        setFaqQuestion("");
                        setFaqAnswer("");
                      }}
                      className="w-1/3 rounded-xl border border-slate-200 text-slate-655 p-2 text-xs font-semibold bg-white"
                    >
                      Reset
                    </button>
                  )}
                  <button
                    type="submit"
                    disabled={faqsLoading}
                    className="flex-1 rounded-xl bg-slate-900 border border-slate-900 text-white font-bold text-xs p-2 hover:bg-slate-805 cursor-pointer disabled:bg-slate-350"
                  >
                    {faqsLoading ? "Caching details..." : (editingFaq ? "Update FAQ" : "Publish FAQ")}
                  </button>
                </div>
              </form>

              {/* Right Side: Listed FAQs (8/12) */}
              <div className="lg:col-span-8 space-y-3.5">
                {faqs.length === 0 ? (
                  <p className="text-xs text-slate-400 font-sans">Official Faqs list is empty.</p>
                ) : (
                  faqs.map((f) => (
                    <div key={f.id} className="p-4 rounded-2xl border border-slate-100 bg-white shadow-xs space-y-2 text-left">
                      <div className="flex items-center justify-between flex-wrap gap-2 select-none">
                        <span className="font-mono text-[9px] text-slate-400 font-semibold uppercase">ID: {f.id}</span>
                        
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              setEditingFaq(f);
                              setFaqQuestion(f.question);
                              setFaqAnswer(f.answer);
                            }}
                            className="p-1 rounded text-slate-450 hover:bg-slate-50 hover:text-slate-805 cursor-pointer"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteFaq(f.id)}
                            className="p-1 rounded text-red-500 hover:bg-red-50 cursor-pointer"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>

                      <div>
                        <strong className="block text-xs font-bold text-slate-900 font-sans">Q: {f.question}</strong>
                        <p className="text-[11px] text-slate-505 leading-relaxed font-light mt-1 font-sans text-slate-600">A: {f.answer}</p>
                      </div>

                    </div>
                  ))
                )}
              </div>

            </div>

          </div>
        )}

        {/* TAB 7: SITE BRANDING SETTINGS */}
        {activeSubTab === "branding" && (
          <form onSubmit={handleUpdateBrandingSubmit} className="space-y-6 max-w-xl text-left" id="workspace-branding">
            <div className="select-none">
              <h3 className="font-display text-base font-bold text-slate-900">
                Adjust Portal Branding Assets
              </h3>
              <p className="text-xs text-slate-400">Configure public site labels, taglines, logo assets, and custom accent coloring dynamically.</p>
            </div>

            <div className="space-y-4 font-sans text-xs">
              <div>
                <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-1.5 font-mono">Platform Site Name Label</label>
                <input
                  type="text"
                  required
                  value={brandName}
                  onChange={(e) => setBrandName(e.target.value)}
                  placeholder="e.g. Research Archive"
                  className="w-full rounded-xl border border-slate-205 p-2.5 text-xs outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-1.5 font-mono">Platform Tagline / Slogan Subtext</label>
                <input
                  type="text"
                  required
                  value={brandTagline}
                  onChange={(e) => setBrandTagline(e.target.value)}
                  placeholder="e.g. A stable open depostory"
                  className="w-full rounded-xl border border-slate-205 p-2.5 text-xs outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-1.5 font-mono">Custom Logo Vector Image URL</label>
                <input
                  type="text"
                  value={brandLogo}
                  onChange={(e) => setBrandLogo(e.target.value)}
                  placeholder="Leave empty or specify custom image link"
                  className="w-full rounded-xl border border-slate-205 p-2.5 text-xs outline-none font-mono text-blue-600"
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-1.5 font-mono">Accent Theme Class</label>
                <select
                  value={brandTheme}
                  onChange={(e) => setBrandTheme(e.target.value)}
                  className="rounded-xl border border-slate-205 bg-white p-2.5 font-mono text-[11px] font-bold text-slate-700 uppercase"
                >
                  <option value="light">LIGHT MODE SYSTEM (DEFAULT)</option>
                  <option value="dark">DARK THEME MATRIX</option>
                  <option value="auto">SYSTEM PREFERENCES PRESETS</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="rounded-xl bg-violet-600 hover:bg-violet-750 text-white font-bold text-xs px-6 py-2.5 shadow-sm cursor-pointer select-none"
            >
              {loading ? "Re-saving configuration..." : "Apply Branding adjustments"}
            </button>
          </form>
        )}

      </div>

    </div>
  );
}
