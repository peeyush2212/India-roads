"use client";

import dynamic from "next/dynamic";
import type { EChartsOption } from "echarts";

const ReactECharts = dynamic(() => import("echarts-for-react"), { ssr: false });

export function EChart({
  option,
  style,
  className,
  onEvents,
}: {
  option: EChartsOption;
  style?: React.CSSProperties;
  className?: string;
  onEvents?: Record<string, (params: any) => void>;
}) {
  return (
    <div className={className}>
      <ReactECharts option={option} style={style} onEvents={onEvents} notMerge lazyUpdate />
    </div>
  );
}
