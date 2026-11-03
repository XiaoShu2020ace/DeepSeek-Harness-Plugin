import { appendFile, mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import { join } from 'node:path';
import type { Context } from '@deepseek-ai/cordis';
import type {} from '@deepseek-ai/dsh-client-connection';
import type { GenerateOptions, StreamChunk, TokenUsage } from '@deepseek-ai/dsh-llm';
import z from '@deepseek-ai/schemastery';
import {
  MONTH_MS,
  QUOTA_API,
  smallLimitFor,
  windowsFor,
  type QuotaConfig,
  type QuotaMode,
  type QuotaSnapshot,
  type UsageRecord,
} from './shared.js';

export const name = 'dsh-quota-guard';
export const inject = ['llm', 'connection'];

export const Config = z.object({
  mode: z.string().default('week'),
  bigLimitCny: z.number().min(0.01).default(200),
  smallWindowHours: z.number().min(1).max(24).default(5),
  smallLimitCny: z.number().min(0.01).default(46.67),
  inputCnyPerMillion: z.number().min(0).default(1.08),
  cachedInputCnyPerMillion: z.number().min(0).default(0.02),
  outputCnyPerMillion: z.number().min(0).default(4.32),
  reservationOutputTokens: z.number().min(1).default(8192),
});

const DEFAULT_CONFIG: QuotaConfig = {
  mode: 'week',
  bigLimitCny: 200,
  smallWindowHours: 5,
  smallLimitCny: 46.67,
  // Default estimate: DeepSeek Flash off-peak unit prices converted to CNY.
  inputCnyPerMillion: 1.08,
  cachedInputCnyPerMillion: 0.02,
  outputCnyPerMillion: 4.32,
  reservationOutputTokens: 8192,
};

const MAX_CONFIG_BYTES = 16 * 1024;
const MAX_USAGE_FILE_BYTES = 16 * 1024 * 1024;
const RETAIN_USAGE_MS = MONTH_MS;

class Mutex {
  private tail: Promise<void> = Promise.resolve();

  async run<T>(operation: () => T | Promise<T>): Promise<T> {
    const previous = this.tail;
    let release!: () => void;
    this.tail = new Promise<void>((resolve) => {
      release = resolve;
    });
    await previous;
    try {
      return await operation();
    } finally {
      release();
    }
  }
}

interface Reservation {
  id: number;
  startedAt: number;
  projectedCost: number;
  actualCost: number;
  windowLabel: string;
}

interface PluginConfigInput {
  mode?: string;
  bigLimitCny?: number;
  smallWindowHours?: number;
  smallLimitCny?: number;
  inputCnyPerMillion?: number;
  cachedInputCnyPerMillion?: number;
  outputCnyPerMillion?: number;
  reservationOutputTokens?: number;
}

function finiteNonNegative(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : fallback;
}

function normalizeConfig(input: PluginConfigInput, fallback: QuotaConfig = DEFAULT_CONFIG): QuotaConfig {
  const mode: QuotaMode = input.mode === 'month' ? 'month' : input.mode === 'week' ? 'week' : fallback.mode;
  return {
    mode,
    bigLimitCny: Math.max(0.01, finiteNonNegative(input.bigLimitCny, fallback.bigLimitCny)),
    smallWindowHours: Math.min(24, Math.max(1, Math.round(finiteNonNegative(input.smallWindowHours, fallback.smallWindowHours)))),
    smallLimitCny: Math.max(0.01, finiteNonNegative(input.smallLimitCny, fallback.smallLimitCny)),
    inputCnyPerMillion: finiteNonNegative(input.inputCnyPerMillion, fallback.inputCnyPerMillion),
    cachedInputCnyPerMillion: finiteNonNegative(input.cachedInputCnyPerMillion, fallback.cachedInputCnyPerMillion),
    outputCnyPerMillion: finiteNonNegative(input.outputCnyPerMillion, fallback.outputCnyPerMillion),
    reservationOutputTokens: Math.max(1, Math.round(finiteNonNegative(input.reservationOutputTokens, fallback.reservationOutputTokens))),
  };
}

function isUsageRecord(value: unknown): value is UsageRecord {
  if (!value || typeof value !== 'object') return false;
  const row = value as Record<string, unknown>;
  return typeof row.windowLabel === 'string'
    && typeof row.ts === 'number'
    && Number.isFinite(row.ts)
    && typeof row.cost === 'number'
    && Number.isFinite(row.cost)
    && row.cost >= 0;
}

class QuotaStore {
  private readonly mutex = new Mutex();
  private readonly reservations = new Map<number, Reservation>();
  private records: UsageRecord[] = [];
  private config: QuotaConfig;
  private nextReservationId = 1;
  private writesSinceTrim = 0;
  private readonly usagePath: string;
  private readonly configPath: string;

  constructor(private readonly dataDirectory: string, initialConfig: QuotaConfig) {
    this.config = initialConfig;
    this.usagePath = join(dataDirectory, 'usage.jsonl');
    this.configPath = join(dataDirectory, 'config.json');
  }

  price(usage: Pick<TokenUsage, 'inputTokens' | 'outputTokens' | 'cacheReadTokens' | 'cacheWriteTokens'>): number {
    return priceUsage(usage, this.config);
  }

  currentConfig(): QuotaConfig {
    return this.config;
  }

  async initialize(): Promise<void> {
    await mkdir(this.dataDirectory, { recursive: true });
    this.records = await this.readUsage();
    const saved = await this.readConfig();
    if (saved) this.config = normalizeConfig(saved, this.config);
    await this.writeConfig(this.config);
  }

  private async readUsage(): Promise<UsageRecord[]> {
    try {
      const text = await readFile(this.usagePath, 'utf8');
      if (Buffer.byteLength(text, 'utf8') > MAX_USAGE_FILE_BYTES) {
        throw new Error(`usage file exceeds ${MAX_USAGE_FILE_BYTES} bytes`);
      }
      const oldestRetained = Date.now() - RETAIN_USAGE_MS;
      return text.split(/\r?\n/)
        .filter((line) => line.length > 0)
        .flatMap((line) => {
          try {
            const value: unknown = JSON.parse(line);
            return isUsageRecord(value) && value.ts >= oldestRetained ? [value] : [];
          } catch {
            return [];
          }
        });
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') return [];
      throw error;
    }
  }

  private async readConfig(): Promise<PluginConfigInput | null> {
    try {
      const text = await readFile(this.configPath, 'utf8');
      if (Buffer.byteLength(text, 'utf8') > MAX_CONFIG_BYTES) return null;
      const value: unknown = JSON.parse(text);
      return value && typeof value === 'object' ? value as PluginConfigInput : null;
    } catch {
      return null;
    }
  }

  private async writeConfig(config: QuotaConfig): Promise<void> {
    const temporaryPath = `${this.configPath}.tmp`;
    await writeFile(temporaryPath, `${JSON.stringify(config, null, 2)}\n`, 'utf8');
    await rename(temporaryPath, this.configPath);
  }

  async updateConfig(value: unknown): Promise<QuotaConfig> {
    return this.mutex.run(async () => {
      if (!value || typeof value !== 'object' || Array.isArray(value)) {
        throw new Error('配置必须是 JSON 对象');
      }
      const input = value as PluginConfigInput;
      if (input.mode !== 'week' && input.mode !== 'month') throw new Error('额度模式无效');
      if (typeof input.bigLimitCny !== 'number' || !Number.isFinite(input.bigLimitCny) || input.bigLimitCny <= 0) {
        throw new Error('大限制金额必须大于 0');
      }
      if (typeof input.smallWindowHours !== 'number' || !Number.isInteger(input.smallWindowHours) || input.smallWindowHours < 1 || input.smallWindowHours > 24) {
        throw new Error('小窗口小时数必须为 1 到 24 的整数');
      }
      if (typeof input.smallLimitCny !== 'number' || !Number.isFinite(input.smallLimitCny) || input.smallLimitCny <= 0) {
        throw new Error('小限制金额必须大于 0');
      }
      const next = normalizeConfig(input, this.config);
      this.validateConfig(next);
      await this.writeConfig(next);
      this.config = next;
      return next;
    });
  }

  private validateConfig(config: QuotaConfig): void {
    if (!Number.isFinite(config.bigLimitCny) || config.bigLimitCny <= 0) throw new Error('大限制金额必须大于 0');
    if (!Number.isInteger(config.smallWindowHours) || config.smallWindowHours < 1 || config.smallWindowHours > 24) {
      throw new Error('小窗口小时数必须为 1 到 24 的整数');
    }
    if (!Number.isFinite(config.smallLimitCny) || config.smallLimitCny <= 0) throw new Error('小限制金额必须大于 0');
  }

  async reset(): Promise<void> {
    await this.mutex.run(async () => {
      await writeFile(this.usagePath, '', 'utf8');
      this.records = [];
      this.writesSinceTrim = 0;
    });
  }

  async checkAdmission(options: GenerateOptions): Promise<number> {
    return this.mutex.run(() => {
      const now = Date.now();
      const inputTokens = estimateInputTokens(options);
      const outputTokens = options.maxTokens ?? this.config.reservationOutputTokens;
      const projectedCost = priceUsage({ inputTokens, outputTokens }, this.config);
      const windows = windowsFor(this.config);
      const smallLimit = smallLimitFor(this.config);
      const bigUsed = this.windowCost(now, windows.big);
      const smallUsed = this.windowCost(now, windows.small);

      if (bigUsed + projectedCost > this.config.bigLimitCny + 1e-8) {
        throw new Error(`额度守卫：预计请求将超过${this.config.mode === 'week' ? '7天' : '30天'}额度。`);
      }
      if (smallUsed + projectedCost > smallLimit + 1e-8) {
        throw new Error(`额度守卫：预计请求将超过${this.config.mode === 'week' ? `${this.config.smallWindowHours}小时` : '7天'}额度。`);
      }

      const id = this.nextReservationId++;
      this.reservations.set(id, {
        id,
        startedAt: now,
        projectedCost,
        actualCost: 0,
        windowLabel: this.config.mode === 'week' ? 'weekly' : 'monthly',
      });
      return id;
    });
  }

  async updateReservationCost(id: number, actualCost: number): Promise<void> {
    await this.mutex.run(() => {
      const reservation = this.reservations.get(id);
      if (reservation) reservation.actualCost = actualCost;
    });
  }

  async finishReservation(id: number, finalCost: number): Promise<void> {
    await this.mutex.run(async () => {
      const reservation = this.reservations.get(id);
      this.reservations.delete(id);
      if (reservation && Number.isFinite(finalCost) && finalCost > 0) {
        const record: UsageRecord = {
          windowLabel: reservation.windowLabel,
          ts: Date.now(),
          cost: roundMoney(finalCost),
        };
        await appendFile(this.usagePath, `${JSON.stringify(record)}\n`, 'utf8');
        this.records.push(record);
        this.writesSinceTrim += 1;
        if (this.writesSinceTrim >= 100) await this.trimExpiredRecords();
      }
    });
  }

  async snapshot(getAccountBalance: () => Promise<number>): Promise<QuotaSnapshot> {
    const [state, accountBalance] = await Promise.all([
      this.mutex.run(() => {
        const now = Date.now();
        const windows = windowsFor(this.config);
        const smallLimit = smallLimitFor(this.config);
        const bigUsedCny = this.windowCost(now, windows.big);
        const smallUsedCny = this.windowCost(now, windows.small);
        return {
          config: { ...this.config },
          bigUsedCny,
          bigRemainingCny: Math.max(0, this.config.bigLimitCny - bigUsedCny),
          bigLimitCny: this.config.bigLimitCny,
          bigPercentRemaining: remainingPercent(bigUsedCny, this.config.bigLimitCny),
          bigWindowMs: windows.big,
          bigResetAt: this.nextExpiry(now, windows.big),
          smallUsedCny,
          smallRemainingCny: Math.max(0, smallLimit - smallUsedCny),
          smallLimitCny: smallLimit,
          smallPercentRemaining: remainingPercent(smallUsedCny, smallLimit),
          smallWindowMs: windows.small,
          smallResetAt: this.nextExpiry(now, windows.small),
        };
      }),
      getAccountBalance(),
    ]);
    return { ...state, accountBalance };
  }

  private windowCost(now: number, windowMs: number): number {
    const cutoff = now - windowMs;
    let total = 0;
    for (const record of this.records) if (record.ts > cutoff) total += record.cost;
    for (const reservation of this.reservations.values()) {
      if (reservation.startedAt > cutoff) total += Math.max(reservation.projectedCost, reservation.actualCost);
    }
    return total;
  }

  private nextExpiry(now: number, windowMs: number): number | null {
    const cutoff = now - windowMs;
    let next: number | null = null;
    for (const record of this.records) {
      if (record.ts > cutoff) {
        const expiresAt = record.ts + windowMs;
        next = next === null ? expiresAt : Math.min(next, expiresAt);
      }
    }
    for (const reservation of this.reservations.values()) {
      if (reservation.startedAt > cutoff) {
        const expiresAt = reservation.startedAt + windowMs;
        next = next === null ? expiresAt : Math.min(next, expiresAt);
      }
    }
    return next;
  }

  private async trimExpiredRecords(): Promise<void> {
    const cutoff = Date.now() - RETAIN_USAGE_MS;
    this.records = this.records.filter((record) => record.ts >= cutoff);
    await writeFile(this.usagePath, this.records.map((record) => JSON.stringify(record)).join('\n') + (this.records.length ? '\n' : ''), 'utf8');
    this.writesSinceTrim = 0;
  }
}

function remainingPercent(used: number, limit: number): number {
  return limit <= 0 ? 0 : Math.max(0, Math.min(100, ((limit - used) / limit) * 100));
}

function roundMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 1_000_000) / 1_000_000;
}

function priceUsage(usage: Pick<TokenUsage, 'inputTokens' | 'outputTokens' | 'cacheReadTokens' | 'cacheWriteTokens'>, config: QuotaConfig): number {
  const inputTokens = finiteNonNegative(usage.inputTokens, 0);
  const outputTokens = finiteNonNegative(usage.outputTokens, 0);
  const cacheReadTokens = finiteNonNegative(usage.cacheReadTokens, 0);
  const cacheWriteTokens = finiteNonNegative(usage.cacheWriteTokens, 0);
  const inputCost = ((inputTokens + cacheWriteTokens) * config.inputCnyPerMillion
    + cacheReadTokens * config.cachedInputCnyPerMillion) / 1_000_000;
  return inputCost + (outputTokens * config.outputCnyPerMillion) / 1_000_000;
}

function estimateInputTokens(options: GenerateOptions): number {
  let characters = 0;
  const add = (value: unknown, depth = 0): void => {
    if (depth > 8 || value == null) return;
    if (typeof value === 'string') {
      characters += value.length;
      return;
    }
    if (typeof value !== 'object') return;
    if (Array.isArray(value)) {
      for (const item of value) add(item, depth + 1);
      return;
    }
    const row = value as Record<string, unknown>;
    for (const [key, item] of Object.entries(row)) {
      if (key === 'attachment') {
        characters += 1024;
      } else if (typeof item === 'string') {
        characters += item.length;
      } else if (typeof item === 'object' && item !== null) {
        add(item, depth + 1);
      }
    }
  };
  add(options.system);
  add(options.messages);
  add(options.tools);
  // One token per four characters plus a conservative envelope allowance.
  return Math.ceil(characters / 4) + options.messages.length * 8 + (options.tools?.length ?? 0) * 16;
}

function outputCharsFromChunk(chunk: StreamChunk): number {
  switch (chunk.type) {
    case 'text-delta':
    case 'reasoning-delta':
      return chunk.text.length;
    case 'tool-call-delta':
      return chunk.argumentsDelta.length;
    case 'block-end':
      if (chunk.block.type === 'text' || chunk.block.type === 'reasoning') return chunk.block.text.length;
      if (chunk.block.type === 'tool-call') return chunk.block.arguments.length;
      return 0;
    default:
      return 0;
  }
}

function createStreamMeter(ctx: Context, store: QuotaStore) {
  ctx.on('llm/stream', (options, next) => {
    return (async function* () {
      const reservationId = await store.checkAdmission(options);
      let latestUsageCost = 0;
      let usageObserved = false;
      let deltaOutputChars = 0;
      let completedBlockChars = 0;
      const inputTokens = estimateInputTokens(options);
      try {
        for await (const chunk of next()) {
          if (chunk.type === 'usage') {
            usageObserved = true;
            latestUsageCost = store.price(chunk.usage);
            await store.updateReservationCost(reservationId, latestUsageCost);
          } else if (chunk.type === 'text-delta' || chunk.type === 'reasoning-delta' || chunk.type === 'tool-call-delta') {
            deltaOutputChars += outputCharsFromChunk(chunk);
          } else if (chunk.type === 'block-end') {
            completedBlockChars += outputCharsFromChunk(chunk);
          } else {
            // Other chunks do not carry billable text.
          }
          yield chunk;
        }
      } finally {
        const outputChars = Math.max(deltaOutputChars, completedBlockChars);
        const estimatedCost = priceUsage({
          inputTokens,
          outputTokens: Math.ceil(outputChars / 4),
        }, store.currentConfig());
        await store.finishReservation(reservationId, usageObserved ? latestUsageCost : estimatedCost);
      }
    })();
  });
}

function jsonResponse(value: unknown, status = 200): Response {
  return Response.json(value, {
    status,
    headers: { 'cache-control': 'no-store' },
  });
}

async function readRequestJson(request: Request): Promise<unknown> {
  if (!request.headers.get('content-type')?.toLowerCase().startsWith('application/json')) {
    throw new Error('请求必须使用 application/json');
  }
  if (!request.body) throw new Error('请求体为空');
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let totalBytes = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    totalBytes += value.byteLength;
    if (totalBytes > MAX_CONFIG_BYTES) {
      await reader.cancel();
      throw new Error('请求内容过大');
    }
    chunks.push(value);
  }
  const text = new TextDecoder().decode(Buffer.concat(chunks.map((chunk) => Buffer.from(chunk)), totalBytes));
  return JSON.parse(text) as unknown;
}

/** Mock account balance. 后续替换为真实 DSH API. */
export async function getAccountBalance(): Promise<number> {
  return 51.5;
}

export async function apply(ctx: Context, rawConfig: PluginConfigInput = {}): Promise<void> {
  const initialConfig = normalizeConfig(rawConfig);
  const home = process.env.DSH_HOME?.trim() || join(homedir(), '.dsh');
  const store = new QuotaStore(join(home, 'plugins', 'dsh-quota-guard'), initialConfig);
  await store.initialize();

  createStreamMeter(ctx, store);

  ctx.effect(() => ctx.connection.fetch.register({
    path: QUOTA_API.state,
    methods: ['GET'],
    requestBody: 'buffered',
    fetch: async () => jsonResponse(await store.snapshot(getAccountBalance)),
  }), 'dsh-quota-guard: state API');

  ctx.effect(() => ctx.connection.fetch.register({
    path: QUOTA_API.config,
    methods: ['POST'],
    requestBody: 'streaming',
    fetch: async (request) => {
      try {
        await store.updateConfig(await readRequestJson(request));
        return jsonResponse(await store.snapshot(getAccountBalance));
      } catch (error) {
        return jsonResponse({ error: error instanceof Error ? error.message : '保存设置失败' }, 400);
      }
    },
  }), 'dsh-quota-guard: config API');

  ctx.effect(() => ctx.connection.fetch.register({
    path: QUOTA_API.reset,
    methods: ['POST'],
    requestBody: 'buffered',
    fetch: async () => {
      try {
        await store.reset();
        return jsonResponse(await store.snapshot(getAccountBalance));
      } catch {
        return jsonResponse({ error: '重置额度记录失败' }, 500);
      }
    },
  }), 'dsh-quota-guard: reset API');
}
