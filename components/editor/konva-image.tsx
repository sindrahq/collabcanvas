import { Image } from "react-konva";
import { useEffect, useRef, useState } from "react";

export function KonvaImage({ imageUrl, ...props }: { imageUrl: string; [key: string]: unknown }) {
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  const [error, setError] = useState(false);
  const urlRef = useRef(imageUrl);

  useEffect(() => {
    if (!imageUrl) return;
    setTimeout(() => setError(false), 0);
    const image = new window.Image();
    image.crossOrigin = "anonymous";
    image.src = imageUrl;
    image.onload = () => setImg(image);
    image.onerror = () => {
      setError(true);
      setImg(null);
      console.warn("Failed to load image for KonvaImage:", imageUrl);
    };
    urlRef.current = imageUrl;
    return () => {
      if (urlRef.current === imageUrl) setImg(null);
    };
  }, [imageUrl]);

  if (error) return null;
  if (!img) return null;
  return <Image image={img} {...props} />;
}
