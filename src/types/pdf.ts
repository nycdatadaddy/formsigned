export interface PDFFormField {
  id: string;
  type: 'signature' | 'initial' | 'checkbox' | 'date' | 'text';
  x: number;
  y: number;
  width: number;
  height: number;
  page: number;
  required: boolean;
  label?: string;
  value?: string | boolean;
  completed?: boolean;
}

export interface PDFAnnotation {
  id: string;
  contractId: string;
  fields: PDFFormField[];
  createdAt: string;
  updatedAt: string;
}

export interface SignatureData {
  signatureImage: string;
  initialImage?: string;
  signedAt: string;
  ipAddress?: string;
}