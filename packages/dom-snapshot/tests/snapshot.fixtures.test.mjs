import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class FakeElement {
  constructor(tagName, attributes = {}, textContent = '') {
    this.tagName = tagName;
    this.attributes = attributes;
    this.textContent = textContent;
    this.parentElement = null;
    this.children = [];
    this.classList = {
      values: (attributes.class ?? '').split(/\s+/).filter(Boolean),
      [Symbol.iterator]: function* iterator() {
        for (const value of this.values) {
          yield value;
        }
      },
    };
    this.hidden = false;
    this.type = attributes.type;
    this.disabled = Boolean(attributes.disabled);
    this.id = attributes.id ?? '';
    this.name = attributes.name ?? '';
    this.href = attributes.href ? `https://example.test${attributes.href}` : undefined;
  }

  getAttribute(name) {
    return this.attributes[name] ?? null;
  }

  querySelector(selector) {
    if (selector.includes('h1') && this.children[0]?.tagName === 'H1') {
      return this.children[0];
    }

    return null;
  }

  matches(selector) {
    return selector.split(',').some((entry) => {
      const token = entry.trim();
      if (!token) return false;
      if (token === 'header' || token === 'nav') return this.tagName.toLowerCase() === token;
      if (token === '[role="navigation"]') return this.getAttribute('role') === 'navigation';
      return false;
    });
  }
}

class FakeAnchorElement extends FakeElement {}
class FakeButtonElement extends FakeElement {}
class FakeInputElement extends FakeElement {}
class FakeSelectElement extends FakeElement {}
class FakeTextAreaElement extends FakeElement {}

const buildElement = (source) => {
  const map = {
    A: FakeAnchorElement,
    BUTTON: FakeButtonElement,
    INPUT: FakeInputElement,
    SELECT: FakeSelectElement,
    TEXTAREA: FakeTextAreaElement,
    DIV: FakeElement,
    H1: FakeElement,
  };

  const Type = map[source.tagName] ?? FakeElement;
  return new Type(source.tagName, source.attributes, source.textContent ?? '');
};

const applyFixtureDom = (fixture) => {
  const actionElements = fixture.actionElements.map(buildElement);
  const sectionElements = fixture.sectionElements.map((section) => {
    const element = buildElement(section);
    if (section.headingText) {
      const heading = buildElement({
        tagName: 'H1',
        textContent: section.headingText,
        attributes: {},
      });
      heading.parentElement = element;
      element.children = [heading];
    }
    return element;
  });

  globalThis.CSS = { escape: (value) => String(value) };
  globalThis.window = {
    location: new URL(fixture.url),
    getComputedStyle: () => ({ display: 'block', visibility: 'visible', opacity: '1' }),
  };

  globalThis.document = {
    title: fixture.title,
    body: {
      innerText: fixture.bodyText,
    },
    querySelectorAll: (selector) => {
      if (selector.includes('a[href]') || selector.includes('button')) {
        return actionElements;
      }

      if (selector.includes('main') || selector.includes('section') || selector.includes('h1')) {
        return sectionElements;
      }

      if (selector === 'header nav, nav, [role="navigation"]') {
        return new Array(fixture.navCount).fill(new FakeElement('NAV'));
      }

      if (selector === 'form') {
        return new Array(fixture.formCount).fill(new FakeElement('FORM'));
      }

      if (selector === 'ul li, ol li, [role="listitem"], [data-testid*="card" i]') {
        return new Array(fixture.listingCount).fill(new FakeElement('LI'));
      }

      return [];
    },
    querySelector: (selector) => {
      if (selector.includes('input[type="search"]')) {
        return actionElements.find((element) => element instanceof FakeInputElement) ?? null;
      }

      if (selector === 'article, main article, [itemprop="articleBody"]') {
        return fixture.hasArticle ? new FakeElement('ARTICLE') : null;
      }

      return null;
    },
  };

  globalThis.Element = FakeElement;
  globalThis.HTMLElement = FakeElement;
  globalThis.HTMLAnchorElement = FakeAnchorElement;
  globalThis.HTMLButtonElement = FakeButtonElement;
  globalThis.HTMLInputElement = FakeInputElement;
  globalThis.HTMLSelectElement = FakeSelectElement;
  globalThis.HTMLTextAreaElement = FakeTextAreaElement;
};

const loadBuiltModule = async () => {
  const distPath = path.resolve(__dirname, '..', 'dist', 'createPageSnapshot.js');
  return import(pathToFileURL(distPath).href);
};

const loadFixture = (filename) => {
  return JSON.parse(readFileSync(path.join(__dirname, 'fixtures', filename), 'utf8'));
};

test('extracts page-type hints and layout heuristics', async () => {
  const { createPageSnapshot } = await loadBuiltModule();
  applyFixtureDom(loadFixture('search-nav.json'));

  const snapshot = createPageSnapshot();

  assert.equal(snapshot.metadata.title, 'Docs Home');
  assert(snapshot.metadata.pageTypeHints.includes('search'));
  assert(snapshot.metadata.pageTypeHints.includes('navigation'));
  assert(snapshot.metadata.pageTypeHints.includes('landing'));
});

test('deduplicates semantically similar actions', async () => {
  const { createPageSnapshot } = await loadBuiltModule();
  applyFixtureDom(loadFixture('dedup-actions.json'));

  const snapshot = createPageSnapshot();

  const buyActions = snapshot.actions.filter((action) => action.label === 'Buy now');
  const detailsActions = snapshot.actions.filter((action) => action.label === 'View details');

  assert.equal(buyActions.length, 1);
  assert.equal(detailsActions.length, 1);
  assert(snapshot.actions.some((action) => action.selector.includes('data-testid="buy-button"')));
});

test('prefers enabled duplicates and preserves distinct query-link targets', async () => {
  const { createPageSnapshot } = await loadBuiltModule();
  applyFixtureDom(loadFixture('dedup-disabled-and-query.json'));

  const snapshot = createPageSnapshot();

  const saveActions = snapshot.actions.filter((action) => action.label === 'Save');
  assert.equal(saveActions.length, 1);
  assert.equal(saveActions[0].disabled, undefined);

  const resultLinks = snapshot.actions.filter(
    (action) => action.label === 'Open results' && action.kind === 'navigate',
  );
  assert.equal(resultLinks.length, 2);
  assert(resultLinks.some((action) => action.href?.includes('?q=alpha')));
  assert(resultLinks.some((action) => action.href?.includes('?q=beta')));
});



test('covers manual QA archetype fixtures for classified, docs, and admin pages', async () => {
  const { createPageSnapshot } = await loadBuiltModule();

  applyFixtureDom(loadFixture('legacy-classified.json'));
  const classifiedSnapshot = createPageSnapshot();
  assert(classifiedSnapshot.metadata.pageTypeHints.includes('listing'));
  assert(classifiedSnapshot.metadata.pageTypeHints.includes('search'));

  applyFixtureDom(loadFixture('docs-article.json'));
  const docsSnapshot = createPageSnapshot();
  assert(docsSnapshot.metadata.pageTypeHints.includes('article'));

  applyFixtureDom(loadFixture('admin-table-heavy.json'));
  const adminSnapshot = createPageSnapshot();
  assert(adminSnapshot.metadata.pageTypeHints.includes('form'));
  assert(adminSnapshot.metadata.pageTypeHints.includes('listing'));
});
test('logs snapshot output when debug mode is enabled', async () => {
  const { createPageSnapshot } = await loadBuiltModule();
  applyFixtureDom(loadFixture('search-nav.json'));

  const originalDebug = console.debug;
  const calls = [];
  console.debug = (...args) => calls.push(args);

  try {
    createPageSnapshot({ debug: true });
  } finally {
    console.debug = originalDebug;
  }

  assert.equal(calls.length, 1);
  assert.equal(calls[0][0], '[PageAura][dom-snapshot] Snapshot output');
});
