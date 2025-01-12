import React, { useRef, useEffect, useState } from 'react';
import './CoordinatesSelector.css';

const CoordinatesSelector = ({ imageData, onSelection, isProcessing, selectedAreas = [], pendingSelection }) => {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [currentPos, setCurrentPos] = useState({ x: 0, y: 0 });
  const [isResizing, setIsResizing] = useState(false);
  const [resizeHandle, setResizeHandle] = useState(null);

  useEffect(() => {
    drawCanvas();
  }, [imageData, selectedAreas, pendingSelection]);

  const drawCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const image = new Image();

    image.onload = () => {
      // Canvas boyutunu resim boyutuna göre ayarla
      const maxWidth = 800;
      const maxHeight = 600;
      let width = image.width;
      let height = image.height;

      // En-boy oranını koru
      if (width > maxWidth) {
        height = (maxWidth * height) / width;
        width = maxWidth;
      }
      if (height > maxHeight) {
        width = (maxHeight * width) / height;
        height = maxHeight;
      }

      canvas.width = width;
      canvas.height = height;

      // Resmi çiz
      ctx.drawImage(image, 0, 0, width, height);

      // Önceki seçimleri çiz
      selectedAreas.forEach((area, index) => {
        drawSelectionArea(ctx, area, `${index + 1}`, '#2563eb');
      });

      // Bekleyen seçimi çiz
      if (pendingSelection) {
        drawSelectionArea(ctx, pendingSelection, 'P', '#22c55e');
        drawResizeHandles(ctx, pendingSelection);
      }
    };

    image.src = imageData;
  };

  const drawSelectionArea = (ctx, area, label, color) => {
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.strokeRect(area.x, area.y, area.width, area.height);

    // Yarı saydam dolgu
    ctx.fillStyle = `${color}1a`; // 10% opaklık
    ctx.fillRect(area.x, area.y, area.width, area.height);

    // Etiket
    ctx.font = '12px Arial';
    ctx.fillStyle = color;
    ctx.setLineDash([]);
    ctx.fillText(label, area.x + 5, area.y + 15);
  };

  const drawResizeHandles = (ctx, area) => {
    const handles = getResizeHandles(area);
    ctx.fillStyle = '#2563eb';
    ctx.setLineDash([]);

    handles.forEach(handle => {
      ctx.beginPath();
      ctx.arc(handle.x, handle.y, 5, 0, Math.PI * 2);
      ctx.fill();
    });
  };

  const getResizeHandles = (area) => {
    return [
      { x: area.x, y: area.y, cursor: 'nw-resize', position: 'tl' },
      { x: area.x + area.width, y: area.y, cursor: 'ne-resize', position: 'tr' },
      { x: area.x, y: area.y + area.height, cursor: 'sw-resize', position: 'bl' },
      { x: area.x + area.width, y: area.y + area.height, cursor: 'se-resize', position: 'br' }
    ];
  };

  const getMousePos = (canvas, event) => {
    const rect = canvas.getBoundingClientRect();
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top
    };
  };

  const isOverResizeHandle = (pos, area) => {
    if (!area) return null;
    
    const handles = getResizeHandles(area);
    for (const handle of handles) {
      const dx = pos.x - handle.x;
      const dy = pos.y - handle.y;
      if (dx * dx + dy * dy <= 25) { // 5px yarıçap
        return handle;
      }
    }
    return null;
  };

  const handleMouseDown = (e) => {
    if (isProcessing) return;
    
    const pos = getMousePos(canvasRef.current, e);
    
    if (pendingSelection) {
      const handle = isOverResizeHandle(pos, pendingSelection);
      if (handle) {
        setIsResizing(true);
        setResizeHandle(handle);
        return;
      }
    }

    setIsDrawing(true);
    setStartPos(pos);
    setCurrentPos(pos);
  };

  const handleMouseMove = (e) => {
    if (isProcessing) return;

    const pos = getMousePos(canvasRef.current, e);
    
    // İmleç stilini güncelle
    if (pendingSelection && !isDrawing && !isResizing) {
      const handle = isOverResizeHandle(pos, pendingSelection);
      canvasRef.current.style.cursor = handle ? handle.cursor : 'crosshair';
    }

    if (isResizing && pendingSelection && resizeHandle) {
      const newSelection = { ...pendingSelection };
      
      switch (resizeHandle.position) {
        case 'tl':
          newSelection.width += newSelection.x - pos.x;
          newSelection.height += newSelection.y - pos.y;
          newSelection.x = pos.x;
          newSelection.y = pos.y;
          break;
        case 'tr':
          newSelection.width = pos.x - newSelection.x;
          newSelection.height += newSelection.y - pos.y;
          newSelection.y = pos.y;
          break;
        case 'bl':
          newSelection.width += newSelection.x - pos.x;
          newSelection.height = pos.y - newSelection.y;
          newSelection.x = pos.x;
          break;
        case 'br':
          newSelection.width = pos.x - newSelection.x;
          newSelection.height = pos.y - newSelection.y;
          break;
      }

      if (newSelection.width >= 10 && newSelection.height >= 10) {
        onSelection(newSelection);
      }
    } else if (isDrawing) {
      setCurrentPos(pos);
      const width = pos.x - startPos.x;
      const height = pos.y - startPos.y;
      const x = width < 0 ? pos.x : startPos.x;
      const y = height < 0 ? pos.y : startPos.y;
      
      onSelection({
        x,
        y,
        width: Math.abs(width),
        height: Math.abs(height),
        canvasWidth: canvasRef.current.width,
        canvasHeight: canvasRef.current.height
      });
    }

    drawCanvas();
  };

  const handleMouseUp = () => {
    if (isProcessing) return;

    setIsDrawing(false);
    setIsResizing(false);
    setResizeHandle(null);
    
    if (!pendingSelection) {
      const width = Math.abs(currentPos.x - startPos.x);
      const height = Math.abs(currentPos.y - startPos.y);
      const x = Math.min(startPos.x, currentPos.x);
      const y = Math.min(startPos.y, currentPos.y);

      // Minimum alan kontrolü
      if (width >= 10 && height >= 10) {
        onSelection({
          x,
          y,
          width,
          height,
          canvasWidth: canvasRef.current.width,
          canvasHeight: canvasRef.current.height
        });
      }
    }
  };

  return (
    <div className="coordinates-selector">
      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        className={isProcessing ? 'processing' : ''}
      />
      <div className="instructions">
        {isProcessing ? (
          <p>İşleniyor, lütfen bekleyin...</p>
        ) : pendingSelection ? (
          <p>Köşelerdeki noktalardan boyutu ayarlayabilir veya "Metni Tanı" butonuna tıklayabilirsiniz</p>
        ) : (
          <p>Fare ile sürükleyerek metin içeren bir alan seçin</p>
        )}
      </div>
    </div>
  );
};

export default CoordinatesSelector;
