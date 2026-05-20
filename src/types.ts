export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  price: number;
}

export interface CompanyDetails {
  name: string;
  address: string;
  email: string;
  phone: string;
  website: string;
  taxId: string;
}

export interface ClientDetails {
  name: string;
  address: string;
  email: string;
  phone: string;
}

export interface InvoiceMeta {
  invoiceNumber: string;
  issueDate: string;
  dueDate: string;
  currency: string;
  poNumber: string;
}

export interface InvoiceData {
  logoUrl?: string;
  company: CompanyDetails;
  client: ClientDetails;
  meta: InvoiceMeta;
  items: InvoiceItem[];
  taxRate: number;      // percentage
  discountRate: number; // percentage
  notes: string;
  terms: string;
}

export type StampStyle = 'round' | 'square' | 'oval';
export type StampPresetColor = 'purple' | 'blue' | 'navy' | 'violet' | 'red' | 'green';

export interface StampSettings {
  style: StampStyle;
  colorPreset: StampPresetColor;
  customColor: string;
  textTop: string;       // e.g. "OXALIS TECHNOLOGIES INC."
  textBottom: string;    // e.g. "★ DEPT OF FINANCE ★"
  textCenter1: string;   // e.g. "APPROVED"
  textCenter2: string;   // e.g. "DATE: 2026-05-20"
  textCenter3: string;   // e.g. "OFFICIAL SEAL"
  grungeIntensity: number; // 0 (crisp) to 100 (heavily distressed)
  opacity: number;       // 0 to 1
  size: number;          // in pixels for base, scaled visually later
  borderWidth: number;   // thickness of outer border
  inkBleed: number;      // ink spread effect
}

export interface StampPlacement {
  x: number;             // X percentage on page (0 - 100)
  y: number;             // Y percentage on page (0 - 100)
  scale: number;         // visual size multiplier
  rotation: number;      // rotation angle in degrees
  isActive: boolean;
  pageNumber: number;    // 1-indexed page where stamp is placed for PDFs
}
