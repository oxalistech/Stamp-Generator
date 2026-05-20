import React, { useRef } from 'react';
import { Mail, Phone, MapPin, Globe, Award } from 'lucide-react';
import { InvoiceData, StampPlacement } from '../types';
import { InteractiveStamp } from './InteractiveStamp';

interface InvoicePreviewProps {
  data: InvoiceData;
  stampImg: string; // Dynamic Canvas PNG base64
  stampPlacement: StampPlacement;
  onStampPlacementChange: (updated: Partial<StampPlacement>) => void;
  onRemoveStamp: () => void;
  isSelected: boolean;
  onSelectStamp: () => void;
}

export const InvoicePreview: React.FC<InvoicePreviewProps> = ({
  data,
  stampImg,
  stampPlacement,
  onStampPlacementChange,
  onRemoveStamp,
  isSelected,
  onSelectStamp,
}) => {
  const pageRef = useRef<HTMLDivElement>(null);

  // Math totals calculation
  const subtotal = data.items.reduce((sum, item) => sum + item.quantity * item.price, 0);
  const discountVal = subtotal * (data.discountRate / 100);
  const taxableBasis = subtotal - discountVal;
  const taxVal = taxableBasis * (data.taxRate / 100);
  const grandTotal = taxableBasis + taxVal;

  return (
    <div className="flex justify-center p-1 md:p-3 bg-slate-100/30 rounded-2xl border border-slate-200/55 min-h-[750px] relative overflow-hidden select-none">
      {/* Outer sizing guide (matches standard aspect-ratio: [1 / 1.414] A4 portrait in design layout) */}
      <div
        ref={pageRef}
        id="print-invoice-a4-sheet"
        className="w-full max-w-[760px] min-h-[960px] bg-white text-slate-800 shadow-2xl rounded-lg p-9 relative flex flex-col justify-between border border-slate-200 select-none"
        style={{
          boxSizing: 'border-box',
          fontFamily: '"Inter", sans-serif',
        }}
        onClick={() => {
          // Deselect stamp if user clicks background blank area
          onStampPlacementChange({ isActive: stampPlacement.isActive }); // just a dummy to register trigger state on parent
        }}
      >
        
        {/* TOP META BRAND HEADERS */}
        <div>
          <div className="flex justify-between items-start border-b border-slate-100 pb-7">
            {/* Left Brand details */}
            <div className="space-y-3.5">
              {data.logoUrl ? (
                <div className="h-14 max-w-[200px] flex items-center justify-start">
                  <img
                    src={data.logoUrl}
                    alt="Corporate Brand Logo"
                    referrerPolicy="no-referrer"
                    className="h-full object-contain"
                  />
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <div className="h-10 w-10 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-lg shadow-sm">
                    {data.company.name ? data.company.name.slice(0, 2).toUpperCase() : 'CO'}
                  </div>
                  <span className="text-lg font-extrabold tracking-tight text-slate-900">
                    {data.company.name || 'Your Company'}
                  </span>
                </div>
              )}

              <div className="space-y-1 text-xs text-slate-500">
                <p className="font-bold text-slate-800 text-sm">{data.company.name || 'Primary Company Ltd.'}</p>
                {data.company.address && (
                  <p className="flex items-center gap-1.5 leading-tight max-w-[280px]">
                    <MapPin size={11} className="shrink-0 text-slate-400" />
                    {data.company.address}
                  </p>
                )}
                {data.company.phone && (
                  <p className="flex items-center gap-1.5">
                    <Phone size={11} className="shrink-0 text-slate-400" />
                    {data.company.phone}
                  </p>
                )}
                {data.company.email && (
                  <p className="flex items-center gap-1.5">
                    <Mail size={11} className="shrink-0 text-slate-400" />
                    {data.company.email}
                  </p>
                )}
                {data.company.website && (
                  <p className="flex items-center gap-1.5">
                    <Globe size={11} className="shrink-0 text-slate-400" />
                    {data.company.website}
                  </p>
                )}
                {data.company.taxId && (
                  <p className="text-[10px] uppercase tracking-wider font-mono bg-slate-50 border border-slate-100 px-1.5 py-0.5 rounded inline-block">
                    Tax ID: {data.company.taxId}
                  </p>
                )}
              </div>
            </div>

            {/* Right Meta document info */}
            <div className="text-right space-y-2">
              <span className="inline-block bg-indigo-50 text-indigo-700 font-extrabold text-[10px] tracking-widest uppercase px-3 py-1 rounded-md border border-indigo-100">
                Commercial Invoice
              </span>
              <h1 className="text-3xl font-extrabold text-slate-900 font-mono tracking-tighter mt-1">
                #{data.meta.invoiceNumber || 'INV-2026-001'}
              </h1>
              
              <div className="space-y-1.5 text-xs text-slate-500 pt-2 grid grid-cols-1 justify-items-end">
                <div className="flex gap-2">
                  <span className="text-slate-400">Issue Date:</span>
                  <span className="font-semibold text-slate-700">{data.meta.issueDate || '2026-05-20'}</span>
                </div>
                <div className="flex gap-2">
                  <span className="text-slate-400">Due Date:</span>
                  <span className="font-semibold text-rose-600">{data.meta.dueDate || '2026-06-20'}</span>
                </div>
                {data.meta.poNumber && (
                  <div className="flex gap-2 bg-slate-50 px-2 py-0.5 rounded border border-slate-150">
                    <span className="text-slate-400 font-mono text-[10px]">Reference PO:</span>
                    <span className="font-mono font-bold text-slate-700 text-[10px]">{data.meta.poNumber}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* BILL TO ROW */}
          <div className="grid grid-cols-12 gap-6 py-6 border-b border-slate-100">
            <div className="col-span-12">
              <span className="text-[10px] font-bold tracking-widest text-slate-400 uppercase block mb-1.5">
                Client Bill To
              </span>
              <div className="space-y-1">
                <h4 className="font-extrabold text-slate-900 text-base">
                  {data.client.name || 'Acme Client Corporation'}
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1 text-xs text-slate-500 pt-0.5">
                  {data.client.address && (
                    <p className="flex items-center gap-1.5 leading-tight">
                      <MapPin size={11} className="shrink-0 text-slate-400" />
                      {data.client.address}
                    </p>
                  )}
                  {data.client.email && (
                    <p className="flex items-center gap-1.5">
                      <Mail size={11} className="shrink-0 text-slate-400" />
                      {data.client.email}
                    </p>
                  )}
                  {data.client.phone && (
                    <p className="flex items-center gap-1.5">
                      <Phone size={11} className="shrink-0 text-slate-400" />
                      {data.client.phone}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* BILLING ITEMS TABLE */}
          <div className="pt-6">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b-2 border-slate-200 text-slate-400 text-[10px] font-bold tracking-widest uppercase">
                  <th className="py-2.5">Item Description</th>
                  <th className="py-2.5 text-center w-20">Qty</th>
                  <th className="py-2.5 text-right w-28">Unit Price</th>
                  <th className="py-2.5 text-right w-32">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {data.items.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-12 text-center text-slate-400 italic">
                      No billing items registered for this document. Use the sidebar to append items.
                    </td>
                  </tr>
                ) : (
                  data.items.map((item, idx) => (
                    <tr key={item.id || idx} className="hover:bg-slate-50/50">
                      <td className="py-3 font-medium text-slate-800 pr-4">
                        {item.description || 'Consulting Services'}
                      </td>
                      <td className="py-3 text-center font-mono text-slate-600">
                        {item.quantity}
                      </td>
                      <td className="py-3 text-right font-mono text-slate-600">
                        {data.meta.currency}{parseFloat(item.price.toFixed(2)).toLocaleString()}
                      </td>
                      <td className="py-3 text-right font-mono font-bold text-slate-900">
                        {data.meta.currency}
                        {parseFloat((item.quantity * item.price).toFixed(2)).toLocaleString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* BOTTOM TOTALS & REMARKS */}
        <div>
          <div className="grid grid-cols-12 gap-8 border-t border-slate-200 pt-5 mt-6">
            {/* Notes & Remarks Left Panel */}
            <div className="col-span-12 md:col-span-7 space-y-4">
              {data.notes && (
                <div>
                  <h5 className="text-[10px] font-bold text-slate-400 tracking-wider uppercase mb-1">
                    Invoice Notes
                  </h5>
                  <p className="text-xs text-slate-500 leading-relaxed whitespace-pre-line bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    {data.notes}
                  </p>
                </div>
              )}
              {data.terms && (
                <div>
                  <h5 className="text-[10px] font-bold text-slate-400 tracking-wider uppercase mb-1">
                    Terms & Conditions
                  </h5>
                  <p className="text-[10px] text-slate-400 leading-relaxed whitespace-pre-line pl-0.5">
                    {data.terms}
                  </p>
                </div>
              )}
            </div>

            {/* Calculations Balance Sheet Right Panel */}
            <div className="col-span-12 md:col-span-5 pt-1.5">
              <div className="space-y-2 text-xs text-slate-600">
                <div className="flex justify-between">
                  <span className="text-slate-400">Subtotal:</span>
                  <span className="font-mono font-semibold">
                    {data.meta.currency}{parseFloat(subtotal.toFixed(2)).toLocaleString()}
                  </span>
                </div>

                {data.discountRate > 0 && (
                  <div className="flex justify-between text-rose-600 bg-rose-50/50 p-1 rounded px-1.5">
                    <span>Discount ({data.discountRate}%):</span>
                    <span className="font-mono font-semibold">
                      -{data.meta.currency}{parseFloat(discountVal.toFixed(2)).toLocaleString()}
                    </span>
                  </div>
                )}

                {data.taxRate > 0 && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">VAT / Tax ({data.taxRate}%):</span>
                    <span className="font-mono font-semibold">
                      +{data.meta.currency}{parseFloat(taxVal.toFixed(2)).toLocaleString()}
                    </span>
                  </div>
                )}

                <div className="h-px bg-slate-200 my-2" />

                <div className="flex justify-between items-center bg-slate-900 text-white rounded-lg p-3 shadow-md">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-300">Total Due:</span>
                  <span className="font-mono text-base font-black">
                    {data.meta.currency}{parseFloat(grandTotal.toFixed(2)).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Footer signature line */}
          <div className="flex justify-between items-end border-t border-slate-100 pt-7 mt-8 text-[11px] text-slate-400">
            <div className="flex items-center gap-1.5">
              <Award size={13} className="text-indigo-600" />
              <span>Electronically authorized official documents</span>
            </div>
            <div className="text-right">
              <div className="w-32 h-px bg-slate-200 mb-1" />
              <span>Authorized Signature</span>
            </div>
          </div>
        </div>

        {/* DRAGGABLE CUSTOM STAMP INSTANCE ON INVOICE */}
        {stampPlacement.isActive && (
          <InteractiveStamp
            stampImg={stampImg}
            placement={stampPlacement}
            onChange={onStampPlacementChange}
            onRemove={onRemoveStamp}
            parentRef={pageRef}
            isSelected={isSelected}
            onSelect={onSelectStamp}
          />
        )}

      </div>
    </div>
  );
};
