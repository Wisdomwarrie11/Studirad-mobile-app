import React, { useState, useEffect, useLayoutEffect, useRef } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import { StudyMaterial } from '../../types';
import {
  getVideoEmbedUrl,
  getGoogleWorkspaceKind,
  getGoogleWorkspaceEmbedUrl,
} from '../../utils/youtube';
import {
  EDUCATIONAL_CACHE_NAME,
  isResourceCached,
  cacheEducationalResource,
  uncacheEducationalResource,
} from '../../utils/offlineStorage';
import {
  X,
  Share2,
  Download,
  FileText,
  Link as LinkIcon,
  Clock,
  User,
  CheckCircle2,
  Maximize2,
  Minimize2,
  Copy,
  Check,
  RefreshCw,
  Bookmark,
  ZoomIn,
  ZoomOut,
  ChevronLeft,
  ChevronRight,
  AlignLeft,
  BookOpen,
  ExternalLink,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { StarRatingWidget } from '../common/StarRatingWidget';

// Configure local Vite-bundled PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

interface MaterialReaderModalProps {
  isOpen?: boolean;
  onClose: () => void;
  material: StudyMaterial | null;
}

const COURSE_COLORS: Record<string, { main: string; light: string; border: string }> = {
  Anatomy: { main: 'text-blue-600 dark:text-blue-400', light: 'bg-blue-50 dark:bg-blue-950/50', border: 'border-blue-200 dark:border-blue-800' },
  Physiology: { main: 'text-emerald-600 dark:text-emerald-400', light: 'bg-emerald-50 dark:bg-emerald-950/50', border: 'border-emerald-200 dark:border-emerald-800' },
  'Rad Tech': { main: 'text-purple-600 dark:text-purple-400', light: 'bg-purple-50 dark:bg-purple-950/50', border: 'border-purple-200 dark:border-purple-800' },
  'Rad Equipment': { main: 'text-rose-600 dark:text-rose-400', light: 'bg-rose-50 dark:bg-rose-950/50', border: 'border-rose-200 dark:border-rose-800' },
  Pathology: { main: 'text-red-600 dark:text-red-400', light: 'bg-red-50 dark:bg-red-950/50', border: 'border-red-200 dark:border-red-800' },
  CT: { main: 'text-cyan-600 dark:text-cyan-400', light: 'bg-cyan-50 dark:bg-cyan-950/50', border: 'border-cyan-200 dark:border-cyan-800' },
  MRI: { main: 'text-amber-600 dark:text-amber-400', light: 'bg-amber-50 dark:bg-amber-950/50', border: 'border-amber-200 dark:border-amber-800' },
  USS: { main: 'text-teal-600 dark:text-teal-400', light: 'bg-teal-50 dark:bg-teal-950/50', border: 'border-teal-200 dark:border-teal-800' },
  Projects: { main: 'text-indigo-600 dark:text-indigo-400', light: 'bg-indigo-50 dark:bg-indigo-950/50', border: 'border-indigo-200 dark:border-indigo-800' },
  'Professional Exams PQ': { main: 'text-slate-600 dark:text-slate-300', light: 'bg-slate-100 dark:bg-slate-800', border: 'border-slate-200 dark:border-slate-700' },
  Others: { main: 'text-pink-600 dark:text-pink-400', light: 'bg-pink-50 dark:bg-pink-950/50', border: 'border-pink-200 dark:border-pink-800' },
  All: { main: 'text-[#002147] dark:text-[#38BDF8]', light: 'bg-slate-100 dark:bg-slate-800', border: 'border-slate-200 dark:border-slate-700' },
};

type LoadedContentKind =
  | 'idle'
  | 'loading'
  | 'pdf'
  | 'text'
  | 'article'
  | 'image'
  | 'video'
  | 'office'
  | 'notes_only'
  | 'error';

export const MaterialReaderModal: React.FC<MaterialReaderModalProps> = ({
  isOpen = true,
  onClose,
  material,
}) => {
  const [copied, setCopied] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isCached, setIsCached] = useState(false);
  const [isCaching, setIsCaching] = useState(false);

  // Reader state for documents & PDFs
  const [contentKind, setContentKind] = useState<LoadedContentKind>('idle');
  const [loadError, setLoadError] = useState<string | null>(null);
  const [textBody, setTextBody] = useState<string>('');
  const [articleParagraphs, setArticleParagraphs] = useState<string[]>([]);
  const [articleTitle, setArticleTitle] = useState<string>('');
  const [blobPreviewUrl, setBlobPreviewUrl] = useState<string | null>(null);

  // PDF.js state
  const [pdfDoc, setPdfDoc] = useState<pdfjsLib.PDFDocumentProxy | null>(null);
  const [numPages, setNumPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [zoom, setZoom] = useState(1.15);
  const [pdfViewMode, setPdfViewMode] = useState<'canvas' | 'text' | 'frame'>('canvas');
  const [extractedPdfPages, setExtractedPdfPages] = useState<string[]>([]);
  const [isRenderingPage, setIsRenderingPage] = useState(false);
  const [officeViewerMode, setOfficeViewerMode] = useState<'office' | 'gview'>('office');
  const [reloadNonce, setReloadNonce] = useState(0);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const renderTaskRef = useRef<any>(null);
  const bodyRef = useRef<HTMLDivElement | null>(null);

  useLayoutEffect(() => {
    if (bodyRef.current) {
      bodyRef.current.scrollTop = 0;
    }
  }, [material?.id]);

  const rawLink = (material?.link || (material as any)?.downloadUrl || (material as any)?.url || '').trim();
  const DEFAULT_CONFIG = {
    main: 'text-[#002147] dark:text-[#38BDF8]',
    light: 'bg-slate-100 dark:bg-slate-800',
    border: 'border-slate-200 dark:border-slate-700',
  };
  const courseKey = material?.course || 'All';
  const config = COURSE_COLORS[courseKey] || COURSE_COLORS.All || DEFAULT_CONFIG;

  const lowerLink = rawLink.toLowerCase();
  const isYouTube = lowerLink.includes('youtube.com') || lowerLink.includes('youtu.be');
  const googleKind = getGoogleWorkspaceKind(rawLink);
  const isGoogleVideo = googleKind === 'videos' || (Boolean(googleKind) && material?.type === 'video');
  const isGoogleDoc = Boolean(googleKind) && !isGoogleVideo;
  const isEmbedVideo = isYouTube || isGoogleVideo;
  const isDirectVideo =
    !isEmbedVideo &&
    !isGoogleDoc &&
    (material?.type === 'video' ||
      /\.(mp4|webm|ogg|mov|m4v)($|\?)/i.test(lowerLink) ||
      lowerLink.includes('/video/upload/') ||
      lowerLink.includes('/storage/v1/object/public/videos'));
  const isKnownImage =
    /\.(jpg|jpeg|png|webp|gif|svg|bmp)($|\?)/i.test(lowerLink) ||
    lowerLink.includes('/image/upload/') && !lowerLink.includes('.pdf');
  const isOfficeDoc = !isGoogleDoc && /\.(docx?|pptx?|xlsx?)($|\?)/i.test(lowerLink);

  const videoEmbedUrl = isEmbedVideo ? getVideoEmbedUrl(rawLink, false) : null;
  const googleWorkspaceEmbedUrl = isGoogleDoc ? getGoogleWorkspaceEmbedUrl(rawLink) : null;

  // Check SW offline cache state quietly
  useEffect(() => {
    let isMounted = true;
    if (isOpen && rawLink) {
      isResourceCached(rawLink)
        .then((cached) => {
          if (isMounted) setIsCached(cached);
        })
        .catch(() => {});
    } else {
      setIsCached(false);
    }
    return () => {
      isMounted = false;
    };
  }, [isOpen, rawLink]);

  // Clean up object URLs and PDF document on close/material change
  useEffect(() => {
    return () => {
      if (blobPreviewUrl) {
        URL.revokeObjectURL(blobPreviewUrl);
      }
    };
  }, [blobPreviewUrl]);

  // Load and parse document/PDF/text/article automatically whenever material opens
  useEffect(() => {
    if (!isOpen || !material) return;

    let cancelled = false;

    const cleanupPdf = (docToDestroy: pdfjsLib.PDFDocumentProxy | null) => {
      if (docToDestroy) {
        try {
          (docToDestroy as any).destroy?.()?.catch?.(() => {});
          docToDestroy.cleanup?.();
        } catch {}
      }
    };

    let activePdf: pdfjsLib.PDFDocumentProxy | null = null;

    setLoadError(null);
    setTextBody('');
    setArticleParagraphs([]);
    setArticleTitle('');
    setExtractedPdfPages([]);
    setCurrentPage(1);
    setNumPages(0);
    setPdfViewMode('canvas');
    setPdfDoc((prev) => {
      cleanupPdf(prev);
      return null;
    });

    if (!rawLink) {
      setContentKind('notes_only');
      return;
    }

    if (isEmbedVideo || isDirectVideo) {
      setContentKind('video');
      return;
    }

    if (isGoogleDoc) {
      setContentKind('idle');
      return;
    }

    if (isKnownImage) {
      setContentKind('image');
      return;
    }

    if (isOfficeDoc) {
      setContentKind('office');
      return;
    }

    const loadMaterialContent = async () => {
      setContentKind('loading');

      try {
        let response: Response | null = null;

        // 1. Check local educational cache first
        if ('caches' in window) {
          try {
            const cache = await caches.open(EDUCATIONAL_CACHE_NAME);
            const cachedResp = await cache.match(rawLink);
            if (cachedResp && cachedResp.ok) {
              response = cachedResp;
            }
          } catch {}
        }

        // 2. Try direct fetch (works for /uploads/ local files and CORS-enabled CDNs)
        const isSameOrigin = rawLink.startsWith('/') || (typeof window !== 'undefined' && rawLink.startsWith(window.location.origin));
        if (!response) {
          try {
            const directRes = await fetch(rawLink, { mode: isSameOrigin ? 'same-origin' : 'cors' });
            if (directRes.ok) {
              response = directRes;
            }
          } catch {
            // Fall through to backend material proxy
          }
        }

        // 3. Fallback to safe Express proxy when CORS blocks direct fetch
        if (!response && /^https?:\/\//i.test(rawLink)) {
          const proxyUrl = `/api/material-proxy?url=${encodeURIComponent(rawLink)}`;
          const proxyRes = await fetch(proxyUrl);
          if (proxyRes.ok) {
            response = proxyRes;
          } else {
            const errJson = await proxyRes.json().catch(() => ({}));
            throw new Error(errJson.error || `Unable to open file (HTTP ${proxyRes.status})`);
          }
        }

        if (!response) {
          throw new Error('Could not reach material source.');
        }

        const headerType = (response.headers.get('content-type') || '').toLowerCase();
        const arrayBuf = await response.arrayBuffer();
        if (cancelled) return;

        const bytes = new Uint8Array(arrayBuf);
        const headerSig =
          bytes.length >= 4
            ? String.fromCharCode(bytes[0], bytes[1], bytes[2], bytes[3])
            : '';

        const looksLikePdf =
          headerSig === '%PDF' ||
          headerType.includes('application/pdf') ||
          lowerLink.includes('.pdf') ||
          material.type === 'pdf';

        if (looksLikePdf && headerSig === '%PDF') {
          const pdfBlob = new Blob([bytes], { type: 'application/pdf' });
          const nextBlobUrl = URL.createObjectURL(pdfBlob);
          if (cancelled) {
            URL.revokeObjectURL(nextBlobUrl);
            return;
          }
          setBlobPreviewUrl((prev) => {
            if (prev) URL.revokeObjectURL(prev);
            return nextBlobUrl;
          });

          const loadingTask = pdfjsLib.getDocument({ data: bytes });
          const loadedPdf = await loadingTask.promise;
          if (cancelled) {
            cleanupPdf(loadedPdf);
            return;
          }
          activePdf = loadedPdf;
          setPdfDoc(loadedPdf);
          setNumPages(loadedPdf.numPages);
          setCurrentPage(1);
          setContentKind('pdf');
          return;
        }

        // Check image MIME
        if (headerType.startsWith('image/')) {
          const imgBlob = new Blob([bytes], { type: headerType });
          const nextBlobUrl = URL.createObjectURL(imgBlob);
          if (!cancelled) {
            setBlobPreviewUrl(nextBlobUrl);
            setContentKind('image');
          }
          return;
        }

        // Check video MIME
        if (headerType.startsWith('video/')) {
          const vidBlob = new Blob([bytes], { type: headerType });
          const nextBlobUrl = URL.createObjectURL(vidBlob);
          if (!cancelled) {
            setBlobPreviewUrl(nextBlobUrl);
            setContentKind('video');
          }
          return;
        }

        // Plain text / Markdown / CSV / JSON
        if (
          headerType.includes('text/plain') ||
          headerType.includes('text/markdown') ||
          headerType.includes('text/csv') ||
          headerType.includes('application/json') ||
          /\.(txt|md|csv|json)($|\?)/i.test(lowerLink)
        ) {
          const decoded = new TextDecoder('utf-8').decode(bytes);
          if (!cancelled) {
            setTextBody(decoded);
            setContentKind('text');
          }
          return;
        }

        // HTML clinical article extraction
        if (headerType.includes('text/html')) {
          const html = new TextDecoder('utf-8').decode(bytes);
          const parser = new DOMParser();
          const doc = parser.parseFromString(html, 'text/html');
          const extractedTitle = doc.querySelector('title')?.textContent?.trim() || material.title;
          const nodes = Array.from(doc.querySelectorAll('article p, main p, p, li, h1, h2, h3'));
          const paragraphs = nodes
            .map((el) => (el.textContent || '').replace(/\s+/g, ' ').trim())
            .filter((t) => t.length > 28)
            .slice(0, 80);

          if (!cancelled) {
            setArticleTitle(extractedTitle);
            setArticleParagraphs(paragraphs);
            setContentKind(paragraphs.length > 0 ? 'article' : 'notes_only');
          }
          return;
        }

        // Check Office MIME
        if (
          headerType.includes('officedocument') ||
          headerType.includes('msword') ||
          headerType.includes('ms-powerpoint') ||
          headerType.includes('ms-excel')
        ) {
          if (!cancelled) setContentKind('office');
          return;
        }

        // Last resort for unknown text-like payloads
        const fallbackText = new TextDecoder('utf-8', { fatal: false }).decode(bytes.slice(0, 60000));
        const printableRatio =
          fallbackText.length > 0
            ? fallbackText.replace(/[^\x20-\x7E\n\r\t]/g, '').length / fallbackText.length
            : 0;
        if (printableRatio > 0.85 && fallbackText.trim().length > 20) {
          if (!cancelled) {
            setTextBody(fallbackText);
            setContentKind('text');
          }
          return;
        }

        if (!cancelled) {
          setContentKind('notes_only');
        }
      } catch (err: any) {
        if (!cancelled) {
          console.warn('[MaterialReaderModal] Read notice:', err?.message || err);
          setLoadError(err?.message || 'Unable to render this document directly inside the reader.');
          // If it's likely a PDF URL even when proxy/fetch failed, still offer frame viewer fallback
          if (lowerLink.includes('.pdf') || material.type === 'pdf') {
            setPdfViewMode('frame');
            setContentKind('pdf');
          } else {
            setContentKind('error');
          }
        }
      }
    };

    loadMaterialContent();

    return () => {
      cancelled = true;
      cleanupPdf(activePdf);
    };
  }, [isOpen, material, rawLink, reloadNonce, isEmbedVideo, isDirectVideo, isGoogleDoc, isKnownImage, isOfficeDoc]);

  // Render active PDF page onto canvas cleanly whenever page, zoom, or view mode updates
  useEffect(() => {
    if (contentKind !== 'pdf' || pdfViewMode !== 'canvas' || !pdfDoc || !canvasRef.current) return;

    let cancelled = false;
    const renderPage = async () => {
      setIsRenderingPage(true);
      try {
        if (renderTaskRef.current) {
          try {
            renderTaskRef.current.cancel();
          } catch {}
        }

        const page = await pdfDoc.getPage(currentPage);
        if (cancelled || !canvasRef.current) return;

        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const viewport = page.getViewport({ scale: zoom });
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');
        if (!context) return;

        canvas.width = Math.floor(viewport.width * dpr);
        canvas.height = Math.floor(viewport.height * dpr);
        canvas.style.width = `${Math.floor(viewport.width)}px`;
        canvas.style.height = `${Math.floor(viewport.height)}px`;

        context.setTransform(dpr, 0, 0, dpr, 0, 0);
        const task = page.render({ canvasContext: context, viewport, canvas } as any);
        renderTaskRef.current = task;
        await task.promise;
      } catch (err: any) {
        if (err?.name !== 'RenderingCancelledException') {
          console.warn('PDF page render warning:', err);
        }
      } finally {
        if (!cancelled) setIsRenderingPage(false);
      }
    };

    renderPage();

    return () => {
      cancelled = true;
      if (renderTaskRef.current) {
        try {
          renderTaskRef.current.cancel();
        } catch {}
      }
    };
  }, [contentKind, pdfViewMode, pdfDoc, currentPage, zoom]);

  // Extract readable text from all PDF pages when switching to Text Mode
  useEffect(() => {
    if (contentKind !== 'pdf' || pdfViewMode !== 'text' || !pdfDoc || extractedPdfPages.length > 0) return;

    let cancelled = false;
    const extractAll = async () => {
      const texts: string[] = [];
      const limit = Math.min(pdfDoc.numPages, 60);
      for (let i = 1; i <= limit; i++) {
        if (cancelled) return;
        try {
          const page = await pdfDoc.getPage(i);
          const textContent = await page.getTextContent();
          const line = (textContent.items as any[])
            .map((item) => item?.str || '')
            .join(' ')
            .replace(/\s+/g, ' ')
            .trim();
          texts.push(line || '(Page contains diagrams or scanned figures)');
        } catch {
          texts.push('(Unable to extract text from this page)');
        }
      }
      if (!cancelled) {
        setExtractedPdfPages(texts);
      }
    };
    extractAll();

    return () => {
      cancelled = true;
    };
  }, [contentKind, pdfViewMode, pdfDoc, extractedPdfPages.length]);

  if (!isOpen || !material) return null;

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
      try {
        navigator.clipboard?.writeText(rawLink).catch(() => {});
      } catch {}
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator
        .share({
          title: `${material?.title || 'Study Material'} | StudiRad Material`,
          text: `Check out this radiography study resource on ${material?.course || 'Radiography'}!`,
          url: rawLink || window.location.href,
        })
        .catch(() => {});
    } else {
      handleCopyLink();
    }
  };

  const handleDownloadInApp = async () => {
    if (!rawLink || isDownloading || isYouTube) return;
    setIsDownloading(true);
    try {
      const fetchTarget =
        rawLink.startsWith('/') || (typeof window !== 'undefined' && rawLink.startsWith(window.location.origin))
          ? rawLink
          : `/api/material-proxy?url=${encodeURIComponent(rawLink)}`;

      const response =
        (await fetch(rawLink, { mode: 'cors' }).catch(() => null)) ||
        (await fetch(fetchTarget).catch(() => null));

      if (response && response.ok) {
        const blob = await response.blob();
        const blobUrl = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = blobUrl;
        const safeName = (material?.title || 'clinical_study_resource').replace(/[^a-zA-Z0-9_-]/g, '_');
        const filename = safeName + (contentKind === 'pdf' ? '.pdf' : isDirectVideo ? '.mp4' : '');
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(blobUrl), 3000);
      }
    } catch {
      // ignore download error
    } finally {
      setIsDownloading(false);
    }
  };

  const formatDate = (dateVal: any) => {
    try {
      if (!dateVal) return 'Recent update';
      if (typeof dateVal === 'string') return dateVal;
      if (typeof dateVal?.toDate === 'function') {
        return dateVal.toDate().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      }
      if (dateVal?.seconds) {
        return new Date(dateVal.seconds * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      }
      const d = new Date(dateVal);
      if (isNaN(d.getTime())) return 'Recent update';
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return 'Recent update';
    }
  };

  const googleDocsGviewUrl = rawLink
    ? `https://docs.google.com/gview?url=${encodeURIComponent(rawLink)}&embedded=true`
    : '';
  const officeAppsViewerUrl = rawLink
    ? `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(rawLink)}`
    : '';

  const typeBadgeLabel = isYouTube || isDirectVideo || isGoogleVideo
    ? 'In-App Video Lecture'
    : contentKind === 'pdf'
    ? 'PDF Document Reader'
    : isGoogleDoc
    ? 'Google Workspace Reader'
    : isOfficeDoc || contentKind === 'office'
    ? 'Slide / Office Reader'
    : contentKind === 'text' || contentKind === 'article'
    ? 'Clinical Study Reader'
    : contentKind === 'image' || isKnownImage
    ? 'Medical Image Viewer'
    : 'Clinical Resource';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-xs transition-opacity animate-fadeIn text-slate-900 dark:text-slate-100">
      <div className="absolute inset-0" onClick={onClose}></div>

      <div
        className={`relative w-full h-[100dvh] ${
          isFullscreen
            ? 'sm:max-w-none sm:h-[100dvh] rounded-none border-0'
            : 'sm:h-[96vh] sm:max-w-5xl md:max-w-6xl rounded-none sm:rounded-3xl border-0 sm:border'
        } bg-white dark:bg-[#121824] flex flex-col shadow-2xl z-10 overflow-hidden text-left animate-slideUp border-slate-200 dark:border-slate-800 transition-all duration-300`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div className="px-4 sm:px-5 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0 bg-white dark:bg-[#121824]">
          <div className="flex items-center gap-2 min-w-0 pr-2">
            <span className={`px-2.5 py-1 rounded-lg text-xs font-black uppercase tracking-wider shrink-0 ${config.light} ${config.main} border ${config.border}`}>
              {material?.course || 'Radiography'}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold truncate">
              {typeBadgeLabel}
            </span>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {!isYouTube && rawLink && (
              <button
                type="button"
                onClick={handleToggleOfflineSave}
                disabled={isCaching}
                title={isCached ? 'Remove from Offline Cache' : 'Save Offline'}
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
                  {isCaching ? 'Saving...' : isCached ? 'Saved Offline' : 'Save Offline'}
                </span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setIsFullscreen(!isFullscreen)}
              title={isFullscreen ? 'Exit Full View' : 'Full View'}
              className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
            >
              {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            </button>

            <button
              type="button"
              onClick={handleShare}
              title="Share Resource"
              className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
            >
              <Share2 className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={onClose}
              title="Close"
              className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Reader Body */}
        <div
          ref={bodyRef}
          className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4"
        >
          {/* 1. LOADING STATE */}
          {contentKind === 'loading' && (
            <div className="w-full h-[52vh] rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#0D131F] flex flex-col items-center justify-center gap-3">
              <Loader2 className="w-8 h-8 text-[#f59e0b] animate-spin" />
              <p className="text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-300">
                Loading study material for reading...
              </p>
            </div>
          )}

          {/* 2. EMBEDDED VIDEO LECTURE (YouTube / Google Video) */}
          {isEmbedVideo && (
            <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-black shadow-lg">
              <iframe
                src={videoEmbedUrl || rawLink}
                title={material.title}
                className="w-full h-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            </div>
          )}

          {/* 3. DIRECT VIDEO */}
          {!isEmbedVideo && (isDirectVideo || contentKind === 'video') && (
            <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-black shadow-lg">
              <video
                src={blobPreviewUrl || rawLink}
                controls
                playsInline
                autoPlay
                className="w-full h-full object-contain bg-black"
              >
                Your browser does not support in-app video playback.
              </video>
            </div>
          )}

          {/* 4. GOOGLE WORKSPACE DOCUMENT / SLIDE / SHEET / DRIVE PDF */}
          {isGoogleDoc && googleWorkspaceEmbedUrl && (
            <div className="space-y-2.5">
              <div className={`w-full ${isFullscreen ? 'h-[76vh]' : 'h-[58vh] sm:h-[64vh]'} rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-900 shadow-md`}>
                <iframe
                  src={googleWorkspaceEmbedUrl}
                  title={material.title}
                  className="w-full h-full border-0 bg-white"
                  allowFullScreen
                />
              </div>
              <div className="flex items-center justify-between px-1 text-xs text-slate-500 dark:text-slate-400">
                <span>Trouble viewing Google Drive preview?</span>
                <a
                  href={rawLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 font-bold text-[#f59e0b] hover:underline"
                >
                  <span>Open Document</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          )}

          {/* 5. IN-APP PDF READER (PDF.js Canvas + Text Mode + Frame Fallback) */}
          {contentKind === 'pdf' && (
            <div className="space-y-3">
              {/* PDF Toolbar */}
              <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-2xl bg-slate-100 dark:bg-[#161F30] border border-slate-200 dark:border-slate-800">
                {/* Mode Toggle */}
                <div className="flex items-center gap-1">
                  {pdfDoc && (
                    <>
                      <button
                        type="button"
                        onClick={() => setPdfViewMode('canvas')}
                        className={`px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors ${
                          pdfViewMode === 'canvas'
                            ? 'bg-[#002147] text-white'
                            : 'text-slate-600 dark:text-slate-300 hover:bg-white/70 dark:hover:bg-slate-800'
                        }`}
                      >
                        <BookOpen className="w-3.5 h-3.5" />
                        <span>Reader</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setPdfViewMode('text')}
                        className={`px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors ${
                          pdfViewMode === 'text'
                            ? 'bg-[#002147] text-white'
                            : 'text-slate-600 dark:text-slate-300 hover:bg-white/70 dark:hover:bg-slate-800'
                        }`}
                      >
                        <AlignLeft className="w-3.5 h-3.5" />
                        <span>Text Mode</span>
                      </button>
                    </>
                  )}
                  <button
                    type="button"
                    onClick={() => setPdfViewMode('frame')}
                    className={`px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors ${
                      pdfViewMode === 'frame'
                        ? 'bg-[#002147] text-white'
                        : 'text-slate-600 dark:text-slate-300 hover:bg-white/70 dark:hover:bg-slate-800'
                    }`}
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Alt Frame</span>
                  </button>
                </div>

                {/* Page Navigation & Zoom */}
                {pdfDoc && pdfViewMode === 'canvas' && (
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage <= 1}
                      className="p-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 disabled:opacity-40 cursor-pointer"
                      aria-label="Previous page"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="text-xs font-bold px-2 tabular-nums">
                      Page {currentPage} / {numPages}
                    </span>
                    <button
                      type="button"
                      onClick={() => setCurrentPage((p) => Math.min(numPages, p + 1))}
                      disabled={currentPage >= numPages}
                      className="p-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 disabled:opacity-40 cursor-pointer"
                      aria-label="Next page"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>

                    <div className="w-px h-5 bg-slate-300 dark:bg-slate-700 mx-1" />

                    <button
                      type="button"
                      onClick={() => setZoom((z) => Math.max(0.65, +(z - 0.15).toFixed(2)))}
                      className="p-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 cursor-pointer"
                      aria-label="Zoom out"
                    >
                      <ZoomOut className="w-3.5 h-3.5" />
                    </button>
                    <span className="text-[11px] font-bold w-11 text-center tabular-nums">
                      {Math.round(zoom * 100)}%
                    </span>
                    <button
                      type="button"
                      onClick={() => setZoom((z) => Math.min(2.2, +(z + 0.15).toFixed(2)))}
                      className="p-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 cursor-pointer"
                      aria-label="Zoom in"
                    >
                      <ZoomIn className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>

              {/* PDF Canvas View */}
              {pdfViewMode === 'canvas' && pdfDoc && (
                <div className={`w-full ${isFullscreen ? 'min-h-[70vh]' : 'min-h-[54vh] max-h-[66vh]'} overflow-auto rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-200/70 dark:bg-[#090D14] p-3 sm:p-5 flex justify-center items-start relative`}>
                  {isRenderingPage && (
                    <div className="absolute top-3 right-3 px-2.5 py-1 rounded-lg bg-slate-900/80 text-white text-[11px] font-semibold flex items-center gap-1.5">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      <span>Rendering...</span>
                    </div>
                  )}
                  <canvas
                    ref={canvasRef}
                    className="shadow-lg rounded-lg bg-white max-w-full h-auto"
                  />
                </div>
              )}

              {/* PDF Text Reading Mode */}
              {pdfViewMode === 'text' && pdfDoc && (
                <div className="space-y-3 max-h-[64vh] overflow-y-auto pr-1">
                  {extractedPdfPages.length === 0 ? (
                    <div className="p-8 text-center rounded-2xl bg-slate-50 dark:bg-[#161F30] border border-slate-200 dark:border-slate-800">
                      <Loader2 className="w-6 h-6 text-[#f59e0b] animate-spin mx-auto mb-2" />
                      <p className="text-xs text-slate-500 dark:text-slate-400">Extracting readable text...</p>
                    </div>
                  ) : (
                    extractedPdfPages.map((pageText, index) => (
                      <div
                        key={index}
                        className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-[#161F30] border border-slate-200 dark:border-slate-800 space-y-2"
                      >
                        <span className="inline-block text-[11px] font-bold uppercase tracking-wider text-[#f59e0b]">
                          Page {index + 1}
                        </span>
                        <p className="text-sm text-slate-800 dark:text-slate-200 leading-relaxed select-text">
                          {pageText}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* PDF Frame Fallback View */}
              {pdfViewMode === 'frame' && (
                <div className={`w-full ${isFullscreen ? 'h-[72vh]' : 'h-[58vh]'} rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-900`}>
                  <iframe
                    src={blobPreviewUrl || googleDocsGviewUrl}
                    title={material.title}
                    className="w-full h-full border-0 bg-white"
                    allowFullScreen
                  />
                </div>
              )}
            </div>
          )}

          {/* 6. IMAGE VIEWER */}
          {(contentKind === 'image' || (contentKind !== 'loading' && isKnownImage)) && (
            <div className={`w-full ${isFullscreen ? 'h-[74vh]' : 'h-[52vh]'} rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-black flex items-center justify-center p-2 shadow-md`}>
              <img
                src={blobPreviewUrl || rawLink}
                alt={material.title}
                referrerPolicy="no-referrer"
                className="max-w-full max-h-full object-contain rounded-xl"
              />
            </div>
          )}

          {/* 7. OFFICE DOC / SLIDE DECK VIEWER */}
          {contentKind === 'office' && (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between p-2 rounded-xl bg-slate-100 dark:bg-[#161F30] border border-slate-200 dark:border-slate-800">
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 px-2">
                  Presentation / Document Preview
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setOfficeViewerMode(officeViewerMode === 'office' ? 'gview' : 'office')}
                    className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <RefreshCw className="w-3 h-3 text-[#f59e0b]" />
                    <span>{officeViewerMode === 'office' ? 'Switch to Google Viewer' : 'Switch to Office Viewer'}</span>
                  </button>
                </div>
              </div>
              <div className={`w-full ${isFullscreen ? 'h-[72vh]' : 'h-[58vh]'} rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-white shadow-md`}>
                <iframe
                  src={officeViewerMode === 'office' ? officeAppsViewerUrl : googleDocsGviewUrl}
                  title={material.title}
                  className="w-full h-full border-0"
                  allowFullScreen
                />
              </div>
            </div>
          )}

          {/* 8. PLAIN TEXT / MARKDOWN READER */}
          {contentKind === 'text' && (
            <div className="p-5 sm:p-6 rounded-2xl bg-slate-50 dark:bg-[#161F30] border border-slate-200 dark:border-slate-800 max-h-[64vh] overflow-y-auto select-text">
              <pre className="whitespace-pre-wrap font-sans text-sm text-slate-800 dark:text-slate-200 leading-relaxed">
                {textBody}
              </pre>
            </div>
          )}

          {/* 9. EXTRACTED CLINICAL ARTICLE READER */}
          {contentKind === 'article' && (
            <div className="p-5 sm:p-6 rounded-2xl bg-slate-50 dark:bg-[#161F30] border border-slate-200 dark:border-slate-800 space-y-3 max-h-[64vh] overflow-y-auto select-text">
              <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-200 dark:border-slate-700">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {articleTitle || material.title}
                </h3>
                {rawLink && (
                  <a
                    href={rawLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-bold text-[#f59e0b] hover:underline shrink-0"
                  >
                    <span>Source</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
              <div className="space-y-3">
                {articleParagraphs.map((para, idx) => (
                  <p key={idx} className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed">
                    {para}
                  </p>
                ))}
              </div>
            </div>
          )}

          {/* 10. NOTES ONLY OR ERROR WITH RETRY & OPEN FALLBACK */}
          {(contentKind === 'notes_only' || contentKind === 'error') && (
            <div className="p-5 sm:p-6 rounded-2xl bg-slate-50 dark:bg-[#161F30] border border-slate-200 dark:border-slate-800 space-y-4">
              <div className="flex items-start gap-3">
                <div className={`p-3 rounded-xl ${config.light} ${config.main} shrink-0`}>
                  {contentKind === 'error' ? (
                    <AlertCircle className="w-6 h-6 text-amber-500" />
                  ) : rawLink ? (
                    <LinkIcon className="w-6 h-6" />
                  ) : (
                    <FileText className="w-6 h-6" />
                  )}
                </div>
                <div className="space-y-1 flex-1 min-w-0">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                    {contentKind === 'error' ? 'Preview Unavailable Inline' : 'Clinical Study Guide'}
                  </h4>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line select-text">
                    {material.description ||
                      `Study resource for ${material.course}.`}
                  </p>
                  {loadError && (
                    <p className="text-xs text-amber-600 dark:text-amber-400 pt-1">
                      {loadError}
                    </p>
                  )}
                </div>
              </div>

              {rawLink && (
                <div className="flex flex-wrap items-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setReloadNonce((n) => n + 1)}
                    className="px-3.5 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Retry Reader</span>
                  </button>
                  <a
                    href={rawLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 rounded-xl bg-[#002147] hover:bg-[#0A3266] text-white text-xs font-bold inline-flex items-center gap-1.5"
                  >
                    <span>Open Original Resource</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              )}
            </div>
          )}

          {/* Title & Metadata Strip */}
          <div className="space-y-1.5 pt-1">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-snug">
              {material.title}
            </h2>

            {material.description && contentKind !== 'notes_only' && contentKind !== 'error' && (
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                {material.description}
              </p>
            )}

            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 dark:text-slate-400 pt-1">
              <div className="flex items-center gap-1.5 font-medium">
                <User className="w-3.5 h-3.5 text-slate-400" />
                <span>
                  Uploaded by <strong className="text-slate-700 dark:text-slate-200">{material.uploader || 'StudiRad Faculty'}</strong>
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>{formatDate(material.createdAt)}</span>
              </div>
            </div>
          </div>

          <StarRatingWidget itemType="material" itemId={material.id} interactive />
        </div>

        {/* Bottom Actions */}
        <div className="p-3.5 sm:p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-[#121824] flex items-center justify-between gap-2.5 shrink-0">
          <button
            type="button"
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
              <button
                type="button"
                onClick={handleDownloadInApp}
                disabled={isDownloading}
                className="py-2.5 px-4 rounded-xl bg-[#002147] hover:bg-[#001733] text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all cursor-pointer active:scale-95"
              >
                <Download className={`w-3.5 h-3.5 ${isDownloading ? 'animate-bounce' : ''}`} />
                <span>{isDownloading ? 'Downloading...' : 'Save File'}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
