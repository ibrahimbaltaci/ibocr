// TemplateEditor.js

import React, { useState } from 'react';
import CoordinatesSelector from './CoordinateSelector';

const TemplateEditor = ({ onChange }) => {
    const [template, setTemplate] = useState([]);
    const [selectedCoordinates, setSelectedCoordinates] = useState(null);

    const handleAddField = () => {
        if (selectedCoordinates) { // Eklenen satır
            const newTemplate = [
                ...template,
                { id: Date.now(), label: '', coordinates: { ...selectedCoordinates } }
            ];
            setTemplate(newTemplate);
            onChange(newTemplate);
        }
    };

    const handleRemoveField = (fieldId) => {
        const newTemplate = template.filter((field) => field.id !== fieldId);
        setTemplate(newTemplate);
        onChange(newTemplate);
    };

    const handleLabelChange = (fieldId, newLabel) => {
        const newTemplate = template.map((field) =>
            field.id === fieldId ? { ...field, label: newLabel } : field
        );
        setTemplate(newTemplate);
        onChange(newTemplate);
    };

    const handleCoordinatesChange = (fieldId, coordinates) => {
        const newTemplate = template.map((field) =>
            field.id === fieldId ? { ...field, coordinates } : field
        );
        setTemplate(newTemplate);
        onChange(newTemplate);
    };

    return (
        <div>
            <h2>Template Editor</h2>
            {template.map((field) => (
                <div key={field.id}>
                    <label>
                        Label:
                        <input
                            type="text"
                            value={field.label}
                            onChange={(e) => handleLabelChange(field.id, e.target.value)}
                        />
                    </label>
                    <label>
                        Coordinates:
                        <input
                            type="text"
                            placeholder="x1"
                            value={field.coordinates.x1}
                            onChange={(e) =>
                                handleCoordinatesChange(field.id, {
                                    ...field.coordinates,
                                    x1: parseInt(e.target.value, 10) || 0,
                                })
                            }
                        />
                        {/* ... (diğer koordinat inputları için aynı yapı) */}
                    </label>
                    <button onClick={() => handleRemoveField(field.id)}>Remove</button>
                </div>
            ))}
            <button onClick={handleAddField}>Add Field</button>
            <CoordinatesSelector onSelection={handleAddField} />
        </div>
    );

};

export default TemplateEditor;
