import React, { useRef, useState, useEffect } from 'react';
import { X, RotateCcw, Save } from 'lucide-react';

interface SignatureCanvasProps {
  onSave: (signatureData: string) => void;
  onCancel: () => void;
  loading: boolean;
  contractTitle: string;
}

export function SignatureCanvas({ onSave, onCancel, loading, contractTitle }: SignatureCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isEmpty, setIsEmpty] = useState(true);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set up canvas
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Set canvas size
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    // Fill with white background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }, []);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    setIsEmpty(false);
    
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    setIsEmpty(true);
  };

  const saveSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas || isEmpty) return;

    const signatureData = canvas.toDataURL('image/png');
    onSave(signatureData);
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Digital Signature</h3>
            <p className="text-sm text-gray-600">Please sign below to confirm your agreement to: <strong>{contractTitle}</strong></p>
          </div>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="border-2 border-gray-300 border-dashed rounded-lg p-4 mb-4">
          <canvas
            ref={canvasRef}
            className="w-full h-48 bg-white border border-gray-200 rounded cursor-crosshair"
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
          />
          <p className="text-xs text-gray-500 mt-2 text-center">
            Draw your signature in the box above using your mouse or touch screen
          </p>
        </div>

        <div className="flex justify-between items-center">
          <button
            onClick={clearCanvas}
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Clear
          </button>

          <div className="flex space-x-3">
            <button
              onClick={onCancel}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={saveSignature}
              disabled={loading || isEmpty}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Save className="h-4 w-4 mr-2" />
              {loading ? 'Saving...' : 'Save Signature'}
            </button>
          </div>
        </div>

        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
          <p className="text-xs text-blue-800">
            <strong>Legal Notice:</strong> By signing this document digitally, you agree that your electronic signature 
            has the same legal validity and effect as a handwritten signature. This signature will be securely stored 
            and cannot be altered after submission.
          </p>
        </div>
      </div>
    </div>
  );
}