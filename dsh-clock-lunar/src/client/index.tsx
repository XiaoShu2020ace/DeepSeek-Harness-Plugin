import type { Context } from '@deepseek-ai/cordis';
import type {} from '@deepseek-ai/dsh-client-ui-renderer/client';
import { ClockWidget } from './ClockWidget.js';

export const inject = ['slots'];

export function apply(ctx: Context): void {
  // 当前 DSH 版本实际提供的标题栏最右侧 Slot。
  ctx.slots.inject('conversation.session.header.corner', () => ctx.slots.register(
    { name: 'conversation.session.header.corner' },
    ClockWidget,
  ));
}
