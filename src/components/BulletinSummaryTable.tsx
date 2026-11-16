import React, { useMemo, useState } from 'react';
import { AlertTriangle, Check, ChevronDown, ChevronUp } from 'lucide-react';
import {
  type EarthquakeOriginType,
  type EQPEvent,
  isEventUnlocated,
} from '../data/eqpData';

const MONTHS_SHORT = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

function formatSummaryDate(isoDate: string): string {
  const parts = isoDate.split('-');
  if (parts.length === 3) {
    const [yyyy, mm, dd] = parts;
    const monthIdx = Math.max(0, Math.min(11, (Number(mm) || 1) - 1));
    return `${dd.padStart(2, '0')} ${MONTHS_SHORT[monthIdx]} ${yyyy}`;
  }
  return isoDate || '01 Jan 2026';
}

function formatSummaryTime(timeStr: string, use12Hour: boolean): string {
  const parts = timeStr.split(':');
  const hhNum = Math.max(0, Math.min(23, Number(parts[0]) || 0));
  const minNum = Math.max(0, Math.min(59, Number(parts[1]) || 0));
  const secNum = Math.max(0, Math.min(59, Math.round(Number(parts[2]) || 0)));
  const hh = String(hhNum).padStart(2, '0');
  const min = String(minNum).padStart(2, '0');
  const sec = String(secNum).padStart(2, '0');

  if (!use12Hour) {
    return `${hh}:${min}:${sec}`;
  }

  const amPm = hhNum >= 12 ? 'PM' : 'AM';
  const hh12 = String(hhNum % 12 || 12).padStart(2, '0');
  return `${hh12}:${min}:${sec} ${amPm}`;
}

export interface BulletinSummaryParameters {
  unlocated: boolean;
  bulletinNo: number;
  originType: EarthquakeOriginType;
  originLst: string;
  originUtc: string;
  preferredScale: string;
  activeMagnitudeText: string;
  allScalesText: string;
  depthText: string;
  depthDetailText: string;
  coordinatesText: string;
  errorText: string;
  locationText: string;
  faultGeneratorText: string | null;
  expectingDamage: boolean;
  expectingAftershocks: boolean;
  rmsText: string;
  stationSummaryText: string;
  intensitySummaryText: string;
  issuedText: string;
}

export function extractBulletinSummaryParameters(
  event: EQPEvent,
  primaryLocationLabel: string,
  options?: {
    faultGeneratorLabel?: string | null;
    printSource?: boolean;
    issuedDateDisplay?: string;
    issuedTimeDisplay?: string;
    issuedByDisplay?: string;
  }
): BulletinSummaryParameters {
  const unlocated = isEventUnlocated(event);
  const bulletinNo = Math.max(1, Math.trunc(event.bulletinNo || 1));
  const originType: EarthquakeOriginType = event.originType ?? 'TECTONIC';

  const activeMag =
    event.preferredScale === 'Ms'
      ? event.ms
      : event.preferredScale === 'Mb'
        ? event.mb
        : event.md;
  const preferredScale = event.preferredScale === 'Md' ? 'Md' : event.preferredScale;

  const depthCode = String(Math.round(Math.max(0, event.depthKm))).padStart(3, '0');
  const depthMode =
    event.locationMetadata?.depthFixed !== undefined
      ? event.locationMetadata.depthFixed
        ? 'Fixed'
        : 'Free'
      : null;

  const activePicks = event.picks.filter((p) => !p.pExcluded && p.pTime.trim() !== '').length;
  const totalPicks = event.picks.length;
  const feltCount = event.intensities.filter((i) => i.category !== 'instrumental').length;
  const instrCount = event.intensities.filter((i) => i.category === 'instrumental').length;

  const issuedDate = options?.issuedDateDisplay ?? (event.issuedDate || 'Pending');
  const issuedTime = options?.issuedTimeDisplay ?? (event.issuedTime || '—');
  const issuedBy = options?.issuedByDisplay ?? (event.issuedBy || 'DSS');

  const intensitySummaryText = event.intensityBulletinOverride?.trim()
    ? 'Custom override'
    : feltCount === 0 && instrCount === 0
      ? 'None reported'
      : `Felt ${feltCount} · Instr ${instrCount}`;

  return {
    unlocated,
    bulletinNo,
    originType,
    originLst: `${formatSummaryDate(event.originDateLst)} - ${formatSummaryTime(event.originTimeLst, true)}`,
    originUtc: `${formatSummaryDate(event.originDateGmt)} - ${formatSummaryTime(event.originTimeGmt, false)} UTC`,
    preferredScale,
    activeMagnitudeText:
      unlocated && activeMag === 0
        ? 'Pending'
        : `${preferredScale} ${activeMag.toFixed(1)}`,
    allScalesText: `Ms ${event.ms.toFixed(1)} · Mb ${event.mb.toFixed(1)} · Ml ${event.md.toFixed(1)}`,
    depthText: unlocated ? 'Pending' : `${depthCode} km`,
    depthDetailText: unlocated
      ? 'Awaiting solution'
      : `${event.depthKm.toFixed(1)} km${depthMode ? ` (${depthMode})` : ''}`,
    coordinatesText: unlocated
      ? 'Pending location'
      : `${event.lat.toFixed(2)}°N, ${event.lon.toFixed(2)}°E`,
    errorText: unlocated ? 'ERH —' : `ERH ±${event.errKm.toFixed(2)} km`,
    locationText: unlocated ? 'Pending location' : primaryLocationLabel,
    faultGeneratorText:
      options?.printSource && options?.faultGeneratorLabel ? options.faultGeneratorLabel : null,
    expectingDamage: Boolean(event.expectingDamage),
    expectingAftershocks: Boolean(event.expectingAftershocks),
    rmsText: unlocated ? 'RMS —' : `RMS ${event.rmsSec.toFixed(2)}s`,
    stationSummaryText: `${activePicks}/${totalPicks} sta`,
    intensitySummaryText,
    issuedText: `${issuedBy} · ${issuedDate} ${issuedTime}`,
  };
}

export interface BulletinSummaryTableProps {
  event: EQPEvent;
  primaryLocationLabel: string;
  faultGeneratorLabel?: string | null;
  printSource?: boolean;
  issuedDateDisplay?: string;
  issuedTimeDisplay?: string;
  issuedByDisplay?: string;
}

export const BulletinSummaryTable: React.FC<BulletinSummaryTableProps> = ({
  event,
  primaryLocationLabel,
  faultGeneratorLabel = null,
  printSource = false,
  issuedDateDisplay,
  issuedTimeDisplay,
  issuedByDisplay,
}) => {
  const [collapsed, setCollapsed] = useState(false);

  const summary = useMemo(
    () =>
      extractBulletinSummaryParameters(event, primaryLocationLabel, {
        faultGeneratorLabel,
        printSource,
        issuedDateDisplay,
        issuedTimeDisplay,
        issuedByDisplay,
      }),
    [
      event,
      primaryLocationLabel,
      faultGeneratorLabel,
      printSource,
      issuedDateDisplay,
      issuedTimeDisplay,
      issuedByDisplay,
    ]
  );

  return (
    <section
      aria-label="Bulletin Event Parameter Verification Table"
      className="bg-white border-b border-slate-300 shrink-0"
    >
      <div className="px-3 py-1.5 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <h3 className="font-semibold text-slate-900">
            Parameter Verification Summary
          </h3>
          <span aria-hidden="true" className="text-slate-300">
            ·
          </span>
          <span className="font-mono tabular-nums text-[11px] text-slate-600">
            Info No. {summary.bulletinNo}
          </span>
          <span aria-hidden="true" className="text-slate-300">
            ·
          </span>
          <span className="text-[11px] font-medium text-slate-700">
            {summary.originType}
          </span>
          <span aria-hidden="true" className="text-slate-300">
            ·
          </span>
          {summary.unlocated ? (
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-800">
              <AlertTriangle className="w-3 h-3 shrink-0" />
              Location Pending
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700">
              <Check className="w-3 h-3 shrink-0" />
              Solution Ready
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={() => setCollapsed((v) => !v)}
          aria-expanded={!collapsed}
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded border border-slate-300 bg-white hover:bg-slate-100 text-[11px] font-medium text-slate-700 whitespace-nowrap shrink-0 cursor-pointer transition-colors"
        >
          {collapsed ? (
            <>
              <ChevronDown className="w-3 h-3" />
              <span>Show Grid</span>
            </>
          ) : (
            <>
              <ChevronUp className="w-3 h-3" />
              <span>Hide Grid</span>
            </>
          )}
        </button>
      </div>

      {!collapsed && (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] border-collapse text-left text-[11.5px]">
            <tbody className="divide-y divide-slate-200">
              <tr>
                <th
                  scope="row"
                  className="w-[132px] bg-slate-50/70 px-2.5 py-1.5 font-medium text-slate-600 whitespace-nowrap border-r border-slate-200"
                >
                  Origin (LST)
                </th>
                <td className="px-2.5 py-1.5 font-mono tabular-nums font-semibold text-slate-900 border-r border-slate-200">
                  {summary.originLst}
                </td>
                <th
                  scope="row"
                  className="w-[132px] bg-slate-50/70 px-2.5 py-1.5 font-medium text-slate-600 whitespace-nowrap border-r border-slate-200"
                >
                  Origin (UTC)
                </th>
                <td className="px-2.5 py-1.5 font-mono tabular-nums font-semibold text-slate-800">
                  {summary.originUtc}
                </td>
              </tr>

              <tr>
                <th
                  scope="row"
                  className="bg-slate-50/70 px-2.5 py-1.5 font-medium text-slate-600 whitespace-nowrap border-r border-slate-200"
                >
                  Magnitude
                </th>
                <td className="px-2.5 py-1.5 border-r border-slate-200">
                  <span className="font-mono tabular-nums font-bold text-blue-800">
                    {summary.activeMagnitudeText}
                  </span>
                  <span className="ml-2 font-mono tabular-nums text-[10.5px] text-slate-500">
                    ({summary.allScalesText})
                  </span>
                </td>
                <th
                  scope="row"
                  className="bg-slate-50/70 px-2.5 py-1.5 font-medium text-slate-600 whitespace-nowrap border-r border-slate-200"
                >
                  Depth of Focus
                </th>
                <td className="px-2.5 py-1.5">
                  <span className="font-mono tabular-nums font-bold text-slate-900">
                    {summary.depthText}
                  </span>
                  <span className="ml-2 font-mono tabular-nums text-[10.5px] text-slate-500">
                    · {summary.depthDetailText}
                  </span>
                </td>
              </tr>

              <tr>
                <th
                  scope="row"
                  className="bg-slate-50/70 px-2.5 py-1.5 font-medium text-slate-600 whitespace-nowrap border-r border-slate-200"
                >
                  Coordinates
                </th>
                <td className="px-2.5 py-1.5 border-r border-slate-200">
                  <span className="font-mono tabular-nums font-semibold text-slate-900">
                    {summary.coordinatesText}
                  </span>
                  <span className="ml-2 font-mono tabular-nums text-[10.5px] text-slate-500">
                    · {summary.errorText}
                  </span>
                </td>
                <th
                  scope="row"
                  className="bg-slate-50/70 px-2.5 py-1.5 font-medium text-slate-600 whitespace-nowrap border-r border-slate-200"
                >
                  Location
                </th>
                <td className="px-2.5 py-1.5 text-slate-900 font-medium">
                  <span>{summary.locationText}</span>
                  {summary.faultGeneratorText && (
                    <span className="ml-2 text-[10.5px] text-slate-600 font-normal">
                      · Source: {summary.faultGeneratorText}
                    </span>
                  )}
                </td>
              </tr>

              <tr>
                <th
                  scope="row"
                  className="bg-slate-50/70 px-2.5 py-1.5 font-medium text-slate-600 whitespace-nowrap border-r border-slate-200"
                >
                  Advisories
                </th>
                <td className="px-2.5 py-1.5 border-r border-slate-200">
                  <span className="text-slate-600">Damage: </span>
                  <span
                    className={`font-semibold ${
                      summary.expectingDamage ? 'text-rose-700' : 'text-slate-800'
                    }`}
                  >
                    {summary.expectingDamage ? 'YES' : 'NO'}
                  </span>
                  <span aria-hidden="true" className="mx-1.5 text-slate-300">
                    ·
                  </span>
                  <span className="text-slate-600">Aftershocks: </span>
                  <span
                    className={`font-semibold ${
                      summary.expectingAftershocks ? 'text-amber-800' : 'text-slate-800'
                    }`}
                  >
                    {summary.expectingAftershocks ? 'YES' : 'NO'}
                  </span>
                  <span aria-hidden="true" className="mx-1.5 text-slate-300">
                    ·
                  </span>
                  <span className="text-slate-600">Intensities: </span>
                  <span className="font-mono tabular-nums text-slate-800">
                    {summary.intensitySummaryText}
                  </span>
                </td>
                <th
                  scope="row"
                  className="bg-slate-50/70 px-2.5 py-1.5 font-medium text-slate-600 whitespace-nowrap border-r border-slate-200"
                >
                  Quality &amp; Issued
                </th>
                <td className="px-2.5 py-1.5 font-mono tabular-nums text-slate-800">
                  <span>{summary.rmsText}</span>
                  <span aria-hidden="true" className="mx-1.5 text-slate-300">
                    ·
                  </span>
                  <span>{summary.stationSummaryText}</span>
                  <span aria-hidden="true" className="mx-1.5 text-slate-300">
                    ·
                  </span>
                  <span className="font-sans font-medium text-slate-700">
                    {summary.issuedText}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
};
