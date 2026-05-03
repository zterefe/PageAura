import type {
  ApplyStylePatchOp,
  ApplyThemeTokensOp,
  BehaviorType,
  InsertJumpLinksOp,
  InsertToolbarOp,
  MountOverlayRootOp,
  RuntimeExecutionPlan,
  RuntimeOp,
} from '@pageaura/shared-types';
import { resolveRuntimeSelector } from './semanticResolvers';
import { compileThemeTokensToCss, normalizeAndClampThemeTokens } from './themeTokenCompiler';

const OVERLAY_RUN_DATA_ATTRIBUTE = 'data-pageaura-overlay';
const OVERLAY_COMPONENT_ATTRIBUTE = 'data-pageaura-component';
const THEME_CLASSNAME = 'pageaura-theme-patch';
const THEME_STYLE_ELEMENT_ID = 'pageaura-theme-patch-style';

interface RuntimeState {
  cleanup: () => void;
}

let runtimeState: RuntimeState | null = null;

const runCleanups = (cleanups: ReadonlyArray<() => void>): void => {
  for (const cleanup of cleanups) {
    try {
      cleanup();
    } catch (error) {
      console.warn('[PageAura] cleanup failed', error);
    }
  }
};

const resolveTarget = (selector: string): HTMLElement | null => {
  const candidate = document.querySelector(resolveRuntimeSelector(selector));
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

const ensureStyleElement = (id: string): HTMLStyleElement => {
  const existing = document.getElementById(id);
  if (existing instanceof HTMLStyleElement) {
    return existing;
  }

  const styleTag = document.createElement('style');
  styleTag.id = id;
  document.head.append(styleTag);
  return styleTag;
};

const executeThemePatch = (op: ApplyThemeTokensOp, cleanups: Array<() => void>): void => {
  const { tokens, clamped } = normalizeAndClampThemeTokens(op.tokens);
  if (clamped.length > 0) {
    console.info('[PageAura] theme tokens clamped', { opId: op.opId, clamped });
  }

  const styleTag = ensureStyleElement(THEME_STYLE_ELEMENT_ID);
  styleTag.textContent = compileThemeTokensToCss(op.preset, tokens);

  document.documentElement.classList.add(THEME_CLASSNAME);
  document.body.classList.add(THEME_CLASSNAME);

  cleanups.push(() => {
    document.documentElement.classList.remove(THEME_CLASSNAME);
    document.body.classList.remove(THEME_CLASSNAME);
    styleTag.remove();
  });
};

const compileStyleRulesToCss = (op: ApplyStylePatchOp): string => {
  return op.rules
    .map((rule, index) => {
      const selector = resolveRuntimeSelector(rule.selector);
      if (!selector) {
        return '';
      }

      const body = Object.entries(rule.declarations)
        .map(([property, rawValue]) => [property.trim(), rawValue.trim()] as const)
        .filter(([property, value]) => property.length > 0 && value.length > 0)
        .map(([property, value]) => `  ${property}: ${value} !important;`)
        .join('\n');

      if (!body) {
        return '';
      }

      return `/* pageaura-style-rule:${op.opId}:${index + 1} */\n${selector} {\n${body}\n}`;
    })
    .filter((chunk) => chunk.length > 0)
    .join('\n');
};

const executeStylePatch = (op: ApplyStylePatchOp, cleanups: Array<() => void>): void => {
  if (!op.rules.length) {
    return;
  }

  const styleTag = document.createElement('style');
  styleTag.setAttribute('data-pageaura-style-op', op.opId);
  styleTag.textContent = compileStyleRulesToCss(op);
  document.head.append(styleTag);

  cleanups.push(() => {
    styleTag.remove();
  });
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
    case 'apply_theme_tokens':
      executeThemePatch(op, cleanups);
      return overlayRoot;
    case 'apply_style_patch':
      executeStylePatch(op, cleanups);
      return overlayRoot;
    default:
      return overlayRoot;
  }
};

export interface RuntimeExecutionResult {
  readonly ok: boolean;
  readonly failedOpId?: string;
}

export const executeRuntimePlan = (executionPlan: RuntimeExecutionPlan): RuntimeExecutionResult => {
  if (runtimeState) {
    runtimeState.cleanup();
  }

  const cleanups: Array<() => void> = [];
  let overlayRoot: HTMLElement | null = null;
  let mountContainerId = 'pageaura-overlay-root';

  for (const op of executionPlan.ops) {
    try {
      overlayRoot = runOp(op, overlayRoot, cleanups);
    } catch (error) {
      console.warn('[PageAura] runtime op failed', {
        opId: op.opId,
        opType: op.opType,
        error,
      });

      runCleanups(cleanups.slice().reverse());
      const leftover = document.getElementById(mountContainerId);
      if (leftover instanceof HTMLElement) {
        leftover.remove();
      }
      runtimeState = null;
      return {
        ok: false,
        failedOpId: op.opId,
      };
    }

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

  return { ok: true };
};

export const cleanupRuntimePlan = (): void => {
  runtimeState?.cleanup();
};
