import React, { useState, useRef, useEffect } from 'react';
import './CoordinatesSelector.css';

const CoordinatesSelector = ({ onSelection }) => {
    const [startX, setStartX] = useState(null);
    const [startY, setStartY] = useState(null);
    const [endX, setEndX] = useState(null);
    const [endY, setEndY] = useState(null);
    const [selecting, setSelecting] = useState(false);
    const containerRef = useRef(null);

    const handleMouseDown = (e) => {
        setSelecting(true);
        setStartX(e.clientX);
        setStartY(e.clientY);
    };

    const handleMouseMove = (e) => {
        if (selecting) {
            setEndX(e.clientX);
            setEndY(e.clientY);
        }
    };

    const handleMouseUp = () => {
        setSelecting(false);
        if (startX !== null && startY !== null && endX !== null && endY !== null) {
            const coordinates = {
                x1: Math.min(startX, endX),
                y1: Math.min(startY, endY),
                x2: Math.max(startX, endX),
                y2: Math.max(startY, endY),
            };
            onSelection(coordinates);
            setStartX(null);
            setStartY(null);
            setEndX(null);
            setEndY(null);
        }
    };

    useEffect(() => {
        const container = containerRef.current;

        if (selecting) {
            container.addEventListener('mousemove', handleMouseMove);
            container.addEventListener('mouseup', handleMouseUp);
        } else {
            container.removeEventListener('mousemove', handleMouseMove);
            container.removeEventListener('mouseup', handleMouseUp);
        }

        return () => {
            container.removeEventListener('mousemove', handleMouseMove);
            container.removeEventListener('mouseup', handleMouseUp);
        };
    }, [selecting, handleMouseUp, handleMouseMove]);

    useEffect(() => {
        const container = containerRef.current;
        container.addEventListener('mousedown', handleMouseDown);

        return () => {
            container.removeEventListener('mousedown', handleMouseDown);
        };
    }, [handleMouseDown]);

    return (
        <div ref={containerRef} className="coordinates-selector">
            {selecting && (
                <div
                    className="selection-box"
                    style={{
                        left: `${Math.min(startX, endX)}px`,
                        top: `${Math.min(startY, endY)}px`,
                        width: `${Math.abs(endX - startX)}px`,
                        height: `${Math.abs(endY - startY)}px`,
                    }}
                />
            )}
        </div>
    );
};

export default CoordinatesSelector;
