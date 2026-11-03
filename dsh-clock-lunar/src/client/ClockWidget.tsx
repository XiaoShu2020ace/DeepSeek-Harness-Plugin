import React, { useEffect, useId, useMemo, useState } from 'react';
import { formatClockDateTime, getClockCalendarInfo, getDateKey } from './utils.js';
import styles from './styles.module.css';

function getLocalTime(date: Date): string {
  return [
    String(date.getHours()).padStart(2, '0'),
    String(date.getMinutes()).padStart(2, '0'),
    String(date.getSeconds()).padStart(2, '0'),
  ].join(':');
}

export function ClockWidget(): React.JSX.Element {
  const [now, setNow] = useState(() => new Date());
  const tooltipId = 'dsh-clock-tooltip-' + useId();
  const dateKey = getDateKey(now);
  const info = useMemo(() => getClockCalendarInfo(now), [dateKey]);
  const isSpecial = Boolean(info.highlightedEvent);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <div className={styles.widget}>
      <time
        className={isSpecial ? styles.clockSpecial : styles.clock}
        dateTime={dateKey + 'T' + getLocalTime(now)}
        aria-describedby={tooltipId}
        tabIndex={0}
      >
        <span>{formatClockDateTime(now)}</span>
        <span> · 农历{info.lunarDate}</span>
        {info.highlightedEvent && (
          <span> · {info.highlightedEvent} {info.highlightedEmoji}</span>
        )}
      </time>

      <div className={styles.tooltip} id={tooltipId} role="tooltip">
        <div className={styles.tooltipLine}>{info.weekday} · {info.ganzhi}</div>
        {info.eventLines.map((line, index) => (
          <div className={styles.tooltipLine} key={line + index}>{line}</div>
        ))}
        <div className={styles.tooltipLine}>
          🚀 距离【{info.nextHoliday.name}】还有 {info.nextHoliday.days} 天
        </div>
        <div className={styles.tooltipLine}>💼 今日状态：{info.holidayStatus}</div>
      </div>
    </div>
  );
}
