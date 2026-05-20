import React, { useEffect, useRef } from 'react';
import { StampSettings } from '../types';

interface StampCanvasProps {
  settings: StampSettings;
  className?: string;
  onDataUrlGenerated?: (dataUrl: string) => void;
}

// Map color presets to accurate physical stamp ink HEX codes
export const STAMP_COLORS = {
  purple: '#6b21a8', // Rich imperial purple ink
  blue: '#1d4ed8',   // Royal blue registrar ink
  navy: '#0f172a',   // Deep archival navy ink
  violet: '#7c3aed', // Classic violet document ink
  red: '#be123c',    // Custom validation crimson
  green: '#15803d',  // Approved emerald stamp
};

export const StampCanvas: React.FC<StampCanvasProps> = ({
  settings,
  className = '',
  onDataUrlGenerated,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    const size = 512; // Draw in heavy 512px resolution for maximum PDF scaling quality.
    canvas.width = size;
    canvas.height = size;

    // Clear and prepare transparent background
    ctx.clearRect(0, 0, size, size);

    // Get color
    const inkColor = STAMP_COLORS[settings.colorPreset] || settings.customColor;
    ctx.strokeStyle = inkColor;
    ctx.fillStyle = inkColor;

    // Draw Stamp Frame
    if (settings.style === 'round') {
      drawRoundStamp(ctx, size, settings);
    } else if (settings.style === 'oval') {
      drawOvalStamp(ctx, size, settings);
    } else {
      drawSquareStamp(ctx, size, settings);
    }

    // Apply the grunge ink distress texture if level > 0
    if (settings.grungeIntensity > 0) {
      applyProceduralGrunge(ctx, size, settings.grungeIntensity);
    }

    // Apply Opacity
    ctx.save();
    ctx.globalCompositeOperation = 'destination-in';
    ctx.fillStyle = `rgba(0, 0, 0, ${settings.opacity})`;
    ctx.fillRect(0, 0, size, size);
    ctx.restore();

    // Export PNG
    if (onDataUrlGenerated) {
      try {
        const dataUrl = canvas.toDataURL('image/png');
        onDataUrlGenerated(dataUrl);
      } catch (e) {
        console.error('Error generating data URL from canvas', e);
      }
    }
  }, [settings, onDataUrlGenerated]);

  // Round Stamp Draw Logic
  const drawRoundStamp = (
    ctx: CanvasRenderingContext2D,
    size: number,
    opt: StampSettings
  ) => {
    const cx = size / 2;
    const cy = size / 2;
    const inkColor = STAMP_COLORS[opt.colorPreset] || opt.customColor;

    // 1. Double Outer Rings
    ctx.lineWidth = opt.borderWidth;
    ctx.strokeStyle = inkColor;
    
    // Hard Outer Circle
    ctx.beginPath();
    ctx.arc(cx, cy, 240, 0, Math.PI * 2);
    ctx.stroke();

    // Thin Inner Circle
    ctx.lineWidth = Math.max(1, opt.borderWidth / 2.5);
    ctx.beginPath();
    ctx.arc(cx, cy, 222, 0, Math.PI * 2);
    ctx.stroke();

    // Central core inner boundaries
    ctx.lineWidth = Math.max(1, opt.borderWidth / 3);
    ctx.beginPath();
    ctx.arc(cx, cy, 145, 0, Math.PI * 2);
    ctx.stroke();

    // 2. Curving Outer Star Text - Top (Dynamic Font Fit)
    if (opt.textTop) {
      drawTextOnArc(ctx, opt.textTop.toUpperCase(), cx, cy, 182, true, 23);
    }

    // 3. Curving Outer Star Text - Bottom (Dynamic Font Fit)
    if (opt.textBottom) {
      drawTextOnArc(ctx, opt.textBottom.toUpperCase(), cx, cy, 181, false, 21);
    }

    // 4. Center Divider Decals
    ctx.fillStyle = inkColor;

    // 5. Central Headers - Spaced and elegant with robust circular chord auto-fitting
    const centerRows = [
      { text: opt.textCenter1, font: `bold 20px "Inter", "Arial Black", sans-serif`, forceUpper: true },
      { text: opt.textCenter2, font: `600 16px "Inter", sans-serif`, forceUpper: false },
      { text: opt.textCenter3, font: `500 14px "JetBrains Mono", monospace`, forceUpper: false },
    ].filter(item => item.text && item.text.trim() !== '');

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = inkColor;

    const totalRowsCount = centerRows.length;
    if (totalRowsCount > 0) {
      const spacing = totalRowsCount === 3 ? 36 : totalRowsCount === 2 ? 44 : 52;
      const totalHeight = (totalRowsCount - 1) * spacing;
      const startY = cy - totalHeight / 2;
      const innerRadius = 145; // Stay strictly within the inner bounding circle

      centerRows.forEach((row, index) => {
        const yPos = startY + index * spacing;
        const dy = Math.abs(yPos - cy);
        
        // Compute circular chord width at vertical offset dy from the center.
        // Leave a 28px buffer (14px padding on each end) so text never touches or clips the circle boundary.
        const safeWidth = 2 * Math.sqrt(Math.max(0, innerRadius * innerRadius - dy * dy)) - 28;
        const renderText = row.forceUpper ? row.text.toUpperCase() : row.text;

        // Parse default size
        const fontMatch = row.font.match(/(\d+)px/);
        let fontSize = fontMatch ? parseInt(fontMatch[1]) : 16;
        const fontStyleAndFamily = row.font.replace(/\d+px/, 'TOKEN_FONT_SIZE');

        ctx.font = fontStyleAndFamily.replace('TOKEN_FONT_SIZE', `${fontSize}px`);
        let textWidth = ctx.measureText(renderText).width;

        // Dynamically shrink the font size down if it overflows the safe chord width
        while (textWidth > safeWidth && fontSize > 8.5) {
          fontSize -= 0.5;
          ctx.font = fontStyleAndFamily.replace('TOKEN_FONT_SIZE', `${fontSize}px`);
          textWidth = ctx.measureText(renderText).width;
        }

        ctx.fillText(renderText, cx, yPos);
      });
    }
  };

  // Square / Rectangular Stamp Draw Logic
  const drawSquareStamp = (
    ctx: CanvasRenderingContext2D,
    size: number,
    opt: StampSettings
  ) => {
    const cx = size / 2;
    const cy = size / 2;
    const inkColor = STAMP_COLORS[opt.colorPreset] || opt.customColor;

    ctx.strokeStyle = inkColor;
    ctx.fillStyle = inkColor;

    // Outer thick framing box with slight rounded bevel
    const width = 466;
    const height = 336;
    const x = cx - width / 2;
    const y = cy - height / 2;
    const radius = 24; // Bevel

    // Outermost Thick Border
    ctx.lineWidth = opt.borderWidth;
    drawRoundedRect(ctx, x, y, width, height, radius);
    ctx.stroke();

    // Innermost Thin Frame (perfectly double-bordered layout)
    const innerOffset = Math.max(6, opt.borderWidth + 3);
    ctx.lineWidth = Math.max(1, opt.borderWidth / 2.5);
    drawRoundedRect(
      ctx,
      x + innerOffset,
      y + innerOffset,
      width - innerOffset * 2,
      height - innerOffset * 2,
      Math.max(4, radius - innerOffset)
    );
    ctx.stroke();

    // Texts Core Setup
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Build the list of active text lines to display (refined to prevent border touch)
    const activeLines = [
      { text: opt.textTop, font: `bold 21px "Inter", "Arial Black", sans-serif`, forceUpper: true },
      { text: opt.textCenter1, font: `bold 19px "Inter", "Arial", sans-serif`, forceUpper: true },
      { text: opt.textCenter2, font: `600 17px "Inter", sans-serif`, forceUpper: false },
      { text: opt.textCenter3, font: `500 15px "JetBrains Mono", monospace`, forceUpper: false },
      { text: opt.textBottom, font: `500 15px "JetBrains Mono", monospace`, forceUpper: false },
    ].filter(item => item.text && item.text.trim() !== '');

    const totalLines = activeLines.length;
    if (totalLines > 0) {
      // Elegant spacing depending on the density of information
      const spacing = totalLines === 5 ? 40 : totalLines === 4 ? 46 : totalLines === 3 ? 52 : 58;
      const totalHeight = (totalLines - 1) * spacing;
      const startY = cy - totalHeight / 2;

      activeLines.forEach((line, index) => {
        ctx.font = line.font;
        const renderText = line.forceUpper ? line.text.toUpperCase() : line.text;
        ctx.fillText(renderText, cx, startY + index * spacing);
      });
    }
  };

  // Curved text drawing helper using clean trigonometry with dynamic auto-fitting
  const drawTextOnArc = (
    ctx: CanvasRenderingContext2D,
    text: string,
    cx: number,
    cy: number,
    radius: number,
    isTop: boolean,
    maxSize: number
  ) => {
    let fontSize = maxSize;
    let charAngles: number[] = [];
    let totalArcAngle = 0;
    const gapMultiplier = 1.05; // Slightly condensed character track for high-end look

    // We restrict the arc's angular span to a maximum of ~132 degrees (2.3 radians) 
    // to strictly prevent text from spilling onto the left/right sides.
    const maxArcLimit = 2.3; 

    while (fontSize > 11) {
      ctx.font = `bold ${fontSize}px "Inter", "Arial Black", sans-serif`;
      charAngles = [];
      totalArcAngle = 0;

      for (let i = 0; i < text.length; i++) {
        const charWidth = ctx.measureText(text[i]).width;
        const charAngle = (charWidth / radius) * gapMultiplier;
        charAngles.push(charAngle);
        totalArcAngle += charAngle;
      }

      if (totalArcAngle <= maxArcLimit) {
        break;
      }
      fontSize -= 0.5;
    }

    const chars = text.split('');
    let currentAngle: number;
    let incrementSign: number;

    if (isTop) {
      // Top text is centered at -Math.PI / 2, flowing clockwise (reading left-to-right)
      const centerAngle = -Math.PI / 2;
      currentAngle = centerAngle - totalArcAngle / 2;
      incrementSign = 1;
    } else {
      // Bottom text is centered at Math.PI / 2, flowing counter-clockwise (reading left-to-right from outside)
      const centerAngle = Math.PI / 2;
      currentAngle = centerAngle + totalArcAngle / 2;
      incrementSign = -1;
    }

    for (let i = 0; i < chars.length; i++) {
      const char = chars[i];
      const charAngle = charAngles[i];

      // Step angle to the middle of this character's space
      const placementAngle = currentAngle + (charAngle / 2) * incrementSign;

      ctx.save();
      
      // Compute standard radial rotation and offset coordinates
      const charX = cx + radius * Math.cos(placementAngle);
      const charY = cy + radius * Math.sin(placementAngle);

      ctx.translate(charX, charY);
      // Aligns the character upright facing outwards for top, or inwards for bottom to read left-to-right
      if (isTop) {
        ctx.rotate(placementAngle + Math.PI / 2);
      } else {
        ctx.rotate(placementAngle - Math.PI / 2);
      }

      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(char, 0, 0);
      ctx.restore();

      currentAngle += charAngle * incrementSign;
    }
  };

  // Rounded Rect drawing helper
  const drawRoundedRect = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    r: number
  ) => {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  };

  // Star drawing helper
  const drawStar = (
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    spikes: number,
    outerRadius: number,
    innerRadius: number
  ) => {
    let rot = (Math.PI / 2) * 3;
    let x = cx;
    let y = cy;
    const step = Math.PI / spikes;

    ctx.beginPath();
    ctx.moveTo(cx, cy - outerRadius);
    for (let i = 0; i < spikes; i++) {
      x = cx + Math.cos(rot) * outerRadius;
      y = cy + Math.sin(rot) * outerRadius;
      ctx.lineTo(x, y);
      rot += step;

      x = cx + Math.cos(rot) * innerRadius;
      y = cy + Math.sin(rot) * innerRadius;
      ctx.lineTo(x, y);
      rot += step;
    }
    ctx.lineTo(cx, cy - outerRadius);
    ctx.closePath();
    ctx.fill();
  };

  // Curved text drawing helper on ellipse with normal matching orientation
  const drawTextOnEllipse = (
    ctx: CanvasRenderingContext2D,
    text: string,
    cx: number,
    cy: number,
    rx: number,
    ry: number,
    isTop: boolean,
    maxSize: number
  ) => {
    let fontSize = maxSize;
    const gapMultiplier = 1.05;
    const maxArcLimit = 2.4; // Max parameter angle span in radians

    const chars = text.split('');
    let charWidths: number[] = [];
    let totalThetaWidth = 0;

    // We do an iterative sizing process to find the font size that fits the maxArcLimit
    while (fontSize > 11) {
      ctx.font = `bold ${fontSize}px "Inter", "Arial Black", sans-serif`;
      charWidths = [];
      totalThetaWidth = 0;

      // Estimate the total theta width of the text.
      // We start at the center angle and simulate stepping to calculate the required d_theta for each char.
      let tempTheta = isTop ? -Math.PI / 2 : Math.PI / 2;
      const stepSign = isTop ? 1 : -1;

      for (let i = 0; i < chars.length; i++) {
        const charWidth = ctx.measureText(chars[i]).width;
        charWidths.push(charWidth);

        const speed = Math.sqrt(
          rx * rx * Math.sin(tempTheta) * Math.sin(tempTheta) +
          ry * ry * Math.cos(tempTheta) * Math.cos(tempTheta)
        );
        const charTheta = (charWidth * gapMultiplier) / speed;
        totalThetaWidth += charTheta;
        
        // Advance angle for the next character measurement
        tempTheta += stepSign * charTheta;
      }

      if (totalThetaWidth <= maxArcLimit) {
        break;
      }
      fontSize -= 0.5;
    }

    // Now layout and draw using the selected font size
    ctx.font = `bold ${fontSize}px "Inter", "Arial Black", sans-serif`;

    let currentAngle: number;
    let incrementSign: number;

    if (isTop) {
      const centerAngle = -Math.PI / 2;
      currentAngle = centerAngle - totalThetaWidth / 2;
      incrementSign = 1;
    } else {
      const centerAngle = Math.PI / 2;
      currentAngle = centerAngle + totalThetaWidth / 2;
      incrementSign = -1;
    }

    for (let i = 0; i < chars.length; i++) {
      const char = chars[i];
      const charWidth = charWidths[i];

      // Calculate the speed at the current angle
      const speed = Math.sqrt(
        rx * rx * Math.sin(currentAngle) * Math.sin(currentAngle) +
        ry * ry * Math.cos(currentAngle) * Math.cos(currentAngle)
      );

      // Parameter step for this character
      const charTheta = (charWidth * gapMultiplier) / speed;

      // Position is at the center of this character's angular span
      const placementAngle = currentAngle + (charTheta / 2) * incrementSign;

      ctx.save();
      const charX = cx + rx * Math.cos(placementAngle);
      const charY = cy + ry * Math.sin(placementAngle);

      ctx.translate(charX, charY);
      
      // Ellipse outward normal angle
      const normalAngle = Math.atan2(rx * Math.sin(placementAngle), ry * Math.cos(placementAngle));
      if (isTop) {
        ctx.rotate(normalAngle + Math.PI / 2);
      } else {
        ctx.rotate(normalAngle - Math.PI / 2);
      }

      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(char, 0, 0);
      ctx.restore();

      // Advance currentAngle by the full character theta for the next character
      currentAngle += charTheta * incrementSign;
    }
  };

  // Oval Stamp Draw Logic with double outside rings, custom inner boundary, and dual ink wheel
  const drawOvalStamp = (
    ctx: CanvasRenderingContext2D,
    size: number,
    opt: StampSettings
  ) => {
    const cx = size / 2;
    const cy = size / 2;
    const inkColor = STAMP_COLORS[opt.colorPreset] || opt.customColor;

    // 1. Double Outer Rings (Outermost Thick, Innermost Thin)
    ctx.lineWidth = opt.borderWidth;
    ctx.strokeStyle = inkColor;

    ctx.beginPath();
    ctx.ellipse(cx, cy, 240, 155, 0, 0, Math.PI * 2);
    ctx.stroke();

    ctx.lineWidth = Math.max(1, opt.borderWidth / 2.5);
    ctx.beginPath();
    ctx.ellipse(cx, cy, 222, 137, 0, 0, Math.PI * 2);
    ctx.stroke();

    // Central core boundary ring
    ctx.lineWidth = Math.max(1, opt.borderWidth / 3);
    ctx.beginPath();
    ctx.ellipse(cx, cy, 145, 76, 0, 0, Math.PI * 2);
    ctx.stroke();

    // 2. Curving Top and Bottom Text
    if (opt.textTop) {
      drawTextOnEllipse(ctx, opt.textTop.toUpperCase(), cx, cy, 182, 105, true, 23);
    }
    if (opt.textBottom) {
      drawTextOnEllipse(ctx, opt.textBottom.toUpperCase(), cx, cy, 181, 104, false, 21);
    }

    // 3. Side Star Decals
    ctx.fillStyle = inkColor;
    drawStar(ctx, cx - 182, cy, 5, 8, 4);
    drawStar(ctx, cx + 182, cy, 5, 8, 4);

    // 4. Center Rows Inside Innermost Ellipse (Date wheel gets red colored automatically)
    const centerRows = [
      { text: opt.textCenter1, font: `bold 22px "Inter", "Arial Black", sans-serif`, forceUpper: true, isDate: true },
      { text: opt.textCenter2, font: `600 16px "Inter", sans-serif`, forceUpper: false, isDate: false },
      { text: opt.textCenter3, font: `500 14px "JetBrains Mono", monospace`, forceUpper: false, isDate: false },
    ].filter(item => item.text && item.text.trim() !== '');

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const totalRowsCount = centerRows.length;
    if (totalRowsCount > 0) {
      const spacing = totalRowsCount === 3 ? 24 : totalRowsCount === 2 ? 30 : 36;
      const totalHeight = (totalRowsCount - 1) * spacing;
      const startY = cy - totalHeight / 2;
      const innerRx = 145;
      const innerRy = 76;

      centerRows.forEach((row, index) => {
        const yPos = startY + index * spacing;
        const dy = Math.abs(yPos - cy);
        
        // Compute ellipse chord width at vertical offset dy from the center.
        // x^2 / rx^2 + y^2 / ry^2 = 1 => x^2 = rx^2 * (1 - y^2 / ry^2)
        const safeWidth = dy < innerRy 
          ? 2 * innerRx * Math.sqrt(1 - (dy * dy) / (innerRy * innerRy)) - 16
          : 0;

        const renderText = row.forceUpper ? row.text.toUpperCase() : row.text;

        const fontMatch = row.font.match(/(\d+)px/);
        let fontSize = fontMatch ? parseInt(fontMatch[1]) : 16;
        const fontStyleAndFamily = row.font.replace(/\d+px/, 'TOKEN_FONT_SIZE');

        ctx.font = fontStyleAndFamily.replace('TOKEN_FONT_SIZE', `${fontSize}px`);
        let textWidth = ctx.measureText(renderText).width;

        while (textWidth > safeWidth && fontSize > 8.5) {
          fontSize -= 0.5;
          ctx.font = fontStyleAndFamily.replace('TOKEN_FONT_SIZE', `${fontSize}px`);
          textWidth = ctx.measureText(renderText).width;
        }

        // Apply beautiful dual ink-wheel effect (date row in crimson red, others preset-color)
        if (row.isDate && opt.colorPreset !== 'red') {
          ctx.fillStyle = '#be123c';
        } else {
          ctx.fillStyle = inkColor;
        }

        ctx.fillText(renderText, cx, yPos);
      });
    }
  };

  // Pixel-level Procedural Stamp Grunge & Ink bleeds simulator
  const applyProceduralGrunge = (
    ctx: CanvasRenderingContext2D,
    size: number,
    intensity: number
  ) => {
    const rawData = ctx.getImageData(0, 0, size, size);
    const data = rawData.data;
    const bleed = settings.inkBleed; // Level of outer fuzziness/bleed

    // Multipliers for noise frequency
    const noiseScale = 0.085;
    const factor = intensity / 100; // 0 to 1 scale

    // We cycle through pixels to erode, scatter, and smudge the stamp boundary organically
    for (let y = 1; y < size - 1; y++) {
      for (let x = 1; x < size - 1; x++) {
        const id = (y * size + x) * 4;
        const currentAlpha = data[id + 3];

        if (currentAlpha > 30) {
          // Generate customized pseudo-random noise patterns
          const pNoise =
            Math.sin(x * noiseScale) * Math.cos(y * noiseScale) +
            Math.cos(x * noiseScale * 2.3 + 1.2) * Math.sin(y * noiseScale * 1.9 + 0.5) +
            Math.tan(Math.sin(x * y * 0.0005) * 4.0);

          let erosion = pNoise * 0.45 + (Math.random() - 0.5) * 1.1;

          // Increase edge erosion by checking adjacent transparent pixels
          let edgeDensity = 0;
          for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
              edgeDensity += data[((y + dy) * size + (x + dx)) * 4 + 3];
            }
          }
          edgeDensity /= 9 * 255; // Normalize 0 to 1

          if (edgeDensity < 0.9) {
            // High erosion on outer edges
            erosion += (1 - edgeDensity) * 1.8;
          }

          // Apply calculated alpha drop (causing standard dry-ink specks)
          if (erosion > 1.25 - factor * 2) {
            // Solid erosion point
            data[id + 3] = Math.max(0, currentAlpha - (erosion * 150 * factor));
          } else {
            // Subtle color tint variance for high-pressure vs light-pressure areas
            const pressDepress = Math.max(0.65, 1.0 - (1.0 - edgeDensity) * factor);
            data[id] = Math.max(0, Math.min(255, data[id] * pressDepress));     // R
            data[id + 1] = Math.max(0, Math.min(255, data[id + 1] * pressDepress)); // G
            data[id + 2] = Math.max(0, Math.min(255, data[id + 2] * pressDepress)); // B
          }

          // Simulate Ink Bleed by bleeding current ink onto adjacent transparent pixels
          if (bleed > 0 && Math.random() < bleed * 0.05 * factor) {
            // Displace single ink-molecules slightly around boundary
            const rx = x + Math.round((Math.random() - 0.5) * 2.8 * bleed);
            const ry = y + Math.round((Math.random() - 0.5) * 2.8 * bleed);
            if (rx > 0 && rx < size && ry > 0 && ry < size) {
              const nid = (ry * size + rx) * 4;
              if (data[nid + 3] < 50) {
                data[nid] = data[id];
                data[nid + 1] = data[id + 1];
                data[nid + 2] = data[id + 2];
                data[nid + 3] = currentAlpha * 0.45 * factor; // lighter halo border
              }
            }
          }
        }
      }
    }

    // Overwrite the canvas with simulated realistic textures
    ctx.putImageData(rawData, 0, 0);
  };

  return (
    <div className={`relative flex items-center justify-center p-2 bg-radial-gradient ${className}`}>
      <canvas
        ref={canvasRef}
        id="official-stamp-rendering-canvas"
        className="w-full h-auto aspect-square rounded max-w-[280px]"
        style={{
          filter: 'drop-shadow(0px 3px 6px rgba(0, 0, 0, 0.12))',
        }}
      />
    </div>
  );
};
