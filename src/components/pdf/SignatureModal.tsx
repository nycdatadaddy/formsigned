import React, { useRef, useState, useEffect } from 'react';
import { PDFFormField } from '../../types/pdf';
import { X, RotateCcw, Save, PenTool } from 'lucide-react';

interface SignatureModalProps {
  field: PDFFormField;
  onSave: (signatureData: string) => void;
  onCancel: () => void;
}

export function SignatureModal({ field, onSave, onCancel }: SignatureModalProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isEmpty, setIsEmpty] = useState(true);
  const [signatureType, setSignatureType] = useState<'draw' | 'type'>('draw');
  const [typedSignature, setTypedSignature] = useState('');

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set up canvas
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = field.type === 'initial' ? 1.5 : 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Set canvas size
    canvas.width = canvas.offsetWidth * 2; // High DPI
    canvas.height = canvas.offsetHeight * 2;
    ctx.scale(2, 2);

    // Fill with white background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }, [field.type]);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (signatureType !== 'draw') return;
    
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
    if (!isDrawing || signatureType !== 'draw') return;

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
    setTypedSignature('');
  };

  const generateTypedSignature = () => {
    if (!typedSignature.trim()) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw typed signature
    ctx.fillStyle = '#000000';
    ctx.font = field.type === 'initial' ? '24px cursive' : '32px cursive';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    const centerX = canvas.width / 4; // Account for 2x scaling
    const centerY = canvas.height / 4;
    
    ctx.fillText(typedSignature, centerX, centerY);
    setIsEmpty(false);
  };

  const saveSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas || (isEmpty && !typedSignature.trim())) return;

    if (signatureType === 'type' && typedSignature.trim()) {
      generateTypedSignature();
      // Small delay to ensure the text is rendered
      setTimeout(() => {
        const signatureData = canvas.toDataURL('image/png');
        onSave(signatureData);
      }, 100);
    } else {
      const signatureData = canvas.toDataURL('image/png');
      onSave(signatureData);
    }
  };

  const isSignatureReady = signatureType === 'draw' ? !isEmpty : typedSignature.trim().length > 0;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <PenTool className="h-5 w-5 mr-2" />
              {field.type === 'initial' ? 'Add Initials' : 'Add Signature'}
            </h3>
            <p className="text-sm text-gray-600">
              {field.label || `Please ${field.type === 'initial' ? 'initial' : 'sign'} this field`}
            </p>
          </div>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Signature Type Selector */}
        <div className="flex space-x-4 mb-4">
          <button
            onClick={() => setSignatureType('draw')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              signatureType === 'draw'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Draw {field.type === 'initial' ? 'Initials' : 'Signature'}
          </button>
          <button
            onClick={() => setSignatureType('type')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              signatureType === 'type'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Type {field.type === 'initial' ? 'Initials' : 'Signature'}
          </button>
        </div>

        {/* Signature Input Area */}
        <div className="border-2 border-gray-300 border-dashed rounded-lg p-4 mb-4">
          {signatureType === 'draw' ? (
            <>
              <canvas
                ref={canvasRef}
                className="w-full h-48 bg-white border border-gray-200 rounded cursor-crosshair"
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
              />
              <p className="text-xs text-gray-500 mt-2 text-center">
                {field.type === 'initial' 
                  ? 'Draw your initials in the box above'
                  : 'Draw your signature in the box above using your mouse or touch screen'
                }
              </p>
            </>
          ) : (
            <div className="space-y-4">
              <input
                type="text"
                value={typedSignature}
                onChange={(e) => setTypedSignature(e.target.value)}
                placeholder={field.type === 'initial' ? 'Enter your initials' : 'Enter your full name'}
                className="w-full px-4 py-3 text-2xl font-cursive border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                style={{ fontFamily: 'cursive' }}
              />
              <canvas
                ref={canvasRef}
                className="w-full h-48 bg-white border border-gray-200 rounded"
              />
              <p className="text-xs text-gray-500 text-center">
                Preview of your typed {field.type === 'initial' ? 'initials' : 'signature'}
              </p>
            </div>
          )}
        </div>

        {/* Action Buttons */}
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
              disabled={!isSignatureReady}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Save className="h-4 w-4 mr-2" />
              Save {field.type === 'initial' ? 'Initials' : 'Signature'}
            </button>
          </div>
        </div>

        {/* Legal Notice */}
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
          <p className="text-xs text-blue-800">
            <strong>Legal Notice:</strong> By {field.type === 'initial' ? 'initialing' : 'signing'} this document digitally, 
            you agree that your electronic {field.type === 'initial' ? 'initials have' : 'signature has'} the same legal validity 
            and effect as a handwritten {field.type === 'initial' ? 'initials' : 'signature'}. 
            The current date ({new Date().toLocaleDateString()}) will be automatically recorded with your {field.type === 'initial' ? 'initials' : 'signature'}.
          </p>
        </div>
      </div>
    </div>
  );
}