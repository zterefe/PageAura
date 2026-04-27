import type {
  InsertJumpLinksOp,
  JumpLinksEnhancement,
  JumpLinkRuntimeItem,
} from '@pageaura/shared-types';

const normalizeJumpLinks = (
  links: readonly JumpLinksEnhancement['links'],
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
): InsertJumpLinksOp => {
  return {
    opId,
    opType: 'insert_jump_links',
    links: normalizeJumpLinks(enhancement.links),
  };
};
