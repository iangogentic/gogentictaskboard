"use client";

import { useDroppable } from "@dnd-kit/core";
import { useTheme } from "@/lib/themes/provider";

interface DroppableColumnProps {
  id: string;
  children: React.ReactNode;
}

export default function DroppableColumn({
  id,
  children,
}: DroppableColumnProps) {
  const { backgroundMode } = useTheme();
  const { isOver, setNodeRef } = useDroppable({
    id: id,
    data: {
      type: "column",
    },
  });

  const baseStyles =
    backgroundMode === "light"
      ? "bg-black/60 backdrop-blur-xl border-black/20"
      : "bg-white/[0.02] backdrop-blur-xl border-white/10";

  const hoverStyles = isOver
    ? "bg-purple-500/10 ring-2 ring-purple-400/50 border-purple-400/50"
    : "";

  return (
    <div
      ref={setNodeRef}
      className={`${baseStyles} rounded-xl p-4 min-h-[400px] transition-all ${hoverStyles}`}
    >
      {children}
    </div>
  );
}
