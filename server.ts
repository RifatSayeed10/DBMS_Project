import express, { Request, Response, NextFunction } from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { dbConnection } from "./server-db";
import { User, Paper, Topic, Researcher, Ticket, ContactMessage, FAQItem, SiteBranding } from "./src/types";

const app = express();
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

const PORT = 3000;

// Serve uploads folder as static files
const UPLOADS_DIR = path.join(process.cwd(), "uploads");
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}
app.use("/uploads", express.static(UPLOADS_DIR));

// Middleware: Authenticate Request via Custom Header token
interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: "student" | "teacher" | "editor" | "admin" | "user";
  };
}

function authMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const tokenHeader = req.headers.authorization;
  if (!tokenHeader) {
    return next();
  }
  
  const token = tokenHeader.split(" ")[1];
  if (!token) {
    return next();
  }

  const decoded = dbConnection.verifyToken(token);
  if (decoded) {
    req.user = decoded;
  }
  next();
}

function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ error: "Authentication credentials required" });
  }
  // Check if blocked in real-time
  const user = dbConnection.getUsers().find(u => u.id === req.user!.id);
  if (user && user.isBlocked) {
    return res.status(403).json({ error: "Your account is flagged or blocked from downloads." });
  }
  next();
}

// Admins are Super Admins, Editors have high index access
function requireAdminOrEditor(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.user || (req.user.role !== "admin" && req.user.role !== "editor")) {
    return res.status(403).json({ error: "Administrator or editor privilege required" });
  }
  next();
}

function requireSuperAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({ error: "Super Administrator privilege required" });
  }
  next();
}

// Bind auth helper
app.use(authMiddleware as express.RequestHandler);

// --- API ENDPOINTS ---

// 1. BRANDING GET/PUT
app.get("/api/branding", (req: Request, res: Response) => {
  res.json(dbConnection.getBranding());
});

app.put("/api/admin/branding", requireSuperAdmin as unknown as express.RequestHandler, (req: Request, res: Response) => {
  const newBranding = req.body;
  const current = dbConnection.getBranding();
  
  if (newBranding.siteName) current.siteName = newBranding.siteName;
  if (newBranding.siteTagline) current.siteTagline = newBranding.siteTagline;
  if (newBranding.logoUrl) current.logoUrl = newBranding.logoUrl;
  if (newBranding.footerText) current.footerText = newBranding.footerText;
  if (newBranding.allowRegistration !== undefined) current.allowRegistration = !!newBranding.allowRegistration;
  if (newBranding.emailNotifications !== undefined) current.emailNotifications = !!newBranding.emailNotifications;
  if (newBranding.themeMode) current.themeMode = newBranding.themeMode;

  dbConnection.save();
  res.json(current);
});

// 2. FAQS GET/ADMIN
app.get("/api/faqs", (req: Request, res: Response) => {
  res.json(dbConnection.getFaqs());
});

app.post("/api/admin/faqs", requireAdminOrEditor as unknown as express.RequestHandler, (req: Request, res: Response) => {
  const { question, answer } = req.body;
  if (!question || !answer) {
    return res.status(400).json({ error: "Question and answer are required" });
  }
  
  const faqs = dbConnection.getFaqs();
  const newFaq: FAQItem = {
    id: "faq_" + Math.random().toString(36).substring(2, 9),
    question,
    answer
  };
  faqs.push(newFaq);
  dbConnection.save();
  res.status(201).json(newFaq);
});

app.put("/api/admin/faqs/:id", requireAdminOrEditor as unknown as express.RequestHandler, (req: Request, res: Response) => {
  const { id } = req.params;
  const { question, answer } = req.body;
  const faqs = dbConnection.getFaqs();
  const faq = faqs.find(f => f.id === id);
  if (!faq) return res.status(404).json({ error: "FAQ not found" });

  if (question) faq.question = question;
  if (answer) faq.answer = answer;

  dbConnection.save();
  res.json(faq);
});

app.delete("/api/admin/faqs/:id", requireAdminOrEditor as unknown as express.RequestHandler, (req: Request, res: Response) => {
  const { id } = req.params;
  const faqs = dbConnection.getFaqs();
  const idx = faqs.findIndex(f => f.id === id);
  if (idx === -1) return res.status(404).json({ error: "FAQ not found" });

  faqs.splice(idx, 1);
  dbConnection.save();
  res.json({ success: true });
});

// 3. CONTACT SUPPORT TICKETS
app.post("/api/contact", (req: Request, res: Response) => {
  const { name, email, message } = req.body;
  if (!name || !email || !message) {
    return res.status(400).json({ error: "Name, email, and message are required" });
  }

  const list = dbConnection.getContactMessages();
  const newMessage: ContactMessage = {
    id: "msg_" + Math.random().toString(36).substring(2, 9),
    name,
    email,
    message,
    status: "open",
    createdAt: new Date().toISOString()
  };
  list.push(newMessage);
  dbConnection.save();

  res.status(201).json({ success: true, item: newMessage });
});

app.get("/api/admin/contact", requireAdminOrEditor as unknown as express.RequestHandler, (req: Request, res: Response) => {
  res.json(dbConnection.getContactMessages());
});

app.put("/api/admin/contact/:id", requireAdminOrEditor as unknown as express.RequestHandler, (req: Request, res: Response) => {
  const { id } = req.params;
  const { reply, status } = req.body;
  const list = dbConnection.getContactMessages();
  const msg = list.find(m => m.id === id);
  if (!msg) return res.status(404).json({ error: "Message not found" });

  if (reply !== undefined) msg.reply = reply;
  if (status) msg.status = status;

  dbConnection.save();
  res.json(msg);
});

// 4. TICKETS
app.get("/api/tickets", requireAuth as unknown as express.RequestHandler, (req: AuthenticatedRequest, res: Response) => {
  const list = dbConnection.getTickets();
  const userTickets = list.filter(t => t.userId === req.user!.id);
  res.json(userTickets);
});

app.post("/api/tickets", requireAuth as unknown as express.RequestHandler, (req: AuthenticatedRequest, res: Response) => {
  const { subject, message } = req.body;
  if (!subject || !message) {
    return res.status(400).json({ error: "Subject and message are required" });
  }

  // Find user's name
  const users = dbConnection.getUsers();
  const userobj = users.find(u => u.id === req.user!.id);
  const userName = userobj ? userobj.name : "Registered User";

  const tickets = dbConnection.getTickets();
  const newTicket: Ticket = {
    id: "tkt_" + Math.random().toString(36).substring(2, 9),
    userId: req.user!.id,
    userName,
    subject,
    message,
    status: "open",
    createdAt: new Date().toISOString()
  };

  tickets.push(newTicket);
  dbConnection.save();
  res.status(201).json(newTicket);
});

app.get("/api/admin/tickets", requireAdminOrEditor as unknown as express.RequestHandler, (req: Request, res: Response) => {
  res.json(dbConnection.getTickets());
});

app.put("/api/admin/tickets/:id", requireAdminOrEditor as unknown as express.RequestHandler, (req: Request, res: Response) => {
  const { id } = req.params;
  const { reply, status } = req.body;
  const tickets = dbConnection.getTickets();
  const ticket = tickets.find(t => t.id === id);
  if (!ticket) return res.status(404).json({ error: "Ticket not found" });

  if (reply !== undefined) ticket.reply = reply;
  if (status) ticket.status = status;

  dbConnection.save();
  res.json(ticket);
});

// 5. AUTH API
app.post("/api/auth/register", (req: Request, res: Response) => {
  const { email, password, name, role } = req.body;
  if (!email || !password || !name) {
    return res.status(400).json({ error: "Email, password, and name are required assets" });
  }

  // Validate choice is teacher or student, default to student
  let registeredRole: 'student' | 'teacher' | 'user' = 'student';
  if (role === 'teacher' || role === 'student' || role === 'user') {
    registeredRole = role;
  }

  const branding = dbConnection.getBranding();
  if (!branding.allowRegistration) {
    return res.status(400).json({ error: "Registration is temporarily closed by Administrator." });
  }

  const users = dbConnection.getUsers();
  const existing = users.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (existing) {
    return res.status(400).json({ error: "Email already registered in research portal" });
  }

  const newId = "usr_" + Math.random().toString(36).substring(2, 11);
  const hash = dbConnection.hashPassword(password);
  
  const newUser = {
    id: newId,
    email: email.toLowerCase(),
    name,
    role: registeredRole,
    bookmarks: [],
    isBlocked: false,
    downloads: [],
    createdAt: new Date().toISOString(),
    passwordHash: hash
  };

  users.push(newUser);
  dbConnection.save();

  const token = dbConnection.createToken({
    id: newUser.id,
    email: newUser.email,
    name: newUser.name,
    role: newUser.role,
    bookmarks: newUser.bookmarks,
    createdAt: newUser.createdAt
  });

  res.status(201).json({
    user: {
      id: newUser.id,
      email: newUser.email,
      name: newUser.name,
      role: newUser.role,
      bookmarks: newUser.bookmarks,
      downloads: newUser.downloads,
      isBlocked: newUser.isBlocked
    },
    token
  });
});

app.post("/api/auth/login", (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required assets" });
  }

  const users = dbConnection.getUsers();
  const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (!user) {
    return res.status(401).json({ error: "Invalid email or credentials" });
  }

  if (user.isBlocked) {
    return res.status(403).json({ error: "This account has been blocked or restricted due to policy violations." });
  }

  const hash = dbConnection.hashPassword(password);
  if (user.passwordHash !== hash) {
    return res.status(401).json({ error: "Invalid email or credentials" });
  }

  const token = dbConnection.createToken({
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    bookmarks: user.bookmarks,
    createdAt: user.createdAt
  });

  res.json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      bookmarks: user.bookmarks,
      downloads: user.downloads || [],
      isBlocked: user.isBlocked
    },
    token
  });
});

app.get("/api/users/me", (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ error: "Not logged in" });
  }
  const users = dbConnection.getUsers();
  const user = users.find(u => u.id === req.user!.id);
  if (!user) {
    return res.status(404).json({ error: "User detail record not found" });
  }
  if (user.isBlocked) {
    return res.status(403).json({ error: "This account has been flagged or blocked." });
  }
  res.json({
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    bookmarks: user.bookmarks,
    downloads: user.downloads || [],
    isBlocked: user.isBlocked,
    createdAt: user.createdAt
  });
});

// Update Profile Detail (Name, email, password change)
app.post("/api/users/profile", requireAuth as unknown as express.RequestHandler, (req: AuthenticatedRequest, res: Response) => {
  const { name, email, currentPassword, newPassword } = req.body;
  const users = dbConnection.getUsers();
  const user = users.find(u => u.id === req.user!.id);
  if (!user) return res.status(404).json({ error: "User not found" });

  if (email && email.toLowerCase() !== user.email.toLowerCase()) {
    const existing = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (existing) {
      return res.status(400).json({ error: "This email address is already locked by another login credentials." });
    }
    user.email = email.toLowerCase();
  }

  if (name) user.name = name;

  if (newPassword) {
    if (!currentPassword) {
      return res.status(400).json({ error: "Current password validation detail is missing." });
    }
    const currentHash = dbConnection.hashPassword(currentPassword);
    if (user.passwordHash !== currentHash) {
      return res.status(400).json({ error: "Current password authentication mismatch." });
    }
    user.passwordHash = dbConnection.hashPassword(newPassword);
  }

  dbConnection.save();
  res.json({
    success: true,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      bookmarks: user.bookmarks,
      downloads: user.downloads || []
    }
  });
});

// Simulation parameters for password recovery
app.post("/api/auth/forgot-password", (req: Request, res: Response) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: "Email is required" });
  const users = dbConnection.getUsers();
  let user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
  
  // Create temporary code
  const code = Math.floor(100000 + Math.random() * 900000).toString();

  if (!user) {
    // Dynamically provision a user so the user can actually use it and reset it!
    user = {
      id: "usr_" + Math.random().toString(36).substring(2, 11),
      email: email.toLowerCase(),
      name: email.split("@")[0].substring(0, 15),
      passwordHash: dbConnection.hashPassword("123456"),
      role: "student",
      bookmarks: [],
      downloads: [],
      createdAt: new Date().toISOString()
    };
    users.push(user);
    dbConnection.save();
  }

  // Save the code temporarily on the database connection state or memory record so we can verify it if required
  (user as any).resetCode = code;
  dbConnection.save();

  res.json({
    success: true,
    simulated: true,
    code,
    message: `[SIMULATION DEMO] Recovery message initiated. Use reset code: ${code} to rebuild your password immediately.`
  });
});

app.post("/api/auth/reset-password", (req: Request, res: Response) => {
  const { email, code, newPassword } = req.body;
  if (!email || !code || !newPassword) {
    return res.status(400).json({ error: "Missing required values for password recovery reset." });
  }

  const users = dbConnection.getUsers();
  const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (!user) {
    return res.status(404).json({ error: "Invalid email coordinates." });
  }

  user.passwordHash = dbConnection.hashPassword(newPassword);
  dbConnection.save();

  res.json({ success: true, message: "Your credential keys have been updated successfully! Please log in." });
});

// Admin Route: Get Users List (Super admin only)
app.get("/api/admin/users", requireSuperAdmin as unknown as express.RequestHandler, (req: Request, res: Response) => {
  const users = dbConnection.getUsers();
  res.json(users.map(u => ({
    id: u.id,
    email: u.email,
    name: u.name,
    role: u.role,
    bookmarks: u.bookmarks,
    isBlocked: u.isBlocked || false,
    downloads: u.downloads || [],
    createdAt: u.createdAt
  })));
});

// Super Admin Route: Block/Unblock user
app.post("/api/admin/users/:id/block", requireSuperAdmin as unknown as express.RequestHandler, (req: Request, res: Response) => {
  const { id } = req.params;
  const users = dbConnection.getUsers();
  const user = users.find(u => u.id === id);
  if (!user) return res.status(404).json({ error: "User profile detail not found" });

  if (id === "usr_admin") return res.status(400).json({ error: "Absolute Administrator cannot block self." });

  user.isBlocked = true;
  dbConnection.save();
  res.json({ success: true, user: { id: user.id, isBlocked: true } });
});

app.post("/api/admin/users/:id/unblock", requireSuperAdmin as unknown as express.RequestHandler, (req: Request, res: Response) => {
  const { id } = req.params;
  const users = dbConnection.getUsers();
  const user = users.find(u => u.id === id);
  if (!user) return res.status(404).json({ error: "User profile detail not found" });

  user.isBlocked = false;
  dbConnection.save();
  res.json({ success: true, user: { id: user.id, isBlocked: false } });
});

// Super Admin Route: Promote role
app.post("/api/admin/users/:id/role", requireSuperAdmin as unknown as express.RequestHandler, (req: Request, res: Response) => {
  const { id } = req.params;
  const { role } = req.body;
  if (role !== "user" && role !== "editor" && role !== "admin") {
    return res.status(400).json({ error: "Invalid role argument coordinate" });
  }

  const users = dbConnection.getUsers();
  const user = users.find(u => u.id === id);
  if (!user) return res.status(404).json({ error: "User not found" });

  if (id === "usr_admin") return res.status(400).json({ error: "Master root supervisor cannot alter role details." });

  user.role = role;
  dbConnection.save();
  res.json({ success: true, user: { id: user.id, role: user.role } });
});

// Super Admin Route: Delete User
app.delete("/api/admin/users/:id", requireSuperAdmin as unknown as express.RequestHandler, (req: Request, res: Response) => {
  const { id } = req.params;
  const users = dbConnection.getUsers();
  const index = users.findIndex(u => u.id === id);
  if (index === -1) {
    return res.status(404).json({ error: "User not found" });
  }
  if (id === "usr_admin") {
    return res.status(400).json({ error: "Cannot delete master administrator account" });
  }
  users.splice(index, 1);
  dbConnection.save();
  res.json({ success: true, message: "User deleted successfully" });
});

// 6. PAPERS API
app.get("/api/papers", (req: Request, res: Response) => {
  const { q, topic, researcher, status } = req.query;
  let list = [...dbConnection.getPapers()];

  // Filter out inactive papers for general public, but allow editors/admins to specify status
  const parsedToken = req.headers.authorization ? dbConnection.verifyToken(req.headers.authorization.split(" ")[1] || "") : null;
  const isElevated = parsedToken && (parsedToken.role === "admin" || parsedToken.role === "editor");

  if (!isElevated) {
    list = list.filter(p => p.status === "Active");
  } else if (status) {
    list = list.filter(p => p.status === status);
  }

  if (q) {
    const queryStr = String(q).toLowerCase();
    list = list.filter(p => 
      p.title.toLowerCase().includes(queryStr) ||
      p.summary.toLowerCase().includes(queryStr) ||
      p.authors.some(a => a.toLowerCase().includes(queryStr))
    );
  }

  if (topic) {
    const topicStr = String(topic).toLowerCase();
    list = list.filter(p => p.categories.some(c => c.toLowerCase() === topicStr));
  }

  if (researcher) {
    const resStr = String(researcher).toLowerCase();
    list = list.filter(p => p.researcherId === resStr || p.authors.some(a => a.toLowerCase().includes(resStr)));
  }

  list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  res.json(list);
});

app.post("/api/papers", requireAuth as unknown as express.RequestHandler, (req: AuthenticatedRequest, res: Response) => {
  const { title, authors, year, pages, categories, summary, fileUrl, researcherId, coverImage, price, status } = req.body;
  if (!title || !authors || !year || !summary || !fileUrl) {
    return res.status(400).json({ error: "Missing required core metadata parameters for creating paper" });
  }

  const paperList = dbConnection.getPapers();

  let resolvedResearcherId = researcherId;
  if (!resolvedResearcherId && req.user) {
    const researchers = dbConnection.getResearchers();
    const match = researchers.find(
      r => r.userId === req.user!.id || (r.email && r.email.toLowerCase() === req.user!.email.toLowerCase())
    );
    if (match) {
      resolvedResearcherId = match.id;
    }
  }

  const newPaper: Paper = {
    id: "paper_" + Math.random().toString(36).substring(2, 11),
    title,
    authors: Array.isArray(authors) ? authors : [authors],
    year: Number(year),
    pages: Number(pages || 10),
    views: 0,
    likes: 0,
    downloadsCount: 0,
    categories: Array.isArray(categories) ? categories : [categories],
    summary,
    fileUrl,
    researcherId: resolvedResearcherId || undefined,
    coverImage: coverImage || "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=600&auto=format&fit=crop&q=80",
    status: status || "Active",
    price: price !== undefined ? Number(price) : 0,
    createdAt: new Date().toISOString()
  };

  paperList.push(newPaper);
  dbConnection.save();

  res.status(201).json(newPaper);
});

app.put("/api/papers/:id", requireAdminOrEditor as unknown as express.RequestHandler, (req: Request, res: Response) => {
  const { id } = req.params;
  const { title, authors, year, pages, categories, summary, fileUrl, researcherId, coverImage, price, status } = req.body;

  const papers = dbConnection.getPapers();
  const paper = papers.find(p => p.id === id);
  if (!paper) {
    return res.status(404).json({ error: "Paper not found" });
  }

  if (title) paper.title = title;
  if (authors) paper.authors = Array.isArray(authors) ? authors : [authors];
  if (year) paper.year = Number(year);
  if (pages) paper.pages = Number(pages);
  if (categories) paper.categories = Array.isArray(categories) ? categories : [categories];
  if (summary) paper.summary = summary;
  if (fileUrl) paper.fileUrl = fileUrl;
  if (coverImage) paper.coverImage = coverImage;
  if (price !== undefined) paper.price = Number(price);
  if (status) paper.status = status;
  if (researcherId !== undefined) paper.researcherId = researcherId || undefined;

  dbConnection.save();
  res.json(paper);
});

app.delete("/api/papers/:id", requireAdminOrEditor as unknown as express.RequestHandler, (req: Request, res: Response) => {
  const { id } = req.params;
  const papers = dbConnection.getPapers();
  const index = papers.findIndex(p => p.id === id);
  if (index === -1) {
    return res.status(404).json({ error: "Paper not found" });
  }
  papers.splice(index, 1);
  dbConnection.save();
  res.json({ success: true, message: "Paper deleted successfully" });
});

// Purchase / Download Paper simulations!
app.post("/api/papers/:id/purchase", requireAuth as unknown as express.RequestHandler, (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const papers = dbConnection.getPapers();
  const paper = papers.find(p => p.id === id);
  if (!paper) return res.status(404).json({ error: "Paper not found" });

  const users = dbConnection.getUsers();
  const user = users.find(u => u.id === req.user!.id);
  if (!user) return res.status(404).json({ error: "User authentication failure" });

  if (!user.downloads) user.downloads = [];

  // Check if already purchased/downloaded
  const exists = user.downloads.find(d => d.paperId === id);
  if (!exists) {
    user.downloads.push({
      paperId: id,
      downloadedAt: new Date().toISOString(),
      orderId: "ORD-" + Math.floor(10000 + Math.random() * 90000),
      price: paper.price
    });
    
    // Increment download metrics
    paper.downloadsCount = (paper.downloadsCount || 0) + 1;
    dbConnection.save();
  }

  res.json({ success: true, downloads: user.downloads });
});

app.post("/api/papers/:id/like", (req: Request, res: Response) => {
  const { id } = req.params;
  const papers = dbConnection.getPapers();
  const paper = papers.find(p => p.id === id);
  if (!paper) {
    return res.status(404).json({ error: "Paper not found" });
  }
  paper.likes += 1;
  dbConnection.save();
  res.json({ liked: true, likes: paper.likes });
});

app.post("/api/papers/:id/view", (req: Request, res: Response) => {
  const { id } = req.params;
  const papers = dbConnection.getPapers();
  const paper = papers.find(p => p.id === id);
  if (!paper) {
    return res.status(404).json({ error: "Paper not found" });
  }
  paper.views += 1;
  dbConnection.save();
  res.json({ viewed: true, views: paper.views });
});

// Bookmark operations
app.post("/api/papers/:id/bookmark", requireAuth as unknown as express.RequestHandler, (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const users = dbConnection.getUsers();
  const user = users.find(u => u.id === req.user!.id);
  if (!user) {
    return res.status(404).json({ error: "User verification error" });
  }

  if (!user.bookmarks.includes(id)) {
    user.bookmarks.push(id);
    dbConnection.save();
  }

  res.json({ bookmarked: true, bookmarks: user.bookmarks });
});

app.post("/api/papers/:id/unbookmark", requireAuth as unknown as express.RequestHandler, (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const users = dbConnection.getUsers();
  const user = users.find(u => u.id === req.user!.id);
  if (!user) {
    return res.status(404).json({ error: "User verification error" });
  }

  user.bookmarks = user.bookmarks.filter(bId => bId !== id);
  dbConnection.save();

  res.json({ bookmarked: false, bookmarks: user.bookmarks });
});

// 7. TOPICS API
app.get("/api/topics", (req: Request, res: Response) => {
  res.json(dbConnection.getTopics());
});

app.post("/api/topics", requireAdminOrEditor as unknown as express.RequestHandler, (req: Request, res: Response) => {
  const { name, description } = req.body;
  if (!name || !description) {
    return res.status(400).json({ error: "Name and description are required topic assets" });
  }

  const topics = dbConnection.getTopics();
  const formatName = name.trim();
  const existing = topics.find(t => t.name.toLowerCase() === formatName.toLowerCase());
  if (existing) {
    return res.status(400).json({ error: "Topic already exists" });
  }

  const newTopic: Topic = {
    id: "topic_" + Math.random().toString(36).substring(2, 11),
    name: formatName,
    description
  };

  topics.push(newTopic);
  dbConnection.save();
  res.status(201).json(newTopic);
});

app.put("/api/topics/:id", requireAdminOrEditor as unknown as express.RequestHandler, (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, description } = req.body;

  const topics = dbConnection.getTopics();
  const topic = topics.find(t => t.id === id);
  if (!topic) {
    return res.status(404).json({ error: "Topic not found" });
  }

  if (name) topic.name = name;
  if (description) topic.description = description;

  dbConnection.save();
  res.json(topic);
});

app.delete("/api/topics/:id", requireAdminOrEditor as unknown as express.RequestHandler, (req: Request, res: Response) => {
  const { id } = req.params;
  const topics = dbConnection.getTopics();
  const index = topics.findIndex(t => t.id === id);
  if (index === -1) {
    return res.status(404).json({ error: "Topic not found" });
  }
  topics.splice(index, 1);
  dbConnection.save();
  res.json({ success: true });
});

// 8. RESEARCHERS API
app.get("/api/researchers", (req: Request, res: Response) => {
  res.json(dbConnection.getResearchers());
});

app.post("/api/researchers", requireAuth as unknown as express.RequestHandler, (req: AuthenticatedRequest, res: Response) => {
  const { name, affiliation, position, bio, email, website, profilePhoto, userId } = req.body;
  if (!name || !affiliation) {
    return res.status(400).json({ error: "Name and affiliation are required researcher credentials" });
  }

  const researchers = dbConnection.getResearchers();
  const resolvedUserId = userId || req.user?.id;

  if (resolvedUserId) {
    const existing = researchers.find(r => r.userId === resolvedUserId);
    if (existing) {
      return res.status(400).json({ error: "A researcher profile has already been registered for this account." });
    }
  }

  const newResearcher: Researcher = {
    id: "res_" + Math.random().toString(36).substring(2, 11),
    name,
    affiliation,
    position: position || "Researcher",
    bio: bio || "",
    email: email || req.user?.email || "",
    website: website || "",
    profilePhoto: profilePhoto || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
    userId: resolvedUserId
  };

  researchers.push(newResearcher);
  dbConnection.save();
  res.status(201).json(newResearcher);
});

app.put("/api/researchers/:id", requireAuth as unknown as express.RequestHandler, (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { name, affiliation, position, bio, email, website, profilePhoto, userId } = req.body;

  const researchers = dbConnection.getResearchers();
  const resProfile = researchers.find(r => r.id === id);
  if (!resProfile) {
    return res.status(404).json({ error: "Researcher not found" });
  }

  const isElevated = req.user && (req.user.role === "admin" || req.user.role === "editor");
  const isOwner = req.user && resProfile.userId === req.user.id;

  if (!isElevated && !isOwner) {
    return res.status(403).json({ error: "Privilege violation: you do not own this researcher record" });
  }

  if (name) resProfile.name = name;
  if (affiliation) resProfile.affiliation = affiliation;
  if (position) resProfile.position = position;
  if (bio) resProfile.bio = bio;
  if (email) resProfile.email = email;
  if (website) resProfile.website = website;
  if (profilePhoto) resProfile.profilePhoto = profilePhoto;
  if (userId !== undefined && isElevated) resProfile.userId = userId || undefined;

  dbConnection.save();
  res.json(resProfile);
});

app.delete("/api/researchers/:id", requireAdminOrEditor as unknown as express.RequestHandler, (req: Request, res: Response) => {
  const { id } = req.params;
  const researchers = dbConnection.getResearchers();
  const index = researchers.findIndex(r => r.id === id);
  if (index === -1) {
    return res.status(404).json({ error: "Researcher not found" });
  }
  researchers.splice(index, 1);
  dbConnection.save();
  res.json({ success: true });
});

// 9. UPLOAD PAPER PDF
app.post("/api/upload", requireAuth as unknown as express.RequestHandler, (req: Request, res: Response) => {
  const { fileName, fileType, fileData } = req.body;
  if (!fileName || !fileData) {
    return res.status(400).json({ error: "No document body assets or file names supplied" });
  }

  const allowedExtensions = [".pdf", ".png", ".jpg", ".jpeg", ".gif", ".svg", ".webp"];
  const lowerName = fileName.toLowerCase();
  const hasAllowedExt = allowedExtensions.some(ext => lowerName.endsWith(ext));

  if (fileType && !fileType.includes("pdf") && !fileType.includes("image") && !hasAllowedExt) {
    return res.status(400).json({ error: "Only PDF documents and image files (PNG, JPG, JPEG, GIF, SVG, WEBP) are supported." });
  }

  try {
    let cleanedData = fileData;
    if (fileData.includes(";base64,")) {
      cleanedData = fileData.split(";base64,")[1];
    }

    const buffer = Buffer.from(cleanedData, "base64");
    if (buffer.length > 25 * 1024 * 1024) {
      return res.status(400).json({ error: "File exceeds 25 megabyte maximum allowable upload capacity" });
    }

    const uniqueId = Math.random().toString(36).substring(3, 11);
    const sanitizedName = fileName.replace(/[^a-zA-Z0-9.\-_]/g, "_");
    const saveName = `${uniqueId}_${sanitizedName}`;
    const destination = path.join(UPLOADS_DIR, saveName);

    fs.writeFileSync(destination, buffer);

    const relativeUrl = `/uploads/${saveName}`;
    res.status(201).json({
      success: true,
      fileUrl: relativeUrl,
      fileName: saveName
    });
  } catch (err) {
    console.error("PDF extraction write error: ", err);
    res.status(500).json({ error: "Error committing file stream to server space" });
  }
});

// 10. CHATS API
app.get("/api/chats/users", requireAuth as unknown as express.RequestHandler, (req: AuthenticatedRequest, res: Response) => {
  const users = dbConnection.getUsers();
  const currentUserId = req.user!.id;
  
  const chatUsers = users
    .filter(u => u.id !== currentUserId)
    .map(u => ({
      id: u.id,
      name: u.name,
      role: u.role,
      email: u.email
    }));
  res.json(chatUsers);
});

app.get("/api/chats", requireAuth as unknown as express.RequestHandler, (req: AuthenticatedRequest, res: Response) => {
  const currentUserId = req.user!.id;
  const chats = dbConnection.getChats();
  
  const myChats = chats.filter(c => c.senderId === currentUserId || c.receiverId === currentUserId);
  res.json(myChats);
});

app.post("/api/chats", requireAuth as unknown as express.RequestHandler, (req: AuthenticatedRequest, res: Response) => {
  const { receiverId, message } = req.body;
  if (!receiverId || !message || !message.trim()) {
    return res.status(400).json({ error: "Receiver and message are required" });
  }

  const currentUserId = req.user!.id;
  const users = dbConnection.getUsers();
  
  const senderUser = users.find(u => u.id === currentUserId);
  const receiverUser = users.find(u => u.id === receiverId);
  
  if (!senderUser || !receiverUser) {
    return res.status(444).json({ error: "Sender or receiver not found in the registers" });
  }

  const chats = dbConnection.getChats();
  const newMsg = {
    id: "msg_" + Math.random().toString(36).substring(2, 11),
    senderId: currentUserId,
    senderName: senderUser.name,
    senderRole: senderUser.role,
    receiverId,
    receiverName: receiverUser.name,
    receiverRole: receiverUser.role,
    message: message.trim(),
    createdAt: new Date().toISOString()
  };

  chats.push(newMsg);
  dbConnection.save();

  res.status(201).json(newMsg);
});

// Error handling middleware to return JSON instead of HTML
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error("Express middleware error caught:", err);
  res.status(err.status || 500).json({
    error: err.message || "An unexpected transaction error occurred on the archiving node"
  });
});

// --- VITE AND SPA FALLBACK MIDDLEWARES ---

async function startServer() {
  console.log("[Server] Initializing database connection...");
  try {
    await dbConnection.init();
    console.log("[Server] Database initialized successfully.");
  } catch (dbErr) {
    console.error("[Server] Critical database initialization failure:", dbErr);
  }

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Research Archive application running on: http://localhost:${PORT}`);
  });
}

startServer().catch(err => {
  console.error("Express boot compilation breakdown:", err);
});
