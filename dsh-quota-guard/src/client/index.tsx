import type { Context } from '@deepseek-ai/cordis';
import type {} from '@deepseek-ai/dsh-client-ui-renderer/client';
import { TopBarIcon } from './TopBarIcon.js';

export const inject = ['slots'];

export function apply(ctx: Context): void {
  ctx.slots.inject('conversation.session.header.corner', () => ctx.slots.register(
    { name: 'conversation.session.header.corner' },
    TopBarIcon,
  ));
}
