"use client";

import { useMemo } from "react";
import type { Block } from "@/types/blocks";
import { CANVAS_WIDTH, CANVAS_HEIGHT } from "./EditorCanvasWrapper";

const SNAP_THRESHOLD = 5; // pixels - how close to alignment before snapping
const GUIDE_LINE_COLOR = "#3b82f6"; // blue-500
const GUIDE_LINE_WIDTH = 1;
const DISTANCE_INDICATOR_THRESHOLD = 100; // Show distance indicators within this range

interface AlignmentGuidesProps {
  draggingBlock: Block | null;
  allBlocks: Block[];
  editorMode: "idle" | "dragging" | "resizing";
}

interface AlignmentLine {
  type: "horizontal" | "vertical";
  position: number; // x for vertical, y for horizontal
  label?: string; // optional distance label
}

interface DistanceIndicator {
  type: "horizontal" | "vertical";
  position: number;
  distance: number;
}

export function AlignmentGuides({
  draggingBlock,
  allBlocks,
  editorMode,
}: AlignmentGuidesProps) {
  const { guides, distanceIndicators } = useMemo(() => {
    if (!draggingBlock || editorMode !== "dragging") {
      return { guides: [], distanceIndicators: [] };
    }

    const lines: AlignmentLine[] = [];
    const indicators: DistanceIndicator[] = [];
    
    const draggingBlockCenterX = draggingBlock.position.x + draggingBlock.size.width / 2;
    const draggingBlockCenterY = draggingBlock.position.y + draggingBlock.size.height / 2;
    const draggingBlockLeft = draggingBlock.position.x;
    const draggingBlockRight = draggingBlock.position.x + draggingBlock.size.width;
    const draggingBlockTop = draggingBlock.position.y;
    const draggingBlockBottom = draggingBlock.position.y + draggingBlock.size.height;

    // Canvas center lines
    const canvasCenterX = CANVAS_WIDTH / 2;
    const canvasCenterY = CANVAS_HEIGHT / 2;

    // Check alignment with canvas center
    const distFromCenterX = Math.abs(draggingBlockCenterX - canvasCenterX);
    const distFromCenterY = Math.abs(draggingBlockCenterY - canvasCenterY);

    // Show distance indicators when close to center
    if (distFromCenterX > 0 && distFromCenterX <= DISTANCE_INDICATOR_THRESHOLD) {
      indicators.push({
        type: "vertical",
        position: draggingBlockCenterX,
        distance: distFromCenterX,
      });
    }
    if (distFromCenterY > 0 && distFromCenterY <= DISTANCE_INDICATOR_THRESHOLD) {
      indicators.push({
        type: "horizontal",
        position: draggingBlockCenterY,
        distance: distFromCenterY,
      });
    }

    // Show guide line when aligned with center
    if (distFromCenterX <= SNAP_THRESHOLD) {
      lines.push({
        type: "vertical",
        position: canvasCenterX,
        label: distFromCenterX > 0 ? `${Math.round(distFromCenterX)}px` : undefined,
      });
    }

    if (distFromCenterY <= SNAP_THRESHOLD) {
      lines.push({
        type: "horizontal",
        position: canvasCenterY,
        label: distFromCenterY > 0 ? `${Math.round(distFromCenterY)}px` : undefined,
      });
    }

    // Check alignment with other blocks
    for (const block of allBlocks) {
      if (block.id === draggingBlock.id) continue;

      const blockLeft = block.position.x;
      const blockRight = block.position.x + block.size.width;
      const blockTop = block.position.y;
      const blockBottom = block.position.y + block.size.height;
      const blockCenterX = block.position.x + block.size.width / 2;
      const blockCenterY = block.position.y + block.size.height / 2;

      // Vertical alignments (left, center, right)
      const distLeft = Math.abs(draggingBlockLeft - blockLeft);
      const distRight = Math.abs(draggingBlockRight - blockRight);
      const distCenterX = Math.abs(draggingBlockCenterX - blockCenterX);

      if (distLeft <= SNAP_THRESHOLD) {
        lines.push({
          type: "vertical",
          position: blockLeft,
        });
      }
      if (distRight <= SNAP_THRESHOLD) {
        lines.push({
          type: "vertical",
          position: blockRight,
        });
      }
      if (distCenterX <= SNAP_THRESHOLD) {
        lines.push({
          type: "vertical",
          position: blockCenterX,
        });
      }

      // Horizontal alignments (top, center, bottom)
      const distTop = Math.abs(draggingBlockTop - blockTop);
      const distBottom = Math.abs(draggingBlockBottom - blockBottom);
      const distCenterY = Math.abs(draggingBlockCenterY - blockCenterY);

      if (distTop <= SNAP_THRESHOLD) {
        lines.push({
          type: "horizontal",
          position: blockTop,
        });
      }
      if (distBottom <= SNAP_THRESHOLD) {
        lines.push({
          type: "horizontal",
          position: blockBottom,
        });
      }
      if (distCenterY <= SNAP_THRESHOLD) {
        lines.push({
          type: "horizontal",
          position: blockCenterY,
        });
      }
    }

    return { guides: lines, distanceIndicators: indicators };
  }, [draggingBlock, allBlocks, editorMode]);

  if (guides.length === 0 && distanceIndicators.length === 0) {
    return null;
  }

  return (
    <>
      {/* Distance indicators - small marks showing distance from center */}
      {distanceIndicators.map((indicator, index) => {
        if (indicator.type === "vertical") {
          return (
            <div
              key={`indicator-v-${index}`}
              style={{
                position: "absolute",
                left: `${indicator.position}px`,
                top: 0,
                width: "1px",
                height: "20px",
                backgroundColor: GUIDE_LINE_COLOR,
                opacity: 0.5,
                pointerEvents: "none",
                zIndex: 9998,
              }}
            >
              <div
                style={{
                  position: "absolute",
                  top: "-18px",
                  left: "4px",
                  backgroundColor: GUIDE_LINE_COLOR,
                  color: "white",
                  padding: "1px 4px",
                  borderRadius: "3px",
                  fontSize: "9px",
                  fontWeight: "500",
                  whiteSpace: "nowrap",
                }}
              >
                {Math.round(indicator.distance)}px
              </div>
            </div>
          );
        } else {
          return (
            <div
              key={`indicator-h-${index}`}
              style={{
                position: "absolute",
                left: 0,
                top: `${indicator.position}px`,
                width: "20px",
                height: "1px",
                backgroundColor: GUIDE_LINE_COLOR,
                opacity: 0.5,
                pointerEvents: "none",
                zIndex: 9998,
              }}
            >
              <div
                style={{
                  position: "absolute",
                  left: "-30px",
                  top: "-8px",
                  backgroundColor: GUIDE_LINE_COLOR,
                  color: "white",
                  padding: "1px 4px",
                  borderRadius: "3px",
                  fontSize: "9px",
                  fontWeight: "500",
                  whiteSpace: "nowrap",
                }}
              >
                {Math.round(indicator.distance)}px
              </div>
            </div>
          );
        }
      })}

      {/* Alignment guide lines */}
      {guides.map((guide, index) => {
        if (guide.type === "vertical") {
          return (
            <div
              key={`v-${index}`}
              style={{
                position: "absolute",
                left: `${guide.position}px`,
                top: 0,
                width: `${GUIDE_LINE_WIDTH}px`,
                height: `${CANVAS_HEIGHT}px`,
                backgroundColor: GUIDE_LINE_COLOR,
                pointerEvents: "none",
                zIndex: 9999,
              }}
            >
              {guide.label && (
                <div
                  style={{
                    position: "absolute",
                    top: "10px",
                    left: "4px",
                    backgroundColor: GUIDE_LINE_COLOR,
                    color: "white",
                    padding: "2px 6px",
                    borderRadius: "4px",
                    fontSize: "10px",
                    fontWeight: "500",
                    whiteSpace: "nowrap",
                  }}
                >
                  {guide.label}
                </div>
              )}
            </div>
          );
        } else {
          return (
            <div
              key={`h-${index}`}
              style={{
                position: "absolute",
                left: 0,
                top: `${guide.position}px`,
                width: `${CANVAS_WIDTH}px`,
                height: `${GUIDE_LINE_WIDTH}px`,
                backgroundColor: GUIDE_LINE_COLOR,
                pointerEvents: "none",
                zIndex: 9999,
              }}
            >
              {guide.label && (
                <div
                  style={{
                    position: "absolute",
                    left: "10px",
                    top: "-10px",
                    backgroundColor: GUIDE_LINE_COLOR,
                    color: "white",
                    padding: "2px 6px",
                    borderRadius: "4px",
                    fontSize: "10px",
                    fontWeight: "500",
                    whiteSpace: "nowrap",
                  }}
                >
                  {guide.label}
                </div>
              )}
            </div>
          );
        }
      })}
    </>
  );
}
