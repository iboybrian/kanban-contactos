import { PointerSensor, TouchSensor, type PointerSensorOptions, type TouchSensorOptions } from "@dnd-kit/core";
import type { PointerEvent as ReactPointerEvent, TouchEvent as ReactTouchEvent } from "react";

function isDragBlocked(event: Event) {
  const target = event.target;
  return target instanceof Element && Boolean(target.closest("[data-no-drag]"));
}

/** Mouse only. Touch is handled by BoardTouchSensor so a quick tap can scroll or open the card. */
export class BoardPointerSensor extends PointerSensor {
  static activators = [
    {
      eventName: "onPointerDown" as const,
      handler: ({ nativeEvent }: ReactPointerEvent, { onActivation }: PointerSensorOptions) => {
        if (nativeEvent.isPrimary === false) return false;
        if (nativeEvent.button !== undefined && nativeEvent.button !== 0) return false;
        if (nativeEvent.pointerType === "touch") return false;
        if (isDragBlocked(nativeEvent)) return false;
        onActivation?.({ event: nativeEvent });
        return true;
      },
    },
  ];
}

/** Hold briefly, then drag. A short tap still clicks the card and the board can scroll. */
export class BoardTouchSensor extends TouchSensor {
  static activators = [
    {
      eventName: "onTouchStart" as const,
      handler: ({ nativeEvent }: ReactTouchEvent, { onActivation }: TouchSensorOptions) => {
        if (nativeEvent.touches.length > 1) return false;
        if (isDragBlocked(nativeEvent)) return false;
        onActivation?.({ event: nativeEvent });
        return true;
      },
    },
  ];
}
