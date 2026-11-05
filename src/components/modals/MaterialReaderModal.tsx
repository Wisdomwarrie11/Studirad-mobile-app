import React, { useState, useEffect } from 'react';
import { StudyMaterial } from '../../types';
import { getYouTubeEmbedUrl } from '../../utils/youtube';
import { isResourceCached, cacheEducationalResource, uncacheEducationalResource } from '../../utils/offlineStorage';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';
import { 
  X, 
  Share2, 
  Download, 
  FileText, 
  Video, 
  Link as LinkIcon, 
  Clock, 
  User, 
  Sparkles, 
  CheckCircle2,
  Maximize2,
  Minimize2,
  Copy,
  Check,
  Eye,
  RefreshCw,
  WifiOff,
  Bookmark
} from 'lucide-react';

interface MaterialReaderModalProps {
  isOpen?: boolean;
  onClose: () => void;
  material: StudyMaterial | null;
}

// Course badge color helper matching MaterialsPage.tsx
const COURSE_COLORS: Record<string, { main: string; light: string; border: string }> = {
  Anatomy: { main: 'text-blue-600', light: 'bg-blue-50 dark:bg-blue-950/50', border: 'border-blue-200 dark:border-blue-800' },
  Physiology: { main: 'text-emerald-600', light: 'bg-emerald-50 dark:bg-emerald-950/50', border: 'border-emerald-200 dark:border-emerald-800' },
  'Rad Tech': { main: 'text-purple-600', light: 'bg-purple-50 dark:bg-purple-950/50', border: 'border-purple-200 dark:border-purple-800' },
  'Rad Equipment': { main: 'text-rose-600', light: 'bg-rose-50 dark:bg-rose-950/50', border: 'border-rose-200 dark:border-rose-800' },
  Pathology: { main: 'text-red-600', light: 'bg-red-50 dark:bg-red-950/50', border: 'border-red-200 dark:border-red-800' },
  CT: { main: 'text-cyan-600', light: 'bg-cyan-50 dark:bg-cyan-950/50', border: 'border-cyan-200 dark:border-cyan-800' },
  MRI: { main: 'text-amber-600', light: 'bg-amber-50 dark:bg-amber-950/50', border: 'border-amber-200 dark:border-amber-800' },
  USS: { main: 'text-teal-600', light: 'bg-teal-50 dark:bg-teal-950/50', border: 'border-teal-200 dark:border-teal-800' },
  Projects: { main: 'text-indigo-600', light: 'bg-indigo-50 dark:bg-indigo-950/50', border: 'border-indigo-200 dark:border-indigo-800' },
  'Professional Exams PQ': { main: 'text-slate-600', light: 'bg-slate-100 dark:bg-slate-800', border: 'border-slate-200 dark:border-slate-700' },
  Others: { main: 'text-pink-600', light: 'bg-pink-50 dark:bg-pink-950/50', border: 'border-pink-200 dark:border-pink-800' },
  All: { main: 'text-[#002147] dark:text-[#38BDF8]', light: 'bg-slate-100 dark:bg-slate-800', border: 'border-slate-200 dark:border-slate-700' },
};

export const MaterialReaderModal: React.FC<MaterialReaderModalProps> = ({
  isOpen = true,
  onClose,
  material,
}) => {
  const isOnline = useOnlineStatus();
  const [copied, setCopied] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [useDirectEmbed, setUseDirectEmbed] = useState(false);
  const [isCached, setIsCached] = useState(false);
  const [isCaching, setIsCaching] = useState(false);

  if (!isOpen || !material) return null;

  const rawLink = (material.link || '').trim();
  const config = COURSE_COLORS[material.course] || COURSE_COLORS.All;

  // Identify file types
  const isYouTube = rawLink.includes('youtube.com') || rawLink.includes('youtu.be');
  const isDirectVideo = !isYouTube && (
    material.type === 'video' ||
    /\.(mp4|webm|ogg|mov)($|\?)/i.test(rawLink) ||
    rawLink.includes('/video/upload/') ||
    rawLink.includes('/storage/v1/object/public/videos')
  );
  const isPDF = material.type === 'pdf' || /\.pdf($|\?)/i.test(rawLink) || rawLink.includes('.pdf');
  const isImage = /\.(jpg|jpeg|png|webp|gif|svg)($|\?)/i.test(rawLink) || rawLink.includes('/image/upload/');
  const isOfficeDoc = /\.(docx?|pptx?|xlsx?)($|\?)/i.test(rawLink);
  const isLink = material.type === 'link' && !isYouTube && !isDirectVideo && !isPDF && !isImage && !isOfficeDoc;

  // In-app embedded URLs
  const youtubeEmbed = isYouTube ? getYouTubeEmbedUrl(rawLink, false) : null;
  const googleDocsViewerUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(rawLink)}&embedded=true`;

  // Check if resource is cached in the service worker educational cache
  useEffect(() => {
    let isMounted = true;
    if (rawLink) {
      isResourceCached(rawLink).then((cached) => {
        if (isMounted) setIsCached(cached);
      });
    }
    return () => {
      isMounted = false;
    };
  }, [rawLink]);

  const handleToggleOfflineSave = async () => {
    if (!rawLink || isCaching || isYouTube) return;
    setIsCaching(true);
    try {
      if (isCached) {
        await uncacheEducationalResource(rawLink);
        setIsCached(false);
      } else {
        const ok = await cacheEducationalResource(rawLink);
        if (ok) setIsCached(true);
      }
    } finally {
      setIsCaching(false);
    }
  };

  const handleCopyLink = () => {
    if (rawLink) {
      navigator.clipboard.writeText(rawLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `${material.title} | StudiRad Material`,
        text: `Check out this radiography study resource on ${material.course}!`,
        url: rawLink || window.location.href,
      }).catch(() => {});
    } else {
      handleCopyLink();
    }
  };

  // In-app silent download helper (saves file without redirecting or opening new windows)
  const handleDownloadInApp = async () => {
    // Strictly prevent downloading YouTube links to avoid external browser navigation
    if (!rawLink || isDownloading || isYouTube) return;
    setIsDownloading(true);
    try {
      const response = await fetch(rawLink, { mode: 'cors' }).catch(() => null);
      if (response && response.ok) {
        const blob = await response.blob();
        const blobUrl = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = blobUrl;
        const filename = material.title.replace(/[^a-zA-Z0-9_-]/g, '_') + (isPDF ? '.pdf' : isDirectVideo ? '.mp4' : '');
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(blobUrl), 3000);
      } else {
        // Fallback hidden anchor with download attribute without window.location navigation
        const a = document.createElement('a');
        a.href = rawLink;
        a.download = material.title;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }
    } catch {
      // Never redirect to external URLs
    } finally {
      setIsDownloading(false);
    }
  };

  const formatDate = (dateVal: any) => {
    if (!dateVal) return 'Recent update';
    if (typeof dateVal === 'string') return dateVal;
    if (dateVal.toDate) {
      return dateVal.toDate().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }
    return new Date(dateVal).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/75 backdrop-blur-xs transition-opacity animate-fadeIn text-slate-900 dark:text-slate-100 select-none">
      <div className="absolute inset-0" onClick={onClose}></div>

      <div 
        className={`relative w-full ${
          isFullscreen 
            ? 'max-w-6xl h-[96vh]' 
            : 'max-w-3xl max-h-[92vh]'
        } bg-white dark:bg-[#121824] rounded-t-3xl sm:rounded-3xl flex flex-col shadow-2xl z-10 overflow-hidden text-left animate-slideUp border border-slate-200 dark:border-slate-800 transition-all duration-300`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div className="px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0 bg-white dark:bg-[#121824]">
          <div className="flex items-center gap-2 min-w-0 pr-2">
            <span className={`px-2.5 py-1 rounded-lg text-xs font-black uppercase tracking-wider ${config.light} ${config.main} border ${config.border}`}>
              {material.course}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold truncate">
              {isYouTube || isDirectVideo 
                ? 'In-App Video Lecture' 
                : isPDF 
                ? 'In-App Clinical PDF' 
                : isImage
                ? 'In-App Medical Image'
                : isOfficeDoc
                ? 'In-App Presentation'
                : 'Clinical Resource'}
            </span>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {!isYouTube && rawLink && (
              <button
                onClick={handleToggleOfflineSave}
                disabled={isCaching}
                title={isCached ? 'Remove from Offline Cache' : 'Cache in Service Worker for Offline Study'}
                className={`h-8 px-2.5 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer ${
                  isCached
                    ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                    : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'
                }`}
              >
                {isCached ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                ) : (
                  <Bookmark className="w-3.5 h-3.5 text-amber-500" />
                )}
                <span className="hidden sm:inline">
                  {isCaching ? 'Caching...' : isCached ? 'Offline Ready' : 'Save Offline'}
                </span>
              </button>
            )}

            {(isPDF || isOfficeDoc) && (
              <button
                onClick={() => setUseDirectEmbed(!useDirectEmbed)}
                title={useDirectEmbed ? 'Switch to Google Docs Viewer' : 'Switch to Direct Browser Embed'}
                className="h-8 px-2.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-[11px] font-semibold text-slate-600 dark:text-slate-300 flex items-center gap-1 transition-colors"
              >
                <RefreshCw className="w-3 h-3 text-[#FF7F32]" />
                <span className="hidden sm:inline">{useDirectEmbed ? 'Viewer' : 'Direct'}</span>
              </button>
            )}

            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              title={isFullscreen ? 'Exit Full View' : 'Full View'}
              className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 transition-colors"
            >
              {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            </button>

            <button
              onClick={handleShare}
              title="Share Resource"
              className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 transition-colors"
            >
              <Share2 className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={onClose}
              title="Close"
              className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Reader Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 no-scrollbar">
          
          {/* Offline Mode Indicator Banner */}
          {!isOnline && (
            <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-300 text-xs font-semibold flex items-center justify-between gap-2 animate-fadeIn">
              <div className="flex items-center gap-2">
                <WifiOff className="w-4 h-4 text-amber-500 shrink-0" />
                <span>
                  {isCached 
                    ? 'Offline Study Active: Viewing document from Service Worker offline cache.' 
                    : 'Offline Mode: Network unavailable. Reading from cached memory.'}
                </span>
              </div>
              {isCached && (
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold shrink-0">
                  Cached in SW
                </span>
              )}
            </div>
          )}

          {/* ================= 1. IN-APP CONTENT VIEWER ================= */}
          {isYouTube ? (
            /* In-App YouTube Player */
            <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-black shadow-lg">
              <iframe
                src={youtubeEmbed || rawLink}
                title={material.title}
                className="w-full h-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            </div>
          ) : isDirectVideo ? (
            /* In-App Direct Video Player (Cloudinary / Supabase video) */
            <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-black shadow-lg">
              <video
                src={rawLink}
                controls
                playsInline
                autoPlay
                className="w-full h-full object-contain bg-black"
              >
                Your browser does not support in-app video playback.
              </video>
            </div>
          ) : isPDF ? (
            /* In-App PDF Reader (Supports Supabase, Cloudinary, Firebase Storage) */
            <div className={`w-full ${isFullscreen ? 'h-[75vh]' : 'h-[55vh] sm:h-[62vh]'} rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-900 shadow-md relative`}>
              {useDirectEmbed ? (
                <object
                  data={rawLink}
                  type="application/pdf"
                  className="w-full h-full border-0"
                >
                  <iframe
                    src={googleDocsViewerUrl}
                    title={material.title}
                    className="w-full h-full border-0"
                  />
                </object>
              ) : (
                <iframe
                  src={googleDocsViewerUrl}
                  title={material.title}
                  className="w-full h-full border-0 bg-slate-900"
                  allowFullScreen
                />
              )}
            </div>
          ) : isImage ? (
            /* In-App High Resolution Image Viewer (Cloudinary / Supabase) */
            <div className={`w-full ${isFullscreen ? 'h-[75vh]' : 'h-[50vh]'} rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-black flex items-center justify-center p-2 shadow-md`}>
              <img
                src={rawLink}
                alt={material.title}
                className="max-w-full max-h-full object-contain rounded-xl"
              />
            </div>
          ) : isOfficeDoc ? (
            /* In-App Office/PowerPoint/Word Viewer */
            <div className={`w-full ${isFullscreen ? 'h-[75vh]' : 'h-[55vh] sm:h-[62vh]'} rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-900 shadow-md`}>
              <iframe
                src={googleDocsViewerUrl}
                title={material.title}
                className="w-full h-full border-0 bg-slate-900"
                allowFullScreen
              />
            </div>
          ) : (
            /* In-App Curated Reading & Clinical Summary */
            <div className="p-5 sm:p-6 rounded-2xl bg-slate-50 dark:bg-[#161F30] border border-slate-200 dark:border-slate-800 space-y-3">
              <div className="flex items-center gap-3">
                <div className={`p-3 rounded-xl ${config.light} ${config.main}`}>
                  {isLink ? <LinkIcon className="w-6 h-6" /> : <FileText className="w-6 h-6" />}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                    {isLink ? 'External Clinical Reference' : 'Radiography Study Guide'}
                  </h4>
                  <span className="text-xs text-slate-400">Verified Academic Source</span>
                </div>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                {material.description || `Curated study material for radiographers focusing on ${material.course}. Published to assist students and imaging professionals in mastering core clinical concepts.`}
              </p>
              {rawLink && (
                <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-500 font-mono break-all flex items-center justify-between gap-2">
                  <span className="truncate">{rawLink}</span>
                  <button
                    onClick={handleCopyLink}
                    className="p-1 text-slate-400 hover:text-[#FF7F32] shrink-0"
                    title="Copy resource URL"
                  >
                    {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Title & Metadata Strip */}
          <div className="space-y-1.5 pt-1">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-snug">
              {material.title}
            </h2>

            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
              <div className="flex items-center gap-1.5 font-medium">
                <User className="w-3.5 h-3.5 text-slate-400" />
                <span>Uploaded by <strong className="text-slate-700 dark:text-slate-200">{material.uploader || 'StudiRad Faculty'}</strong></span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>{formatDate(material.createdAt)}</span>
              </div>
            </div>
          </div>

  
        </div>

        {/* Bottom Actions (Clean In-App Controls - No External Redirection) */}
        <div className="p-3.5 sm:p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-[#121824] flex items-center justify-between gap-2.5 shrink-0">
          <button
            onClick={onClose}
            className="py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Close Reader
          </button>

          <div className="flex items-center gap-2">
            {rawLink && (
              <button
                type="button"
                onClick={handleCopyLink}
                className="py-2.5 px-3.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Link Copied' : 'Copy Link'}</span>
              </button>
            )}

            {rawLink && !isYouTube && (
              <>
                <button
                  type="button"
                  onClick={handleToggleOfflineSave}
                  disabled={isCaching}
                  className={`py-2.5 px-3.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer border ${
                    isCached
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                      : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-500/30 hover:bg-amber-100'
                  }`}
                  title={isCached ? 'Saved in Service Worker offline cache' : 'Save for offline access'}
                >
                  {isCached ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  ) : (
                    <Bookmark className="w-3.5 h-3.5 text-amber-500" />
                  )}
                  <span>{isCaching ? 'Caching...' : isCached ? 'Saved Offline' : 'Save for Offline Study'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleDownloadInApp}
                  disabled={isDownloading}
                  className="py-2.5 px-4 rounded-xl bg-[#002147] hover:bg-[#001733] text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all cursor-pointer active:scale-95"
                >
                  <Download className={`w-3.5 h-3.5 ${isDownloading ? 'animate-bounce' : ''}`} />
                  <span>{isDownloading ? 'Downloading...' : 'Save File'}</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
