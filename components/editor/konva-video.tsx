"use client";

import { Image } from "react-konva";
import { useEffect, useRef, useState } from "react";

export function KonvaVideo({
  videoUrl,
  trimStart = 0,
  ...props
}: {
  videoUrl: string;
  trimStart?: number;
  [key: string]: unknown;
}) {
  const [video, setVideo] = useState<HTMLVideoElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    if (!videoUrl) return;
    const el = document.createElement("video");
    el.crossOrigin = "anonymous";
    el.src = videoUrl;
    el.muted = true;
    el.playsInline = true;
    videoRef.current = el;

    const onLoaded = () => {
      el.currentTime = trimStart;
      setVideo(el);
    };
    el.addEventListener("loadeddata", onLoaded);
    el.load();

    return () => {
      el.removeEventListener("loadeddata", onLoaded);
      videoRef.current = null;
      setVideo(null);
    };
  }, [videoUrl, trimStart]);

  if (!video) return null;
  return <Image image={video} {...(props as Record<string, unknown>)} />;
}
