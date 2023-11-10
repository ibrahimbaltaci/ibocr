import React from 'react';

const TemplateEditor = ({ template }) => {
    return (
        <div>
            <h2>Template Editor</h2>
            {template.map((field, index) => (
                <div key={index}>
                    <label>
                        Label:
                        <input
                            type="text"
                            value={field.label}
                            onChange={(e) => console.log(e.target.value)}
                        />
                    </label>
                    <label>
                        Coordinates:
                        <input
                            type="text"
                            placeholder="x1"
                            value={field.coordinates.x1}
                            onChange={(e) => console.log(e.target.value)}
                        />
                        <input
                            type="text"
                            placeholder="y1"
                            value={field.coordinates.y1}
                            onChange={(e) => console.log(e.target.value)}
                        />
                        <input
                            type="text"
                            placeholder="x2"
                            value={field.coordinates.x2}
                            onChange={(e) => console.log(e.target.value)}
                        />
                        <input
                            type="text"
                            placeholder="y2"
                            value={field.coordinates.y2}
                            onChange={(e) => console.log(e.target.value)}
                        />
                    </label>
                    <button onClick={() => console.log('Remove button clicked')}>Remove</button>
                </div>
            ))}
        </div>
    );
};

export default TemplateEditor;
