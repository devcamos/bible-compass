/** Critical first-paint styles — literal Nexus kit colours, no CSS-bundle dependency. */
export const SHELL_CRITICAL_CSS = `
:root{--cream:#fffaf1;--ink:#1b1510;--paper:#f3ead8;--copper:#b85a2a;--mute:#6d6254;--rule:#cbbfa3;--surface:#241c16}
html,body{margin:0;min-height:100%;background:var(--cream);color:var(--ink)}
[data-theme="dark"]{color-scheme:dark}
[data-theme="dark"] html,[data-theme="dark"] body,html[data-theme="dark"],html[data-theme="dark"] body{background:var(--ink);color:var(--paper)}
#bc-splash{position:fixed;inset:0;z-index:40;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:.55rem;padding:1.5rem;text-align:center;background:radial-gradient(ellipse 70% 50% at 50% 38%,var(--paper) 0%,transparent 70%),var(--cream);color:var(--ink)}
html[data-theme="dark"] #bc-splash{background:radial-gradient(ellipse 70% 50% at 50% 38%,var(--surface) 0%,transparent 70%),var(--ink);color:var(--paper)}
html.splash-seen:not(.shell-fault) #bc-splash{display:none}
html.shell-fault #bc-splash,html.shell-fault #bc-splash.bc-splash--fade{display:flex!important;opacity:1!important;pointer:none}
#bc-splash .bc-splash__title{margin:0;font-family:ui-serif,Georgia,serif;font-size:1.65rem;font-weight:600;letter-spacing:-.02em;color:var(--copper)}
#bc-splash .bc-splash__kicker{margin:0;font-size:.72rem;font-weight:500;letter-spacing:.18em;text-transform:uppercase;color:var(--copper)}
#bc-splash .bc-splash__mark{font-size:2.35rem;line-height:1}
#bc-splash .bc-splash__recover{display:none;max-width:22rem;margin-top:.85rem}
html.shell-fault #bc-splash .bc-splash__recover{display:block}
#bc-splash .bc-splash__recover p{margin:0 0 .9rem;line-height:1.55;color:var(--mute);font-family:ui-sans-serif,system-ui,sans-serif;font-size:.95rem;letter-spacing:normal;text-transform:none}
html[data-theme="dark"] #bc-splash .bc-splash__recover p{color:var(--rule)}
#bc-splash .bc-splash__retry{display:inline-flex;min-height:2.75rem;align-items:center;justify-content:center;border:0;border-radius:999px;background:var(--copper);color:var(--cream);padding:0 1rem;font-size:.875rem;font-weight:500;font-family:ui-sans-serif,system-ui,sans-serif;cursor:pointer}
`.trim();
