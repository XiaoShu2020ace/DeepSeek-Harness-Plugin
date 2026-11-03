import React, { useMemo, useState } from 'react';
import {
  QUOTA_API,
  smallLimitFor,
  type QuotaConfig,
  type QuotaSnapshot,
} from '../shared.js';
import styles from './styles.module.css';

interface Props {
  snapshot: QuotaSnapshot;
  onSnapshot(snapshot: QuotaSnapshot): void;
  onClose(): void;
}

function money(value: number): string {
  return `¥${value.toFixed(2)}`;
}

export function SettingsPopover({ snapshot, onSnapshot, onClose }: Props): React.JSX.Element {
  const [draft, setDraft] = useState<QuotaConfig>({ ...snapshot.config });
  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isWeek = draft.mode === 'week';
  const smallAmount = useMemo(() => smallLimitFor(draft), [draft]);

  const setNumber = (key: 'bigLimitCny' | 'smallLimitCny' | 'smallWindowHours', value: string) => {
    const number = Number(value);
    if (!Number.isFinite(number)) return;
    setDraft((current) => ({ ...current, [key]: number }));
  };

  const save = async () => {
    if (draft.bigLimitCny <= 0 || (isWeek && (draft.smallWindowHours < 1 || draft.smallWindowHours > 24)) || (!isWeek && draft.smallLimitCny <= 0)) {
      setError('请检查额度金额和小时范围。');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const response = await fetch(QUOTA_API.config, {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(draft),
      });
      const body = await response.json() as QuotaSnapshot | { error?: string };
      if (!response.ok) throw new Error('error' in body ? body.error ?? '保存失败' : '保存失败');
      onSnapshot(body as QuotaSnapshot);
      onClose();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : '保存失败');
    } finally {
      setSaving(false);
    }
  };

  const reset = async () => {
    if (!window.confirm('确定清空当前已记录的使用额度吗？')) return;
    setResetting(true);
    setError(null);
    try {
      const response = await fetch(QUOTA_API.reset, {
        method: 'POST',
        credentials: 'same-origin',
      });
      const body = await response.json() as QuotaSnapshot | { error?: string };
      if (!response.ok) throw new Error('error' in body ? body.error ?? '重置失败' : '重置失败');
      onSnapshot(body as QuotaSnapshot);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : '重置失败');
    } finally {
      setResetting(false);
    }
  };

  return <div className={styles.popoverLayer}>
    <button className={styles.backdrop} type="button" aria-label="关闭额度设置" onClick={onClose} />
    <section className={styles.panel} aria-label="额度守卫设置" onClick={(event) => event.stopPropagation()}>
      <div className={styles.balanceRow}>
        <span>当前账户余额</span>
        <strong>{money(snapshot.accountBalance)}</strong>
      </div>

      <div className={styles.sectionLabel}>额度模式</div>
      <div className={styles.segmented} role="group" aria-label="额度模式">
        <button type="button" className={isWeek ? styles.segmentActive : styles.segment} onClick={() => setDraft((value) => ({ ...value, mode: 'week' }))}>
          {isWeek ? '●' : '○'} 周额度
        </button>
        <button type="button" className={!isWeek ? styles.segmentActive : styles.segment} onClick={() => setDraft((value) => ({ ...value, mode: 'month' }))}>
          {!isWeek ? '●' : '○'} 月额度
        </button>
      </div>

      <label className={styles.field}>
        <span>大限制金额</span>
        <span className={styles.inputWrap}>
          <span>¥</span>
          <input type="number" min="0.01" step="0.01" value={draft.bigLimitCny} onChange={(event) => setNumber('bigLimitCny', event.target.value)} />
        </span>
      </label>

      {isWeek ? <label className={styles.field}>
        <span>小限制窗口：{draft.smallWindowHours} 小时</span>
        <input
          className={styles.range}
          type="range"
          min="1"
          max="24"
          step="1"
          value={draft.smallWindowHours}
          onChange={(event) => setNumber('smallWindowHours', event.target.value)}
        />
        <span className={styles.rangeLabels}><span>1 小时</span><span>24 小时</span></span>
      </label> : <label className={styles.field}>
        <span>小限制金额（7天）</span>
        <span className={styles.inputWrap}>
          <span>¥</span>
          <input type="number" min="0.01" step="0.01" value={draft.smallLimitCny} onChange={(event) => setNumber('smallLimitCny', event.target.value)} />
        </span>
      </label>}

      {draft.bigLimitCny > snapshot.accountBalance && <div className={styles.warning} role="alert">
        ⚠️ 设定大限制超过账户余额，请充值或降低额度
      </div>}

      <div className={styles.preview}>
        <div>生效预览</div>
        <strong>
          大限制：{isWeek ? '7天' : '30天'} ({money(draft.bigLimitCny)}) / 小限制：{isWeek ? `${draft.smallWindowHours}小时` : '7天'} ({money(smallAmount)})
        </strong>
        <small>金额按 Token 单价估算：输入 {money(draft.inputCnyPerMillion)} / 缓存 {money(draft.cachedInputCnyPerMillion)} / 输出 {money(draft.outputCnyPerMillion)}（每百万 Token）</small>
      </div>

      {error && <div className={styles.error} role="alert">{error}</div>}

      <div className={styles.actions}>
        <button type="button" className={styles.reset} disabled={resetting || saving} onClick={() => void reset()}>
          {resetting ? '重置中…' : '重置已用额度'}
        </button>
        <div className={styles.actionGroup}>
          <button type="button" className={styles.cancel} disabled={saving} onClick={onClose}>取消</button>
          <button type="button" className={styles.save} disabled={saving || resetting} onClick={() => void save()}>
            {saving ? '保存中…' : '保存'}
          </button>
        </div>
      </div>
    </section>
  </div>;
}
