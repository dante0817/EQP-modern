import React, { useEffect, useMemo, useState } from 'react';
import { Globe, X } from 'lucide-react';
import { EQPEvent, MagnitudeScale, SolverEngine, StationPick } from '../data/eqpData';

export interface StationDurationMagRow {
  pickId: string;
  index: number;
  sta: string;
  td: number;
  hd: number;
  ml: number;
  mb: number;
  ms: number;
  included: boolean;
}

export interface DurationOutlierSummary {
  scaleLabel: 'Ms' | 'Mb' | 'Ml';
  eligibleCount: number;
  keptCount: number;
  outlierCount: number;
  meanAll: number;
  stdDev: number;
  filteredMean: number;
  lowerBound: number;
  upperBound: number;
  varianceK: number;
  outlierPickIds: Set<string>;
  zScoreByPickId: Map<string, number>;
}

interface MagnitudeDurationPopupProps {
  open: boolean;
  event: EQPEvent;
  varianceK?: number;
  onChangeVarianceK?: (nextK: number) => void;
  onApply: (result: {
    preferredScale: MagnitudeScale;
    ms: number;
    mb: number;
    md: number;
    updatedPicks: StationPick[];
  }) => void;
  onCancel: () => void;
}

export function isDurationMagnitudeEligible(pick: StationPick): boolean {
  return (
    pick.pTime.trim() !== '' &&
    !pick.pExcluded &&
    pick.duration !== null &&
    pick.duration !== undefined &&
    Number.isFinite(pick.duration) &&
    pick.duration > 0
  );
}

export function computeDurationMagnitudes(
  td: number,
  deltaDeg: number,
  depthKm: number
): { hd: number; ml: number; mb: number; ms: number } {
  const safeTd = Math.max(1, td);
  const depthDeg = Math.max(0, depthKm) / 111.32;
  const hd = Number(Math.hypot(Math.max(0.05, deltaDeg), depthDeg).toFixed(2));
  const ml = Number((3.24 * Math.log10(safeTd) + 0.0005 * hd - 3.49).toFixed(2));
  const mb = Number((0.865 * ml + 1.6).toFixed(2));
  const ms = Number((1.38 * ml - 1.44).toFixed(2));
  return { hd, ml, mb, ms };
}

export function computePickDurationMagnitudes(
  pick: StationPick,
  depthKm: number
): { hd: number; ml: number; mb: number; ms: number } | null {
  if (!isDurationMagnitudeEligible(pick)) return null;
  const td = Math.round(pick.duration as number);
  return computeDurationMagnitudes(td, pick.delta, depthKm);
}

export function computeDurationOutlierSummary(
  rows: ReadonlyArray<Pick<StationDurationMagRow, 'pickId' | 'ml' | 'mb' | 'ms'>>,
  scale: MagnitudeScale,
  varianceK: number
): DurationOutlierSummary {
  const scaleLabel: 'Ms' | 'Mb' | 'Ml' =
    scale === 'Ms' ? 'Ms' : scale === 'Mb' ? 'Mb' : 'Ml';
  const safeK = Number.isFinite(varianceK) && varianceK > 0 ? varianceK : 1.5;

  if (rows.length === 0) {
    return {
      scaleLabel,
      eligibleCount: 0,
      keptCount: 0,
      outlierCount: 0,
      meanAll: 0,
      stdDev: 0,
      filteredMean: 0,
      lowerBound: 0,
      upperBound: 0,
      varianceK: safeK,
      outlierPickIds: new Set<string>(),
      zScoreByPickId: new Map<string, number>(),
    };
  }

  const values = rows.map((row) => {
    const rawVal = scale === 'Ms' ? row.ms : scale === 'Mb' ? row.mb : row.ml;
    return {
      pickId: row.pickId,
      val: Number(rawVal.toFixed(1)),
    };
  });

  const meanAll = values.reduce((sum, item) => sum + item.val, 0) / values.length;
  const variance =
    values.reduce((sum, item) => sum + Math.pow(item.val - meanAll, 2), 0) /
    values.length;
  const stdDev = Math.sqrt(variance);

  const outlierPickIds = new Set<string>();
  const zScoreByPickId = new Map<string, number>();
  const kept: number[] = [];

  for (const item of values) {
    const diff = Math.abs(item.val - meanAll);
    const zScore = stdDev > 0 ? Number((diff / stdDev).toFixed(2)) : 0;
    zScoreByPickId.set(item.pickId, zScore);

    if (stdDev > 0.05 && diff > safeK * stdDev) {
      outlierPickIds.add(item.pickId);
    } else {
      kept.push(item.val);
    }
  }

  const filteredMean =
    kept.length > 0 ? kept.reduce((sum, v) => sum + v, 0) / kept.length : meanAll;

  return {
    scaleLabel,
    eligibleCount: values.length,
    keptCount: values.length - outlierPickIds.size,
    outlierCount: outlierPickIds.size,
    meanAll: Number(meanAll.toFixed(2)),
    stdDev: Number(stdDev.toFixed(2)),
    filteredMean: Number(filteredMean.toFixed(1)),
    lowerBound: Number((meanAll - safeK * stdDev).toFixed(2)),
    upperBound: Number((meanAll + safeK * stdDev).toFixed(2)),
    varianceK: safeK,
    outlierPickIds,
    zScoreByPickId,
  };
}

export function computeOutlierFilteredScaleMean(
  picks: ReadonlyArray<StationPick>,
  key: 'ms' | 'mb' | 'md',
  varianceK: number,
  fallback: number
): number {
  const eligible = picks.filter(
    (p) => isDurationMagnitudeEligible(p) && p[key] !== null && p.magExcluded !== true
  );
  if (eligible.length === 0) return fallback;

  const scale: MagnitudeScale = key === 'ms' ? 'Ms' : key === 'mb' ? 'Mb' : 'Md';
  const rows = eligible.map((p) => ({
    pickId: p.id,
    ms: p.ms ?? 0,
    mb: p.mb ?? 0,
    ml: p.md ?? 0,
  }));
  return computeDurationOutlierSummary(rows, scale, varianceK).filteredMean;
}

export function applyOutlierFilteredMagnitudeToEvent(
  ev: EQPEvent,
  varianceK: number,
  options?: {
    solverEngine?: SolverEngine;
    createHistoryIfEmpty?: boolean;
    utcTimestamp?: string;
  }
): {
  event: EQPEvent;
  ms: number;
  mb: number;
  md: number;
  meanAll: number;
  stdDev: number;
  filteredMean: number;
  outlierCount: number;
} {
  const pickDurationMap = new Map<
    string,
    { ms: number; mb: number; ml: number }
  >();
  const rows: Array<{ pickId: string; ms: number; mb: number; ml: number }> = [];

  for (const pick of ev.picks) {
    const durMag = computePickDurationMagnitudes(pick, ev.depthKm);
    if (!durMag) continue;
    const rounded = {
      ms: Number(durMag.ms.toFixed(1)),
      mb: Number(durMag.mb.toFixed(1)),
      ml: Number(durMag.ml.toFixed(1)),
    };
    pickDurationMap.set(pick.id, rounded);
    rows.push({
      pickId: pick.id,
      ms: durMag.ms,
      mb: durMag.mb,
      ml: durMag.ml,
    });
  }

  if (rows.length === 0) {
    const nextPicks = ev.picks.map((pick) => ({
      ...pick,
      ms: isDurationMagnitudeEligible(pick) ? pick.ms : null,
      mb: isDurationMagnitudeEligible(pick) ? pick.mb : null,
      md: isDurationMagnitudeEligible(pick) ? pick.md : null,
      magExcluded: undefined,
    }));
    const nextHistory =
      ev.magnitudeHistory.length > 0
        ? ev.magnitudeHistory.map((entry, idx) =>
            idx === ev.magnitudeHistory.length - 1
              ? { ...entry, ms: 0, mb: 0, md: 0 }
              : entry
          )
        : ev.magnitudeHistory;

    return {
      event: {
        ...ev,
        picks: nextPicks,
        ms: 0,
        mb: 0,
        md: 0,
        magnitudeHistory: nextHistory,
      },
      ms: 0,
      mb: 0,
      md: 0,
      meanAll: 0,
      stdDev: 0,
      filteredMean: 0,
      outlierCount: 0,
    };
  }

  const msSummary = computeDurationOutlierSummary(rows, 'Ms', varianceK);
  const mbSummary = computeDurationOutlierSummary(rows, 'Mb', varianceK);
  const mdSummary = computeDurationOutlierSummary(rows, 'Md', varianceK);

  const activeSummary =
    ev.preferredScale === 'Ms'
      ? msSummary
      : ev.preferredScale === 'Mb'
        ? mbSummary
        : mdSummary;

  const nextMs = msSummary.filteredMean;
  const nextMb = mbSummary.filteredMean;
  const nextMd = mdSummary.filteredMean;

  const nextPicks = ev.picks.map((pick) => {
    const computed = pickDurationMap.get(pick.id);
    if (!computed) {
      return {
        ...pick,
        ms: null,
        mb: null,
        md: null,
        magExcluded: undefined,
      };
    }
    return {
      ...pick,
      ms: computed.ms,
      mb: computed.mb,
      md: computed.ml,
      magExcluded: activeSummary.outlierPickIds.has(pick.id),
    };
  });

  const activePhases = nextPicks.reduce(
    (count, p) =>
      count + (p.pTime && !p.pExcluded ? 1 : 0) + (p.sTime && !p.sExcluded ? 1 : 0),
    0
  );

  let nextHistory = ev.magnitudeHistory;
  if (ev.magnitudeHistory.length > 0) {
    nextHistory = ev.magnitudeHistory.map((entry, idx) =>
      idx === ev.magnitudeHistory.length - 1
        ? {
            ...entry,
            ms: nextMs,
            mb: nextMb,
            md: nextMd,
          }
        : entry
    );
  } else if (options?.createHistoryIfEmpty) {
    const now = new Date();
    const utcTimestamp =
      options.utcTimestamp ??
      `${String(now.getUTCHours()).padStart(2, '0')}:${String(
        now.getUTCMinutes()
      ).padStart(2, '0')}:${String(now.getUTCSeconds()).padStart(2, '0')} UTC`;
    nextHistory = [
      {
        relocation: 'Reloc #1',
        timestamp: utcTimestamp,
        solver: options.solverEngine ?? 'EQP',
        rmsSec: ev.rmsSec,
        activePhases,
        ms: nextMs,
        mb: nextMb,
        md: nextMd,
      },
    ];
  }

  return {
    event: {
      ...ev,
      picks: nextPicks,
      ms: nextMs,
      mb: nextMb,
      md: nextMd,
      magnitudeHistory: nextHistory,
    },
    ms: nextMs,
    mb: nextMb,
    md: nextMd,
    meanAll: activeSummary.meanAll,
    stdDev: activeSummary.stdDev,
    filteredMean: activeSummary.filteredMean,
    outlierCount: activeSummary.outlierCount,
  };
}

export function buildDurationRowsWithOutlierFilter(
  event: EQPEvent,
  scale: MagnitudeScale,
  varianceK: number,
  options?: {
    autoRejectOutliers?: boolean;
    respectManualOverrides?: boolean;
  }
): {
  rows: StationDurationMagRow[];
  autoRejectActive: boolean;
} {
  const candidates = event.picks.filter(isDurationMagnitudeEligible);
  const autoRejectRequested = options?.autoRejectOutliers ?? true;
  const respectManualOverrides = options?.respectManualOverrides ?? true;

  const baseRows: StationDurationMagRow[] = candidates.map((pick, idx) => {
    const td = Math.round(pick.duration ?? 0);
    const computed = computeDurationMagnitudes(td, pick.delta, event.depthKm);

    return {
      pickId: pick.id,
      index: idx,
      sta: pick.sta,
      td,
      hd: computed.hd,
      ml: computed.ml,
      mb: computed.mb,
      ms: computed.ms,
      included: pick.magExcluded !== true,
    };
  });

  const summary = computeDurationOutlierSummary(baseRows, scale, varianceK);
  const pickById = new Map(candidates.map((p) => [p.id, p]));

  const hasExplicitOutlierInclude =
    respectManualOverrides &&
    baseRows.some((row) => {
      const pick = pickById.get(row.pickId);
      return pick?.magExcluded === false && summary.outlierPickIds.has(row.pickId);
    });

  const autoRejectActive = autoRejectRequested && !hasExplicitOutlierInclude;

  const rows = baseRows.map((row) => {
    const pick = pickById.get(row.pickId);
    if (pick?.magExcluded === true) {
      return { ...row, included: false };
    }
    if (autoRejectActive && summary.outlierPickIds.has(row.pickId)) {
      return { ...row, included: false };
    }
    return row;
  });

  return { rows, autoRejectActive };
}

export const MagnitudeDurationPopup: React.FC<MagnitudeDurationPopupProps> = ({
  open,
  event,
  varianceK,
  onChangeVarianceK,
  onApply,
  onCancel,
}) => {
  const [selectedScale, setSelectedScale] = useState<MagnitudeScale>(event.preferredScale);
  const [rows, setRows] = useState<StationDurationMagRow[]>([]);
  const [localK, setLocalK] = useState<number>(varianceK ?? 1.5);
  const [autoRejectOutliers, setAutoRejectOutliers] = useState<boolean>(true);

  const effectiveK = varianceK ?? localK;

  useEffect(() => {
    if (!open) return;
    setSelectedScale(event.preferredScale);
    const initial = buildDurationRowsWithOutlierFilter(
      event,
      event.preferredScale,
      varianceK ?? 1.5,
      { autoRejectOutliers: true, respectManualOverrides: true }
    );
    setRows(initial.rows);
    setAutoRejectOutliers(initial.autoRejectActive);
  }, [open, event]);

  useEffect(() => {
    if (varianceK !== undefined) {
      setLocalK(varianceK);
    }
  }, [varianceK]);

  const averages = useMemo(() => {
    const active = rows.filter((r) => r.included);
    if (active.length === 0) {
      return {
        ms: 0,
        mb: 0,
        ml: 0,
        count: 0,
      };
    }
    const mean = (vals: number[]) =>
      Number((vals.reduce((s, v) => s + v, 0) / vals.length).toFixed(1));
    return {
      ms: mean(active.map((r) => r.ms)),
      mb: mean(active.map((r) => r.mb)),
      ml: mean(active.map((r) => r.ml)),
      count: active.length,
    };
  }, [rows]);

  const outlierSummary = useMemo(
    () => computeDurationOutlierSummary(rows, selectedScale, effectiveK),
    [rows, selectedScale, effectiveK]
  );

  const hasUnexcludedOutliers = useMemo(
    () => rows.some((r) => r.included && outlierSummary.outlierPickIds.has(r.pickId)),
    [rows, outlierSummary.outlierPickIds]
  );

  const hasAnyExcluded = useMemo(() => rows.some((r) => !r.included), [rows]);

  if (!open) return null;

  const handleScaleChange = (nextScale: MagnitudeScale) => {
    setSelectedScale(nextScale);
    if (autoRejectOutliers) {
      const nextSummary = computeDurationOutlierSummary(rows, nextScale, effectiveK);
      setRows((prev) =>
        prev.map((row) => ({
          ...row,
          included: !nextSummary.outlierPickIds.has(row.pickId),
        }))
      );
    }
  };

  const handleKChange = (nextK: number) => {
    setLocalK(nextK);
    onChangeVarianceK?.(nextK);
    if (autoRejectOutliers) {
      const nextSummary = computeDurationOutlierSummary(rows, selectedScale, nextK);
      setRows((prev) =>
        prev.map((row) => ({
          ...row,
          included: !nextSummary.outlierPickIds.has(row.pickId),
        }))
      );
    }
  };

  const handleToggleAutoReject = (enabled: boolean) => {
    setAutoRejectOutliers(enabled);
    if (enabled) {
      setRows((prev) =>
        prev.map((row) => ({
          ...row,
          included: !outlierSummary.outlierPickIds.has(row.pickId),
        }))
      );
    }
  };

  const handleToggleRow = (pickId: string) => {
    const targetRow = rows.find((r) => r.pickId === pickId);
    const willIncludeOutlier =
      targetRow && !targetRow.included && outlierSummary.outlierPickIds.has(pickId);
    if (willIncludeOutlier) {
      setAutoRejectOutliers(false);
    }
    setRows((prev) =>
      prev.map((row) =>
        row.pickId === pickId ? { ...row, included: !row.included } : row
      )
    );
  };

  const handleExcludeOutliers = () => {
    setAutoRejectOutliers(true);
    setRows((prev) =>
      prev.map((row) => ({
        ...row,
        included: !outlierSummary.outlierPickIds.has(row.pickId),
      }))
    );
  };

  const handleIncludeAll = () => {
    setAutoRejectOutliers(false);
    setRows((prev) => prev.map((row) => ({ ...row, included: true })));
  };

  const handleRecompute = () => {
    if (autoRejectOutliers) {
      const rebuilt = buildDurationRowsWithOutlierFilter(
        event,
        selectedScale,
        effectiveK,
        { autoRejectOutliers: true, respectManualOverrides: false }
      );
      setRows(rebuilt.rows);
      return;
    }

    setRows((prev) => {
      const checkedMap = new Map(prev.map((r) => [r.pickId, r.included]));
      const candidates = event.picks.filter(isDurationMagnitudeEligible);
      return candidates.map((pick, idx) => {
        const td = Math.round(pick.duration ?? 0);
        const computed = computeDurationMagnitudes(td, pick.delta, event.depthKm);
        return {
          pickId: pick.id,
          index: idx,
          sta: pick.sta,
          td,
          hd: computed.hd,
          ml: computed.ml,
          mb: computed.mb,
          ms: computed.ms,
          included: checkedMap.get(pick.id) ?? (pick.magExcluded !== true),
        };
      });
    });
  };

  const handleConfirmOk = () => {
    const rowMap = new Map(rows.map((r) => [r.pickId, r]));
    const updatedPicks = event.picks.map((pick) => {
      const row = rowMap.get(pick.id);
      if (!row) {
        return {
          ...pick,
          md: null,
          mb: null,
          ms: null,
          magExcluded: undefined,
        };
      }
      return {
        ...pick,
        md: Number(row.ml.toFixed(1)),
        mb: Number(row.mb.toFixed(1)),
        ms: Number(row.ms.toFixed(1)),
        magExcluded: !row.included,
      };
    });
    onApply({
      preferredScale: selectedScale,
      ms: averages.ms,
      mb: averages.mb,
      md: averages.ml,
      updatedPicks,
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/45 flex items-center justify-center p-3"
      role="dialog"
      aria-modal="true"
      aria-labelledby="mag-duration-popup-title"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-[620px] bg-[#f0f0f0] border border-slate-600 shadow-2xl text-slate-900 select-none overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Classic EQP Desktop Title Bar */}
        <div className="bg-white border-b border-slate-300 px-2.5 py-1.5 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className="w-4 h-4 rounded-xs bg-red-600 text-white flex items-center justify-center shrink-0">
              <Globe className="w-3 h-3" />
            </span>
            <h2
              id="mag-duration-popup-title"
              className="text-[11px] font-semibold tracking-tight text-slate-900 truncate"
            >
              COMPUTED MAGNITUDE USING TIME DURATION :
            </h2>
          </div>
          <button
            type="button"
            onClick={onCancel}
            aria-label="Close Computed Magnitude Dialog"
            className="p-0.5 text-slate-600 hover:text-slate-950 hover:bg-slate-200 rounded-xs transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Top Action Buttons: OK / Recompute / Cancel */}
        <div className="px-3 py-2 border-b border-slate-300 bg-[#f0f0f0] flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleConfirmOk}
              className="min-w-[82px] px-4 py-1 bg-[#e1e1e1] hover:bg-[#e5f1fb] border-2 border-[#0078d7] text-xs font-medium text-slate-900 shadow-2xs transition-colors"
            >
              OK
            </button>
            <button
              type="button"
              onClick={handleRecompute}
              className="min-w-[82px] px-3 py-1 bg-[#e1e1e1] hover:bg-[#e5f1fb] border border-slate-400 text-xs font-medium text-slate-900 shadow-2xs transition-colors"
            >
              Recompute
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="min-w-[82px] px-4 py-1 bg-[#e1e1e1] hover:bg-[#e5f1fb] border border-slate-400 text-xs font-medium text-slate-900 shadow-2xs transition-colors"
            >
              Cancel
            </button>
          </div>
          <span className="font-mono text-[11px] tabular-nums text-slate-600">
            {averages.count}/{rows.length} stations checked
          </span>
        </div>

        {/* Body */}
        <div className="p-2.5 space-y-2.5 bg-[#f0f0f0]">
          {/* Summary Row: Average Radio Box + Outlier Filtering Info */}
          <div className="grid grid-cols-1 sm:grid-cols-[175px_1fr] gap-2.5 items-stretch">
            <fieldset className="border border-slate-300 px-3 pt-1 pb-2">
              <legend className="px-1 font-mono text-xs text-slate-900">Average :</legend>
              <div className="flex flex-col gap-1 font-mono text-xs tabular-nums">
                <label className="inline-flex items-center gap-2 cursor-pointer w-fit">
                  <input
                    type="radio"
                    name="durationMagScale"
                    checked={selectedScale === 'Ms'}
                    onChange={() => handleScaleChange('Ms')}
                    className="accent-blue-600"
                  />
                  <span>Ms {averages.ms.toFixed(1)}</span>
                </label>
                <label className="inline-flex items-center gap-2 cursor-pointer w-fit">
                  <input
                    type="radio"
                    name="durationMagScale"
                    checked={selectedScale === 'Mb'}
                    onChange={() => handleScaleChange('Mb')}
                    className="accent-blue-600"
                  />
                  <span>Mb {averages.mb.toFixed(1)}</span>
                </label>
                <label className="inline-flex items-center gap-2 cursor-pointer w-fit">
                  <input
                    type="radio"
                    name="durationMagScale"
                    checked={selectedScale === 'Md'}
                    onChange={() => handleScaleChange('Md')}
                    className="accent-blue-600"
                  />
                  <span>Ml {averages.ml.toFixed(1)}</span>
                </label>
              </div>
            </fieldset>

            {/* Outlier Filtering (RemoveOutLiers) Info Panel */}
            <fieldset
              className="border border-slate-300 px-3 pt-1 pb-2 bg-white/55"
              aria-label="Outlier Filtering Info"
            >
              <legend className="px-1 font-mono text-xs text-slate-900">
                Outlier Filtering ({outlierSummary.scaleLabel}) :
              </legend>
              <div className="space-y-1.5 text-[11px]">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <label className="inline-flex items-center gap-1.5 font-sans font-medium text-slate-800 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={autoRejectOutliers}
                      onChange={(e) => handleToggleAutoReject(e.target.checked)}
                      aria-label="Auto-reject outliers by default"
                      className="w-3.5 h-3.5 accent-blue-600 cursor-pointer"
                    />
                    <span>Auto-reject outliers</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <label
                      htmlFor="popup-variance-k"
                      className="font-sans font-medium text-slate-700"
                    >
                      Threshold (K):{' '}
                      <span className="font-mono font-semibold tabular-nums text-slate-900">
                        {outlierSummary.varianceK.toFixed(2)}σ
                      </span>
                    </label>
                    <input
                      id="popup-variance-k"
                      type="range"
                      min={0.8}
                      max={2.5}
                      step={0.1}
                      value={outlierSummary.varianceK}
                      onChange={(e) => handleKChange(Number(e.target.value))}
                      aria-label="Outlier filtering sigma threshold K"
                      className="w-24 accent-blue-600 cursor-pointer"
                    />
                  </div>
                </div>

                {rows.length === 0 ? (
                  <div className="text-slate-500 font-sans">
                    No eligible stations to evaluate variance corridor.
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 font-mono tabular-nums text-[11px]">
                      <div className="text-slate-600">
                        Raw Mean:{' '}
                        <span className="text-slate-900 font-semibold">
                          {outlierSummary.meanAll.toFixed(2)}
                        </span>
                      </div>
                      <div className="text-slate-600">
                        Std Dev (σ):{' '}
                        <span className="text-slate-900 font-semibold">
                          {outlierSummary.stdDev.toFixed(2)}
                        </span>
                      </div>
                      <div className="text-slate-600">
                        Corridor:{' '}
                        <span className="text-slate-900">
                          {outlierSummary.lowerBound.toFixed(2)}–{outlierSummary.upperBound.toFixed(2)}
                        </span>
                      </div>
                      <div className="text-slate-600">
                        Filtered {outlierSummary.scaleLabel}:{' '}
                        <span className="text-slate-950 font-bold">
                          {outlierSummary.filteredMean.toFixed(1)}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-200/80">
                      <span
                        className={`font-sans text-[11px] font-medium ${
                          outlierSummary.outlierCount > 0
                            ? 'text-amber-800'
                            : 'text-emerald-800'
                        }`}
                      >
                        {outlierSummary.outlierCount > 0
                          ? `${outlierSummary.outlierCount} outlier${
                              outlierSummary.outlierCount === 1 ? '' : 's'
                            } (> ${outlierSummary.varianceK.toFixed(2)}σ) · ${outlierSummary.keptCount}/${outlierSummary.eligibleCount} kept`
                          : `0 outliers (> ${outlierSummary.varianceK.toFixed(2)}σ) · ${outlierSummary.keptCount}/${outlierSummary.eligibleCount} kept`}
                      </span>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={handleExcludeOutliers}
                          disabled={!hasUnexcludedOutliers}
                          className="px-2 py-0.5 bg-[#e1e1e1] hover:bg-[#e5f1fb] disabled:opacity-45 disabled:hover:bg-[#e1e1e1] border border-slate-400 text-[11px] font-medium text-slate-900 transition-colors"
                        >
                          Reject Outliers ({outlierSummary.outlierCount})
                        </button>
                        <button
                          type="button"
                          onClick={handleIncludeAll}
                          disabled={!hasAnyExcluded}
                          className="px-2 py-0.5 bg-[#e1e1e1] hover:bg-[#e5f1fb] disabled:opacity-45 disabled:hover:bg-[#e1e1e1] border border-slate-400 text-[11px] font-medium text-slate-900 transition-colors"
                        >
                          Include All
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </fieldset>
          </div>

          {/* Station Duration Magnitude Table */}
          <div className="bg-white border border-slate-400 px-2 py-1.5 font-mono text-xs tabular-nums max-h-[270px] overflow-y-auto">
            <div className="grid grid-cols-[20px_22px_44px_46px_54px_56px_56px_56px_1fr] text-blue-800 pb-0.5 select-none">
              <span />
              <span />
              <span>STA</span>
              <span className="text-right pr-2">TD</span>
              <span className="text-right pr-2">HD</span>
              <span className="text-right pr-2">ML</span>
              <span className="text-right pr-2">MB</span>
              <span className="text-right pr-2">MS</span>
              <span className="text-right pr-1">FILTER</span>
            </div>

            {rows.length === 0 ? (
              <div className="py-6 text-center font-sans text-xs text-slate-500">
                No stations with checked Primary (P) arrival and Time Duration (Dur) &gt; 0.
              </div>
            ) : (
              <div className="space-y-0.5">
                {rows.map((row) => {
                  const isOutlier = outlierSummary.outlierPickIds.has(row.pickId);
                  const zScore = outlierSummary.zScoreByPickId.get(row.pickId) ?? 0;
                  return (
                    <div
                      key={row.pickId}
                      onClick={() => handleToggleRow(row.pickId)}
                      className={`grid grid-cols-[20px_22px_44px_46px_54px_56px_56px_56px_1fr] items-center cursor-pointer py-0.5 rounded-2xs ${
                        isOutlier
                          ? row.included
                            ? 'bg-amber-50/90 text-amber-950 hover:bg-amber-100/80'
                            : 'bg-amber-50/50 text-slate-500 hover:bg-amber-50'
                          : row.included
                            ? 'text-slate-950 hover:bg-blue-50'
                            : 'text-slate-500 hover:bg-slate-100'
                      }`}
                    >
                      <span
                        className="flex items-center"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <input
                          type="checkbox"
                          checked={row.included}
                          onChange={() => handleToggleRow(row.pickId)}
                          aria-label={`Include ${row.sta} in magnitude average`}
                          className="w-3.5 h-3.5 accent-blue-600 cursor-pointer"
                        />
                      </span>
                      <span>{row.index}</span>
                      <span>{row.sta}</span>
                      <span className="text-right pr-2">{row.td}</span>
                      <span className="text-right pr-2">{row.hd.toFixed(2)}</span>
                      <span className="text-right pr-2">{row.ml.toFixed(2)}</span>
                      <span className="text-right pr-2">{row.mb.toFixed(2)}</span>
                      <span className="text-right pr-2">{row.ms.toFixed(2)}</span>
                      <span className="text-right pr-1 text-[10.5px] font-sans">
                        {isOutlier ? (
                          <span className="font-semibold text-amber-800">
                            {row.included
                              ? `Outlier (${zScore.toFixed(2)}σ)`
                              : `Rejected (${zScore.toFixed(2)}σ)`}
                          </span>
                        ) : !row.included ? (
                          <span className="text-slate-500">
                            Excluded ({zScore.toFixed(2)}σ)
                          </span>
                        ) : (
                          <span className="text-emerald-700">
                            OK ({zScore.toFixed(2)}σ)
                          </span>
                        )}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
