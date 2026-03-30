"use client"

import { useWorkspaceStore } from "@/store/workspaceStore"
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core"
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { CanvasElement } from "@/store/workspaceStore"

// Single Layer Row Component
function LayerItem({ element }: { element: CanvasElement }) {
  const { selectedElementId, setSelectedElement, toggleVisibility, toggleLock } =
    useWorkspaceStore()

  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: element.id,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const isSelected = selectedElementId === element.id

  const typeIcon = element.type === "rect" ? "⬛" : element.type === "circle" ? "⭕" : "🔤"

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-2 px-3 py-2 rounded-lg mb-1 cursor-pointer group
        ${isSelected ? "bg-indigo-600" : "bg-zinc-800 hover:bg-zinc-700"}`}
      onClick={() => setSelectedElement(element.id)}
    >
      {/* Drag Handle */}
      <span
        {...attributes}
        {...listeners}
        className="text-zinc-500 cursor-grab active:cursor-grabbing text-xs"
        onClick={(e) => e.stopPropagation()}
      >
        ⠿
      </span>

      {/* Type Icon */}
      <span className="text-sm">{typeIcon}</span>

      {/* Label */}
      <span className="flex-1 text-sm truncate">
        {element.label}
      </span>

      {/* Visibility Toggle */}
      <button
        onClick={(e) => {
          e.stopPropagation()
          toggleVisibility(element.id)
        }}
        className="text-sm opacity-60 hover:opacity-100"
        title="Toggle Visibility"
      >
        {element.visible ? "👁️" : "🙈"}
      </button>

      {/* Lock Toggle */}
      <button
        onClick={(e) => {
          e.stopPropagation()
          toggleLock(element.id)
        }}
        className="text-sm opacity-60 hover:opacity-100"
        title="Toggle Lock"
      >
        {element.locked ? "🔒" : "🔓"}
      </button>
    </div>
  )
}

// Main Layer Panel
export default function LayerPanel() {
  const { elementList, updateLayerOrder } = useWorkspaceStore()

  const sensors = useSensors(useSensor(PointerSensor))

  const sortedElements = [...elementList].sort((a, b) => a.layer_order - b.layer_order)

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = sortedElements.findIndex((el) => el.id === active.id)
    const newIndex = sortedElements.findIndex((el) => el.id === over.id)

    const reordered = arrayMove(sortedElements, oldIndex, newIndex).map((el, index) => ({
      ...el,
      layer_order: index + 1,
    }))

    updateLayerOrder(reordered)
  }

  return (
    <div className="w-56 h-full bg-zinc-900 border-r border-zinc-700 p-3 text-white flex flex-col">
      <h2 className="text-sm font-semibold text-zinc-400 uppercase mb-3 tracking-wider">
        Layers
      </h2>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={sortedElements.map((el) => el.id)}
          strategy={verticalListSortingStrategy}
        >
          {sortedElements.map((element) => (
            <LayerItem key={element.id} element={element} />
          ))}
        </SortableContext>
      </DndContext>

      <div className="mt-auto pt-3 border-t border-zinc-700">
        <p className="text-xs text-zinc-500">{elementList.length} elements</p>
      </div>
    </div>
  )
}