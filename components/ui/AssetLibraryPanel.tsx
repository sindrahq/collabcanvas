import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GlassTooltip } from '@/components/ui/glass-tooltip';
import { RefreshCw, X } from 'lucide-react';
import type { UploadedAsset } from '@/types/integration';
import Image from "next/image";

/**
 * AssetLibraryPanel
 * ----------------
 * A modal panel that fetches the user's uploaded images (via `/api/upload/list`)
 * and displays them in a responsive grid. Clicking an image calls the `onSelect`
 * callback with the asset URL so the caller can insert it into the canvas.
 */
export default function AssetLibraryPanel({
  open,
  onClose,
  onSelect,
  assets,
  loading,
  error,
  onRefresh,
}: {
  open: boolean;
  onClose: () => void;
  onSelect: (url: string) => void;
  assets: UploadedAsset[];
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
}) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="glass-panel-deep w-[90%] max-w-3xl rounded-2xl p-6 overflow-y-auto max-h-[80vh]"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Asset Library</h2>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onRefresh}
                  disabled={loading}
                  className="p-1 rounded hover:bg-white/20 disabled:opacity-50"
                  title="Refresh assets"
                >
                  <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
                </button>
                <button type="button" onClick={onClose} className="p-1 rounded hover:bg-white/20" aria-label="Close asset library">
                  <X size={20} />
                </button>
              </div>
            </div>
            {loading && <p className="text-sm text-gray-400">Loading...</p>}
            {error && <p className="text-sm text-red-500">{error}</p>}
            {!loading && !error && assets.length === 0 && (
              <p className="py-8 text-center text-sm text-gray-400">No uploaded assets yet.</p>
            )}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {assets.map((asset) => (
                <GlassTooltip key={asset.id} content="Insert into canvas">
                  <motion.button
                    className="p-1 rounded hover:bg-white/20 transition"
                    whileHover={{ scale: 1.05 }}
                    onClick={() => onSelect(asset.url)}
                  >
                    <Image
                      src={asset.url}
                      alt={asset.name}
                      width={160}
                      height={96}
                      unoptimized
                      className="object-cover w-full h-24 rounded"
                    />
                  </motion.button>
                </GlassTooltip>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
