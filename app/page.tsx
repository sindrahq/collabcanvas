import InspectorPanel from "@/components/inspector/InspectorPanel"
import LayerPanel from "@/components/layers/LayerPanel"

export default function Home() {
  return (
    <main className="flex h-screen w-screen overflow-hidden bg-zinc-950 text-white">

      {/* Left - Layer Panel */}
      <div className="flex-shrink-0">
        <LayerPanel />
      </div>

      {/* Center - Canvas Area */}
      <div className="flex-1 flex items-center justify-center text-zinc-600 text-sm">
        Canvas Area (Harsh's part)
      </div>

      {/* Right - Inspector Panel */}
      <div className="flex-shrink-0">
        <InspectorPanel />
      </div>

    </main>
  )
}