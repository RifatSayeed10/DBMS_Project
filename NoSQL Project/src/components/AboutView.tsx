import React from "react";
import { Terminal, Settings, Database, Key, HelpCircle, Code, ShieldCheck, Server, Play, Heart } from "lucide-react";

export default function AboutView() {
  return (
    <div className="mx-auto max-w-4xl space-y-10 pb-16 page-transition-enter page-transition-enter-active">
      
      {/* Page Title */}
      <div className="border-b border-stone-200 pb-5">
        <h1 className="font-serif text-3xl font-bold tracking-tight text-stone-900">
          Dossier & Project Documentation
        </h1>
        <p className="text-sm text-stone-500 mt-1">
          Review architecture details, development scripts, database state, and environment instructions.
        </p>
      </div>

      {/* Grid of system info */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="rounded-sm border border-stone-200 bg-white p-5.5 space-y-3 shadow-3xs">
          <div className="flex h-10 w-10 items-center justify-center rounded-sm bg-brand-500 text-white shadow-xs">
            <Server className="h-5.5 w-5.5" />
          </div>
          <h3 className="font-sans text-base font-bold text-stone-900">
            Full-Stack Hybrid Layer
          </h3>
          <p className="text-xs text-stone-500 leading-relaxed font-light">
            React.js powers client rendering, served instantly by Node + Express. Local operations act as high-fidelity MongoDB database drivers with instant persistent disk synchronization.
          </p>
        </div>

        <div className="rounded-sm border border-stone-200 bg-white p-5.5 space-y-3 shadow-3xs">
          <div className="flex h-10 w-10 items-center justify-center rounded-sm bg-brand-600 text-white shadow-xs">
            <ShieldCheck className="h-5.5 w-5.5" />
          </div>
          <h3 className="font-sans text-base font-bold text-stone-900">
            Cryptographic Authentication
          </h3>
          <p className="text-xs text-stone-500 leading-relaxed font-light">
            Uses high-entropy secure static PBKDF2 hashing functions inside Node with JWT core header signatures (HMAC SHA-251) to securely identify sessions over remote portals.
          </p>
        </div>
      </div>

      {/* Configuration environmental parameters */}
      <section className="space-y-4" id="env-documentation">
        <div className="flex items-center gap-2">
          <Settings className="h-5 w-5 text-stone-650" />
          <h2 className="font-serif text-lg font-bold text-stone-850">
            Environment Deployment Configuration
          </h2>
        </div>

        <div className="overflow-hidden rounded-sm border border-stone-250 bg-white shadow-3xs">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-stone-50 font-sans font-bold text-stone-650 border-b border-stone-200 select-none">
                <th className="px-5 py-3.5">Variable Parameter</th>
                <th className="px-5 py-3.5">Default Fallback</th>
                <th className="px-5 py-3.5">Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-150 text-stone-650">
              <tr>
                <td className="px-5 py-3.5 font-mono font-bold text-brand-650">JWT_SECRET</td>
                <td className="px-5 py-3.5 font-mono text-stone-400">research_archive_secret...</td>
                <td className="px-5 py-3.5 font-sans font-light">
                  A high-entropy cryptographic signature key used to authorize sessions on active user accounts.
                </td>
              </tr>
              <tr>
                <td className="px-5 py-3.5 font-mono font-bold text-brand-650">MONGODB_URI</td>
                <td className="px-5 py-3.5 font-mono text-stone-400">Local JSON Persistence</td>
                <td className="px-5 py-3.5 font-sans font-light">
                  Standard MongoDB production connection string. Programmatically switches to file storage in local debugging sandboxes.
                </td>
              </tr>
              <tr>
                <td className="px-5 py-3.5 font-mono font-bold text-amber-700">PORT</td>
                <td className="px-5 py-3.5 font-mono text-stone-400">3000</td>
                <td className="px-5 py-3.5 font-sans font-light">
                  Required systems port. Handled automatically via Cloud Run and internal network proxies.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Development Terminal instructions */}
      <section className="space-y-4 font-sans text-xs">
        <div className="flex items-center gap-2">
          <Terminal className="h-4.5 w-4.5 text-stone-650" />
          <h2 className="font-serif text-lg font-bold text-stone-850">
            Installation & Local Execution
          </h2>
        </div>

        <div className="rounded-sm border border-stone-200 bg-stone-900 p-5.5 text-stone-300 font-mono space-y-5 shadow-inner">
          <div className="space-y-2">
            <span className="block text-stone-500 text-[10px] font-bold uppercase tracking-wider select-none border-b border-stone-800 pb-1">
              # Step 1: Install workspace packages
            </span>
            <span className="block text-brand-300">npm install</span>
          </div>

          <div className="space-y-2">
            <span className="block text-stone-500 text-[10px] font-bold uppercase tracking-wider select-none border-b border-stone-800 pb-1">
              # Step 2: Set up environment parameters
            </span>
            <span className="block text-brand-300">cp .env.example .env</span>
            <p className="text-stone-400 font-light leading-relaxed text-[11px] font-sans">
              * Edit .env values. Make sure you set your target production credentials if connecting to an external MongoDB Atlas cluster.
            </p>
          </div>

          <div className="space-y-2">
            <span className="block text-stone-500 text-[10px] font-bold uppercase tracking-wider select-none border-b border-stone-800 pb-1">
              # Step 3: Run full-stack dev server (Express + Vite on 3000)
            </span>
            <span className="block text-emerald-400">npm run dev</span>
          </div>

          <div className="space-y-2">
            <span className="block text-stone-500 text-[10px] font-bold uppercase tracking-wider select-none border-b border-stone-800 pb-1">
              # Step 4: Full compilation & bundling for deployment
            </span>
            <span className="block text-brand-300">npm run build</span>
            <span className="block text-stone-500 text-[10px] pl-3">
              - Generates static index files in /dist
            </span>
            <span className="block text-stone-500 text-[10px] pl-3">
              - Bundles Express server into single dist/server.cjs module using esbuild
            </span>
          </div>

          <div className="space-y-2">
            <span className="block text-stone-500 text-[10px] font-bold uppercase tracking-wider select-none border-b border-stone-800 pb-1">
              # Step 5: Start compiled application
            </span>
            <span className="block text-brand-300">npm start</span>
          </div>
        </div>
      </section>

      {/* Core technologies section */}
      <section className="space-y-3 rounded-sm bg-stone-50 border border-stone-200 p-5 font-sans">
        <h4 className="font-serif text-xs font-bold text-stone-850 uppercase tracking-widest flex items-center gap-1.5">
          <Code className="h-4 w-4 text-brand-500" />
          Technical Stack Specifications
        </h4>
        <p className="text-xs text-stone-650 leading-relaxed font-light">
          This system is crafted under **React 19** with unified metadata files in Vite. Static layout elements are governed directly by **Tailwind CSS**, and user controls are powered by **Lucide React** icon nodes. The database layer utilizes standard JS FileSystem read/writes ensuring persistent backups over active Docker lifecycles.
        </p>
      </section>
      
    </div>
  );
}
