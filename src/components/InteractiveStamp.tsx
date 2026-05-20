import React, { useRef, useState, useEffect } from 'react';
import { RotateCcw, Maximize, Move, Trash2 } from 'lucide-react';
import { StampPlacement } from '../types';

interface InteractiveStampProps {
  stampImg: string; // Base64 dataURL from Canvas
  placement: StampPlacement;
  onChange: (updated: Partial<StampPlacement>) => void;
  onRemove?: () => void;
  parentRef: React.RefObject<HTMLDivElement | null>;
  isSelected: boolean;
  onSelect: () => void;
}

export const InteractiveStamp: React.FC<InteractiveStampProps> = ({
  stampImg,
  placement,
  onChange,
  onRemove,
  parentRef,
  isSelected,
  onSelect,
}) => {
  const stampRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isRotating, setIsRotating] = useState(false);
  const [isScaling, setIsScaling] = useState(false);

  // Drag states
  const dragStart = useRef({ x: 0, y: 0, stampX: 0, stampY: 0 });
  // Rotation states
  const rotateStart = useRef({ centerX: 0, centerY: 0, startAngle: 0, initialRotation: 0 });
  // Scale states
  const scaleStart = useRef({ centerX: 0, centerY: 0, startDist: 0, initialScale: 1.0 });

  // Handle Drag Move (Moving the Stamp)
  const handleDragStart = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect();
    if (!parentRef.current) return;

    setIsDragging(true);
    const parentRect = parentRef.current.getBoundingClientRect();
    
    // Position of stamp on standard scale
    dragStart.current = {
      x: e.clientX,
      y: e.clientY,
      stampX: (placement.x / 100) * parentRect.width,
      stampY: (placement.y / 100) * parentRect.height,
    };
  };

  // Handle Rotation Start
  const handleRotateStart = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (!parentRef.current || !stampRef.current) return;

    onSelect();
    setIsRotating(true);
    const parentRect = parentRef.current.getBoundingClientRect();
    const stampRect = stampRef.current.getBoundingClientRect();

    // Find geometrical center of the stamp relative to viewport
    const cx = stampRect.left + stampRect.width / 2;
    const cy = stampRect.top + stampRect.height / 2;

    const angle = Math.atan2(e.clientY - cy, e.clientX - cx);

    rotateStart.current = {
      centerX: cx,
      centerY: cy,
      startAngle: angle,
      initialRotation: placement.rotation,
    };
  };

  // Handle Scale Start
  const handleScaleStart = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (!parentRef.current || !stampRef.current) return;

    onSelect();
    setIsScaling(true);
    const stampRect = stampRef.current.getBoundingClientRect();

    // Center of the stamp
    const cx = stampRect.left + stampRect.width / 2;
    const cy = stampRect.top + stampRect.height / 2;

    const dx = e.clientX - cx;
    const dy = e.clientY - cy;
    const dist = Math.sqrt(dx * dx + dy * dy);

    scaleStart.current = {
      centerX: cx,
      centerY: cy,
      startDist: dist || 1, // Avoid division by zero
      initialScale: placement.scale,
    };
  };

  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (!parentRef.current) return;
      const parentRect = parentRef.current.getBoundingClientRect();

      if (isDragging) {
        // Calculate raw position move inside parent
        const dx = e.clientX - dragStart.current.x;
        const dy = e.clientY - dragStart.current.y;

        let newX = dragStart.current.stampX + dx;
        let newY = dragStart.current.stampY + dy;

        // Convert to percentage bounds [0, 100]
        const pctX = Math.max(-25, Math.min(115, (newX / parentRect.width) * 100));
        const pctY = Math.max(-25, Math.min(115, (newY / parentRect.height) * 100));

        onChange({ x: pctX, y: pctY });
      }

      if (isRotating) {
        const cx = rotateStart.current.centerX;
        const cy = rotateStart.current.centerY;

        const currentAngle = Math.atan2(e.clientY - cy, e.clientX - cx);
        const angleDiff = currentAngle - rotateStart.current.startAngle;

        const degDiff = (angleDiff * 180) / Math.PI;
        // Apply angle addition
        let newRotation = (rotateStart.current.initialRotation + degDiff) % 360;
        
        // Snapping at 0, 90, 180, 270 with a small threshold (e.g., 3-degrees)
        const snapThreshold = 3.5;
        const targetAngles = [-180, -90, 0, 90, 180, 270, 360];
        for (const target of targetAngles) {
          if (Math.abs(newRotation - target) < snapThreshold) {
            newRotation = target;
            break;
          }
        }

        onChange({ rotation: newRotation });
      }

      if (isScaling) {
        const cx = scaleStart.current.centerX;
        const cy = scaleStart.current.centerY;

        const dx = e.clientX - cx;
        const dy = e.clientY - cy;
        const currentDist = Math.sqrt(dx * dx + dy * dy);

        // Compute ratio compared to starting resize distance
        const ratio = currentDist / scaleStart.current.startDist;
        const targetScale = Math.max(0.35, Math.min(2.8, scaleStart.current.initialScale * ratio));

        onChange({ scale: parseFloat(targetScale.toFixed(2)) });
      }
    };

    const handleGlobalMouseUp = () => {
      setIsDragging(false);
      setIsRotating(false);
      setIsScaling(false);
    };

    if (isDragging || isRotating || isScaling) {
      window.addEventListener('mousemove', handleGlobalMouseMove);
      window.addEventListener('mouseup', handleGlobalMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleGlobalMouseMove);
      window.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [isDragging, isRotating, isScaling, onChange, parentRef, placement]);

  // Base size mapping
  const baseSize = 135; // Default display stamp width in px
  const currentSize = baseSize * placement.scale;

  return (
    <div
      ref={stampRef}
      id="draggable-stamp-active-overlay"
      className="absolute select-none cursor-grab active:cursor-grabbing group"
      style={{
        left: `${placement.x}%`,
        top: `${placement.y}%`,
        width: `${currentSize}px`,
        height: `${currentSize}px`,
        transform: `translate(-50%, -50%) rotate(${placement.rotation}deg)`,
        zIndex: isSelected ? 30 : 20,
      }}
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
      onMouseDown={handleDragStart}
    >
      {/* Visual Bounding Boxes when selected */}
      {isSelected && (
        <div className="absolute inset-0 border-2 border-dashed border-indigo-600 rounded-lg pointer-events-none scale-102 flex items-center justify-center animated animate-pulse">
          {/* Movement Indicator Overlay */}
          <div className="bg-indigo-600/90 text-white rounded-full p-1 shadow-md scale-90">
            <Move size={14} className="stroke-[2.5]" />
          </div>
        </div>
      )}

      {/* Actual High Resolution Stamp Canvas Render */}
      <img
        src={stampImg || 'placeholder.png'}
        alt="Custom Seal Stamp"
        referrerPolicy="no-referrer"
        className="w-full h-full object-contain pointer-events-none drop-shadow-sm transition-transform duration-75"
        style={{
          userSelect: 'none',
          WebkitUserDrag: 'none',
        }}
      />

      {/* Rotation Indicator and Handles (Active only on select) */}
      {isSelected && (
        <>
          {/* Top Rotation Handle */}
          <div
            className="absolute -top-7 left-1/2 -translate-x-1/2 w-6 h-6 bg-white border border-indigo-600 rounded-full shadow-lg flex items-center justify-center cursor-[#ccc-rotate] hover:bg-indigo-50 active:scale-110 cursor-pointer-parent"
            title="Rotate Stamp (Drag to rotate)"
            style={{ cursor: 'alias', pointerEvents: 'auto' }}
            onMouseDown={handleRotateStart}
          >
            <RotateCcw size={12} className="text-indigo-600 stroke-[3]" />
          </div>
          {/* Vertical Stem Connecting Rotate Handle to Frame */}
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-0.5 h-3 bg-indigo-600 pointer-events-none" />

          {/* Bottom Right Resize Scale Handle */}
          <div
            className="absolute -bottom-2 -right-2 w-6 h-6 bg-indigo-600 border border-white rounded-full shadow-lg flex items-center justify-center cursor-se-resize hover:bg-indigo-700 active:scale-110"
            title="Resize Stamp (Drag or pinch)"
            onMouseDown={handleScaleStart}
          >
            <Maximize size={12} className="text-white stroke-[3] rotate-45" />
          </div>

          {/* Mini Action bar overlay above */}
          <div 
            className="absolute -top-14 left-1/2 -translate-x-1/2 flex items-center gap-1.5 bg-slate-900 border border-slate-700 p-1 rounded-md shadow-xl text-white pointer-events-auto"
            onMouseDown={(e) => e.stopPropagation()} // Stop propagation from body drag
          >
            <button
              id="stamp-quick-reset"
              onClick={() => onChange({ rotation: 0, scale: 1.0 })}
              className="p-1 hover:bg-slate-800 rounded text-xs px-1.5 flex items-center gap-1 text-slate-300"
              title="Reset angle & scale"
            >
              Reset
            </button>
            <div className="w-px h-3 bg-slate-700" />
            <button
              id="stamp-delete-action"
              onClick={onRemove}
              className="p-1 hover:bg-red-950/20 text-red-400 rounded hover:text-red-300"
              title="Remove Stamp"
            >
              <Trash2 size={13} />
            </button>
          </div>
        </>
      )}

      {/* Elegant Hover Indicator */}
      {!isSelected && (
        <div className="absolute inset-0 border border-dashed border-slate-400 opacity-0 group-hover:opacity-100 rounded-md pointer-events-none transition-opacity duration-150" />
      )}
    </div>
  );
};
