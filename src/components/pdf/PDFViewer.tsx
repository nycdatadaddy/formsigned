import React, { useState, useRef, useEffect } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { PDFFormField } from '../../types/pdf';
import { PDFAnnotationLayer } from './PDFAnnotationLayer';
import { ZoomIn, ZoomOut, RotateCw, Download } from 'lucide-react';

// Set up PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

interface PDFViewerProps {
  fileUrl: string;
  fields?: PDFFormField[];
  onFieldUpdate?: (fieldId: string, value: any) => void;
  isEditable?: boolean;
  showAnnotations?: boolean;
}

export function PDFViewer({ 
  fileUrl, 
  fields = [], 
  onFieldUpdate, 
  isEditable = false,
  showAnnotations = true 
}: PDFViewerProps) {
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.0);
  const [rotation, setRotation] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setLoading(false);
  };

  const onDocumentLoadError = (error: Error) => {
    setError('Failed to load PDF document');
    setLoading(false);
    console.error('PDF load error:', error);
  };

  const zoomIn = () => setScale(prev => Math.min(prev + 0.2, 3.0));
  const zoomOut = () => setScale(prev => Math.max(prev - 0.2, 0.5));
  const rotate = () => setRotation(prev => (prev + 90) % 360);

  const goToPrevPage = () => setPageNumber(prev => Math.max(prev - 1, 1));
  const goToNextPage = () => setPageNumber(prev => Math.min(prev + 1, numPages));

  const currentPageFields = fields.filter(field => field.page === pageNumber);

  if (error) {
    return (
      <div className="flex items-center justify-center h-96 bg-gray-50 rounded-lg">
        <div className="text-center">
          <div className="text-red-500 text-lg mb-2">Error Loading PDF</div>
          <div className="text-gray-600">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      {/* PDF Controls */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center space-x-2">
          <button
            onClick={zoomOut}
            className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded transition-colors"
            title="Zoom Out"
          >
            <ZoomOut className="h-4 w-4" />
          </button>
          <span className="text-sm text-gray-600 min-w-[60px] text-center">
            {Math.round(scale * 100)}%
          </span>
          <button
            onClick={zoomIn}
            className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded transition-colors"
            title="Zoom In"
          >
            <ZoomIn className="h-4 w-4" />
          </button>
          <button
            onClick={rotate}
            className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded transition-colors"
            title="Rotate"
          >
            <RotateCw className="h-4 w-4" />
          </button>
        </div>

        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <button
              onClick={goToPrevPage}
              disabled={pageNumber <= 1}
              className="px-3 py-1 text-sm bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <span className="text-sm text-gray-600">
              Page {pageNumber} of {numPages}
            </span>
            <button
              onClick={goToNextPage}
              disabled={pageNumber >= numPages}
              className="px-3 py-1 text-sm bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>

          <button
            onClick={() => window.open(fileUrl, '_blank')}
            className="flex items-center px-3 py-1 text-sm text-blue-600 hover:text-blue-700"
          >
            <Download className="h-4 w-4 mr-1" />
            Download
          </button>
        </div>
      </div>

      {/* PDF Document */}
      <div className="relative overflow-auto max-h-[800px] bg-gray-100">
        {loading && (
          <div className="flex items-center justify-center h-96">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        )}
        
        <div className="flex justify-center p-4">
          <div className="relative">
            <Document
              file={fileUrl}
              onLoadSuccess={onDocumentLoadSuccess}
              onLoadError={onDocumentLoadError}
              loading=""
            >
              <Page
                pageNumber={pageNumber}
                scale={scale}
                rotate={rotation}
                renderTextLayer={false}
                renderAnnotationLayer={false}
              />
              
              {showAnnotations && (
                <PDFAnnotationLayer
                  fields={currentPageFields}
                  scale={scale}
                  rotation={rotation}
                  onFieldUpdate={onFieldUpdate}
                  isEditable={isEditable}
                />
              )}
            </Document>
          </div>
        </div>
      </div>

      {/* Field Summary */}
      {fields.length > 0 && (
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <div className="text-sm text-gray-600 mb-2">
            Form Fields: {fields.filter(f => f.completed).length} of {fields.length} completed
          </div>
          <div className="flex flex-wrap gap-2">
            {fields.map(field => (
              <span
                key={field.id}
                className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                  field.completed
                    ? 'bg-green-100 text-green-800'
                    : field.required
                    ? 'bg-red-100 text-red-800'
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                {field.label || field.type}
                {field.required && !field.completed && ' *'}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}