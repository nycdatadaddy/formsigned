import React, { useState, useRef } from 'react';
import { PDFFormField } from '../../types/pdf';
import { PDFViewer } from './PDFViewer';
import { Plus, Save, PenTool, Square, Type, Calendar, Trash2 } from 'lucide-react';

interface PDFFormBuilderProps {
  fileUrl: string;
  initialFields?: PDFFormField[];
  onSave: (fields: PDFFormField[]) => void;
  onCancel: () => void;
}

export function PDFFormBuilder({ fileUrl, initialFields = [], onSave, onCancel }: PDFFormBuilderProps) {
  const [fields, setFields] = useState<PDFFormField[]>(initialFields);
  const [selectedFieldType, setSelectedFieldType] = useState<PDFFormField['type']>('signature');
  const [isPlacingField, setIsPlacingField] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const fieldTypes = [
    { type: 'signature' as const, label: 'Signature', icon: PenTool, color: 'bg-blue-100 text-blue-800' },
    { type: 'initial' as const, label: 'Initial', icon: PenTool, color: 'bg-purple-100 text-purple-800' },
    { type: 'checkbox' as const, label: 'Checkbox', icon: Square, color: 'bg-green-100 text-green-800' },
    { type: 'date' as const, label: 'Date', icon: Calendar, color: 'bg-amber-100 text-amber-800' },
    { type: 'text' as const, label: 'Text', icon: Type, color: 'bg-gray-100 text-gray-800' },
  ];

  const handlePDFClick = (event: React.MouseEvent, pageNumber: number) => {
    if (!isPlacingField) return;

    const rect = (event.target as HTMLElement).getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    const newField: PDFFormField = {
      id: `field_${Date.now()}`,
      type: selectedFieldType,
      x: x / 1.0, // Adjust for scale
      y: y / 1.0,
      width: selectedFieldType === 'signature' ? 200 : selectedFieldType === 'checkbox' ? 20 : 100,
      height: selectedFieldType === 'signature' ? 60 : selectedFieldType === 'checkbox' ? 20 : 30,
      page: pageNumber,
      required: true,
      label: `${fieldTypes.find(ft => ft.type === selectedFieldType)?.label} ${fields.length + 1}`,
      completed: false,
    };

    setFields(prev => [...prev, newField]);
    setIsPlacingField(false);
  };

  const removeField = (fieldId: string) => {
    setFields(prev => prev.filter(f => f.id !== fieldId));
  };

  const updateField = (fieldId: string, updates: Partial<PDFFormField>) => {
    setFields(prev => prev.map(f => f.id === fieldId ? { ...f, ...updates } : f));
  };

  const handleSave = () => {
    onSave(fields);
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-4 mx-auto p-5 border w-full max-w-7xl shadow-lg rounded-md bg-white min-h-[90vh]">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">PDF Form Builder</h3>
            <p className="text-sm text-gray-600">Click on the PDF to place form fields</p>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={onCancel}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
            >
              <Save className="h-4 w-4 mr-2" />
              Save Form Fields
            </button>
          </div>
        </div>

        <div className="flex gap-6">
          {/* Sidebar */}
          <div className="w-80 bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-4">Field Types</h4>
            
            <div className="space-y-2 mb-6">
              {fieldTypes.map(({ type, label, icon: Icon, color }) => (
                <button
                  key={type}
                  onClick={() => {
                    setSelectedFieldType(type);
                    setIsPlacingField(true);
                  }}
                  className={`w-full flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    selectedFieldType === type && isPlacingField
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="h-4 w-4 mr-2" />
                  Add {label}
                </button>
              ))}
            </div>

            {isPlacingField && (
              <div className="mb-6 p-3 bg-blue-50 border border-blue-200 rounded-md">
                <p className="text-sm text-blue-800">
                  <strong>Placing {fieldTypes.find(ft => ft.type === selectedFieldType)?.label}</strong>
                  <br />
                  Click on the PDF where you want to place this field.
                </p>
                <button
                  onClick={() => setIsPlacingField(false)}
                  className="mt-2 text-xs text-blue-600 hover:text-blue-700"
                >
                  Cancel placement
                </button>
              </div>
            )}

            <h4 className="font-medium text-gray-900 mb-4">Form Fields ({fields.length})</h4>
            
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {fields.map((field) => {
                const fieldType = fieldTypes.find(ft => ft.type === field.type);
                const Icon = fieldType?.icon || Type;
                
                return (
                  <div key={field.id} className="bg-white rounded-md p-3 border border-gray-200">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center">
                        <Icon className="h-4 w-4 mr-2 text-gray-600" />
                        <span className="text-sm font-medium text-gray-900">
                          {field.label}
                        </span>
                      </div>
                      <button
                        onClick={() => removeField(field.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    
                    <div className="space-y-2">
                      <input
                        type="text"
                        value={field.label || ''}
                        onChange={(e) => updateField(field.id, { label: e.target.value })}
                        placeholder="Field label"
                        className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                      
                      <div className="flex items-center space-x-2">
                        <label className="flex items-center text-xs text-gray-600">
                          <input
                            type="checkbox"
                            checked={field.required}
                            onChange={(e) => updateField(field.id, { required: e.target.checked })}
                            className="mr-1"
                          />
                          Required
                        </label>
                        <span className="text-xs text-gray-500">Page {field.page}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* PDF Viewer */}
          <div className="flex-1">
            <div 
              onClick={(e) => handlePDFClick(e, currentPage)}
              className={isPlacingField ? 'cursor-crosshair' : 'cursor-default'}
            >
              <PDFViewer
                fileUrl={fileUrl}
                fields={fields}
                showAnnotations={true}
                isEditable={false}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}