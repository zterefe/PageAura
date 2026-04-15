# PageAura Detailed Design Document

## 1. Overview

PageAura is a Chrome Extension that enhances existing websites by analyzing the current page, generating an AI enhancement plan, validating that plan, and applying safe, reversible UI improvements.

This document focuses on the detailed technical design for the MVP.

## 2. Product Goals

### Primary goal
Improve the usability of outdated or cluttered websites without replacing the original site.

### Secondary goals
- Preserve site recognizability
- Keep enhancements reversible
- Keep processing local where possible
- Make AI central to the product experience
- Prevent arbitrary AI-generated code execution

## 3. MVP Scope

### In scope
- DOM snapshot extraction
- AI-generated enhancement plan
- Plan validation
- Plan compilation into trusted runtime operations
- Toolbar enhancements
- Jump link navigation
- Theme and style patches
- Per-site settings
- Local persistence

### Out of scope
- Screenshot analysis
- Remote execution of arbitrary code
- Cloud sync
- User accounts
- Plugin marketplace
- Full page redesign
- Multi-browser support beyond Chrome

## 4. Design Principles

### 4.1 Augment, don’t replace
PageAura should add assistive improvements, not fully redesign pages.

### 4.2 AI plans, runtime executes
AI decides what should be enhanced. Packaged code decides how it is safely applied.

### 4.3 Reversible by default
Every enhancement should support cleanup.

### 4.4 Bounded capability model
AI can only request known enhancement families and bounded tokens.

### 4.5 Privacy first
No screenshot analysis in MVP. DOM-derived structure should be preferred over raw content capture.

## 5. User Experience Design

### 5.1 User flow
1. User opens a webpage
2. Content script detects eligible page
3. PageAura creates DOM snapshot
4. AI returns structured enhancement plan
5. Plan is validated and compiled
6. Enhancements are applied
7. User sees a lightly improved page
8. User can enable/disable or tune behavior from popup

### 5.2 Enhancement style
Default PageAura behavior should feel:
- lightweight
- contextual
- visually consistent
- non-destructive
- helpful within a few seconds

### 5.3 MVP enhancement examples
- Add a quick actions toolbar
- Add jump links for major sections
- Improve spacing and typography
- Emphasize primary actions
- Soften clutter and increase readability

## 6. System Design

### 6.1 Runtime modules

#### Content script
Responsibilities:
- detect page readiness
- extract page snapshot
- call planner
- validate and compile plan
- execute enhancements
- observe route changes and refresh when needed

#### Service worker
Responsibilities:
- settings lookup
- site enablement
- persistence
- popup/options coordination
- feature flag management

#### Popup
Responsibilities:
- current site enable/disable
- mode selection
- show enhancement summary
- expose “remove enhancements” action

#### Options page
Responsibilities:
- global defaults
- site behavior presets
- debugging toggles
- AI settings visibility

### 6.2 Processing pipeline

```text
DOM
→ Snapshot
→ Normalize
→ AI Plan
→ Validate
→ Compile
→ Execute
→ Cleanup-ready enhanced UI
```

## 7. Snapshot Design

### 7.1 Purpose
Convert the live DOM into a smaller, structured representation the planner can reason over.

### 7.2 Snapshot contents
- page metadata
- action candidates
- sections/headings
- forms/tables presence
- layout metrics
- visual heuristics
- semantic hints

### 7.3 Snapshot extraction rules
- ignore hidden elements
- avoid user-entered values
- keep selectors stable and minimal
- cap large element sets
- deduplicate similar actions

### 7.4 Selector strategy
Selectors should prefer:
1. element ids
2. stable classes
3. semantic attributes
4. constrained fallback selectors

Avoid brittle nth-child selectors where possible.

## 8. AI Planning Design

### 8.1 Planner input
The planner receives:
- normalized snapshot
- site mode
- allowed enhancement families
- token ranges
- optional prior accept/reject memory

### 8.2 Planner output
The planner returns:
- version
- rationale
- enhancement list
- optional confidence

### 8.3 Planner restrictions
The planner cannot:
- emit arbitrary JavaScript
- emit arbitrary HTML to inject
- request unsupported enhancement families
- bypass limits or validation
- force automatic destructive actions

### 8.4 Prompting strategy
Use a planning prompt that emphasizes:
- minimal useful changes
- preserving site identity
- assistive navigation before restructuring
- safe selectors
- bounded styling tokens

## 9. Validation Design

### 9.1 Validation stages

#### Schema validation
Ensure the plan matches the expected contract.

#### Selector validation
Ensure referenced selectors exist on the current page.

#### Capability validation
Ensure requested enhancement types are enabled and supported.

#### Safety validation
Reject actions that:
- trigger destructive workflows
- use invalid selectors
- exceed bounds
- conflict with current page state

#### Token validation
Clamp or reject values outside allowed ranges.

### 9.2 Failure policy
If validation fails:
- reject invalid enhancement
- continue with remaining safe enhancements if possible
- otherwise abort plan application

## 10. Compiler Design

### 10.1 Purpose
Translate high-level AI semantics into low-level runtime operations.

### 10.2 Why a compiler layer exists
Without a compiler layer, the runtime becomes tightly coupled to planner output structure.

The compiler:
- normalizes enhancement variants
- resolves defaults
- maps semantic targets to ops
- makes runtime execution simpler

### 10.3 Example compilation

High-level:
```json
{
  "type": "jump_links",
  "sections": [
    { "label": "Jobs", "selector": "#jjj" }
  ]
}
```

Compiled:
```json
[
  { "op": "mount_container", "id": "jump-links", "area": "left-floating" },
  { "op": "add_nav_link", "containerId": "jump-links", "label": "Jobs", "selector": "#jjj" }
]
```

## 11. Runtime Executor Design

### 11.1 Runtime responsibilities
- create overlay containers
- inject CSS
- attach event handlers
- apply classes
- manage cleanup

### 11.2 Runtime guardrails
- only packaged logic runs
- no eval
- no remote script execution
- only known operations allowed
- event handlers should be simple and auditable

### 11.3 Cleanup model
Each operation should either:
- return a cleanup function
- register cleanup side effects centrally

Cleanup should remove:
- overlay nodes
- added classes
- style tags
- event listeners if directly bound

## 12. UI Design

### 12.1 Toolbar
Purpose:
- expose top actions
- reduce repeated scanning
- create a clear assistive affordance

Design:
- floating or sticky
- compact chips/buttons
- minimal visual intrusion

### 12.2 Jump links
Purpose:
- help navigate long or dense sectioned pages

Design:
- compact floating rail or dock
- only show for pages with meaningful sections

### 12.3 Theme patch
Purpose:
- improve readability and polish

Design:
- light typography and spacing changes
- slight card/elevation treatment
- preserve site structure

### 12.4 Style patch
Purpose:
- target semantic groups such as buttons or body text

Design:
- token driven
- selector or semantic target based
- conservative by default

## 13. State Management Design

### 13.1 Local storage entities
- extension enabled state
- per-site mode
- dismissed enhancements
- last successful plan summary
- debug settings

### 13.2 Site settings model
Per hostname, PageAura should track:
- enabled/disabled
- preferred mode
- recent plan hash
- user dismissals

## 14. Error Handling Design

### 14.1 AI failure
- show no unsafe fallback
- surface planner unavailable state
- optionally show debug reason in developer mode

### 14.2 Snapshot failure
- abort enhancement application
- log locally
- avoid repeated retries in a tight loop

### 14.3 Selector drift
- skip missing targets
- continue safe subset
- avoid crashing entire enhancement pipeline

### 14.4 Route change issues
- cleanup prior enhancements
- debounce re-analysis
- avoid duplicate overlays

## 15. Performance Design

### 15.1 Constraints
The MVP should feel responsive and not visibly freeze the page.

### 15.2 Performance strategies
- cap snapshot size
- deduplicate elements
- debounce mutation-based refresh
- avoid scanning entire DOM repeatedly
- cache last analyzed URL and simple structure signature
- apply minimal CSS and DOM nodes

## 16. Security Design

### 16.1 Threats addressed
- arbitrary code execution from AI output
- unsafe selector-based actions
- accidental promotion of destructive controls
- persistent stale overlays

### 16.2 Security measures
- strict plan schema
- strict validator
- compiler boundary
- fixed runtime ops
- no screenshot support in MVP
- no remote code loading
- no hidden destructive actions

## 17. Open vs Closed Design

### 17.1 Open core
Should include:
- snapshot engine
- validator
- compiler
- executor
- UI overlay primitives
- shared types

### 17.2 Closed layer
May include:
- AI prompting logic
- ranking logic
- personalization
- premium site packs

### 17.3 Dependency rule
Private modules may depend on open modules.
Open modules must not depend on private modules.

## 18. Suggested Implementation Sequence

### Week 1
- scaffold extension
- implement snapshot
- define contracts
- implement planner adapter
- implement validator
- implement toolbar and jump links

### Week 2
- implement style/theme patch
- popup and local storage
- cleanup system
- route change support
- test on target sites
- prepare demo

## 19. Testing Design

### 19.1 Unit tests
- selector validation
- token clamping
- compiler output
- cleanup registration

### 19.2 Integration tests
- plan application on sample DOM fixtures
- re-run behavior on route changes
- site settings behavior

### 19.3 Manual QA
Test against:
- dense legacy pages
- classifieds portals
- docs pages
- table-heavy admin pages

## 20. Final Design Summary

PageAura MVP should be implemented as a bounded AI planning system plus a trusted runtime enhancement engine.

## 21. Code Example AI enhancement plan

(() => {
  // Prevent duplicate runs
  if (window.PageAuraDemo && typeof window.PageAuraDemo.destroy === "function") {
    window.PageAuraDemo.destroy();
  }

  const enhancementPlan = {
    version: 1,
    pageType: "classifieds_homepage",
    rationale: [
      "The page has a dense category layout with many links spread across sections.",
      "There are repeated high-value actions: search, post, account, favorites.",
      "Readability can be improved with modest text, spacing, and card-like grouping."
    ],
    enhancements: [
      {
        type: "insert_toolbar",
        id: "pageaura-toolbar",
        position: "top-right",
        actions: [
          {
            label: "Search",
            selector: ".cl-home-search-field input[type='text'], .cl-search-dropdown input[type='text']",
            behavior: "focus"
          },
          {
            label: "Post Ad",
            selector: "a[href*='post.craigslist.org']",
            behavior: "click"
          },
          {
            label: "Account",
            selector: "a[href*='accounts.craigslist.org/login/home']",
            behavior: "click"
          },
          {
            label: "For Sale",
            selector: "#sss h3 a, a[href='/search/sss'], a[href='https://dallas.craigslist.org/search/sss']",
            behavior: "scroll"
          },
          {
            label: "Jobs",
            selector: "#jjj h3 a, a[href='/search/jjj'], a[href='https://dallas.craigslist.org/search/jjj']",
            behavior: "scroll"
          }
        ]
      },
      {
        type: "jump_links",
        id: "pageaura-jump-links",
        title: "Jump to",
        sections: [
          { label: "Community", selector: "#ccc" },
          { label: "Housing", selector: "#hhh" },
          { label: "For Sale", selector: "#sss" },
          { label: "Jobs", selector: "#jjj" },
          { label: "Services", selector: "#bbb" },
          { label: "Forums", selector: "#forums" }
        ]
      },
      {
        type: "theme_patch",
        id: "pageaura-theme",
        tokens: {
          textScale: 1.04,
          lineHeight: 1.45,
          radius: 10,
          sectionPadding: 10,
          elevateColumns: true,
          softenBorders: true
        }
      }
    ]
  };

  const cleanupFns = [];
  const styleIds = [];

  function q(selector, root = document) {
    try {
      return root.querySelector(selector);
    } catch {
      return null;
    }
  }

  function qa(selector, root = document) {
    try {
      return Array.from(root.querySelectorAll(selector));
    } catch {
      return [];
    }
  }

  function createStyle(id, cssText) {
    const style = document.createElement("style");
    style.id = id;
    style.textContent = cssText;
    document.head.appendChild(style);
    styleIds.push(id);
    cleanupFns.push(() => style.remove());
    return style;
  }

  function createContainer(id, className) {
    const existing = document.getElementById(id);
    if (existing) existing.remove();

    const el = document.createElement("div");
    el.id = id;
    el.className = className;
    document.body.appendChild(el);
    cleanupFns.push(() => el.remove());
    return el;
  }

  function applyThemePatch(tokens) {
    createStyle(
      "pageaura-theme-style",
      `
      html.pageaura-theme-on {
        font-size: ${tokens.textScale}em;
      }

      body.pageaura-theme-on {
        line-height: ${tokens.lineHeight};
      }

      body.pageaura-theme-on #center .col,
      body.pageaura-theme-on .community .col,
      body.pageaura-theme-on .housing .col,
      body.pageaura-theme-on .jobs .col {
        background: rgba(255,255,255,0.92);
        border-radius: ${tokens.radius}px;
        padding: ${tokens.sectionPadding}px;
        margin-bottom: 10px;
        box-sizing: border-box;
        ${tokens.elevateColumns ? "box-shadow: 0 2px 10px rgba(0,0,0,0.06);" : ""}
        ${tokens.softenBorders ? "border: 1px solid rgba(0,0,0,0.08);" : ""}
      }

      body.pageaura-theme-on #center .ban,
      body.pageaura-theme-on #leftbar h4,
      body.pageaura-theme-on #rightbar h5 {
        margin-bottom: 8px;
      }

      body.pageaura-theme-on #center a,
      body.pageaura-theme-on #leftbar a,
      body.pageaura-theme-on #rightbar a {
        transition: color 120ms ease, background-color 120ms ease;
      }

      body.pageaura-theme-on #center a:hover,
      body.pageaura-theme-on #leftbar a:hover,
      body.pageaura-theme-on #rightbar a:hover {
        text-decoration: none;
        background: rgba(86, 26, 139, 0.08);
        border-radius: 6px;
      }

      body.pageaura-theme-on .cl-home-search-field input[type="text"] {
        border-radius: ${tokens.radius}px;
        padding: 10px 12px;
        border: 1px solid rgba(0,0,0,0.18);
        box-shadow: 0 1px 3px rgba(0,0,0,0.05);
      }

      body.pageaura-theme-on #post,
      body.pageaura-theme-on a[href*="post.craigslist.org"] {
        font-weight: 700;
      }

      body.pageaura-theme-on .pageaura-highlight-target {
        outline: 2px solid rgba(86, 26, 139, 0.45);
        outline-offset: 2px;
        border-radius: 8px;
        transition: outline-color 240ms ease;
      }
      `
    );

    document.documentElement.classList.add("pageaura-theme-on");
    document.body.classList.add("pageaura-theme-on");

    cleanupFns.push(() => {
      document.documentElement.classList.remove("pageaura-theme-on");
      document.body.classList.remove("pageaura-theme-on");
      qa(".pageaura-highlight-target").forEach((el) => {
        el.classList.remove("pageaura-highlight-target");
      });
    });
  }

  function brieflyHighlight(target) {
    if (!(target instanceof HTMLElement)) return;
    target.classList.add("pageaura-highlight-target");
    const timer = setTimeout(() => {
      target.classList.remove("pageaura-highlight-target");
    }, 1800);
    cleanupFns.push(() => clearTimeout(timer));
  }

  function attachActionHandler(button, action) {
    button.addEventListener("click", (e) => {
      e.preventDefault();
      const target = q(action.selector);
      if (!target) {
        console.warn("PageAura: target not found for action", action);
        return;
      }

      if (action.behavior === "focus") {
        target.scrollIntoView({ behavior: "smooth", block: "center" });
        if (target instanceof HTMLElement) {
          target.focus();
          brieflyHighlight(target);
        }
        return;
      }

      if (action.behavior === "scroll") {
        target.scrollIntoView({ behavior: "smooth", block: "start" });
        brieflyHighlight(target);
        return;
      }

      if (action.behavior === "click") {
        if (target instanceof HTMLElement) {
          brieflyHighlight(target);
          target.click();
        }
      }
    });
  }

  function applyToolbar(enhancement) {
    createStyle(
      "pageaura-toolbar-style",
      `
      #pageaura-toolbar {
        position: fixed;
        top: 16px;
        right: 16px;
        z-index: 2147483647;
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        max-width: min(92vw, 520px);
        padding: 10px;
        background: rgba(255,255,255,0.95);
        border: 1px solid rgba(0,0,0,0.12);
        border-radius: 14px;
        box-shadow: 0 8px 24px rgba(0,0,0,0.12);
        backdrop-filter: blur(8px);
      }

      #pageaura-toolbar .pageaura-chip {
        appearance: none;
        border: 1px solid rgba(86, 26, 139, 0.18);
        background: linear-gradient(180deg, #ffffff, #f7f4fb);
        color: #38145f;
        font: 600 13px/1.2 system-ui, sans-serif;
        border-radius: 999px;
        padding: 9px 12px;
        cursor: pointer;
      }

      #pageaura-toolbar .pageaura-chip:hover {
        background: #f1eafb;
      }

      #pageaura-toolbar .pageaura-title {
        width: 100%;
        font: 700 12px/1.2 system-ui, sans-serif;
        color: #6b5a7d;
        margin-bottom: 2px;
        text-transform: uppercase;
        letter-spacing: 0.06em;
      }

      @media (max-width: 900px) {
        #pageaura-toolbar {
          top: auto;
          bottom: 16px;
          right: 16px;
          left: 16px;
        }
      }
      `
    );

    const toolbar = createContainer(enhancement.id, "pageaura-toolbar");
    toolbar.innerHTML = `<div class="pageaura-title">PageAura Quick Actions</div>`;

    enhancement.actions.forEach((action) => {
      const target = q(action.selector);
      if (!target) return;

      const btn = document.createElement("button");
      btn.className = "pageaura-chip";
      btn.type = "button";
      btn.textContent = action.label;
      attachActionHandler(btn, action);
      toolbar.appendChild(btn);
    });
  }

  function applyJumpLinks(enhancement) {
    createStyle(
      "pageaura-jump-style",
      `
      #pageaura-jump-links {
        position: fixed;
        left: 18px;
        top: 120px;
        z-index: 2147483646;
        width: 150px;
        padding: 12px;
        background: rgba(255,255,255,0.94);
        border: 1px solid rgba(0,0,0,0.1);
        border-radius: 14px;
        box-shadow: 0 8px 24px rgba(0,0,0,0.1);
        font: 13px/1.35 system-ui, sans-serif;
      }

      #pageaura-jump-links .pageaura-jump-title {
        font-weight: 700;
        margin-bottom: 8px;
        color: #5d4e70;
      }

      #pageaura-jump-links .pageaura-jump-link {
        display: block;
        width: 100%;
        text-align: left;
        background: transparent;
        border: 0;
        padding: 7px 8px;
        border-radius: 8px;
        color: #3d2855;
        cursor: pointer;
      }

      #pageaura-jump-links .pageaura-jump-link:hover {
        background: rgba(86, 26, 139, 0.08);
      }

      @media (max-width: 1180px) {
        #pageaura-jump-links {
          display: none;
        }
      }
      `
    );

    const panel = createContainer(enhancement.id, "pageaura-jump-links");
    const title = document.createElement("div");
    title.className = "pageaura-jump-title";
    title.textContent = enhancement.title || "Jump to";
    panel.appendChild(title);

    enhancement.sections.forEach((section) => {
      const target = q(section.selector);
      if (!target) return;

      const btn = document.createElement("button");
      btn.className = "pageaura-jump-link";
      btn.type = "button";
      btn.textContent = section.label;
      btn.addEventListener("click", () => {
        target.scrollIntoView({ behavior: "smooth", block: "start" });
        brieflyHighlight(target);
      });
      panel.appendChild(btn);
    });
  }

  function applyEnhancement(enhancement) {
    switch (enhancement.type) {
      case "insert_toolbar":
        applyToolbar(enhancement);
        break;
      case "jump_links":
        applyJumpLinks(enhancement);
        break;
      case "theme_patch":
        applyThemePatch(enhancement.tokens);
        break;
      default:
        console.warn("PageAura: unknown enhancement type", enhancement.type);
    }
  }

  enhancementPlan.enhancements.forEach(applyEnhancement);

  window.PageAuraDemo = {
    plan: enhancementPlan,
    destroy() {
      cleanupFns.slice().reverse().forEach((fn) => {
        try {
          fn();
        } catch (err) {
          console.warn("PageAura cleanup error:", err);
        }
      });
      styleIds.forEach((id) => {
        document.getElementById(id)?.remove();
      });
      delete window.PageAuraDemo;
    }
  };

  console.log("PageAura demo applied.", enhancementPlan);
})();

Core rule:

**AI chooses the enhancement plan.  
The packaged runtime validates, compiles, and applies that plan safely.**
