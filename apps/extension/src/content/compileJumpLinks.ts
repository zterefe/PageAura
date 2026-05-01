import type {
  InsertJumpLinksOp,
  JumpLinksEnhancement,
  JumpLinkRuntimeItem,
} from '@pageaura/shared-types';

type InsertJumpLinksOpDraft = Omit<InsertJumpLinksOp, 'cleanup'>;

const normalizeJumpLinks = (
  links: JumpLinksEnhancement['links'],
): readonly JumpLinkRuntimeItem[] => {
  return links.map((link) => ({
    id: link.id.trim(),
    label: link.label.trim(),
    selector: link.selector.trim(),
  }));
};

export const compileJumpLinks = (
  enhancement: JumpLinksEnhancement,
  opId: string,
): InsertJumpLinksOpDraft => {
  return {
    opId,
    opType: 'insert_jump_links',
    links: normalizeJumpLinks(enhancement.links),
  };
};
