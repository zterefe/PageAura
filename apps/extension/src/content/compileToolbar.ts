import type {
  InsertToolbarEnhancement,
  InsertToolbarOp,
  ToolbarRuntimeItem,
} from '@pageaura/shared-types';

type InsertToolbarOpDraft = Omit<InsertToolbarOp, 'cleanup'>;

const normalizeToolbarItems = (
  items: InsertToolbarEnhancement['items'],
): readonly ToolbarRuntimeItem[] => {
  return items.map((item) => ({
    id: item.id.trim(),
    label: item.label.trim(),
    selector: item.selector.trim(),
    behavior: item.behavior,
  }));
};

export const compileToolbar = (
  enhancement: InsertToolbarEnhancement,
  opId: string,
): InsertToolbarOpDraft => {
  return {
    opId,
    opType: 'insert_toolbar',
    items: normalizeToolbarItems(enhancement.items),
  };
};
