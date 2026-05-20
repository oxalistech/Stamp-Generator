import React from 'react';
import { Plus, Trash2, ShieldCheck, Mail, Phone, MapPin, Building2, Globe, FileText, Calendar, DollarSign, Image as ImageIcon } from 'lucide-react';
import { InvoiceData, InvoiceItem } from '../types';

interface InvoiceFormProps {
  data: InvoiceData;
  onChange: (updated: InvoiceData) => void;
}

// Preset vector logos for immediate aesthetic mockups
export const LOGO_PRESETS = [
  {
    name: 'Apex Modern',
    svg: `<svg viewBox="0 0 100 100" class="w-12 h-12 text-blue-600"><polygon points="50,15 85,80 15,80" fill="currentColor" opacity="0.95"/><polygon points="50,45 70,80 30,80" fill="#ffffff"/></svg>`,
    dataUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><polygon points="50,15 85,80 15,80" fill="%231d4ed8" opacity="0.95"/><polygon points="50,45 70,80 30,80" fill="%23ffffff"/></svg>',
  },
  {
    name: 'Prism Tech',
    svg: `<svg viewBox="0 0 100 100" class="w-12 h-12 text-purple-600"><rect x="25" y="25" width="50" height="50" rx="12" fill="currentColor"/><circle cx="50" cy="50" r="16" fill="#ffffff" /><circle cx="50" cy="50" r="8" fill="currentColor" /></svg>`,
    dataUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect x="25" y="25" width="50" height="50" rx="12" fill="%237c3aed"/><circle cx="50" cy="50" r="16" fill="%23ffffff"/><circle cx="50" cy="50" r="8" fill="%237c3aed"/></svg>',
  },
  {
    name: 'Helix Bio',
    svg: `<svg viewBox="0 0 100 100" class="w-12 h-12 text-indigo-600"><circle cx="40" cy="35" r="12" fill="currentColor" opacity="0.6"/><circle cx="60" cy="65" r="12" fill="currentColor" opacity="0.9"/><path d="M40 35 L60 65" stroke="currentColor" stroke-width="6"/></svg>`,
    dataUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="40" cy="35" r="12" fill="%234f46e5" opacity="0.6"/><circle cx="60" cy="65" r="12" fill="%234f46e5" opacity="0.9"/><path d="M40 35 L60 65" stroke="%234f46e5" stroke-width="6"/></svg>',
  },
  {
    name: 'Globe Connect',
    svg: `<svg viewBox="0 0 100 100" class="w-12 h-12 text-slate-700"><circle cx="50" cy="50" r="35" stroke="currentColor" stroke-width="6" fill="none"/><line x1="15" y1="50" x2="85" y2="50" stroke="currentColor" stroke-width="4"/><line x1="50" y1="15" x2="50" y2="85" stroke="currentColor" stroke-width="4"/></svg>`,
    dataUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="35" stroke="%23475569" stroke-width="6" fill="none"/><line x1="15" y1="50" x2="85" y2="50" stroke="%23475569" stroke-width="4"/><line x1="50" y1="15" x2="50" y2="85" stroke="%23475569" stroke-width="4"/></svg>',
  },
];

export const InvoiceForm: React.FC<InvoiceFormProps> = ({ data, onChange }) => {

  const handleCompanyChange = (field: keyof typeof data.company, value: string) => {
    onChange({
      ...data,
      company: { ...data.company, [field]: value },
    });
  };

  const handleClientChange = (field: keyof typeof data.client, value: string) => {
    onChange({
      ...data,
      client: { ...data.client, [field]: value },
    });
  };

  const handleMetaChange = (field: keyof typeof data.meta, value: string) => {
    onChange({
      ...data,
      meta: { ...data.meta, [field]: value },
    });
  };

  const handleItemChange = (index: number, field: keyof InvoiceItem, value: string | number) => {
    const updatedItems = [...data.items];
    updatedItems[index] = {
      ...updatedItems[index],
      [field]: value,
    };
    onChange({ ...data, items: updatedItems });
  };

  const addItem = () => {
    const newItem: InvoiceItem = {
      id: Math.random().toString(36).substr(2, 9),
      description: 'Consulting Services Layer',
      quantity: 1,
      price: 150,
    };
    onChange({
      ...data,
      items: [...data.items, newItem],
    });
  };

  const removeItem = (index: number) => {
    const updatedItems = data.items.filter((_, i) => i !== index);
    onChange({ ...data, items: updatedItems });
  };

  // Extract base64 logo from file uploads
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        const result = uploadEvent.target?.result;
        if (typeof result === 'string') {
          onChange({
            ...data,
            logoUrl: result,
          });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Preset picker helper
  const selectPresetLogo = (dataUrl: string) => {
    onChange({
      ...data,
      logoUrl: dataUrl,
    });
  };

  return (
    <div id="invoice-details-form" className="space-y-6 max-h-[calc(100vh-160px)] overflow-y-auto pr-2 scrollbar-thin">
      
      {/* 1. Header & Logo Selection */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2">
          <Building2 size={15} className="text-indigo-600" />
          Company Profile & Logo
        </h3>

        {/* Logo picker */}
        <div className="space-y-3">
          <label className="block text-xs font-medium text-slate-600">Brand Logo</label>
          <div className="flex flex-wrap items-center gap-4">
            {/* Live current logo frame */}
            <div className="w-16 h-16 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center p-2 relative overflow-hidden shrink-0">
              {data.logoUrl ? (
                <img src={data.logoUrl} alt="Logo Preview" referrerPolicy="no-referrer" className="w-full h-full object-contain" />
              ) : (
                <ImageIcon size={22} className="text-slate-300" />
              )}
              {data.logoUrl && (
                <button
                  onClick={() => onChange({ ...data, logoUrl: undefined })}
                  className="absolute inset-0 bg-red-600/80 text-white flex items-center justify-center text-[10px] opacity-0 hover:opacity-100 transition-opacity font-semibold"
                >
                  Remove
                </button>
              )}
            </div>

            {/* Custom file input */}
            <div className="flex-1 min-w-[150px]">
              <label className="relative flex flex-col items-center justify-center border border-dashed border-slate-300 rounded-lg p-3 text-center cursor-pointer hover:bg-slate-50 transition-colors w-full">
                <span className="text-xs font-semibold text-indigo-600">Upload Logo</span>
                <span className="text-[10px] text-slate-400">PNG or SVG, Max 1MB</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* Preset Logos */}
          <div className="space-y-1.5">
            <span className="text-[10px] text-slate-400 block">Or select an instant design mockup preset:</span>
            <div className="flex items-center gap-3">
              {LOGO_PRESETS.map((preset, idx) => (
                <button
                  key={idx}
                  onClick={() => selectPresetLogo(preset.dataUrl)}
                  className={`p-1.5 rounded-lg border hover:border-indigo-600 transition-all ${
                    data.logoUrl === preset.dataUrl ? 'border-2 border-indigo-600 bg-indigo-50/50' : 'border-slate-200 bg-white'
                  }`}
                  title={preset.name}
                  dangerouslySetInnerHTML={{ __html: preset.svg }}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Inputs */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Company Name</label>
            <input
              type="text"
              value={data.company.name}
              onChange={(e) => handleCompanyChange('name', e.target.value)}
              className="w-full p-2 text-sm border border-slate-200 rounded-md focus:ring-2 focus:ring-indigo-500 outline-none"
              placeholder="e.g. Oxalis Technologies"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Tax ID / VAT No.</label>
            <input
              type="text"
              value={data.company.taxId}
              onChange={(e) => handleCompanyChange('taxId', e.target.value)}
              className="w-full p-2 text-sm border border-slate-200 rounded-md focus:ring-2 focus:ring-indigo-500 outline-none"
              placeholder="e.g. US-9831751"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Email Address</label>
            <input
              type="email"
              value={data.company.email}
              onChange={(e) => handleCompanyChange('email', e.target.value)}
              className="w-full p-2 text-sm border border-slate-200 rounded-md focus:ring-2 focus:ring-indigo-500 outline-none"
              placeholder="billing@company.com"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Phone Number</label>
            <input
              type="text"
              value={data.company.phone}
              onChange={(e) => handleCompanyChange('phone', e.target.value)}
              className="w-full p-2 text-sm border border-slate-200 rounded-md focus:ring-2 focus:ring-indigo-500 outline-none"
              placeholder="+1 (555) 123-4567"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs font-medium text-slate-600 mb-1">Street Address</label>
            <input
              type="text"
              value={data.company.address}
              onChange={(e) => handleCompanyChange('address', e.target.value)}
              className="w-full p-2 text-sm border border-slate-200 rounded-md focus:ring-2 focus:ring-indigo-500 outline-none"
              placeholder="100 Innovation Way, Suite 400, New York, NY 10001"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs font-medium text-slate-600 mb-1">Website URL</label>
            <input
              type="text"
              value={data.company.website}
              onChange={(e) => handleCompanyChange('website', e.target.value)}
              className="w-full p-2 text-sm border border-slate-200 rounded-md focus:ring-2 focus:ring-indigo-500 outline-none"
              placeholder="www.company.com"
            />
          </div>
        </div>
      </div>

      {/* 2. Client Details */}
      {/* 2. Client Details */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2">
          <Mail size={15} className="text-indigo-600" />
          Client Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Client Company / Name</label>
            <input
              type="text"
              value={data.client.name}
              onChange={(e) => handleClientChange('name', e.target.value)}
              className="w-full p-2 text-sm border border-slate-200 rounded-md focus:ring-2 focus:ring-indigo-500 outline-none"
              placeholder="e.g. Acme Corporation"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Email Address</label>
            <input
              type="email"
              value={data.client.email}
              onChange={(e) => handleClientChange('email', e.target.value)}
              className="w-full p-2 text-sm border border-slate-200 rounded-md focus:ring-2 focus:ring-indigo-500 outline-none"
              placeholder="finance@client.com"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Phone Number</label>
            <input
              type="text"
              value={data.client.phone}
              onChange={(e) => handleClientChange('phone', e.target.value)}
              className="w-full p-2 text-sm border border-slate-200 rounded-md focus:ring-2 focus:ring-indigo-500 outline-none"
              placeholder="+1 (555) 765-4321"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs font-medium text-slate-600 mb-1">Client Address</label>
            <input
              type="text"
              value={data.client.address}
              onChange={(e) => handleClientChange('address', e.target.value)}
              className="w-full p-2 text-sm border border-slate-200 rounded-md focus:ring-2 focus:ring-indigo-500 outline-none"
              placeholder="456 Corporate Blvd, Building B, Austin, TX 78701"
            />
          </div>
        </div>
      </div>

      {/* 3. Invoice Metadata */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2">
          <FileText size={15} className="text-indigo-600" />
          Invoice Identification
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Invoice Number</label>
            <input
              type="text"
              value={data.meta.invoiceNumber}
              onChange={(e) => handleMetaChange('invoiceNumber', e.target.value)}
              className="w-full p-2 text-sm border border-slate-200 rounded-md focus:ring-2 focus:ring-indigo-500 outline-none font-mono"
              placeholder="INV-2026-001"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Currency Symbol</label>
            <select
              value={data.meta.currency}
              onChange={(e) => handleMetaChange('currency', e.target.value)}
              className="w-full p-2 text-sm border border-slate-200 rounded-md focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
            >
              <option value="$">$ USD</option>
              <option value="€">€ EUR</option>
              <option value="£">£ GBP</option>
              <option value="¥">¥ JPY</option>
              <option value="CHF">CHF</option>
              <option value="A$">A$ AUD</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">PO / Ref Number</label>
            <input
              type="text"
              value={data.meta.poNumber}
              onChange={(e) => handleMetaChange('poNumber', e.target.value)}
              className="w-full p-2 text-sm border border-slate-200 rounded-md focus:ring-2 focus:ring-indigo-500 outline-none"
              placeholder="PO-87421"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Issue Date</label>
            <input
              type="date"
              value={data.meta.issueDate}
              onChange={(e) => handleMetaChange('issueDate', e.target.value)}
              className="w-full p-2 text-sm border border-slate-200 rounded-md focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Due Date</label>
            <input
              type="date"
              value={data.meta.dueDate}
              onChange={(e) => handleMetaChange('dueDate', e.target.value)}
              className="w-full p-2 text-sm border border-slate-200 rounded-md focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>
        </div>
      </div>

      {/* 4. Line Items Grid */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2">
            <ShieldCheck size={15} className="text-emerald-600" />
            Billing Items List
          </h3>
          <button
            id="invoice-form-add-item-btn"
            onClick={addItem}
            className="px-3 py-1.5 border border-slate-300 rounded-md text-xs font-medium hover:bg-slate-50 text-slate-700 bg-white flex items-center gap-1 cursor-pointer transition-all"
          >
            <Plus size={13} /> Add Item Row
          </button>
        </div>

        <div className="space-y-3">
          {data.items.length === 0 ? (
            <div className="text-center py-6 border border-dashed border-slate-200 rounded-md text-slate-400 text-xs">
              No items added. Click &quot;Add Item Row&quot; above to include invoice rows.
            </div>
          ) : (
            data.items.map((item, index) => (
              <div key={item.id} className="grid grid-cols-12 gap-2 items-end bg-slate-50/50 p-3 rounded-lg border border-slate-200">
                <div className="col-span-12 md:col-span-6">
                  <label className="block text-xs font-medium text-slate-600 mb-1">Description</label>
                  <input
                    type="text"
                    value={item.description}
                    onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                    className="w-full p-2 text-sm border border-slate-200 rounded-md focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                    placeholder="Item details..."
                  />
                </div>
                <div className="col-span-4 md:col-span-2">
                  <label className="block text-xs font-medium text-slate-600 mb-1">Quantity</label>
                  <input
                    type="number"
                    value={item.quantity}
                    onChange={(e) => handleItemChange(index, 'quantity', parseInt(e.target.value) || 0)}
                    className="w-full p-2 text-sm border border-slate-200 rounded-md focus:ring-2 focus:ring-indigo-500 outline-none bg-white font-mono"
                    placeholder="1"
                    min="1"
                  />
                </div>
                <div className="col-span-5 md:col-span-3">
                  <label className="block text-xs font-medium text-slate-600 mb-1">Unit Price ({data.meta.currency})</label>
                  <input
                    type="number"
                    value={item.price}
                    onChange={(e) => handleItemChange(index, 'price', parseFloat(e.target.value) || 0)}
                    className="w-full p-2 text-sm border border-slate-200 rounded-md focus:ring-2 focus:ring-indigo-500 outline-none bg-white font-mono"
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                  />
                </div>
                <div className="col-span-3 md:col-span-1 flex items-center justify-center">
                  <button
                    onClick={() => removeItem(index)}
                    className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                    title="Delete item row"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Financial Adjusters: Tax & Discount */}
        <div className="grid grid-cols-2 gap-4 border-t border-slate-200 pt-4">
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="font-semibold text-slate-600">Tax Rate:</span>
              <span className="font-mono text-slate-800">{data.taxRate}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="35"
              step="0.5"
              value={data.taxRate}
              onChange={(e) => onChange({ ...data, taxRate: parseFloat(e.target.value) })}
              className="w-full h-1 bg-slate-200 rounded appearance-none cursor-pointer accent-indigo-600"
            />
          </div>
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="font-semibold text-slate-600">Discount Rate:</span>
              <span className="font-mono text-slate-800">{data.discountRate}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="50"
              step="0.5"
              value={data.discountRate}
              onChange={(e) => onChange({ ...data, discountRate: parseFloat(e.target.value) })}
              className="w-full h-1 bg-slate-200 rounded appearance-none cursor-pointer accent-rose-500"
            />
          </div>
        </div>
      </div>

      {/* 5. Notes & Terms */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500">Remarks & Financial Conditions</h3>
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Notes / Remarks</label>
            <textarea
              rows={2}
              value={data.notes}
              onChange={(e) => onChange({ ...data, notes: e.target.value })}
              className="w-full p-2 text-sm border border-slate-200 rounded-md focus:ring-2 focus:ring-indigo-500 outline-none"
              placeholder="e.g. Thank you for your business. Please include Invoice # in payment details."
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Terms & Conditions</label>
            <textarea
              rows={2}
              value={data.terms}
              onChange={(e) => onChange({ ...data, terms: e.target.value })}
              className="w-full p-2 text-sm border border-slate-200 rounded-md focus:ring-2 focus:ring-indigo-500 outline-none"
              placeholder="e.g. Payment is due within 30 days. Outstanding balances are subject to a 1.5% late fee."
            />
          </div>
        </div>
      </div>

    </div>
  );
};
