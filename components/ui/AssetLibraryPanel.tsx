import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GlassTooltip } from '@/components/ui/glass-tooltip';
import { X } from 'lucide-react';

// Types for uploaded asset
export type UploadedAsset = {
  id: string;
  url: string;
  name: string;
  mimeType: string;
};

/**
 * AssetLibraryPanel
 * ----------------
 * A modal panel that fetches the user's uploaded images (via `/api/uploads/list`)
 * and displays them in a responsive grid. Clicking an image calls the `onSelect`
 * callback with the asset URL so the caller can insert it into the canvas.
 */
export default function AssetLibraryPanel({
  open,
  onClose,
  onSelect,
}: {
  open: boolean;
  onClose: () => void;
  /** Called with the URL of the selected asset */
  onSelect: (url: string) => void;
}) {
  const [assets, setAssets] = useState<UploadedAsset[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    setError(null);
    fetch('/api/uploads/list')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setAssets(data);
        else setAssets(data.assets ?? []);
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load assets'))
      .finally(() => setLoading(false));
  }, [open]);

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
              <button onClick={onClose} className="p-1 rounded hover:bg-white/20">
                <X size={20} />
              </button>
            </div>
            {loading && <p className="text-sm text-gray-400">Loading...</p>}
            {error && <p className="text-sm text-red-500">{error}</p>}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {assets.map((asset) => (
                <GlassTooltip key={asset.id} content="Insert into canvas">
                  <motion.button
                    className="p-1 rounded hover:bg-white/20 transition"
                    whileHover={{ scale: 1.05 }}
                    onClick={() => onSelect(asset.url)}
                  >
                    <img
                      src={asset.url}
                      alt={asset.name}
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
