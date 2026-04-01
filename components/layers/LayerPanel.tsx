"use client";

import { DndContext, PointerSensor, closestCenter, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { SortableContext, arrayMove, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import { type CanvasElement, useWorkspaceStore } from "@/store/workspaceStore";

function LayerItem({ element }: { element: CanvasElement }) {
  const { selectedElementId, selectElement, toggleVisibility, toggleLock } = useWorkspaceStore();
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: element.id
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition
  };

  const isSelected = selectedElementId === element.id;
  const typeIcon =
    element.type === "rectangle"
      ? "[]"
      : element.type === "circle"
        ? "()"
        : "T";

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group mb-1 flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 ${
        isSelected ? "bg-indigo-600" : "bg-zinc-800 hover:bg-zinc-700"
      }`}
      onClick={() => selectElement(element.id)}
    >
      <span
        {...attributes}
        {...listeners}
        className="cursor-grab text-xs text-zinc-500 active:cursor-grabbing"
        onClick={(event) => event.stopPropagation()}
      >
        ::
      </span>

      <span className="text-sm">{typeIcon}</span>

      <span className="flex-1 truncate text-sm">{element.label}</span>

      <button
        onClick={(event) => {
          event.stopPropagation();
          toggleVisibility(element.id);
        }}
        className="text-sm opacity-60 hover:opacity-100"
        title="Toggle Visibility"
      >
        {element.visible ? "Show" : "Hide"}
      </button>

      <button
        onClick={(event) => {
          event.stopPropagation();
          toggleLock(element.id);
        }}
        className="text-sm opacity-60 hover:opacity-100"
        title="Toggle Lock"
      >
        {element.locked ? "Lock" : "Free"}
      </button>
    </div>
  );
}

export default function LayerPanel() {
  const { elementList, updateLayerOrder } = useWorkspaceStore();
  const sensors = useSensors(useSensor(PointerSensor));
  const sortedElements = [...elementList].sort((left, right) => left.layer_order - right.layer_order);

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    const oldIndex = sortedElements.findIndex((element) => element.id === active.id);
    const newIndex = sortedElements.findIndex((element) => element.id === over.id);

    const reordered = arrayMove(sortedElements, oldIndex, newIndex).map((element, index) => ({
      ...element,
      layer_order: index,
      layerOrder: index
    }));

    updateLayerOrder(reordered);
  }

  return (
    <div className="flex h-full w-56 flex-col border-r border-zinc-700 bg-zinc-900 p-3 text-white">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-zinc-400">Layers</h2>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={sortedElements.map((element) => element.id)} strategy={verticalListSortingStrategy}>
          {sortedElements.map((element) => (
            <LayerItem key={element.id} element={element} />
          ))}
        </SortableContext>
      </DndContext>

      <div className="mt-auto border-t border-zinc-700 pt-3">
        <p className="text-xs text-zinc-500">{elementList.length} elements</p>
      </div>
    </div>
  );
}
