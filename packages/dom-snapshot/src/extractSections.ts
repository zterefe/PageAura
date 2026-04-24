import type { SectionNode } from '@pageaura/shared-types';

import { MAX_LABEL_LENGTH, MAX_SECTION_NODES } from './constants.js';
import { createStableSelector, isElementVisible } from './domUtils.js';

const SECTION_SELECTOR = 'main, section, article, nav, aside, h1, h2, h3, h4, h5, h6';

const resolveHeadingAndLevel = (
  element: Element,
): Pick<SectionNode, 'heading' | 'level'> | null => {
  if (/^H[1-6]$/.test(element.tagName)) {
    return {
      heading: (element.textContent ?? '').trim(),
      level: Number(element.tagName.slice(1)),
    };
  }

  const headingElement = element.querySelector('h1, h2, h3, h4, h5, h6');
  if (!headingElement) {
    return null;
  }

  return {
    heading: (headingElement.textContent ?? '').trim(),
    level: Number(headingElement.tagName.slice(1)),
  };
};

export const extractSections = (): SectionNode[] => {
  const sectionElements = Array.from(document.querySelectorAll(SECTION_SELECTOR));
  const sections: SectionNode[] = [];

  for (const element of sectionElements) {
    if (!isElementVisible(element)) {
      continue;
    }

    const headingAndLevel = resolveHeadingAndLevel(element);
    if (!headingAndLevel || !headingAndLevel.heading) {
      continue;
    }

    sections.push({
      id: `section-${sections.length + 1}`,
      heading: headingAndLevel.heading.replace(/\s+/g, ' ').slice(0, MAX_LABEL_LENGTH),
      level: headingAndLevel.level,
      selector: createStableSelector(element),
    });

    if (sections.length >= MAX_SECTION_NODES) {
      break;
    }
  }

  return sections;
};
