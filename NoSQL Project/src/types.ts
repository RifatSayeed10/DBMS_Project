export interface User {
  id: string;
  email: string;
  name: string;
  role: 'student' | 'teacher' | 'editor' | 'admin' | 'user';
  bookmarks: string[]; // List of paper IDs
  isBlocked?: boolean;
  downloads?: DownloadRecord[];
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: string;
  receiverId: string;
  receiverName: string;
  receiverRole: string;
  message: string;
  createdAt: string;
}

export interface DownloadRecord {
  paperId: string;
  downloadedAt: string;
  orderId: string;
  price: number;
}

export interface Ticket {
  id: string;
  userId: string;
  userName: string;
  subject: string;
  message: string;
  reply?: string;
  status: 'open' | 'resolved';
  createdAt: string;
}

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  message: string;
  reply?: string;
  status: 'open' | 'resolved';
  createdAt: string;
}

export interface FAQItem {
  id: string;
  question: string;
  answer: string;
}

export interface SiteBranding {
  siteName: string;
  siteTagline: string;
  logoUrl: string;
  footerText: string;
  allowRegistration: boolean;
  emailNotifications: boolean;
  themeMode: 'light' | 'dark' | 'auto';
}

export interface Paper {
  id: string;
  title: string;
  authors: string[];
  year: number;
  pages: number;
  views: number;
  likes: number;
  downloadsCount: number;
  categories: string[]; // Topic names
  summary: string;
  fileUrl: string; // PDF link or data URI
  researcherId?: string; // Associated main researcher ID
  coverImage?: string; // Visual illustration index/placeholder link
  status: 'Active' | 'Inactive';
  price: number; // 0 for free, > 0 for premium/paid
  createdAt: string;
}

export interface Topic {
  id: string;
  name: string;
  description: string;
  paperCount?: number;
}

export interface Researcher {
  id: string;
  name: string;
  affiliation: string;
  position: string;
  bio: string;
  email: string;
  website: string;
  profilePhoto: string; // Icon index or SVG/image URL
  paperCount?: number;
  userId?: string;
}

export interface DatabaseState {
  users: (User & { passwordHash: string })[];
  papers: Paper[];
  topics: Topic[];
  researchers: Researcher[];
  tickets: Ticket[];
  contactMessages: ContactMessage[];
  faqs: FAQItem[];
  branding: SiteBranding;
  chats?: ChatMessage[];
}

export interface AuthResponse {
  user: User;
  token: string;
}
