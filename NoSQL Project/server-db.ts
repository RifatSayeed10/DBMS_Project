import fs from "fs";
import path from "path";
import crypto from "crypto";
import { MongoClient, Db } from "mongodb";
import { User, Paper, Topic, Researcher, DatabaseState, Ticket, ContactMessage, FAQItem, SiteBranding } from "./src/types";

const DB_FILE_PATH = path.join(process.cwd(), "archive-database.json");
const UPLOAD_DIR_PATH = path.join(process.cwd(), "uploads");

// Standard JWT Signature Key
const JWT_SECRET = process.env.JWT_SECRET || "research_archive_secret_key_2026_xyz";

const initialTopics: Topic[] = [
  {
    id: "topic_ai",
    name: "Artificial Intelligence",
    description: "Machine learning, neural networks, computer vision, and cognitive systems research."
  },
  {
    id: "topic_quantum",
    name: "Quantum Computing",
    description: "Quantum algorithms, error correction, hardware engineering, and quantum cryptography."
  },
  {
    id: "topic_bioinfo",
    name: "Bioinformatics",
    description: "Computational genomics, structural biology, and algorithmic systems for molecular analysis."
  },
  {
    id: "topic_hci",
    name: "Human-Computer Interaction",
    description: "Interaction design, virtual and augmented reality, collaborative interfaces, and accessibility."
  },
  {
    id: "topic_sec",
    name: "Cybersecurity",
    description: "Network security, cryptography, intrusion detection, and trust architectures."
  }
];

const initialResearchers: Researcher[] = [
  {
    id: "res_elena",
    name: "Dr. Elena Rostova",
    affiliation: "Institute of Advanced Learning, Zurich",
    position: "Associate Professor of AI",
    bio: "Elena specializes in neural architecture search and deep reinforcement learning applied to swarm robotics. Over 12 years of research, she has driven multiple international smart-agent programs.",
    email: "e.rostova@ial.ch",
    website: "https://example.edu/erostova",
    profilePhoto: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80"
  },
  {
    id: "res_marcus",
    name: "Prof. Marcus Thorne",
    affiliation: "Pacific Quantum Laboratory, Vancouver",
    position: "Director of Systems Research",
    bio: "Marcus has been pioneering high-coherence physical qubits and error-resilient logical circuit architectures for over two decades. He coordinates public-private quantum networks.",
    email: "m.thorne@pql.org",
    website: "https://example.edu/mthorne",
    profilePhoto: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150&auto=format&fit=crop&q=80"
  },
  {
    id: "res_siddharth",
    name: "Dr. Siddharth Mehta",
    affiliation: "Stanford Bio-Science Center",
    position: "Senior Researcher in Genomics",
    bio: "Siddharth develops sequence alignment heuristics and deep models for predicting protein folding shapes. He focuses on scalable distributed bioinformatics platforms.",
    email: "smehta@stanford.edu",
    website: "https://example.edu/smehta",
    profilePhoto: "https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=150&auto=format&fit=crop&q=80"
  }
];

const initialPapers: Paper[] = [
  {
    id: "paper_1",
    title: "Swarm Intelligence in Unsupervised Autonomous Navigation Pathing",
    authors: ["Elena Rostova", "Li Wei", "Jan de Vries"],
    year: 2025,
    pages: 14,
    views: 1245,
    likes: 312,
    downloadsCount: 145,
    categories: ["Artificial Intelligence"],
    summary: "This paper presents an unsupervised routing model for airborne robot swarms. By employing a localized graph neural net, swarms can adaptively map obstacle fields and retain robust connectivity without centralized coordination.",
    fileUrl: "/sample-papers/swarm_intelligence_navigation.pdf",
    researcherId: "res_elena",
    coverImage: "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=600&auto=format&fit=crop&q=80",
    status: "Active",
    price: 0, // Free
    createdAt: new Date("2025-11-12T08:00:00Z").toISOString()
  },
  {
    id: "paper_2",
    title: "Fault-Tolerant Logical Qubits via High-Density Surface Codes",
    authors: ["Marcus Thorne", "Sophia Al-Jamil"],
    year: 2026,
    pages: 22,
    views: 890,
    likes: 211,
    downloadsCount: 88,
    categories: ["Quantum Computing"],
    summary: "We demonstrate a topological protection protocol optimizing fault-tolerance on heavy-hex layouts. Our experimental circuit demonstrates error margins below the threshold necessary for practical scale-up architectures.",
    fileUrl: "/sample-papers/fault_tolerant_qubits.pdf",
    researcherId: "res_marcus",
    coverImage: "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=600&auto=format&fit=crop&q=80",
    status: "Active",
    price: 19.99, // Premium paid paper
    createdAt: new Date("2026-02-18T10:30:00Z").toISOString()
  },
  {
    id: "paper_3",
    title: "Transformer-based Alignment of Heterogeneous Metagenomic Reads",
    authors: ["Siddharth Mehta", "Emily Carter"],
    year: 2024,
    pages: 12,
    views: 1420,
    likes: 405,
    downloadsCount: 212,
    categories: ["Bioinformatics", "Artificial Intelligence"],
    summary: "Metagenomics sequences often present highly disjoint sequences. We detail a custom local cross-attention decoder model trained to predict positional overlap across species without rigid reference schemas.",
    fileUrl: "/sample-papers/transformer_metagenomic_reads.pdf",
    researcherId: "res_siddharth",
    coverImage: "https://images.unsplash.com/photo-1530026405186-ed1eaae6bbdb?w=600&auto=format&fit=crop&q=80",
    status: "Active",
    price: 0, // Free
    createdAt: new Date("2024-08-05T14:15:00Z").toISOString()
  },
  {
    id: "paper_4",
    title: "Trust Anchors in Distributed Collaborative Computing Frameworks",
    authors: ["Marcus Thorne", "Elena Rostova"],
    year: 2025,
    pages: 16,
    views: 955,
    likes: 182,
    downloadsCount: 54,
    categories: ["Cybersecurity", "Artificial Intelligence"],
    summary: "This work investigates the union of autonomous machine swarms and decentralized ledgers. We offer cryptographic proof for zero-knowledge validation of path state updates without degrading live computational cycles.",
    fileUrl: "/sample-papers/trust_anchors_computing.pdf",
    researcherId: "res_marcus",
    coverImage: "https://images.unsplash.com/photo-1510511459019-5dda7724fd87?w=600&auto=format&fit=crop&q=80",
    status: "Active",
    price: 24.50, // Premium paid paper
    createdAt: new Date("2025-05-20T09:40:00Z").toISOString()
  }
];

const initialFAQs: FAQItem[] = [
  {
    id: "faq_1",
    question: "How can I download a premium indexed publication?",
    answer: "You can download papers directly. Premium papers require a one-click demo enrollment/purchase simulation on the publication page. This will append the paper to your personal Downloads Dashboard, unlocking immediate secure PDF viewing and offline archives."
  },
  {
    id: "faq_2",
    question: "Do download buttons have secure auto-expiry keys?",
    answer: "Yes, download links are provisioned via secure temporary tokens. They invalidate dynamically to ensure copyrighted materials are not distributed outside the platform sandbox."
  },
  {
    id: "faq_3",
    question: "Can I register as a platform Editor, or Super Admin?",
    answer: "Only existing Administrators can elevate user profiles to Editor status. Editor profiles have capabilities to index, update and remove publications, while Super Admins can additionally block users and manage support lines."
  },
  {
    id: "faq_4",
    question: "How do I request help if my downloads breakdown?",
    answer: "You can use either the built-in AI chatbot companion on the support page, or submit an official Support Ticket directly from your account page. Our editors will reply immediately."
  }
];

const initialBranding: SiteBranding = {
  siteName: "Research Archive",
  siteTagline: "Discover • Explore • Research",
  logoUrl: "/logo.svg",
  footerText: "Research Archive Portal. All rights reserved.",
  allowRegistration: true,
  emailNotifications: true,
  themeMode: "light"
};

// Seed directories
if (!fs.existsSync(UPLOAD_DIR_PATH)) {
  fs.mkdirSync(UPLOAD_DIR_PATH, { recursive: true });
}

const sampleDir = path.join(process.cwd(), "public", "sample-papers");
if (!fs.existsSync(sampleDir)) {
  fs.mkdirSync(sampleDir, { recursive: true });
}
initialPapers.forEach(p => {
  const targetPath = path.join(process.cwd(), "public", p.fileUrl);
  if (!fs.existsSync(targetPath)) {
    fs.mkdirSync(path.dirname(targetPath), { recursive: true });
    fs.writeFileSync(targetPath, `%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R >>\nendobj\n4 0 obj\n<< /Length 85 >>\nstream\nBT\n/F1 24 Tf\n70 700 Td\n(Research Archive - Local Document: ${p.title})\nTj\nET\nendstream\nendobj\nxref\n0 5\n0000000000 65535 f\n0000000009 00000 n\n0000000062 00000 n\n0000000125 00000 n\n0000000216 00000 n\ntrailer\n<< /Size 5 /Root 1 0 R >>\nstartxref\n349\n%%EOF\n`);
  }
});

class DBConnection {
  private state: DatabaseState;
  public mongoClient: MongoClient | null = null;
  public mongoDb: Db | null = null;
  public isMongo = false;

  constructor() {
    this.state = {
      users: [],
      papers: [],
      topics: [],
      researchers: [],
      tickets: [],
      contactMessages: [],
      faqs: [],
      branding: initialBranding
    };
  }

  public async init() {
    // 1. Try to load local file backup first as initial state
    this.load();
    // 2. Attempt to initialize MongoDB connection and load state directly from it
    await this.initMongo();
  }

  private async initMongo() {
    const mongoUri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/research_archive";
    try {
      console.log(`[Database] Connecting to MongoDB at URI: ${mongoUri}...`);
      const client = new MongoClient(mongoUri, {
        connectTimeoutMS: 5000,
        serverSelectionTimeoutMS: 5000
      });
      await client.connect();
      this.mongoClient = client;
      this.mongoDb = client.db();
      this.isMongo = true;
      console.log("[Database] Connected successfully to MongoDB! MongoDB is now the primary database.");

      // Verify if database contains existing documents
      const userCount = await this.mongoDb.collection("users").countDocuments();
      if (userCount > 0) {
        console.log("[Database] Found pre-existing documents in MongoDB. Syncing directly from MongoDB as sole source of truth...");
        await this.loadFromMongo();
      } else {
        console.log("[Database] MongoDB database is freshly initialized. Populating with initial seed data...");
        await this.syncStateToMongo();
      }
    } catch (err: any) {
      console.warn(`[Database] MongoDB not found or unreachable (${err.message}). Safe-fallback mode enabled: using local JSON storage archive-database.json.`);
      this.isMongo = false;
    }
  }

  private async loadFromMongo() {
    if (!this.mongoDb) return;
    try {
      const users = await this.mongoDb.collection("users").find({}).toArray();
      const papers = await this.mongoDb.collection("papers").find({}).toArray();
      const topics = await this.mongoDb.collection("topics").find({}).toArray();
      const researchers = await this.mongoDb.collection("researchers").find({}).toArray();
      const tickets = await this.mongoDb.collection("tickets").find({}).toArray();
      const contactMessages = await this.mongoDb.collection("contactMessages").find({}).toArray();
      const faqs = await this.mongoDb.collection("faqs").find({}).toArray();
      const chats = await this.mongoDb.collection("chats").find({}).toArray();
      
      const brandingDoc = await this.mongoDb.collection("branding").findOne({ id: "current" });

      const cleanDocs = (arr: any[]) => arr.map(item => {
        const { _id, ...clean } = item;
        return clean;
      });

      this.state.users = cleanDocs(users) as any[];
      this.state.papers = cleanDocs(papers) as any[];
      this.state.topics = cleanDocs(topics) as any[];
      this.state.researchers = cleanDocs(researchers) as any[];
      this.state.tickets = cleanDocs(tickets) as any[];
      this.state.contactMessages = cleanDocs(contactMessages) as any[];
      this.state.faqs = cleanDocs(faqs) as any[];
      this.state.chats = cleanDocs(chats) as any[];

      if (brandingDoc) {
        const { _id, id, ...cleanBranding } = brandingDoc as any;
        this.state.branding = cleanBranding;
      }

      console.log(`[Database] Loaded successfully from MongoDB: ${this.state.users.length} users, ${this.state.papers.length} publications, ${this.state.researchers.length} scholar profiles.`);
      
      // Keep local backup synchronized
      this.saveLocalBackup();
    } catch (err) {
      console.error("[Database] Critical error loading tables from MongoDB:", err);
    }
  }

  public async syncStateToMongo() {
    if (!this.mongoDb) return;
    try {
      const collections = [
        { name: "users", data: this.state.users },
        { name: "papers", data: this.state.papers },
        { name: "topics", data: this.state.topics },
        { name: "researchers", data: this.state.researchers },
        { name: "tickets", data: this.state.tickets },
        { name: "contactMessages", data: this.state.contactMessages },
        { name: "faqs", data: this.state.faqs },
        { name: "chats", data: this.state.chats || [] }
      ];

      for (const col of collections) {
        const dbCol = this.mongoDb.collection(col.name);
        
        // 1. Safe Upsert: Ensure all documents exist or are updated in place (no total collection wipe)
        const activeIds = new Set<string>();
        for (const item of col.data) {
          if (item && item.id) {
            activeIds.add(item.id);
            const doc = JSON.parse(JSON.stringify(item));
            delete doc._id; // Prevent _id duplication/immutable field issues
            await dbCol.updateOne({ id: item.id }, { $set: doc }, { upsert: true });
          }
        }

        // 2. Cleanup: Safely remove documents that were explicitly deleted from our state array
        const dbDocs = await dbCol.find({}, { projection: { id: 1 } }).toArray();
        const idsToRemove = dbDocs
          .map(d => d.id)
          .filter(id => id && !activeIds.has(id));
        
        if (idsToRemove.length > 0) {
          await dbCol.deleteMany({ id: { $in: idsToRemove } });
        }
      }

      // Sync branding
      const brandingCol = this.mongoDb.collection("branding");
      if (this.state.branding) {
        const doc = JSON.parse(JSON.stringify(this.state.branding));
        delete doc._id;
        await brandingCol.updateOne({ id: "current" }, { $set: doc }, { upsert: true });
      }

      console.log("[Database] Local state safely mirrored to MongoDB.");
    } catch (err) {
      console.error("[Database] Failure mirroring schema states to running MongoDB instance:", err);
    }
  }

  private saveLocalBackup() {
    try {
      this.recalculateStats();
      fs.writeFileSync(DB_FILE_PATH, JSON.stringify(this.state, null, 2), "utf8");
    } catch (err) {
      console.error("[Database] Backup write failed:", err);
    }
  }

  private load() {
    try {
      if (fs.existsSync(DB_FILE_PATH)) {
        const data = fs.readFileSync(DB_FILE_PATH, "utf8");
        this.state = JSON.parse(data);
        
        // Ensure newest collections are fully populated
        if (!this.state.tickets) this.state.tickets = [];
        if (!this.state.contactMessages) this.state.contactMessages = [];
        if (!this.state.faqs) this.state.faqs = initialFAQs;
        if (!this.state.branding) this.state.branding = initialBranding;
        if (!this.state.chats) this.state.chats = [];

        // Clean user models for blocks & order histories
        this.state.users.forEach(u => {
          if (u.isBlocked === undefined) u.isBlocked = false;
          if (!u.downloads) u.downloads = [];
        });

        // Clean paper models for prices/downloadsCount/coverImage
        this.state.papers.forEach(p => {
          if (p.downloadsCount === undefined) p.downloadsCount = Math.floor(Math.random() * 50) + 12;
          p.price = 0; // Force all papers to be 100% free as requested
          if (p.status === undefined) p.status = "Active";
          if (!p.coverImage) {
            if (p.id === "paper_1") p.coverImage = "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=600&auto=format&fit=crop&q=80";
            else if (p.id === "paper_2") p.coverImage = "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=600&auto=format&fit=crop&q=80";
            else if (p.id === "paper_3") p.coverImage = "https://images.unsplash.com/photo-1530026405186-ed1eaae6bbdb?w=600&auto=format&fit=crop&q=80";
            else p.coverImage = "https://images.unsplash.com/photo-1510511459019-5dda7724fd87?w=600&auto=format&fit=crop&q=80";
          }
        });

        this.recalculateStats();
      } else {
        // First setup
        const defaultAdminPassword = "adminpassword2026";
        const passwordHash = this.hashPassword(defaultAdminPassword);
        
        this.state = {
          users: [
            {
              id: "usr_admin",
              email: "admin@archive.org",
              name: "System Administrator",
              role: "admin",
              bookmarks: ["paper_1", "paper_3"],
              isBlocked: false,
              downloads: [
                { paperId: "paper_1", downloadedAt: new Date().toISOString(), orderId: "ORD-93021", price: 0 }
              ],
              createdAt: new Date().toISOString(),
              passwordHash
            },
            {
              id: "usr_demo",
              email: "researcher@example.com",
              name: "Alex Mercer",
              role: "user",
              bookmarks: ["paper_2"],
              isBlocked: false,
              downloads: [
                { paperId: "paper_1", downloadedAt: new Date(Date.now() - 86400000).toISOString(), orderId: "ORD-12344", price: 0 },
                { paperId: "paper_2", downloadedAt: new Date().toISOString(), orderId: "ORD-88401", price: 19.99 }
              ],
              createdAt: new Date().toISOString(),
              passwordHash: this.hashPassword("password123")
            },
            {
              id: "usr_editor",
              email: "editor@archive.org",
              name: "Clara Oswald",
              role: "editor",
              bookmarks: [],
              isBlocked: false,
              downloads: [],
              createdAt: new Date().toISOString(),
              passwordHash: this.hashPassword("editor123")
            }
          ],
          papers: initialPapers,
          topics: initialTopics,
          researchers: initialResearchers,
          tickets: [
            {
              id: "tkt_1",
              userId: "usr_demo",
              userName: "Alex Mercer",
              subject: "PDF validation key timeout",
              message: "I am trying to download 'Fault-Tolerant Logical Qubits' but the secure download link seems expired.",
              status: "open",
              createdAt: new Date(Date.now() - 3600000).toISOString()
            },
            {
              id: "tkt_2",
              userId: "usr_demo",
              userName: "Alex Mercer",
              subject: "Onboarding as researcher request",
              message: "Could Elena Rostova link my user account to her researcher profile, please?",
              reply: "Yes, we can link your portfolio once you submit your credential files inside the dashboard.",
              status: "resolved",
              createdAt: new Date(Date.now() - 86400000 * 2).toISOString()
            }
          ],
          contactMessages: [
            {
              id: "msg_1",
              name: "Jane Smith",
              email: "janesmith@mit.edu",
              message: "Hello! We are looking to syndicate our lab publications with the index server. Who are the contact editors?",
              status: "open",
              createdAt: new Date().toISOString()
            }
          ],
          faqs: initialFAQs,
          branding: initialBranding
        };
        this.save();
      }
    } catch (err) {
      console.error("Error loading mock database, resetting:", err);
    }
  }

  save() {
    try {
      this.recalculateStats();
      fs.writeFileSync(DB_FILE_PATH, JSON.stringify(this.state, null, 2), "utf8");
      if (this.isMongo && this.mongoDb) {
        this.syncStateToMongo().catch(err => {
          console.error("[Database] Background sync to MongoDB failed:", err);
        });
      }
    } catch (err) {
      console.error("Error saving mock database:", err);
    }
  }

  private recalculateStats() {
    // Top-up researcher paper counts
    this.state.researchers.forEach(res => {
      res.paperCount = this.state.papers.filter(p => (p.researcherId === res.id || p.authors.includes(res.name)) && p.status === "Active").length;
    });
    // Top-up topic counts
    this.state.topics.forEach(top => {
      top.paperCount = this.state.papers.filter(p => p.categories.includes(top.name) && p.status === "Active").length;
    });
  }

  hashPassword(password: string): string {
    const salt = "research_salt_key_static_2026";
    const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, "sha512").toString("hex");
    return hash;
  }

  getChats() {
    if (!this.state.chats) {
      this.state.chats = [];
    }
    return this.state.chats;
  }

  getUsers() { return this.state.users; }
  getPapers() { return this.state.papers; }
  getTopics() { return this.state.topics; }
  getResearchers() { return this.state.researchers; }
  getTickets() { return this.state.tickets; }
  getContactMessages() { return this.state.contactMessages; }
  getFaqs() { return this.state.faqs; }
  getBranding() { return this.state.branding; }

  createToken(user: User): string {
    const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
    const payload = Buffer.from(JSON.stringify({ id: user.id, email: user.email, role: user.role, exp: Date.now() + 86400000 })).toString("base64url");
    const tokenInput = `${header}.${payload}`;
    const signature = crypto.createHmac("sha256", JWT_SECRET).update(tokenInput).digest("base64url");
    return `${tokenInput}.${signature}`;
  }

  verifyToken(token: string): { id: string; email: string; role: 'student' | 'teacher' | 'editor' | 'admin' | 'user' } | null {
    try {
      const parts = token.split(".");
      if (parts.length !== 3) return null;
      const [header, payload, signature] = parts;
      const tokenInput = `${header}.${payload}`;
      const expectedSignature = crypto.createHmac("sha256", JWT_SECRET).update(tokenInput).digest("base64url");
      if (signature !== expectedSignature) return null;
      
      const parsedPay = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
      if (parsedPay.exp && Date.now() > parsedPay.exp) {
        return null;
      }
      return parsedPay;
    } catch {
      return null;
    }
  }
}

export const dbConnection = new DBConnection();
export const jwtSecret = JWT_SECRET;
