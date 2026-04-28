import type {
  BehaviorType,
  InsertJumpLinksOp,
  InsertToolbarOp,
  MountOverlayRootOp,
  RuntimeExecutionPlan,
  RuntimeOp,
} from '@pageaura/shared-types';

const OVERLAY_RUN_DATA_ATTRIBUTE = 'data-pageaura-overlay';
const OVERLAY_COMPONENT_ATTRIBUTE = 'data-pageaura-component';

interface RuntimeState {
  cleanup: () => void;
}

let runtimeState: RuntimeState | null = null;

const runCleanups = (cleanups: readonly Array<() => void>): void => {
  for (const cleanup of cleanups) {
    try {
      cleanup();
    } catch (error) {
      console.warn('[PageAura] cleanup failed', error);
    }
  }
};

const resolveTarget = (selector: string): HTMLElement | null => {
  const candidate = document.querySelector(selector);
  return candidate instanceof HTMLElement ? candidate : null;
};

const runBehavior = (target: HTMLElement, behavior: BehaviorType): void => {
  switch (behavior) {
    case 'focus':
      target.focus({ preventScroll: false });
      break;
    case 'scroll':
      target.scrollIntoView({ behavior: 'smooth', block: 'start', inline: 'nearest' });
      break;
    case 'click':
      target.click();
      break;
  }
};

const safeBindAction = (
  element: HTMLElement,
  action: () => void,
  cleanups: Array<() => void>,
): void => {
  const listener = (event: Event) => {
    event.preventDefault();
    event.stopPropagation();

    try {
      action();
    } catch (error) {
      console.warn('[PageAura] action execution failed', error);
    }
  };

  element.addEventListener('click', listener);
  cleanups.push(() => {
    element.removeEventListener('click', listener);
  });
};

const executeMountOverlayRoot = (
  op: MountOverlayRootOp,
  cleanups: Array<() => void>,
): HTMLElement | null => {
  const existing = document.getElementById(op.containerId);
  if (existing instanceof HTMLElement) {
    existing.remove();
  }

  const root = document.createElement('div');
  root.id = op.containerId;
  root.setAttribute(OVERLAY_RUN_DATA_ATTRIBUTE, 'true');
  root.style.position = 'fixed';
  root.style.top = '12px';
  root.style.right = '12px';
  root.style.zIndex = '2147483647';
  root.style.display = 'grid';
  root.style.gap = '8px';
  root.style.fontFamily = 'system-ui, sans-serif';

  document.body.append(root);
  cleanups.push(() => {
    root.remove();
  });

  return root;
};

const executeToolbar = (
  op: InsertToolbarOp,
  overlayRoot: HTMLElement,
  cleanups: Array<() => void>,
): void => {
  if (!op.items.length) {
    return;
  }

  const toolbar = document.createElement('section');
  toolbar.setAttribute(OVERLAY_COMPONENT_ATTRIBUTE, 'toolbar');
  toolbar.style.display = 'flex';
  toolbar.style.flexWrap = 'wrap';
  toolbar.style.gap = '6px';
  toolbar.style.padding = '8px';
  toolbar.style.background = 'rgba(17, 24, 39, 0.95)';
  toolbar.style.borderRadius = '10px';

  for (const item of op.items) {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = item.label;
    button.setAttribute('data-pageaura-item-id', item.id);
    button.style.border = '1px solid rgba(255,255,255,0.35)';
    button.style.background = 'transparent';
    button.style.color = '#fff';
    button.style.padding = '6px 10px';
    button.style.borderRadius = '8px';
    button.style.cursor = 'pointer';

    safeBindAction(
      button,
      () => {
        const target = resolveTarget(item.selector);
        if (!target) {
          console.info('[PageAura] toolbar target not found', {
            selector: item.selector,
            itemId: item.id,
          });
          return;
        }

        runBehavior(target, item.behavior);
      },
      cleanups,
    );

    toolbar.append(button);
  }

  overlayRoot.append(toolbar);
};

const executeJumpLinks = (
  op: InsertJumpLinksOp,
  overlayRoot: HTMLElement,
  cleanups: Array<() => void>,
): void => {
  if (!op.links.length) {
    return;
  }

  const nav = document.createElement('nav');
  nav.setAttribute(OVERLAY_COMPONENT_ATTRIBUTE, 'jump-links');
  nav.style.display = 'grid';
  nav.style.gap = '4px';
  nav.style.padding = '8px';
  nav.style.background = 'rgba(31, 41, 55, 0.95)';
  nav.style.borderRadius = '10px';

  for (const link of op.links) {
    const anchor = document.createElement('a');
    anchor.href = '#';
    anchor.textContent = link.label;
    anchor.setAttribute('data-pageaura-link-id', link.id);
    anchor.style.color = '#dbeafe';
    anchor.style.textDecoration = 'none';

    safeBindAction(
      anchor,
      () => {
        const target = resolveTarget(link.selector);
        if (!target) {
          console.info('[PageAura] jump link target not found', {
            selector: link.selector,
            linkId: link.id,
          });
          return;
        }

        target.scrollIntoView({ behavior: 'smooth', block: 'start', inline: 'nearest' });
        target.focus({ preventScroll: true });
      },
      cleanups,
    );

    nav.append(anchor);
  }

  overlayRoot.append(nav);
};

const runOp = (
  op: RuntimeOp,
  overlayRoot: HTMLElement | null,
  cleanups: Array<() => void>,
): HTMLElement | null => {
  switch (op.opType) {
    case 'mount_overlay_root':
      return executeMountOverlayRoot(op, cleanups);
    case 'insert_toolbar':
      if (overlayRoot) {
        executeToolbar(op, overlayRoot, cleanups);
      }
      return overlayRoot;
    case 'insert_jump_links':
      if (overlayRoot) {
        executeJumpLinks(op, overlayRoot, cleanups);
      }
      return overlayRoot;
    default:
      return overlayRoot;
  }
};

export const executeRuntimePlan = (executionPlan: RuntimeExecutionPlan): void => {
  if (runtimeState) {
    runtimeState.cleanup();
  }

  const cleanups: Array<() => void> = [];
  let overlayRoot: HTMLElement | null = null;
  let mountContainerId = 'pageaura-overlay-root';

  for (const op of executionPlan.ops) {
    overlayRoot = runOp(op, overlayRoot, cleanups);

    if (op.opType === 'mount_overlay_root') {
      mountContainerId = op.containerId;
    }
  }

  runtimeState = {
    cleanup: () => {
      runCleanups(cleanups.slice().reverse());
      const leftover = document.getElementById(mountContainerId);
      if (leftover instanceof HTMLElement) {
        leftover.remove();
      }
      runtimeState = null;
    },
  };
};

export const cleanupRuntimePlan = (): void => {
  runtimeState?.cleanup();
};
