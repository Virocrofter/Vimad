/* apps/api/src/modules/tasks/task-push.public.routes.ts — T5 one-tap page.
 * The token IS the capability: no login, no app. Mounted at /v1/tasks/t with a
 * per-IP rate limit. GET renders the mobile page; POST applies the action and
 * redirects back (PRG — refresh never re-submits).
 */
import { Router, type Request, type Response } from 'express';
import { prisma } from '../../common/prisma.js';
import { escapeHtml } from '../../common/sanitize.js';
import { logger } from '../../common/logger.js';

export const tasksPublicRouter = Router();

const PAGE_STYLE = `
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif;
         background: #f4f4f8; color: #1a1a2e; min-height: 100vh;
         display: flex; align-items: center; justify-content: center; padding: 20px; }
  .card { background: #fff; border-radius: 16px; padding: 28px 24px; max-width: 420px;
          width: 100%; box-shadow: 0 8px 30px rgba(0,0,0,.08); }
  .brand { font-size: 12px; letter-spacing: .12em; text-transform: uppercase;
           color: #863bff; font-weight: 700; margin-bottom: 12px; }
  h1 { font-size: 20px; margin-bottom: 6px; }
  .meta { font-size: 13px; color: #666; margin-bottom: 18px; }
  .badge { display: inline-block; padding: 4px 12px; border-radius: 999px;
           font-size: 12px; font-weight: 600; margin-bottom: 20px; }
  .b-open { background: #dbeafe; color: #1d4ed8; }
  .b-progress { background: #fef3c7; color: #b45309; }
  .b-done { background: #dcfce7; color: #15803d; }
  .b-cancelled { background: #fee2e2; color: #b91c1c; }
  .flash { background: #dcfce7; color: #15803d; border-radius: 10px;
           padding: 12px 14px; font-size: 14px; margin-bottom: 18px; font-weight: 600; }
  form { margin-bottom: 10px; }
  button { width: 100%; border: none; border-radius: 12px; padding: 16px;
           font-size: 16px; font-weight: 700; cursor: pointer; }
  .primary { background: #863bff; color: #fff; }
  .secondary { background: #eef2ff; color: #4338ca; }
  .danger { background: #fff1f2; color: #be123c; }
  .foot { margin-top: 18px; font-size: 11px; color: #999; text-align: center; }
`;

function page(title: string, inner: string): string {
  return `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>${escapeHtml(title)} — Vimad</title><style>${PAGE_STYLE}</style></head>
<body><div class="card">${inner}</div></body></html>`;
}

function loadTask(token: string) {
  return prisma.task.findUnique({
    where: { pushToken: token },
    include: {
      property: { select: { name: true } },
      room: { select: { number: true } },
      assignee: { select: { firstName: true, lastName: true } },
    },
  });
}

type LoadedTask = NonNullable<Awaited<ReturnType<typeof loadTask>>>;

function isUsable(task: LoadedTask): boolean {
  return Boolean(task.pushTokenExpiresAt && task.pushTokenExpiresAt.getTime() > Date.now());
}

function expiredPage(): string {
  return page(
    'Link expired',
    `<div class="brand">Vimad</div><h1>Link expired</h1>
     <p class="meta">This task link is invalid or has expired. Please contact the front desk.</p>`
  );
}

function badge(status: string): string {
  const map: Record<string, string> = {
    open: 'b-open',
    in_progress: 'b-progress',
    done: 'b-done',
    cancelled: 'b-cancelled',
  };
  const label: Record<string, string> = {
    open: 'Open',
    in_progress: 'In progress',
    done: 'Done',
    cancelled: 'Cancelled',
  };
  return `<span class="badge ${map[status] ?? 'b-open'}">${label[status] ?? escapeHtml(status)}</span>`;
}

// ─── GET /v1/tasks/t/:token — the one-tap page ───
tasksPublicRouter.get('/:token', async (req: Request, res: Response): Promise<void> => {
  const task = await loadTask(req.params.token);
  if (!task || !isUsable(task)) {
    res.status(404).send(expiredPage());
    return;
  }

  const flash =
    typeof req.query.m === 'string' && req.query.m
      ? `<div class="flash">${escapeHtml(req.query.m)}</div>`
      : '';

  const roomBit = task.room?.number ? ` · Room ${escapeHtml(task.room.number)}` : '';
  const who = task.assignee
    ? ` · ${escapeHtml([task.assignee.firstName, task.assignee.lastName].filter(Boolean).join(' '))}`
    : '';
  const dueBit = task.dueAt
    ? ` · Due ${escapeHtml(new Date(task.dueAt).toLocaleString('en-ZA'))}`
    : '';

  const active = task.status === 'open' || task.status === 'in_progress';
  const actions = active
    ? `
      ${task.status === 'open' ? `<form method="post" action="/v1/tasks/t/${task.pushToken}/start"><button type="submit" class="secondary">Start task</button></form>` : ''}
      <form method="post" action="/v1/tasks/t/${task.pushToken}/done"><button type="submit" class="primary">Mark done</button></form>
      <form method="post" action="/v1/tasks/t/${task.pushToken}/cant"><button type="submit" class="danger">I can't do this</button></form>`
    : `<p class="meta">This task is closed — nothing more to do. Thank you.</p>`;

  res.send(
    page(
      task.title,
      `<div class="brand">Vimad · ${escapeHtml(task.property?.name ?? '')}</div>
       ${flash}
       <h1>${escapeHtml(task.title)}</h1>
       <p class="meta">${escapeHtml(task.department.replace(/_/g, ' '))}${roomBit}${who}${dueBit}</p>
       ${badge(task.status)}
       ${actions}
       <div class="foot">Sent by Vimad — no app needed. Status lands on the board instantly.</div>`
    )
  );
});

// ─── POST /v1/tasks/t/:token/:action — apply one tap ───
tasksPublicRouter.post('/:token/:action', async (req: Request, res: Response): Promise<void> => {
  const { token, action } = req.params;
  const task = await loadTask(token);
  if (!task || !isUsable(task)) {
    res.status(404).send(expiredPage());
    return;
  }

  const active = task.status === 'open' || task.status === 'in_progress';
  let message = '';

  if (active && action === 'start' && task.status === 'open') {
    await prisma.task.update({
      where: { id: task.id },
      data: { status: 'in_progress' },
    });
    message = 'Task started — the board has been updated.';
  } else if (active && action === 'done') {
    await prisma.task.update({
      where: { id: task.id },
      data: {
        status: 'done',
        completedAt: new Date(),
        completedBy: `push:${task.pushChannel ?? 'link'}`,
      },
    });
    message = 'Task marked done — the board has been updated. Thank you.';
  } else if (active && action === 'cant') {
    await prisma.task.update({
      where: { id: task.id },
      data: {
        status: 'cancelled',
        metadata: { ...((task.metadata ?? {}) as object), cancelledVia: 'push-link' },
      },
    });
    message = 'Noted — the task is cancelled and the desk has been informed.';
  } else {
    message = 'That action is no longer available for this task.';
  }

  await prisma.auditLog
    .create({
      data: {
        tenantId: task.tenantId,
        action: `task.${action}.via-push`,
        entity: 'task',
        entityId: task.id,
        metadata: { status: task.status, ip: req.ip },
      },
    })
    .catch(() => {});

  logger.info({ taskId: task.id, action, ip: req.ip }, 'task updated via one-tap push link');
  res.redirect(303, `/v1/tasks/t/${token}?m=${encodeURIComponent(message)}`);
});
