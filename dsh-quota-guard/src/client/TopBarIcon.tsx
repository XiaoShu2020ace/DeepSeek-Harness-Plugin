import React, { useCallback, useEffect, useState } from 'react';
import { QUOTA_API, type QuotaSnapshot } from '../shared.js';
import { SettingsPopover } from './SettingsPopover.js';
import styles from './styles.module.css';

function money(value: number): string {
  return `¥${value.toFixed(2)}`;
}

function resetDistance(timestamp: number | null): string {
  if (timestamp === null) return '暂无待重置记录';
  const left = Math.max(0, timestamp - Date.now());
  const hours = Math.floor(left / 3_600_000);
  const minutes = Math.floor((left % 3_600_000) / 60_000);
  return hours > 0 ? `${hours}小时${minutes}分后重置` : `${Math.max(1, minutes)}分钟后重置`;
}

function ringColor(remainingPercent: number): string {
  if (remainingPercent <= 0) return '#EF4444';
  if (remainingPercent < 20) return '#F59E0B';
  return '#666666';
}

function HalfRing({
  radius,
  remainingPercent,
  half,
  circumference,
}: {
  radius: number;
  remainingPercent: number;
  half: 'upper' | 'lower';
  circumference: number;
}) {
  const halfLength = circumference / 2;
  const remainingLength = halfLength * Math.max(0, Math.min(100, remainingPercent)) / 100;
  const rotation = half === 'upper' ? 180 : 0;
  const transform = `rotate(${rotation} 20 20)`;

  return <>
    <circle
      cx="20"
      cy="20"
      r={radius}
      fill="none"
      stroke="#E8E8E8"
      strokeWidth="2.5"
      strokeDasharray={`${halfLength} ${halfLength}`}
      transform={transform}
    />
    <circle
      cx="20"
      cy="20"
      r={radius}
      fill="none"
      stroke={ringColor(remainingPercent)}
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeDasharray={`${remainingLength} ${circumference - remainingLength}`}
      transform={transform}
    />
  </>;
}

export function TopBarIcon(): React.JSX.Element {
  const [snapshot, setSnapshot] = useState<QuotaSnapshot | null>(null);
  const [open, setOpen] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const response = await fetch(QUOTA_API.state, { credentials: 'same-origin', cache: 'no-store' });
      if (!response.ok) throw new Error(`额度数据读取失败 (${response.status})`);
      setSnapshot(await response.json() as QuotaSnapshot);
      setLoadError(null);
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : '额度数据读取失败');
    }
  }, []);

  useEffect(() => {
    void refresh();
    const timer = window.setInterval(() => void refresh(), 20_000);
    return () => window.clearInterval(timer);
  }, [refresh]);

  const label = snapshot
    ? `额度剩余：小限制 ${snapshot.smallPercentRemaining.toFixed(0)}%，大限制 ${snapshot.bigPercentRemaining.toFixed(0)}%`
    : '额度守卫';

  return <div className={styles.anchor}>
    <button
      type="button"
      className={styles.trigger}
      aria-label={label}
      aria-expanded={open}
      onClick={() => setOpen((value) => !value)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <svg className={styles.ring} width="24" height="24" viewBox="0 0 40 40" aria-hidden="true">
        <HalfRing radius={16} remainingPercent={snapshot?.smallPercentRemaining ?? 100} half="upper" circumference={2 * Math.PI * 16} />
        <HalfRing radius={10} remainingPercent={snapshot?.bigPercentRemaining ?? 100} half="lower" circumference={2 * Math.PI * 10} />
      </svg>
    </button>

    {hovered && !open && snapshot && <div className={styles.tooltip} role="tooltip">
      <div className={styles.tooltipTitle}>额度守卫</div>
      <div className={styles.tooltipRow}>
        <span>小限制</span>
        <span>{snapshot.config.mode === 'week' ? `${snapshot.config.smallWindowHours}小时` : '7天'}</span>
      </div>
      <div className={styles.tooltipMeta}>
        已用 {money(snapshot.smallUsedCny)} ({(100 - snapshot.smallPercentRemaining).toFixed(0)}%) · 剩余 {money(snapshot.smallRemainingCny)} ({snapshot.smallPercentRemaining.toFixed(0)}%)
        <br />{resetDistance(snapshot.smallResetAt)}
      </div>
      <div className={styles.tooltipRow}>
        <span>大限制</span>
        <span>{snapshot.config.mode === 'week' ? '7天' : '30天'}</span>
      </div>
      <div className={styles.tooltipMeta}>
        已用 {money(snapshot.bigUsedCny)} ({(100 - snapshot.bigPercentRemaining).toFixed(0)}%) · 剩余 {money(snapshot.bigRemainingCny)} ({snapshot.bigPercentRemaining.toFixed(0)}%)
        <br />{resetDistance(snapshot.bigResetAt)}
      </div>
    </div>}
    {hovered && !open && loadError && <div className={styles.tooltip} role="tooltip">{loadError}</div>}

    {open && snapshot && <SettingsPopover
      snapshot={snapshot}
      onSnapshot={(next) => setSnapshot(next)}
      onClose={() => setOpen(false)}
    />}
  </div>;
}
