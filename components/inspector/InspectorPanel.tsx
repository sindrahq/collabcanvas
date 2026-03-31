"use client"

import { useWorkspaceStore } from "@/store/workspaceStore"

export default function InspectorPanel() {
  const { selectedElementId, elementList, updateElement } = useWorkspaceStore()

  const selectedElement = elementList.find((el) => el.id === selectedElementId)

  if (!selectedElement) {
    return (
      <div className="w-64 h-full bg-zinc-900 border-l border-zinc-700 p-4 text-zinc-400 flex items-center justify-center">
        <p className="text-sm">Select an element to inspect</p>
      </div>
    )
  }

  const { style, type } = selectedElement

  return (
    <div className="w-64 h-full bg-zinc-900 border-l border-zinc-700 p-4 text-white overflow-y-auto">
      <h2 className="text-sm font-semibold text-zinc-400 uppercase mb-4 tracking-wider">
        Inspector
      </h2>

      {/* Background Color */}
      <div className="mb-4">
        <label className="text-xs text-zinc-400 mb-1 block">Background Color</label>
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={style.fill}
            onChange={(e) => updateElement(selectedElement.id, { fill: e.target.value })}
            className="w-8 h-8 rounded cursor-pointer border-0 bg-transparent"
          />
          <span className="text-sm font-mono">{style.fill}</span>
        </div>
      </div>

      {/* Stroke Color */}
      <div className="mb-4">
        <label className="text-xs text-zinc-400 mb-1 block">Stroke Color</label>
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={style.stroke}
            onChange={(e) => updateElement(selectedElement.id, { stroke: e.target.value })}
            className="w-8 h-8 rounded cursor-pointer border-0 bg-transparent"
          />
          <span className="text-sm font-mono">{style.stroke}</span>
        </div>
      </div>

      {/* Stroke Width */}
      <div className="mb-4">
        <label className="text-xs text-zinc-400 mb-1 block">
          Stroke Width: {style.strokeWidth}px
        </label>
        <input
          type="range"
          min={0}
          max={20}
          value={style.strokeWidth}
          onChange={(e) => updateElement(selectedElement.id, { strokeWidth: Number(e.target.value) })}
          className="w-full accent-indigo-500"
        />
      </div>

      {/* Opacity */}
      <div className="mb-4">
        <label className="text-xs text-zinc-400 mb-1 block">
          Opacity: {Math.round(style.opacity * 100)}%
        </label>
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={style.opacity}
          onChange={(e) => updateElement(selectedElement.id, { opacity: Number(e.target.value) })}
          className="w-full accent-indigo-500"
        />
      </div>

      {/* Font Size — only for text elements */}
      {type === "text" && (
        <div className="mb-4">
          <label className="text-xs text-zinc-400 mb-1 block">
            Font Size: {style.fontSize}px
          </label>
          <input
            type="range"
            min={8}
            max={72}
            value={style.fontSize}
            onChange={(e) => updateElement(selectedElement.id, { fontSize: Number(e.target.value) })}
            className="w-full accent-indigo-500"
          />
        </div>
      )}

      {/* Element Info */}
      <div className="mt-6 pt-4 border-t border-zinc-700">
        <p className="text-xs text-zinc-500">Type: <span className="text-zinc-300">{type}</span></p>
        <p className="text-xs text-zinc-500">ID: <span className="text-zinc-300 font-mono">{selectedElement.id}</span></p>
        <p className="text-xs text-zinc-500">Label: <span className="text-zinc-300">{selectedElement.label}</span></p>
      </div>
    </div>
  )
}