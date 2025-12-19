"use client";

import { useEffect, useState } from "react";
import { useEditorStateStore } from "@/stores/editorStateStore";
import { PositionSidebar } from "./PositionSidebar";

export function PositionSidebarWrapper() {
  const { getBlock } = useEditorStateStore();
  const [isOpen, setIsOpen] = useState(false);
  const [blockId, setBlockId] = useState<string | null>(null);

  useEffect(() => {
    const handleOpen = (e: CustomEvent) => {
      const { blockId: id } = e.detail;
      setBlockId(id);
      setIsOpen(true);
    };

    window.addEventListener("open-position-sidebar", handleOpen as EventListener);
    return () => window.removeEventListener("open-position-sidebar", handleOpen as EventListener);
  }, []);

  if (!isOpen || !blockId) return null;

  const block = getBlock(blockId);
  if (!block) {
    setIsOpen(false);
    setBlockId(null);
    return null;
  }

  return (
    <PositionSidebar
      block={block}
      isOpen={isOpen}
      onClose={() => {
        setIsOpen(false);
        setBlockId(null);
      }}
    />
  );
}
