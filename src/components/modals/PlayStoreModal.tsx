import React, { useState, useEffect } from 'react';
import { 
  Smartphone, 
  Download, 
  CheckCircle2, 
  ExternalLink, 
  Copy, 
  Check, 
  X, 
  ShieldCheck, 
  Layers, 
  Terminal,
  Sparkles
} from 'lucide-react';

interface PlayStoreModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PlayStoreModal: React.FC<PlayStoreModalProps> = ({ isOpen, onClose }) => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  useEffect(() => {
    // Check if already in standalone display mode
    if (window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone) {
      setIsInstalled(true);
    }

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
  }, []);

  if (!isOpen) return null;

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        setIsInstalled(true);
      }
      setDeferredPrompt(null);
    } else {
      alert('To install StudiRad on Android:\n1. Open your browser menu (⋮)\n2. Tap "Install App" or "Add to Home screen"');
    }
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white dark:bg-[#121824] rounded-2xl max-w-lg w-full max-h-[90vh] flex flex-col border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-[#151D2C]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#002147] dark:bg-[#002147] border border-blue-900/40 flex items-center justify-center text-white shadow-sm">
              <Smartphone className="w-5 h-5 text-[#FF7F32]" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                Google Play Store Ready
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800/60">
                  TWA Compliant
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Install as a native app or package for Google Play
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-5 overflow-y-auto space-y-5 text-left text-xs leading-relaxed text-slate-600 dark:text-slate-300">
          {/* Quick Install Action */}
          <div className="p-4 rounded-xl bg-gradient-to-br from-[#002147]/10 via-[#002147]/5 to-[#FF7F32]/10 border border-[#002147]/20 dark:border-blue-900/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <div className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-[#FF7F32]" />
                {isInstalled ? 'App is Already Installed' : 'Direct Device Installation'}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {isInstalled
                  ? 'Running in full standalone native container mode.'
                  : 'Install StudiRad directly on Android or Chrome OS without Play Store.'}
              </p>
            </div>
            {!isInstalled && (
              <button
                onClick={handleInstallClick}
                className="w-full sm:w-auto px-4 py-2 rounded-xl bg-[#002147] hover:bg-[#002e63] dark:bg-[#FF7F32] dark:hover:bg-[#ff8f4a] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-all shrink-0 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                Install Now
              </button>
            )}
          </div>

          {/* Compliance Checklist */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2.5 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              TWA (Trusted Web Activity) Readiness
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-[#1A2333] border border-slate-200/80 dark:border-slate-800 flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <div>
                  <div className="font-semibold text-slate-900 dark:text-slate-200">Web App Manifest</div>
                  <div className="text-[10px] text-slate-400">/manifest.json configured</div>
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-[#1A2333] border border-slate-200/80 dark:border-slate-800 flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <div>
                  <div className="font-semibold text-slate-900 dark:text-slate-200">Active Service Worker</div>
                  <div className="text-[10px] text-slate-400">/sw.js (v2.0) with educational resources offline cache</div>
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-[#1A2333] border border-slate-200/80 dark:border-slate-800 flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <div>
                  <div className="font-semibold text-slate-900 dark:text-slate-200">Adaptive Icons</div>
                  <div className="text-[10px] text-slate-400">192px & 512px (Any + Maskable)</div>
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-[#1A2333] border border-slate-200/80 dark:border-slate-800 flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <div>
                  <div className="font-semibold text-slate-900 dark:text-slate-200">AssetLinks Config</div>
                  <div className="text-[10px] text-slate-400">/.well-known/assetlinks.json</div>
                </div>
              </div>
            </div>
          </div>

          {/* How to Build Android Bundle (.aab) */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Terminal className="w-4 h-4 text-blue-400" />
              Build Android Package for Google Play
            </h4>
            <p className="text-slate-500 dark:text-slate-400">
              Google recommends using <strong>Bubblewrap</strong> (Google’s official TWA CLI) or <strong>PWABuilder</strong> to generate the signed <code className="px-1 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[#FF7F32]">.aab</code> file:
            </p>

            <div className="space-y-2 pt-1">
              <div className="rounded-lg bg-slate-950 p-3 text-slate-300 font-mono text-[11px] border border-slate-800 relative group">
                <div className="text-slate-500"># 1. Install official Google Bubblewrap CLI</div>
                <div className="text-emerald-400">npm i -g @bubblewrap/cli</div>
                <button
                  onClick={() => copyToClipboard('npm i -g @bubblewrap/cli', 'cli')}
                  className="absolute right-2 top-2 p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
                  title="Copy command"
                >
                  {copiedKey === 'cli' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>

              <div className="rounded-lg bg-slate-950 p-3 text-slate-300 font-mono text-[11px] border border-slate-800 relative group">
                <div className="text-slate-500"># 2. Initialize project from your live domain manifest</div>
                <div className="text-emerald-400">bubblewrap init --manifest=https://&lt;your-domain&gt;/manifest.json</div>
                <button
                  onClick={() => copyToClipboard('bubblewrap init --manifest=/manifest.json', 'init')}
                  className="absolute right-2 top-2 p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
                  title="Copy command"
                >
                  {copiedKey === 'init' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>

              <div className="rounded-lg bg-slate-950 p-3 text-slate-300 font-mono text-[11px] border border-slate-800 relative group">
                <div className="text-slate-500"># 3. Build signed Android App Bundle (.aab)</div>
                <div className="text-emerald-400">bubblewrap build</div>
                <button
                  onClick={() => copyToClipboard('bubblewrap build', 'build')}
                  className="absolute right-2 top-2 p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
                  title="Copy command"
                >
                  {copiedKey === 'build' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          </div>

          {/* Configuration Summary */}
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#1A2333] border border-slate-200 dark:border-slate-800 space-y-1.5">
            <div className="font-bold text-slate-900 dark:text-white">App Metadata for Play Console</div>
            <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[11px]">
              <div><span className="text-slate-400">Package Name:</span> <span className="font-mono text-slate-700 dark:text-slate-300">org.studirad.app</span></div>
              <div><span className="text-slate-400">Orientation:</span> <span className="font-medium text-slate-700 dark:text-slate-300">portrait-primary</span></div>
              <div><span className="text-slate-400">Theme Color:</span> <span className="font-mono text-slate-700 dark:text-slate-300">#002147</span></div>
              <div><span className="text-slate-400">Display:</span> <span className="font-medium text-slate-700 dark:text-slate-300">standalone (TWA)</span></div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-[#151D2C] flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
