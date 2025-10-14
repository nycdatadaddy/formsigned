import React, { useState } from 'react';
import { PDFFormField } from '../../types/pdf';
import { SignatureModal } from './SignatureModal';
import { PenTool, Square, Type, Calendar } from 'lucide-react';

interface PDFAnnotationLayerProps {
  fields: PDFFormField[];
  scale: number;
  rotation: number;
  onFieldUpdate?: (fieldId: string, value: any) => void;
  isEditable?: boolean;
}

export function PDFAnnotationLayer({ 
  fields, 
  scale, 
  rotation, 
  onFieldUpdate, 
  isEditable = false 
}: PDFAnnotationLayerProps) {
  const [activeField, setActiveField] = useState<string | null>(null);
  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const [currentSignatureField, setCurrentSignatureField] = useState<PDFFormField | null>(null);

  const handleFieldClick = (field: PDFFormField) => {
    if (!isEditable) return;

    setActiveField(field.id);

    if (field.type === 'signature' || field.type === 'initial') {
      setCurrentSignatureField(field);
      setShowSignatureModal(true);
    } else if (field.type === 'date') {
      // Auto-fill current date
      const currentDate = new Date().toLocaleDateString();
      onFieldUpdate?.(field.id, currentDate);
    } else if (field.type === 'checkbox') {
      onFieldUpdate?.(field.id, !field.value);
    }
  };

  const handleSignatureSave = (signatureData: string) => {
    if (currentSignatureField) {
      onFieldUpdate?.(currentSignatureField.id, signatureData);
      setCurrentSignatureField(null);
    }
    setShowSignatureModal(false);
  };

  const getFieldIcon = (type: string) => {
    switch (type) {
      case 'signature':
      case 'initial':
        return PenTool;
      case 'checkbox':
        return Square;
      case 'text':
        return Type;
      case 'date':
        return Calendar;
      default:
        return Type;
    }
  };

  const getFieldStyle = (field: PDFFormField) => {
    const baseStyle = {
      position: 'absolute' as const,
      left: field.x * scale,
      top: field.y * scale,
      width: field.width * scale,
      height: field.height * scale,
      transform: `rotate(${rotation}deg)`,
    };

    return baseStyle;
  };

  const getFieldClassName = (field: PDFFormField) => {
    const baseClasses = "border-2 rounded transition-all duration-200 flex items-center justify-center";
    
    if (!isEditable) {
      return `${baseClasses} border-blue-300 bg-blue-50 opacity-75`;
    }

    if (field.completed) {
      return `${baseClasses} border-green-400 bg-green-50`;
    }

    if (field.required) {
      return `${baseClasses} border-red-400 bg-red-50 hover:border-red-500 cursor-pointer`;
    }

    return `${baseClasses} border-blue-400 bg-blue-50 hover:border-blue-500 cursor-pointer`;
  };

  return (
    <>
      <div className="absolute inset-0 pointer-events-none">
        {fields.map((field) => {
          const Icon = getFieldIcon(field.type);
          
          return (
            <div
              key={field.id}
              style={getFieldStyle(field)}
              className={`${getFieldClassName(field)} ${isEditable ? 'pointer-events-auto' : ''}`}
              onClick={() => handleFieldClick(field)}
              title={field.label || `${field.type}${field.required ? ' (required)' : ''}`}
            >
              {field.type === 'checkbox' && field.value ? (
                <div className="text-green-600 font-bold text-lg">✓</div>
              ) : field.completed && (field.type === 'signature' || field.type === 'initial') ? (
                <div className="text-green-600 text-xs font-medium">Signed</div>
              ) : field.completed && field.type === 'date' ? (
                <div className="text-gray-800 text-xs font-medium">{field.value as string}</div>
              ) : (
                <Icon className="h-4 w-4 text-gray-500" />
              )}
              
              {field.required && !field.completed && (
                <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></div>
              )}
            </div>
          );
        })}
      </div>

      {showSignatureModal && currentSignatureField && (
        <SignatureModal
          field={currentSignatureField}
          onSave={handleSignatureSave}
          onCancel={() => {
            setShowSignatureModal(false);
            setCurrentSignatureField(null);
          }}
        />
      )}
    </>
  );
}