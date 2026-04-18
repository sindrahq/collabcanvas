import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement> & { title?: string };

export function PaletteIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 64 64" fill="none" aria-hidden={props.title ? undefined : true} role={props.title ? "img" : "presentation"} {...props}>
      {props.title ? <title>{props.title}</title> : null}
      <circle cx="32" cy="32" r="24" stroke="currentColor" strokeWidth="3" />
      <path d="M24 22h16M24 32h10M24 42h8" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

export function LightningIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 64 64" fill="none" aria-hidden={props.title ? undefined : true} role={props.title ? "img" : "presentation"} {...props}>
      {props.title ? <title>{props.title}</title> : null}
      <path d="M36 6 16 36h14l-2 22 20-30H34L36 6Z" fill="currentColor" />
    </svg>
  );
}

export function HandshakeIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 64 64" fill="none" aria-hidden={props.title ? undefined : true} role={props.title ? "img" : "presentation"} {...props}>
      {props.title ? <title>{props.title}</title> : null}
      <path d="M12 28h12l8 8a6 6 0 0 0 8 0l4-4" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M52 28H40l-8 8a6 6 0 0 1-8 0l-4-4" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="18" y="22" width="28" height="20" rx="10" stroke="currentColor" strokeWidth="3" />
    </svg>
  );
}

export function MagnifierIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 64 64" fill="none" aria-hidden={props.title ? undefined : true} role={props.title ? "img" : "presentation"} {...props}>
      {props.title ? <title>{props.title}</title> : null}
      <circle cx="27" cy="27" r="14" stroke="currentColor" strokeWidth="3" />
      <path d="m38 38 14 14" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

export function LayersIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 64 64" fill="none" aria-hidden={props.title ? undefined : true} role={props.title ? "img" : "presentation"} {...props}>
      {props.title ? <title>{props.title}</title> : null}
      <path d="m32 10 20 10-20 10L12 20l20-10Z" stroke="currentColor" strokeWidth="3" strokeLinejoin="round" />
      <path d="m32 26 20 10-20 10-20-10 20-10Z" stroke="currentColor" strokeWidth="3" strokeLinejoin="round" />
      <path d="m32 42 20 10-20 10-20-10 20-10Z" stroke="currentColor" strokeWidth="3" strokeLinejoin="round" />
    </svg>
  );
}

export function SparklesIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 64 64" fill="none" aria-hidden={props.title ? undefined : true} role={props.title ? "img" : "presentation"} {...props}>
      {props.title ? <title>{props.title}</title> : null}
      <path d="M32 8l4.2 12.8L49 25l-12.8 4.2L32 42l-4.2-12.8L15 25l12.8-4.2L32 8Z" fill="currentColor" />
      <path d="M48 36l2.2 6.8L57 45l-6.8 2.2L48 54l-2.2-6.8L39 45l6.8-2.2L48 36Z" fill="currentColor" opacity="0.85" />
    </svg>
  );
}
