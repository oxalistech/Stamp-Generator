import React, { useRef, useState, useEffect } from 'react';
import { Upload, Download, FileUp, ClipboardCopy, Loader2, AlertTriangle } from 'lucide-react';
import { PDFDocument, degrees } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist';
import { StampSettings, StampPlacement } from '../types';
import { InteractiveStamp } from './InteractiveStamp';

interface PdfStamperProps {
  stampImg: string; // Base64 transparent stamp image from canvas
  settings: StampSettings;
  stampPlacement: StampPlacement;
  onStampPlacementChange: (updated: Partial<StampPlacement>) => void;
  onRemoveStamp: () => void;
  isSelected: boolean;
  onSelectStamp: () => void;
}

// Setup matching CDN worker node for background parsing
try {
  pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://unpkg.com/pdfjs-dist@5.7.284/build/pdf.worker.min.mjs';
} catch (e) {
  console.warn('Could not standardise workerSrc', e);
}

interface PdfPageCardProps {
  pageNumber: number;
  pdfDoc: any;
  stampImg: string;
  stampPlacement: StampPlacement;
  onStampPlacementChange: (updated: Partial<StampPlacement>) => void;
  onRemoveStamp: () => void;
  isSelected: boolean;
  onSelectStamp: () => void;
  pageCanvasesRef: React.RefObject<{ [key: number]: HTMLCanvasElement | null }>;
}

const PdfPageCard: React.FC<PdfPageCardProps> = ({
  pageNumber,
  pdfDoc,
  stampImg,
  stampPlacement,
  onStampPlacementChange,
  onRemoveStamp,
  isSelected,
  onSelectStamp,
  pageCanvasesRef,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [rendering, setRendering] = useState<boolean>(false);
  const [dimensions, setDimensions] = useState<{ width: number; height: number } | null>(null);

  useEffect(() => {
    let active = true;
    const renderPage = async () => {
      if (!pdfDoc || !canvasRef.current) return;
      setRendering(true);

      try {
        const page = await pdfDoc.getPage(pageNumber);
        if (!active) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const scale = 1.35; // optimal clarity zoom
        const viewport = page.getViewport({ scale });

        canvas.width = viewport.width;
        canvas.height = viewport.height;
        setDimensions({ width: viewport.width, height: viewport.height });

        const renderContext = {
          canvasContext: ctx,
          viewport: viewport,
        };

        await page.render(renderContext).promise;
      } catch (err) {
        console.error(`Error rendering page ${pageNumber}:`, err);
      } finally {
        if (active) {
          setRendering(false);
        }
      }
    };

    renderPage();
    return () => {
      active = false;
    };
  }, [pdfDoc, pageNumber]);

  const handlePageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    
    // Get click coordinates relative to the page wrapper container
    const rect = containerRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    // Convert to percentages between 0 and 100
    const pctX = (clickX / rect.width) * 100;
    const pctY = (clickY / rect.height) * 100;

    onStampPlacementChange({
      isActive: true,
      pageNumber,
      x: parseFloat(pctX.toFixed(2)),
      y: parseFloat(pctY.toFixed(2)),
    });
  };

  const isCurrentPage = stampPlacement.isActive && stampPlacement.pageNumber === pageNumber;

  return (
    <div className="flex flex-col items-center w-full mb-6 relative">
      {/* Dynamic Header Badge */}
      <div className="text-xs text-slate-500 font-bold mb-2 flex items-center gap-2 select-none">
        <span className="font-mono bg-slate-200 text-slate-700 px-2.5 py-0.5 rounded-md shadow-xs">
          Page {pageNumber}
        </span>
        {isCurrentPage && (
          <span className="bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-md uppercase font-black text-[9px] tracking-widest animate-pulse border border-indigo-200">
            ★ Clicked Target
          </span>
        )}
      </div>

      <div
        ref={containerRef}
        className={`relative shadow-2xl rounded-lg border max-w-full overflow-hidden select-none cursor-crosshair bg-white p-1 transition-all ${
          isCurrentPage ? 'border-indigo-600 ring-2 ring-indigo-600 ring-offset-4' : 'border-slate-300 hover:border-slate-400'
        }`}
        onClick={handlePageClick}
        style={{
          width: dimensions ? `${dimensions.width / 1.35}px` : 'auto',
          maxWidth: '100%',
        }}
      >
        {rendering && (
          <div className="absolute inset-0 bg-white/70 flex items-center justify-center z-10 transition-opacity">
            <Loader2 size={24} className="animate-spin text-indigo-600" />
          </div>
        )}

        <canvas
          ref={(el) => {
            canvasRef.current = el;
            if (pageCanvasesRef.current) {
              pageCanvasesRef.current[pageNumber] = el;
            }
          }}
          className="w-full h-auto bg-white"
          style={{ display: 'block' }}
        />

        {isCurrentPage && (
          <InteractiveStamp
            stampImg={stampImg}
            placement={stampPlacement}
            onChange={onStampPlacementChange}
            onRemove={onRemoveStamp}
            parentRef={containerRef}
            isSelected={isSelected}
            onSelect={onSelectStamp}
          />
        )}
      </div>
    </div>
  );
};

export const PdfStamper: React.FC<PdfStamperProps> = ({
  stampImg,
  settings,
  stampPlacement,
  onStampPlacementChange,
  onRemoveStamp,
  isSelected,
  onSelectStamp,
}) => {
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfBytes, setPdfBytes] = useState<Uint8Array | null>(null);
  const [numPages, setNumPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [rendering, setRendering] = useState<boolean>(false);
  const [processing, setProcessing] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  const pdfDocRef = useRef<any>(null);
  const pageCanvasesRef = useRef<{ [key: number]: HTMLCanvasElement | null }>({});

  // Trigger file selection
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    loadPdfFile(file);
  };

  const loadPdfFile = async (file: File) => {
    setRendering(true);
    setErrorMsg('');
    setPdfFile(file);

    try {
      const buffer = await file.arrayBuffer();
      const bytes = new Uint8Array(buffer);
      setPdfBytes(bytes);

      const loadingTask = pdfjsLib.getDocument({ data: bytes });
      const doc = await loadingTask.promise;
      pdfDocRef.current = doc;
      setNumPages(doc.numPages);
      setCurrentPage(1);
      
      // Auto-place stamp when PDF loads successfully for first time
      onStampPlacementChange({
        isActive: true,
        pageNumber: 1,
        x: 50,
        y: 50,
        scale: 1.0,
        rotation: -8 // organic angle stamp
      });
    } catch (err: any) {
      console.error('Error loading PDF:', err);
      setErrorMsg('Failed to parse this PDF. Please check that it is not password protected.');
    } finally {
      setRendering(false);
    }
  };

  // Keep target page tracker synced with visual stamp placement page
  useEffect(() => {
    if (stampPlacement.isActive && stampPlacement.pageNumber) {
      setCurrentPage(stampPlacement.pageNumber);
    }
  }, [stampPlacement.isActive, stampPlacement.pageNumber]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type === 'application/pdf') {
      loadPdfFile(file);
    } else {
      setErrorMsg('Please drop a valid .pdf file.');
    }
  };

  const scrollToPage = (pageNum: number) => {
    const el = document.getElementById(`pdf-page-card-${pageNum}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  // Cartesian transformation vector placement logic & PDF merge
  const handleExportStampedPdf = async () => {
    if (!pdfFile || !stampImg) return;
    setProcessing(true);

    try {
      const buffer = await pdfFile.arrayBuffer();
      const currentBytes = new Uint8Array(buffer);
      const pdfLibDoc = await PDFDocument.load(currentBytes);
      const pages = pdfLibDoc.getPages();
      
      // Ensure page target is in range
      const targetPageIndex = Math.min(numPages, Math.max(1, stampPlacement.pageNumber)) - 1;
      const targetPage = pages[targetPageIndex];
      
      // Retrieve original width & height dimensions in standard PostScript points
      const { width: pdfPageW, height: pdfPageH } = targetPage.getSize();

      // Clean prefix if any "data:image/png;base64,"
      const cleanBase64 = stampImg.replace(/^data:image\/png;base64,/, '');
      const stampBytes = Uint8Array.from(atob(cleanBase64), c => c.charCodeAt(0));
      const embeddedStamp = await pdfLibDoc.embedPng(stampBytes);

      // Compute display client width to project precisely onto corresponding PDF dimensions
      const targetCanvas = pageCanvasesRef.current[stampPlacement.pageNumber];
      const previewW = targetCanvas ? targetCanvas.clientWidth : 650;
      
      const stampBaseVisualSize = 135;
      const currentVisualW = stampBaseVisualSize * stampPlacement.scale;
      const stampToPageRatio = currentVisualW / previewW;

      const physicalStampW = pdfPageW * stampToPageRatio;
      const physicalStampH = physicalStampW; // Symmetrical circular/square aspect ratio

      // Translate coordinates (CSS top-left -> PDF bottom-left Cartesian)
      const cx = (stampPlacement.x / 100) * pdfPageW;
      const cy = (1 - (stampPlacement.y / 100)) * pdfPageH;

      // Convert rotation angle (clockwise degrees to counter-clockwise radians)
      const theta = (-stampPlacement.rotation * Math.PI) / 180;

      // Center bottom-left translation math for rotated elements
      const rx = cx + ((-physicalStampW / 2) * Math.cos(theta) + (physicalStampH / 2) * Math.sin(theta));
      const ry = cy + ((-physicalStampW / 2) * Math.sin(theta) - (physicalStampH / 2) * Math.cos(theta));

      // Draw the stamp image
      targetPage.drawImage(embeddedStamp, {
        x: rx,
        y: ry,
        width: physicalStampW,
        height: physicalStampH,
        rotate: degrees(-stampPlacement.rotation), // pdf-lib rotates bottom-left counter-clockwise
      });

      // Save and Download
      const stampedBytes = await pdfLibDoc.save();
      const blob = new Blob([stampedBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `stamped_${pdfFile?.name || 'document.pdf'}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

    } catch (err: any) {
      console.error('Failed to embed validation seal:', err);
      alert('Verification embed failed: ' + err.message);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div id="pdf-stamper-panel" className="space-y-4">
      
      {/* Upload Zone */}
      {!pdfFile ? (
        <div
          id="pdf-drag-drop-zone"
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          className="h-[380px] border-2 border-dashed border-slate-200 hover:border-indigo-500 rounded-2xl flex flex-col items-center justify-center p-6 text-center bg-slate-50 transition-all group"
        >
          <div className="h-14 w-14 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <FileUp size={26} className="text-indigo-600" />
          </div>
          <h4 className="text-sm font-semibold text-slate-700 mb-1">Drag and drop your document here</h4>
          <p className="text-xs text-slate-400 mb-4 max-w-xs">Supports PDF contracts, reports, transcripts or certificates up to 10MB</p>
          
          <label className="text-xs bg-indigo-600 text-white font-semibold px-4 py-2.5 rounded-md cursor-pointer hover:bg-indigo-700 transition-colors">
            Browse files
            <input
              type="file"
              accept=".pdf,application/pdf"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>
          
          {errorMsg && (
            <div className="flex items-center gap-1.5 text-xs text-rose-600 font-semibold mt-4">
              <AlertTriangle size={14} /> {errorMsg}
            </div>
          )}
        </div>
      ) : (
        /* Workspace */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          
          {/* Controls column banner */}
          <div className="col-span-12 lg:col-span-4 space-y-4">
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4 sticky top-20">
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400">Selected File</span>
                <p className="text-xs font-bold text-slate-800 truncate" title={pdfFile.name}>
                  {pdfFile.name}
                </p>
                <p className="text-[10px] text-slate-400 font-mono">
                  {(pdfFile.size / 1024 / 1024).toFixed(3)} MB
                </p>
              </div>

              {/* Page Navigator */}
              <div className="border-t border-slate-200 pt-3 space-y-2">
                <label className="text-xs font-semibold text-slate-600 flex justify-between">
                  <span>Target Page Stamp:</span>
                  <span className="font-mono bg-slate-100 text-slate-800 px-1.5 py-0.5 rounded leading-none text-[10px]">
                    {currentPage} / {numPages}
                  </span>
                </label>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => {
                      const prev = Math.max(1, currentPage - 1);
                      setCurrentPage(prev);
                      onStampPlacementChange({ pageNumber: prev });
                      setTimeout(() => scrollToPage(prev), 50);
                    }}
                    disabled={currentPage === 1}
                    className="flex-1 text-center font-semibold py-1.5 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 rounded-md text-xs disabled:opacity-40 cursor-pointer"
                  >
                    Prev
                  </button>
                  <button
                    onClick={() => {
                      const next = Math.min(numPages, currentPage + 1);
                      setCurrentPage(next);
                      onStampPlacementChange({ pageNumber: next });
                      setTimeout(() => scrollToPage(next), 50);
                    }}
                    disabled={currentPage === numPages}
                    className="flex-1 text-center font-semibold py-1.5 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 rounded-md text-xs disabled:opacity-40 cursor-pointer"
                  >
                    Next
                  </button>
                </div>
              </div>

              {/* File Reselection */}
              <div className="border-t border-slate-200 pt-3 flex items-center justify-between">
                <label className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 hover:underline cursor-pointer">
                  Replace File
                  <input
                    type="file"
                    accept="application/pdf"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
                <button
                  onClick={() => {
                    setPdfFile(null);
                    setPdfBytes(null);
                    setNumPages(0);
                    setCurrentPage(1);
                  }}
                  className="text-xs text-rose-600 hover:underline cursor-pointer font-medium"
                >
                  Clear File
                </button>
              </div>
            </div>

            {/* Downloader Trigger card */}
            <button
              id="pdf-download-stamped-doc-btn"
              onClick={handleExportStampedPdf}
              disabled={processing || rendering}
              style={{ pointerEvents: 'auto' }}
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white font-semibold py-2.5 px-4 rounded-md flex items-center justify-center gap-2 shadow-sm transition-all text-sm cursor-pointer"
            >
              {processing ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  Stamping and Saving...
                </>
              ) : (
                <>
                  <Download size={15} className="stroke-[2.5]" />
                  Save Stamped Document
                </>
              )}
            </button>
            <p className="text-[10px] text-slate-400 italic text-center leading-relaxed px-2">
              * The download will process inside your local browser. No data leaves your machine, prioritizing full corporate document privacy.
            </p>
          </div>

          {/* Core visual Interactive work canvas */}
          <div className="col-span-12 lg:col-span-8 flex flex-col items-center">
            
            {/* Scrollable multi-page document container */}
            <div 
              id="pdf-pages-scroll-container"
              className="w-full max-h-[75vh] overflow-y-auto p-4 bg-slate-150 border border-slate-300 rounded-xl space-y-6 flex flex-col items-center shadow-inner relative scrollbar-thin select-none"
              style={{ minHeight: '520px' }}
            >
              {rendering && numPages === 0 && (
                <div className="absolute z-10 p-4 bg-white/90 border rounded-lg flex items-center gap-2 shadow-md">
                  <Loader2 size={16} className="animate-spin text-indigo-600" />
                  <span className="text-xs font-semibold text-slate-600">Initializing document pages...</span>
                </div>
              )}

              {Array.from({ length: numPages }).map((_, i) => {
                const pageNum = i + 1;
                return (
                  <div key={pageNum} id={`pdf-page-card-${pageNum}`} className="w-full flex justify-center">
                    <PdfPageCard
                      pageNumber={pageNum}
                      pdfDoc={pdfDocRef.current}
                      stampImg={stampImg}
                      stampPlacement={stampPlacement}
                      onStampPlacementChange={onStampPlacementChange}
                      onRemoveStamp={onRemoveStamp}
                      isSelected={isSelected}
                      onSelectStamp={onSelectStamp}
                      pageCanvasesRef={pageCanvasesRef}
                    />
                  </div>
                );
              })}
            </div>

            <div className="text-center mt-3 text-xs text-slate-500 font-medium select-none flex items-center justify-center gap-1.5 bg-white py-2 px-4 rounded-lg border border-slate-200 shadow-xs max-w-lg">
              <ClipboardCopy size={13} className="text-indigo-500 shrink-0" />
              <span>Click on any page to target & place stamp. Use handles on the stamp to drag, resize, or rotate!</span>
            </div>
          </div>

        </div>
      )}

    </div>
  );
};
