import React from 'react';
import './TemplateEditor.css';

const TemplateEditor = ({ template, onDelete }) => {
  const getConfidenceColor = (confidence) => {
    if (confidence >= 90) return '#22c55e'; // Yeşil
    if (confidence >= 75) return '#eab308'; // Sarı
    return '#ef4444'; // Kırmızı
  };

  return (
    <div className="template-editor">
      {template.map((item) => (
        <div key={item.id} className="template-item">
          <div className="template-header">
            <div className="template-info">
              <span className="template-label">{item.label}</span>
              <div className="confidence-indicator" style={{ 
                backgroundColor: getConfidenceColor(item.confidence),
                '--confidence-width': `${item.confidence}%`
              }}>
                <span className="confidence-text">%{Math.round(item.confidence)}</span>
              </div>
            </div>
            <div className="template-actions">
              <span className="template-coordinates">
                ({Math.round(item.coordinates.x)}, {Math.round(item.coordinates.y)})
              </span>
              <button 
                onClick={() => onDelete(item.id)}
                className="delete-button"
                title="Seçimi Sil"
              >
                ✕
              </button>
            </div>
          </div>
          <div className="template-content">
            <p className="template-text">{item.ocrText}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default TemplateEditor;
