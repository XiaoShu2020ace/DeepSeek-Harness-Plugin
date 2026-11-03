// src/index.ts
import { appendFile, mkdir, readFile, rename, writeFile } from "fs/promises";
import { homedir } from "os";
import { join } from "path";
import z from "@deepseek-ai/schemastery";

// src/shared.ts
var QUOTA_API = {
  state: "/api/dsh-quota-guard/state",
  config: "/api/dsh-quota-guard/config",
  reset: "/api/dsh-quota-guard/reset"
};
var WEEK_MS = 7 * 24 * 60 * 60 * 1e3;
var MONTH_MS = 30 * 24 * 60 * 60 * 1e3;
var WEEK_SMALL_REFERENCE_HOURS = 70;
function smallLimitFor(config) {
  return config.mode === "week" ? config.bigLimitCny * config.smallWindowHours / WEEK_SMALL_REFERENCE_HOURS : config.smallLimitCny;
}
function windowsFor(config) {
  return config.mode === "week" ? { big: WEEK_MS, small: config.smallWindowHours * 60 * 60 * 1e3 } : { big: MONTH_MS, small: WEEK_MS };
}

// src/index.ts
var name = "dsh-quota-guard";
var inject = ["llm", "connection"];
var Config = z.object({
  mode: z.string().default("week"),
  bigLimitCny: z.number().min(0.01).default(200),
  smallWindowHours: z.number().min(1).max(24).default(5),
  smallLimitCny: z.number().min(0.01).default(46.67),
  inputCnyPerMillion: z.number().min(0).default(1.08),
  cachedInputCnyPerMillion: z.number().min(0).default(0.02),
  outputCnyPerMillion: z.number().min(0).default(4.32),
  reservationOutputTokens: z.number().min(1).default(8192)
});
var DEFAULT_CONFIG = {
  mode: "week",
  bigLimitCny: 200,
  smallWindowHours: 5,
  smallLimitCny: 46.67,
  // Default estimate: DeepSeek Flash off-peak unit prices converted to CNY.
  inputCnyPerMillion: 1.08,
  cachedInputCnyPerMillion: 0.02,
  outputCnyPerMillion: 4.32,
  reservationOutputTokens: 8192
};
var MAX_CONFIG_BYTES = 16 * 1024;
var MAX_USAGE_FILE_BYTES = 16 * 1024 * 1024;
var RETAIN_USAGE_MS = MONTH_MS;
var Mutex = class {
  tail = Promise.resolve();
  async run(operation) {
    const previous = this.tail;
    let release;
    this.tail = new Promise((resolve) => {
      release = resolve;
    });
    await previous;
    try {
      return await operation();
    } finally {
      release();
    }
  }
};
function finiteNonNegative(value, fallback) {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 ? value : fallback;
}
function normalizeConfig(input, fallback = DEFAULT_CONFIG) {
  const mode = input.mode === "month" ? "month" : input.mode === "week" ? "week" : fallback.mode;
  return {
    mode,
    bigLimitCny: Math.max(0.01, finiteNonNegative(input.bigLimitCny, fallback.bigLimitCny)),
    smallWindowHours: Math.min(24, Math.max(1, Math.round(finiteNonNegative(input.smallWindowHours, fallback.smallWindowHours)))),
    smallLimitCny: Math.max(0.01, finiteNonNegative(input.smallLimitCny, fallback.smallLimitCny)),
    inputCnyPerMillion: finiteNonNegative(input.inputCnyPerMillion, fallback.inputCnyPerMillion),
    cachedInputCnyPerMillion: finiteNonNegative(input.cachedInputCnyPerMillion, fallback.cachedInputCnyPerMillion),
    outputCnyPerMillion: finiteNonNegative(input.outputCnyPerMillion, fallback.outputCnyPerMillion),
    reservationOutputTokens: Math.max(1, Math.round(finiteNonNegative(input.reservationOutputTokens, fallback.reservationOutputTokens)))
  };
}
function isUsageRecord(value) {
  if (!value || typeof value !== "object") return false;
  const row = value;
  return typeof row.windowLabel === "string" && typeof row.ts === "number" && Number.isFinite(row.ts) && typeof row.cost === "number" && Number.isFinite(row.cost) && row.cost >= 0;
}
var QuotaStore = class {
  constructor(dataDirectory, initialConfig) {
    this.dataDirectory = dataDirectory;
    this.config = initialConfig;
    this.usagePath = join(dataDirectory, "usage.jsonl");
    this.configPath = join(dataDirectory, "config.json");
  }
  dataDirectory;
  mutex = new Mutex();
  reservations = /* @__PURE__ */ new Map();
  records = [];
  config;
  nextReservationId = 1;
  writesSinceTrim = 0;
  usagePath;
  configPath;
  price(usage) {
    return priceUsage(usage, this.config);
  }
  currentConfig() {
    return this.config;
  }
  async initialize() {
    await mkdir(this.dataDirectory, { recursive: true });
    this.records = await this.readUsage();
    const saved = await this.readConfig();
    if (saved) this.config = normalizeConfig(saved, this.config);
    await this.writeConfig(this.config);
  }
  async readUsage() {
    try {
      const text = await readFile(this.usagePath, "utf8");
      if (Buffer.byteLength(text, "utf8") > MAX_USAGE_FILE_BYTES) {
        throw new Error(`usage file exceeds ${MAX_USAGE_FILE_BYTES} bytes`);
      }
      const oldestRetained = Date.now() - RETAIN_USAGE_MS;
      return text.split(/\r?\n/).filter((line) => line.length > 0).flatMap((line) => {
        try {
          const value = JSON.parse(line);
          return isUsageRecord(value) && value.ts >= oldestRetained ? [value] : [];
        } catch {
          return [];
        }
      });
    } catch (error) {
      if (error.code === "ENOENT") return [];
      throw error;
    }
  }
  async readConfig() {
    try {
      const text = await readFile(this.configPath, "utf8");
      if (Buffer.byteLength(text, "utf8") > MAX_CONFIG_BYTES) return null;
      const value = JSON.parse(text);
      return value && typeof value === "object" ? value : null;
    } catch {
      return null;
    }
  }
  async writeConfig(config) {
    const temporaryPath = `${this.configPath}.tmp`;
    await writeFile(temporaryPath, `${JSON.stringify(config, null, 2)}
`, "utf8");
    await rename(temporaryPath, this.configPath);
  }
  async updateConfig(value) {
    return this.mutex.run(async () => {
      if (!value || typeof value !== "object" || Array.isArray(value)) {
        throw new Error("\u914D\u7F6E\u5FC5\u987B\u662F JSON \u5BF9\u8C61");
      }
      const input = value;
      if (input.mode !== "week" && input.mode !== "month") throw new Error("\u989D\u5EA6\u6A21\u5F0F\u65E0\u6548");
      if (typeof input.bigLimitCny !== "number" || !Number.isFinite(input.bigLimitCny) || input.bigLimitCny <= 0) {
        throw new Error("\u5927\u9650\u5236\u91D1\u989D\u5FC5\u987B\u5927\u4E8E 0");
      }
      if (typeof input.smallWindowHours !== "number" || !Number.isInteger(input.smallWindowHours) || input.smallWindowHours < 1 || input.smallWindowHours > 24) {
        throw new Error("\u5C0F\u7A97\u53E3\u5C0F\u65F6\u6570\u5FC5\u987B\u4E3A 1 \u5230 24 \u7684\u6574\u6570");
      }
      if (typeof input.smallLimitCny !== "number" || !Number.isFinite(input.smallLimitCny) || input.smallLimitCny <= 0) {
        throw new Error("\u5C0F\u9650\u5236\u91D1\u989D\u5FC5\u987B\u5927\u4E8E 0");
      }
      const next = normalizeConfig(input, this.config);
      this.validateConfig(next);
      await this.writeConfig(next);
      this.config = next;
      return next;
    });
  }
  validateConfig(config) {
    if (!Number.isFinite(config.bigLimitCny) || config.bigLimitCny <= 0) throw new Error("\u5927\u9650\u5236\u91D1\u989D\u5FC5\u987B\u5927\u4E8E 0");
    if (!Number.isInteger(config.smallWindowHours) || config.smallWindowHours < 1 || config.smallWindowHours > 24) {
      throw new Error("\u5C0F\u7A97\u53E3\u5C0F\u65F6\u6570\u5FC5\u987B\u4E3A 1 \u5230 24 \u7684\u6574\u6570");
    }
    if (!Number.isFinite(config.smallLimitCny) || config.smallLimitCny <= 0) throw new Error("\u5C0F\u9650\u5236\u91D1\u989D\u5FC5\u987B\u5927\u4E8E 0");
  }
  async reset() {
    await this.mutex.run(async () => {
      await writeFile(this.usagePath, "", "utf8");
      this.records = [];
      this.writesSinceTrim = 0;
    });
  }
  async checkAdmission(options) {
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
        throw new Error(`\u989D\u5EA6\u5B88\u536B\uFF1A\u9884\u8BA1\u8BF7\u6C42\u5C06\u8D85\u8FC7${this.config.mode === "week" ? "7\u5929" : "30\u5929"}\u989D\u5EA6\u3002`);
      }
      if (smallUsed + projectedCost > smallLimit + 1e-8) {
        throw new Error(`\u989D\u5EA6\u5B88\u536B\uFF1A\u9884\u8BA1\u8BF7\u6C42\u5C06\u8D85\u8FC7${this.config.mode === "week" ? `${this.config.smallWindowHours}\u5C0F\u65F6` : "7\u5929"}\u989D\u5EA6\u3002`);
      }
      const id = this.nextReservationId++;
      this.reservations.set(id, {
        id,
        startedAt: now,
        projectedCost,
        actualCost: 0,
        windowLabel: this.config.mode === "week" ? "weekly" : "monthly"
      });
      return id;
    });
  }
  async updateReservationCost(id, actualCost) {
    await this.mutex.run(() => {
      const reservation = this.reservations.get(id);
      if (reservation) reservation.actualCost = actualCost;
    });
  }
  async finishReservation(id, finalCost) {
    await this.mutex.run(async () => {
      const reservation = this.reservations.get(id);
      this.reservations.delete(id);
      if (reservation && Number.isFinite(finalCost) && finalCost > 0) {
        const record = {
          windowLabel: reservation.windowLabel,
          ts: Date.now(),
          cost: roundMoney(finalCost)
        };
        await appendFile(this.usagePath, `${JSON.stringify(record)}
`, "utf8");
        this.records.push(record);
        this.writesSinceTrim += 1;
        if (this.writesSinceTrim >= 100) await this.trimExpiredRecords();
      }
    });
  }
  async snapshot(getAccountBalance2) {
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
          smallResetAt: this.nextExpiry(now, windows.small)
        };
      }),
      getAccountBalance2()
    ]);
    return { ...state, accountBalance };
  }
  windowCost(now, windowMs) {
    const cutoff = now - windowMs;
    let total = 0;
    for (const record of this.records) if (record.ts > cutoff) total += record.cost;
    for (const reservation of this.reservations.values()) {
      if (reservation.startedAt > cutoff) total += Math.max(reservation.projectedCost, reservation.actualCost);
    }
    return total;
  }
  nextExpiry(now, windowMs) {
    const cutoff = now - windowMs;
    let next = null;
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
  async trimExpiredRecords() {
    const cutoff = Date.now() - RETAIN_USAGE_MS;
    this.records = this.records.filter((record) => record.ts >= cutoff);
    await writeFile(this.usagePath, this.records.map((record) => JSON.stringify(record)).join("\n") + (this.records.length ? "\n" : ""), "utf8");
    this.writesSinceTrim = 0;
  }
};
function remainingPercent(used, limit) {
  return limit <= 0 ? 0 : Math.max(0, Math.min(100, (limit - used) / limit * 100));
}
function roundMoney(value) {
  return Math.round((value + Number.EPSILON) * 1e6) / 1e6;
}
function priceUsage(usage, config) {
  const inputTokens = finiteNonNegative(usage.inputTokens, 0);
  const outputTokens = finiteNonNegative(usage.outputTokens, 0);
  const cacheReadTokens = finiteNonNegative(usage.cacheReadTokens, 0);
  const cacheWriteTokens = finiteNonNegative(usage.cacheWriteTokens, 0);
  const inputCost = ((inputTokens + cacheWriteTokens) * config.inputCnyPerMillion + cacheReadTokens * config.cachedInputCnyPerMillion) / 1e6;
  return inputCost + outputTokens * config.outputCnyPerMillion / 1e6;
}
function estimateInputTokens(options) {
  let characters = 0;
  const add = (value, depth = 0) => {
    if (depth > 8 || value == null) return;
    if (typeof value === "string") {
      characters += value.length;
      return;
    }
    if (typeof value !== "object") return;
    if (Array.isArray(value)) {
      for (const item of value) add(item, depth + 1);
      return;
    }
    const row = value;
    for (const [key, item] of Object.entries(row)) {
      if (key === "attachment") {
        characters += 1024;
      } else if (typeof item === "string") {
        characters += item.length;
      } else if (typeof item === "object" && item !== null) {
        add(item, depth + 1);
      }
    }
  };
  add(options.system);
  add(options.messages);
  add(options.tools);
  return Math.ceil(characters / 4) + options.messages.length * 8 + (options.tools?.length ?? 0) * 16;
}
function outputCharsFromChunk(chunk) {
  switch (chunk.type) {
    case "text-delta":
    case "reasoning-delta":
      return chunk.text.length;
    case "tool-call-delta":
      return chunk.argumentsDelta.length;
    case "block-end":
      if (chunk.block.type === "text" || chunk.block.type === "reasoning") return chunk.block.text.length;
      if (chunk.block.type === "tool-call") return chunk.block.arguments.length;
      return 0;
    default:
      return 0;
  }
}
function createStreamMeter(ctx, store) {
  ctx.on("llm/stream", (options, next) => {
    return (async function* () {
      const reservationId = await store.checkAdmission(options);
      let latestUsageCost = 0;
      let usageObserved = false;
      let deltaOutputChars = 0;
      let completedBlockChars = 0;
      const inputTokens = estimateInputTokens(options);
      try {
        for await (const chunk of next()) {
          if (chunk.type === "usage") {
            usageObserved = true;
            latestUsageCost = store.price(chunk.usage);
            await store.updateReservationCost(reservationId, latestUsageCost);
          } else if (chunk.type === "text-delta" || chunk.type === "reasoning-delta" || chunk.type === "tool-call-delta") {
            deltaOutputChars += outputCharsFromChunk(chunk);
          } else if (chunk.type === "block-end") {
            completedBlockChars += outputCharsFromChunk(chunk);
          } else {
          }
          yield chunk;
        }
      } finally {
        const outputChars = Math.max(deltaOutputChars, completedBlockChars);
        const estimatedCost = priceUsage({
          inputTokens,
          outputTokens: Math.ceil(outputChars / 4)
        }, store.currentConfig());
        await store.finishReservation(reservationId, usageObserved ? latestUsageCost : estimatedCost);
      }
    })();
  });
}
function jsonResponse(value, status = 200) {
  return Response.json(value, {
    status,
    headers: { "cache-control": "no-store" }
  });
}
async function readRequestJson(request) {
  if (!request.headers.get("content-type")?.toLowerCase().startsWith("application/json")) {
    throw new Error("\u8BF7\u6C42\u5FC5\u987B\u4F7F\u7528 application/json");
  }
  if (!request.body) throw new Error("\u8BF7\u6C42\u4F53\u4E3A\u7A7A");
  const reader = request.body.getReader();
  const chunks = [];
  let totalBytes = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    totalBytes += value.byteLength;
    if (totalBytes > MAX_CONFIG_BYTES) {
      await reader.cancel();
      throw new Error("\u8BF7\u6C42\u5185\u5BB9\u8FC7\u5927");
    }
    chunks.push(value);
  }
  const text = new TextDecoder().decode(Buffer.concat(chunks.map((chunk) => Buffer.from(chunk)), totalBytes));
  return JSON.parse(text);
}
async function getAccountBalance() {
  return 51.5;
}
async function apply(ctx, rawConfig = {}) {
  const initialConfig = normalizeConfig(rawConfig);
  const home = process.env.DSH_HOME?.trim() || join(homedir(), ".dsh");
  const store = new QuotaStore(join(home, "plugins", "dsh-quota-guard"), initialConfig);
  await store.initialize();
  createStreamMeter(ctx, store);
  ctx.effect(() => ctx.connection.fetch.register({
    path: QUOTA_API.state,
    methods: ["GET"],
    requestBody: "buffered",
    fetch: async () => jsonResponse(await store.snapshot(getAccountBalance))
  }), "dsh-quota-guard: state API");
  ctx.effect(() => ctx.connection.fetch.register({
    path: QUOTA_API.config,
    methods: ["POST"],
    requestBody: "streaming",
    fetch: async (request) => {
      try {
        await store.updateConfig(await readRequestJson(request));
        return jsonResponse(await store.snapshot(getAccountBalance));
      } catch (error) {
        return jsonResponse({ error: error instanceof Error ? error.message : "\u4FDD\u5B58\u8BBE\u7F6E\u5931\u8D25" }, 400);
      }
    }
  }), "dsh-quota-guard: config API");
  ctx.effect(() => ctx.connection.fetch.register({
    path: QUOTA_API.reset,
    methods: ["POST"],
    requestBody: "buffered",
    fetch: async () => {
      try {
        await store.reset();
        return jsonResponse(await store.snapshot(getAccountBalance));
      } catch {
        return jsonResponse({ error: "\u91CD\u7F6E\u989D\u5EA6\u8BB0\u5F55\u5931\u8D25" }, 500);
      }
    }
  }), "dsh-quota-guard: reset API");
}
export {
  Config,
  apply,
  getAccountBalance,
  inject,
  name
};
