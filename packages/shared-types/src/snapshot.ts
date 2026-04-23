export type PageActionKind =
  | 'click'
  | 'navigate'
  | 'input'
  | 'submit'
  | 'toggle'
  | 'menu'
  | 'other';

export interface PageMetadata {
  readonly url: string;
  readonly hostname: string;
  readonly title: string;
  readonly capturedAt: string;
}

export interface ActionNode {
  readonly id: string;
  readonly kind: PageActionKind;
  readonly label: string;
  readonly selector: string;
  readonly role?: string;
  readonly href?: string;
  readonly disabled?: boolean;
}

export interface SectionNode {
  readonly id: string;
  readonly heading: string;
  readonly level: number;
  readonly selector: string;
}

export interface PageMetrics {
  readonly actionCount: number;
  readonly sectionCount: number;
  readonly wordCount: number;
  readonly interactiveDensity: number;
}

export interface PageSnapshot {
  readonly metadata: PageMetadata;
  readonly actions: readonly ActionNode[];
  readonly sections: readonly SectionNode[];
  readonly metrics: PageMetrics;
}
