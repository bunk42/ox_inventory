import React, { RefObject, useRef } from "react";
import { DragLayerMonitor, useDragLayer, XYCoord } from "react-dnd";
import { ItemProps } from "../../typings";

interface DragLayerProps {
  item: { item: ItemProps };
  currentOffset: XYCoord | null;
  isDragging: boolean;
}

const subtract = (a: XYCoord, b: XYCoord): XYCoord => {
  return {
    x: a.x - b.x,
    y: a.y - b.y,
  };
};

const calculateParentOffset = (monitor: DragLayerMonitor): XYCoord => {
  const client = monitor.getInitialClientOffset();
  const source = monitor.getInitialSourceClientOffset();
  // TODO: why is client containing `undefined` values _sometimes_?
  // more precisely, just after MultiBackend switched from HTML5 to Touch _for the first time_?
  if (
    client === null ||
    source === null ||
    client.x === undefined ||
    client.y === undefined
  ) {
    return { x: 0, y: 0 };
  }
  return subtract(client, source);
};

export const calculatePointerPosition = (
  monitor: DragLayerMonitor,
  childRef: RefObject<Element>
): XYCoord | null => {
  const offset = monitor.getClientOffset();
  if (offset === null) {
    return null;
  }

  // If we don't have a reference to a valid child, use the default offset:
  // current cursor - initial parent/drag source offset
  if (!childRef.current || !childRef.current.getBoundingClientRect) {
    return subtract(offset, calculateParentOffset(monitor));
  }

  const bb = childRef.current.getBoundingClientRect();
  const middle = { x: bb.width / 2, y: bb.height / 2 };
  return subtract(offset, middle);
};

const DragPreview: React.FC = () => {
  const element = useRef<HTMLDivElement>(null);
  const { item, isDragging, currentOffset } = useDragLayer<DragLayerProps>(
    (monitor) => ({
      item: monitor.getItem(),
      currentOffset: calculatePointerPosition(monitor, element),
      isDragging: monitor.isDragging(),
    })
  );

  return (
    <>
      {isDragging && currentOffset && (
        <div
          ref={element}
          style={{
            position: "fixed",
            pointerEvents: "none",
            top: 0,
            left: 0,
            transform: `translate(${currentOffset.x}px, ${currentOffset.y}px)`,
            WebkitTransform: `translate(${currentOffset.x}px, ${currentOffset.y}px)`,
            zIndex: 1,
          }}
        >
          <img
            src={process.env.PUBLIC_URL + `/images/${item.item.name}.png`}
            style={{
              imageRendering: "-webkit-optimize-contrast",
              maxWidth: "80%",
            }}
          />
        </div>
      )}
    </>
  );
};

export default DragPreview;
