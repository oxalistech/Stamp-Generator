import React, { useState, useEffect } from 'react';
import { 
  Upload, 
  Sparkles, 
  RefreshCcw, 
  Sliders,
  ShieldCheck
} from 'lucide-react';

import { StampSettings, StampPlacement, StampStyle, StampPresetColor } from './types';
import { StampCanvas, STAMP_COLORS } from './components/StampCanvas';
import { PdfStamper } from './components/PdfStamper';

// Pre-define default date ranges
const getTodayDateString = () => {
  const today = new Date();
  return today.toISOString().split('T')[0];
};

const getTodayStampDateString = () => {
  const today = new Date();
  const day = String(today.getDate()).padStart(2, '0');
  const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
  const month = months[today.getMonth()];
  const year = today.getFullYear();
  return `${day} ${month} ${year}`;
};

// Initial Stamp variables matching realistic defaults
const INITIAL_STAMP: StampSettings = {
  style: 'oval',
  colorPreset: 'blue',
  customColor: '#1d4ed8',
  textTop: 'ACME ENTERPRISES LTD',
  textCenter1: getTodayStampDateString(),
  textCenter2: 'Sign:...................',
  textCenter3: '',
  textBottom: 'contact@acme-enterprises.com',
  grungeIntensity: 45, // default to highly realistic grunge immediately
  opacity: 0.88,
  size: 260,
  borderWidth: 7.5,
  inkBleed: 2.5,
};

// Target presets for quick-applying structured stamp metadata
interface QuickStampPreset {
  name: string;
  style: StampStyle;
  colorPreset: StampPresetColor;
  textTop: string;
  textBottom: string;
  textCenter1: string;
  textCenter2: string;
  textCenter3: string;
}

const STAMP_PRESETS: QuickStampPreset[] = [
  {
    name: 'Official Oval Seal (Blue)',
    style: 'oval',
    colorPreset: 'blue',
    textTop: 'ACME ENTERPRISES LTD',
    textBottom: 'contact@acme-enterprises.com',
    textCenter1: getTodayStampDateString(),
    textCenter2: 'Sign:...................',
    textCenter3: '',
  },
  {
    name: 'Community Bursary Fund (Blue)',
    style: 'square',
    colorPreset: 'blue',
    textTop: 'METROPOLIS EDUCATION TRUSTEES',
    textBottom: '',
    textCenter1: 'CENTRAL BURSARY BOARD',
    textCenter2: 'P. O. BOX 100, METROPOLIS',
    textCenter3: 'Date............. Sign.............',
  },
  {
    name: 'Corporate Seals (Navy)',
    style: 'square',
    colorPreset: 'navy',
    textTop: 'GLOBAL LOGISTICS SYSTEMS',
    textBottom: 'SIGN: .......................................',
    textCenter1: '888 COMMERCE BLVD, SECTOR 7',
    textCenter2: 'PHONE: +1 (555) 099-1234',
    textCenter3: 'DATE: .......................................',
  },
];

export default function App() {
  const [stampSettings, setStampSettings] = useState<StampSettings>(INITIAL_STAMP);
  const [stampImg, setStampImg] = useState<string>(''); // Base64 dataURL from the StampCanvas drawer
  const [stampPlacement, setStampPlacement] = useState<StampPlacement>({
    x: 50,
    y: 50,
    scale: 1.0,
    rotation: -8,
    isActive: true,
    pageNumber: 1,
  });
  
  // Highlighting selection states for interactive moves
  const [isStampSelected, setIsStampSelected] = useState<boolean>(true);

  // Auto update stamp's date lines if current time shifts
  useEffect(() => {
    // Keep date synchronized
    setStampSettings(prev => ({
      ...prev,
      textCenter2: prev.textCenter2 === '2026-05-20' ? getTodayDateString() : prev.textCenter2
    }));
  }, []);

  // Preset dispatcher helper
  const applyPreset = (preset: QuickStampPreset) => {
    setStampSettings(prev => ({
      ...prev,
      style: preset.style,
      colorPreset: preset.colorPreset,
      textTop: preset.textTop,
      textBottom: preset.textBottom,
      textCenter1: preset.textCenter1,
      textCenter2: preset.textCenter2,
      textCenter3: preset.textCenter3,
    }));
    // Re-active stamp on document
    setStampPlacement(prev => ({ ...prev, isActive: true }));
    setIsStampSelected(true);
  };

  const handleStampPlacementChange = (updated: Partial<StampPlacement>) => {
    setStampPlacement(prev => ({ ...prev, ...updated }));
    // Automatically select the stamp on drag or movement triggers
    setIsStampSelected(true);
  };

  const removeStampInstance = () => {
    setStampPlacement(prev => ({ ...prev, isActive: false }));
    setIsStampSelected(false);
  };

  const addStampInstance = () => {
    setStampPlacement(prev => ({
      ...prev,
      isActive: true,
      x: 50,
      y: 50,
      scale: 1.0,
      rotation: -8,
    }));
    setIsStampSelected(true);
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-950 flex flex-col font-sans" id="main-application-window">
      
      {/* 1. TOP MAIN HEADER */}
      <header className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-6 shrink-0 sticky top-0 z-50 transition-all select-none">
        <div className="max-w-7xl w-full mx-auto flex items-center justify-between gap-4">
          
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-indigo-600 rounded flex items-center justify-center shadow-xs">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <h1 className="font-bold text-lg tracking-tight text-slate-900">
              StampGen <span className="text-slate-400 font-normal">Official PDF Stamper</span>
            </h1>
          </div>

        </div>
      </header>

      {/* 2. CORE WORKSPACE GRID */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 lg:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* ================= COLUMN A: STAMP CUSTOMIZATION EDITOR (PERSISTENT SIDEBAR) ================= */}
        <section className="col-span-12 lg:col-span-4 space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-5 sticky top-20">
            
            {/* Sidebar title */}
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h2 className="text-xs font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2">
                <Sliders size={15} className="text-indigo-600" />
                Stamp Design Controls
              </h2>
              <span className="bg-emerald-50 text-emerald-700 text-[9px] uppercase font-mono px-2 py-0.5 rounded-full border border-emerald-200 font-bold">
                Dynamic Preview
              </span>
            </div>

            {/* LIVE STAMP PREVIEW ELEMENT */}
            <div className="bg-slate-50 border border-slate-150 rounded-xl p-4 flex flex-col items-center justify-center relative">
              <StampCanvas
                settings={stampSettings}
                onDataUrlGenerated={setStampImg}
                className="w-full"
              />
              <span className="text-[10px] text-slate-400 font-mono mt-2 uppercase tracking-wide">
                Live Physical Ink Projection
              </span>

              {/* Reset defaults button */}
              <button
                onClick={() => setStampSettings(INITIAL_STAMP)}
                className="absolute top-3 right-3 p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-colors"
                title="Reset stamp attributes to default"
              >
                <RefreshCcw size={13} />
              </button>
            </div>

            {/* PRESETS LIST */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-500 flex items-center gap-1">
                <Sparkles size={12} className="text-amber-500" />
                Quick Stamp Presets:
              </label>
              <div className="grid grid-cols-2 gap-2">
                {STAMP_PRESETS.map((preset, index) => (
                  <button
                    key={index}
                    onClick={() => applyPreset(preset)}
                    className="text-left p-1.5 border border-slate-200 rounded-lg bg-slate-50 text-[10px] hover:border-indigo-500 font-medium hover:bg-indigo-50/10 transition-all truncate animate-fade-in"
                    title={preset.name}
                  >
                    {preset.name}
                  </button>
                ))}
              </div>
            </div>

            {/* FORM CONTROLS */}
            <div className="space-y-4 max-h-[calc(100vh-420px)] overflow-y-auto pr-1.5 scrollbar-thin">
              
              {/* Style Selection */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-600 block">Stamp Boundary Shape:</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    id="stamp-style-round-btn"
                    onClick={() => setStampSettings({ ...stampSettings, style: 'round' })}
                    className={`p-2 border rounded-md text-xs font-semibold flex flex-col items-center justify-center gap-1.5 transition-all ${
                      stampSettings.style === 'round'
                        ? 'border-2 border-indigo-600 bg-white text-indigo-700'
                        : 'border-slate-200 text-slate-400 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <div className={`w-3.5 h-3.5 rounded-full border ${stampSettings.style === 'round' ? 'border-indigo-600 border-2' : 'border-slate-400'}`}></div>
                    ROUND
                  </button>
                  <button
                    id="stamp-style-oval-btn"
                    onClick={() => setStampSettings({ ...stampSettings, style: 'oval' })}
                    className={`p-2 border rounded-md text-xs font-semibold flex flex-col items-center justify-center gap-1.5 transition-all ${
                      stampSettings.style === 'oval'
                        ? 'border-2 border-indigo-600 bg-white text-indigo-700'
                        : 'border-slate-200 text-slate-400 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <div className={`w-5 h-3.5 rounded-full border ${stampSettings.style === 'oval' ? 'border-indigo-600 border-2' : 'border-slate-400'}`} style={{ borderRadius: '50% / 40%' }}></div>
                    OVAL
                  </button>
                  <button
                    id="stamp-style-square-btn"
                    onClick={() => setStampSettings({ ...stampSettings, style: 'square' })}
                    className={`p-2 border rounded-md text-xs font-semibold flex flex-col items-center justify-center gap-1.5 transition-all ${
                      stampSettings.style === 'square'
                        ? 'border-2 border-indigo-600 bg-white text-indigo-700'
                        : 'border-slate-200 text-slate-400 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <div className={`w-3.5 h-3.5 rounded-sm border ${stampSettings.style === 'square' ? 'border-indigo-600 border-2' : 'border-slate-400'}`}></div>
                    SQUARE
                  </button>
                </div>
              </div>

              {/* Colors */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-600 block">Stamp Ink Palette color:</label>
                <div className="flex items-center gap-3">
                  {(Object.keys(STAMP_COLORS) as Array<keyof typeof STAMP_COLORS>).map((presetKey) => (
                    <button
                      key={presetKey}
                      onClick={() => setStampSettings({ ...stampSettings, colorPreset: presetKey })}
                      className={`w-8 h-8 rounded-full transition-transform hover:scale-105 relative ${
                        stampSettings.colorPreset === presetKey ? 'ring-2 ring-offset-2 ring-indigo-600' : 'ring-1 ring-slate-200'
                      }`}
                      style={{ backgroundColor: STAMP_COLORS[presetKey] }}
                      title={`Select ${presetKey} official ink`}
                    >
                      {stampSettings.colorPreset === presetKey && (
                        <div className="absolute inset-0 flex items-center justify-center text-white text-[10px]">
                          ✓
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Text Rows customizable */}
              <div className="space-y-3 pt-1 border-t border-slate-100">
                <span className="text-[10px] uppercase font-bold text-slate-400">Custom Stamp Wording</span>
                
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {(stampSettings.style === 'round' || stampSettings.style === 'oval') ? 'Outer Curved Top Text' : 'Line 1: Main Title / Committee / Company'}
                  </label>
                  <input
                    type="text"
                    value={stampSettings.textTop}
                    onChange={(e) => setStampSettings({ ...stampSettings, textTop: e.target.value })}
                    className="w-full p-2 text-sm border border-slate-200 rounded-md focus:ring-2 focus:ring-indigo-500 outline-none bg-white font-medium"
                    placeholder="e.g. ACME ENTERPRISES LTD"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {(stampSettings.style === 'round' || stampSettings.style === 'oval') ? 'Center Headline R1' : 'Line 2: Subtitle / Department / Ward'}
                  </label>
                  <input
                    type="text"
                    value={stampSettings.textCenter1}
                    onChange={(e) => setStampSettings({ ...stampSettings, textCenter1: e.target.value })}
                    className="w-full p-2 text-sm border border-slate-200 rounded-md focus:ring-2 focus:ring-indigo-500 outline-none bg-white font-medium"
                    placeholder="e.g. CENTRAL BURSARY BOARD"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {(stampSettings.style === 'round' || stampSettings.style === 'oval') ? 'Center Subline R2' : 'Line 3: Address / Phone / P.O. Box'}
                  </label>
                  <input
                    type="text"
                    value={stampSettings.textCenter2}
                    onChange={(e) => setStampSettings({ ...stampSettings, textCenter2: e.target.value })}
                    className="w-full p-2 text-sm border border-slate-200 rounded-md focus:ring-2 focus:ring-indigo-500 outline-none bg-white font-medium"
                    placeholder="e.g. P. O. BOX 100, METROPOLIS"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {(stampSettings.style === 'round' || stampSettings.style === 'oval') ? 'Center Subline R3' : 'Line 4: Dates / Action Guidelines'}
                  </label>
                  <input
                    type="text"
                    value={stampSettings.textCenter3}
                    onChange={(e) => setStampSettings({ ...stampSettings, textCenter3: e.target.value })}
                    className="w-full p-2 text-sm border border-slate-200 rounded-md focus:ring-2 focus:ring-indigo-500 outline-none bg-white font-medium"
                    placeholder="e.g. Date........................... Sign..........................."
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {(stampSettings.style === 'round' || stampSettings.style === 'oval') ? 'Outer Curved Bottom Text' : 'Line 5: Optional Signature Line'}
                  </label>
                  <input
                    type="text"
                    value={stampSettings.textBottom}
                    onChange={(e) => setStampSettings({ ...stampSettings, textBottom: e.target.value })}
                    className="w-full p-2 text-sm border border-slate-200 rounded-md focus:ring-2 focus:ring-indigo-500 outline-none bg-white font-medium"
                    placeholder="e.g. contact@acme-enterprises.com"
                  />
                </div>
              </div>

              {/* Hardening Details Sliders */}
              <div className="space-y-4 pt-4 border-t border-slate-100">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Realism & Ink Hardening</span>

                {/* Ink Distress/Grunge */}
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-600 font-medium">Ink Distress (Aged Grunge):</span>
                    <span className="font-mono font-semibold">{stampSettings.grungeIntensity}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="90"
                    value={stampSettings.grungeIntensity}
                    onChange={(e) => setStampSettings({ ...stampSettings, grungeIntensity: parseInt(e.target.value) })}
                    className="w-full h-1 bg-slate-150 rounded appearance-none cursor-pointer accent-indigo-600"
                  />
                </div>

                {/* Ink Bleed */}
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-600 font-medium">Ink Spread / Bleed:</span>
                    <span className="font-mono font-semibold">{stampSettings.inkBleed}</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="5.0"
                    step="0.5"
                    value={stampSettings.inkBleed}
                    onChange={(e) => setStampSettings({ ...stampSettings, inkBleed: parseFloat(e.target.value) })}
                    className="w-full h-1 bg-slate-150 rounded appearance-none cursor-pointer accent-indigo-600"
                  />
                </div>

                {/* Stamp Outer Border Width */}
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-600 font-medium">Border Outer Density:</span>
                    <span className="font-mono font-semibold">{stampSettings.borderWidth}px</span>
                  </div>
                  <input
                    type="range"
                    min="3"
                    max="14"
                    step="0.5"
                    value={stampSettings.borderWidth}
                    onChange={(e) => setStampSettings({ ...stampSettings, borderWidth: parseFloat(e.target.value) })}
                    className="w-full h-1 bg-slate-150 rounded appearance-none cursor-pointer accent-indigo-600"
                  />
                </div>

                {/* Stamp Opacity */}
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-600 font-medium">Ink Wetness (Opacity):</span>
                    <span className="font-mono font-semibold">{(stampSettings.opacity * 100).toFixed(0)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0.25"
                    max="1.0"
                    step="0.05"
                    value={stampSettings.opacity}
                    onChange={(e) => setStampSettings({ ...stampSettings, opacity: parseFloat(e.target.value) })}
                    className="w-full h-1 bg-slate-150 rounded appearance-none cursor-pointer accent-indigo-600"
                  />
                </div>
              </div>

              {/* Document Stamp Overlay Button State */}
              <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
                {stampPlacement.isActive ? (
                  <button
                    onClick={removeStampInstance}
                    className="w-full py-1.5 border border-slate-300 rounded-md text-sm font-medium hover:bg-slate-50 text-slate-700 bg-white"
                  >
                    Hide Overlay Stamp
                  </button>
                ) : (
                  <button
                    onClick={addStampInstance}
                    className="w-full py-2 bg-indigo-600 text-white rounded-md text-sm font-semibold shadow-sm hover:bg-indigo-700 transition-all select-none"
                  >
                    ✦ Place Active Stamp on Document ✦
                  </button>
                )}
              </div>

            </div>

          </div>
        </section>

        {/* ================= COLUMN B: WORKSPACE (PDF WORKBENCH ONLY) ================= */}
        <section className="col-span-12 lg:col-span-8 space-y-6">
          
          <div className="space-y-6">
            
            {/* Document general context header */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-wrap gap-4 items-center justify-between shadow-xs select-none">
              <div>
                <h3 className="text-sm font-extrabold text-slate-800 flex items-center gap-1.5 animate-fade-in">
                  <Upload size={16} className="text-indigo-600" />
                  PDF Document Stamp Burner
                </h3>
                <p className="text-[10px] text-slate-400">Load local PDF files or certificates, drag the customized wet stamp onto any page, and burn it into the final PDF document</p>
              </div>
            </div>

            {/* Central canvas renderer panel */}
            <div className="bg-slate-200/40 p-1 md:p-4 rounded-2xl border border-slate-200/55 min-h-[500px] flex items-center justify-center relative">
              <div className="w-full">
                <PdfStamper
                  stampImg={stampImg}
                  settings={stampSettings}
                  stampPlacement={stampPlacement}
                  onStampPlacementChange={handleStampPlacementChange}
                  onRemoveStamp={removeStampInstance}
                  isSelected={isStampSelected}
                  onSelectStamp={() => setIsStampSelected(true)}
                />
              </div>
            </div>

          </div>

        </section>

      </main>

    </div>
  );
}
