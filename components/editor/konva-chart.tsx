"use client";

import { Circle, Group, Line, Rect, Text, Wedge } from "react-konva";

export interface ChartDataPoint {
  label: string;
  value: number;
  color?: string;
}

export type ChartType = "bar" | "line" | "pie";

interface KonvaChartProps {
  x: number;
  y: number;
  width: number;
  height: number;
  chartType: ChartType;
  data: ChartDataPoint[];
  selected?: boolean;
  elevation?: number;
  onClick?: () => void;
  onTap?: () => void;
  draggable?: boolean;
  visible?: boolean;
  opacity?: number;
  rotation?: number;
  onDragEnd?: (e: any) => void;
  onTransformEnd?: (e: any) => void;
  nodeRef?: (node: any) => void;
}

const PALETTE = ["#D3A5B1", "#8b7355", "#6B8FAB", "#7A9E7E", "#C9956A", "#9B8EC4", "#d4a017", "#0284c7"];

export function KonvaChart({
  x, y, width, height,
  chartType,
  data,
  selected,
  elevation = 0,
  onClick, onTap,
  draggable, visible = true, opacity = 1, rotation = 0,
  onDragEnd, onTransformEnd, nodeRef,
}: KonvaChartProps) {
  const pad = { top: 24, right: 16, bottom: 32, left: 40 };
  const cw = Math.max(width - pad.left - pad.right, 10);
  const ch = Math.max(height - pad.top - pad.bottom, 10);
  const maxVal = Math.max(...data.map((d) => d.value), 1);
  const shadowBlur = selected ? 20 + elevation * 8 : 6 + elevation * 6;
  const shadowOpacity = selected ? 0.35 : 0.12 + elevation * 0.08;

  const groupProps = {
    x, y,
    rotation,
    draggable,
    visible,
    opacity,
    onClick,
    onTap,
    onDragEnd,
    onTransformEnd,
    ref: nodeRef,
  };

  if (chartType === "bar") {
    const slotW = cw / data.length;
    const barW = Math.max(slotW * 0.55, 6);
    return (
      <Group {...groupProps}>
        <Rect
          width={width} height={height}
          fill="white" cornerRadius={10}
          shadowBlur={shadowBlur} shadowColor="#D3A5B1" shadowOpacity={shadowOpacity}
        />
        {/* axes */}
        <Line points={[pad.left, pad.top, pad.left, pad.top + ch]} stroke="#e0d8d0" strokeWidth={1} />
        <Line points={[pad.left, pad.top + ch, pad.left + cw, pad.top + ch]} stroke="#e0d8d0" strokeWidth={1} />
        {/* y-axis label (max) */}
        <Text x={2} y={pad.top - 4} width={pad.left - 4} text={String(maxVal)} fontSize={9} fill="#9b8b7a" align="right" />
        {data.map((d, i) => {
          const barH = Math.max((d.value / maxVal) * ch, 2);
          const bx = pad.left + i * slotW + (slotW - barW) / 2;
          const by = pad.top + ch - barH;
          const color = d.color ?? PALETTE[i % PALETTE.length];
          return (
            <Group key={i}>
              <Rect x={bx} y={by} width={barW} height={barH} fill={color} cornerRadius={[3, 3, 0, 0]} />
              <Text x={bx} y={pad.top + ch + 5} width={barW} text={d.label} fontSize={9} fill="#8b7355" align="center" />
              {barH > 16 && (
                <Text x={bx} y={by + 3} width={barW} text={String(d.value)} fontSize={8} fill="white" align="center" fontStyle="bold" />
              )}
            </Group>
          );
        })}
        <Text x={0} y={4} width={width} text="Bar Chart" fontSize={10} fill="#b0a090" align="center" fontStyle="bold" />
      </Group>
    );
  }

  if (chartType === "line") {
    const n = data.length;
    const points: number[] = data.flatMap((d, i) => [
      pad.left + (n > 1 ? (i / (n - 1)) * cw : cw / 2),
      pad.top + ch - (d.value / maxVal) * ch,
    ]);
    return (
      <Group {...groupProps}>
        <Rect
          width={width} height={height}
          fill="white" cornerRadius={10}
          shadowBlur={shadowBlur} shadowColor="#D3A5B1" shadowOpacity={shadowOpacity}
        />
        <Line points={[pad.left, pad.top, pad.left, pad.top + ch]} stroke="#e0d8d0" strokeWidth={1} />
        <Line points={[pad.left, pad.top + ch, pad.left + cw, pad.top + ch]} stroke="#e0d8d0" strokeWidth={1} />
        {points.length >= 4 && (
          <Line points={points} stroke={PALETTE[0]} strokeWidth={2.5} tension={0.35} lineCap="round" lineJoin="round" />
        )}
        {data.map((d, i) => {
          const px = pad.left + (n > 1 ? (i / (n - 1)) * cw : cw / 2);
          const py = pad.top + ch - (d.value / maxVal) * ch;
          return (
            <Group key={i}>
              <Circle x={px} y={py} radius={4} fill="white" stroke={PALETTE[0]} strokeWidth={2} />
              <Text x={px - 16} y={pad.top + ch + 5} width={32} text={d.label} fontSize={9} fill="#8b7355" align="center" />
            </Group>
          );
        })}
        <Text x={0} y={4} width={width} text="Line Chart" fontSize={10} fill="#b0a090" align="center" fontStyle="bold" />
      </Group>
    );
  }

  // pie
  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  const cx = width / 2;
  const cy = height / 2 + 8;
  const radius = Math.min(width, height) / 2 - 20;
  const wedges: React.ReactNode[] = [];
  let startAngle = -90;
  for (let i = 0; i < data.length; i++) {
    const angle = (data[i].value / total) * 360;
    wedges.push(
      <Wedge
        key={i}
        x={cx} y={cy}
        radius={radius}
        angle={angle}
        rotation={startAngle}
        fill={data[i].color ?? PALETTE[i % PALETTE.length]}
        stroke="white"
        strokeWidth={2}
      />
    );
    startAngle += angle;
  }

  return (
    <Group {...groupProps}>
      <Rect
        width={width} height={height}
        fill="white" cornerRadius={10}
        shadowBlur={shadowBlur} shadowColor="#D3A5B1" shadowOpacity={shadowOpacity}
      />
      <Text x={0} y={4} width={width} text="Pie Chart" fontSize={10} fill="#b0a090" align="center" fontStyle="bold" />
      {wedges}
      {data.slice(0, 6).map((d, i) => (
        <Group key={`leg-${i}`} x={6} y={18 + i * 13}>
          <Rect width={9} height={9} fill={d.color ?? PALETTE[i % PALETTE.length]} cornerRadius={2} />
          <Text x={13} y={0} text={`${d.label}: ${d.value}`} fontSize={9} fill="#4a3f35" />
        </Group>
      ))}
    </Group>
  );
}
