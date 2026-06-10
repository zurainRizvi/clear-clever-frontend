/** Downsample long daily series so Recharts stays readable (e.g. all-time analytics). */
export function compressChartSeries(
  xAxis: string[],
  series: Record<string, number[]>,
  maxPoints = 31
): { xAxis: string[]; series: Record<string, number[]> } {
  const keys = Object.keys(series);
  if (xAxis.length <= maxPoints) {
    return { xAxis, series };
  }

  const bucketSize = Math.ceil(xAxis.length / maxPoints);
  const nextX: string[] = [];
  const nextSeries: Record<string, number[]> = Object.fromEntries(keys.map((key) => [key, []]));

  for (let start = 0; start < xAxis.length; start += bucketSize) {
    const end = Math.min(start + bucketSize, xAxis.length);
    const sliceLabels = xAxis.slice(start, end);
    nextX.push(
      sliceLabels.length === 1
        ? sliceLabels[0]
        : `${sliceLabels[0]} – ${sliceLabels[sliceLabels.length - 1]}`
    );
    for (const key of keys) {
      const slice = series[key]?.slice(start, end) ?? [];
      const total = slice.reduce((sum, value) => sum + value, 0);
      nextSeries[key].push(total);
    }
  }

  return { xAxis: nextX, series: nextSeries };
}

export function maxSeriesValue(rows: Array<Record<string, string | number>>, keys: string[]): number {
  let max = 0;
  for (const row of rows) {
    for (const key of keys) {
      const value = Number(row[key] ?? 0);
      if (Number.isFinite(value)) max = Math.max(max, value);
    }
  }
  return max;
}
