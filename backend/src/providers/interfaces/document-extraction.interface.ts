export interface ExtractedLineItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface ExtractedDocumentData {
  documentType: string;
  vendorName: string;
  invoiceNumber: string;
  referenceNumber: string;
  date: string; // ISO date string
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  currency: string;
  confidence: number;
  lineItems: ExtractedLineItem[];
  metadata: Record<string, any>;
}

export interface IDocumentExtractionProvider {
  extractDocumentData(filePath: string, originalFileName: string, documentType: string): Promise<ExtractedDocumentData>;
}
