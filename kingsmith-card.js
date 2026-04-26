/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║   KingSmith WalkingPad Card  –  UrbanTechIO                  ║
 * ║   v10 — heart rate indicator in header                       ║
 * ╚══════════════════════════════════════════════════════════════╝
 *
 * Exact entity model from kingsmith_walkingpad source:
 *
 *   media_player.walkingpad_control   ← Start/Stop/Pause
 *     states: "playing" | "paused" | "idle" | "countdown 3/2/1"
 *     services: media_player.media_play / media_player.media_pause
 *
 *   sensor.walkingpad_speed           ← km/h  (float)
 *   sensor.walkingpad_distance        ← METRES (int) — card divides /1000 for km display
 *   sensor.walkingpad_energy          ← kcal   (int, raw from device)
 *   sensor.walkingpad_steps           ← steps  (calculated from distance / 0.7)
 *   sensor.walkingpad_elapsed_time    ← "HH:MM:SS" formatted string
 *   sensor.walkingpad_daily_energy    ← kcal aggregates (optional)
 *
 *   binary_sensor.walkingpad_connected ← BLE connected true/false
 *
 *   button.walkingpad_connect         ← manual BT reconnect
 *
 * Auto-discovery matches all of the above by suffix pattern.
 * Manual overrides available via YAML or the UI visual editor.
 *
 * card_mod parts:
 *   header, goal-bar, goal-fill, hero, speed,
 *   stats, stat, stat-value, stat-label,
 *   controls, btn-startstop, btn-connect, goal-chip, plus-btn
 *
 * card_mod example:
 *   card_mod:
 *     style: |
 *       :host::part(goal-fill) {
 *         background: linear-gradient(90deg, teal, navy);
 *       }
 *       :host::part(speed) { font-size: 72px; }
 */

const CARD_STYLE = `
  @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@300;400;500&family=IBM+Plex+Sans:wght@300;400;500;600&display=swap');

  :host {
    --ks-running:    #10d9a0;
    --ks-paused:     #f59e0b;
    --ks-error:      #ef4444;
    --ks-countdown:  #3b82f6;
    --ks-grad-start: #1d4ed8;
    --ks-grad-mid:   #7c3aed;
    --ks-grad-end:   #be123c;
    --ks-font: 'IBM Plex Sans', var(--paper-font-body1_-_font-family, sans-serif);
    --ks-mono: 'IBM Plex Mono', var(--paper-font-body1_-_font-family, monospace);
    display: block;
  }
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  ha-card {
    background:    var(--ha-card-background, var(--card-background-color, #fff));
    border:        var(--ha-card-border-width, 1px) solid var(--ha-card-border-color, var(--divider-color, rgba(0,0,0,0.12)));
    border-radius: var(--ha-card-border-radius, 12px);
    box-shadow:    var(--ha-card-box-shadow, none);
    overflow:      hidden;
    font-family:   var(--ks-font);
    color:         var(--primary-text-color);
    position:      relative;
    isolation:     isolate;
  }

  /* ── Header ── */
  [part~="header"] {
    display: flex; align-items: center; justify-content: space-between;
    padding: 14px 16px 10px;
  }
  .hl, .hr { display: flex; align-items: center; gap: 8px; }

  /* Connectivity / status pip */
  .pip {
    width: 6px; height: 6px; border-radius: 50%;
    background: var(--secondary-text-color, #888);
    opacity: .4; flex-shrink: 0;
    transition: background .4s, box-shadow .4s, opacity .4s;
  }
  .pip.connected   { background: var(--secondary-text-color, #888); opacity: .55; }
  .pip.running     { background: var(--ks-running); opacity: 1; box-shadow: 0 0 8px var(--ks-running); animation: ppulse 1.6s ease-in-out infinite; }
  .pip.paused      { background: var(--ks-paused);  opacity: 1; box-shadow: 0 0 7px var(--ks-paused); }
  .pip.countdown   { background: var(--ks-countdown); opacity: 1; box-shadow: 0 0 7px var(--ks-countdown); animation: ppulse-blue 1s ease-in-out infinite; }
  .pip.disconnected{ background: var(--ks-error);   opacity: 1; }
  @keyframes ppulse      { 0%,100%{box-shadow:0 0 5px var(--ks-running)}   50%{box-shadow:0 0 14px var(--ks-running)} }
  @keyframes ppulse-blue { 0%,100%{box-shadow:0 0 4px var(--ks-countdown)} 50%{box-shadow:0 0 10px var(--ks-countdown)} }

  .devname {
    font-size: 13px; font-weight: 500; letter-spacing: .04em;
    color: var(--primary-text-color); opacity: .85;
  }

  /* ── Heart rate widget ── */
  .hr-widget {
    display: flex; flex-direction: column; align-items: center; gap: 2px;
    margin-left: 4px;
  }
  .hr-icon {
    width: 14px; height: 14px; flex-shrink: 0;
    filter: drop-shadow(0 0 3px var(--ks-hr-color, #22c55e));
    animation: heartbeat 0.85s ease-in-out infinite;
  }
  .hr-bpm {
    font-family: var(--ks-mono); font-size: 9px; font-weight: 400;
    color: var(--ks-hr-color, #22c55e);
    letter-spacing: .03em; line-height: 1;
  }
  @keyframes heartbeat {
    0%   { transform: scale(1);    }
    14%  { transform: scale(1.22); }
    28%  { transform: scale(1);    }
    42%  { transform: scale(1.14); }
    70%  { transform: scale(1);    }
    100% { transform: scale(1);    }
  }

  /* Goal chip */
  [part~="goal-chip"] {
    font-family: var(--ks-mono); font-size: 9px;
    color: var(--secondary-text-color);
    background: var(--secondary-background-color, rgba(0,0,0,0.05));
    border-radius: 20px; padding: 2.5px 9px;
    letter-spacing: .06em; white-space: nowrap;
    border: 1px solid transparent;
    transition: color .3s, border-color .3s;
  }
  [part~="goal-chip"].active {
    color: var(--primary-color, #03a9f4);
    border-color: color-mix(in srgb, var(--primary-color, #03a9f4) 30%, transparent);
  }

  /* Plus button */
  [part~="plus-btn"] {
    width: 27px; height: 27px; border-radius: 7px;
    border: 1px solid var(--divider-color, rgba(0,0,0,0.12));
    background: var(--secondary-background-color, rgba(0,0,0,0.04));
    color: var(--secondary-text-color);
    display: flex; align-items: center; justify-content: center;
    cursor: pointer; flex-shrink: 0;
    transition: background .2s, color .2s;
  }
  [part~="plus-btn"] svg { width: 13px; height: 13px; }
  [part~="plus-btn"]:hover  { background: var(--divider-color, rgba(0,0,0,0.1)); color: var(--primary-text-color); }
  [part~="plus-btn"]:active { transform: scale(.91); }

  /* ── Progress bar — header/body separator ── */
  [part~="goal-bar"] {
    height: 3px;
    background: var(--divider-color, rgba(0,0,0,0.1));
    overflow: hidden;
  }
  [part~="goal-fill"] {
    height: 100%;
    background: linear-gradient(90deg,
      var(--ks-grad-start) 0%,
      var(--ks-grad-mid)   55%,
      var(--ks-grad-end)   100%
    );
    width: 0%;
    transition: width .7s cubic-bezier(.4,0,.2,1);
    position: relative;
  }
  [part~="goal-fill"]::after {
    content: ''; position: absolute; right: 0; top: 0; bottom: 0; width: 60px;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,.2));
    animation: glow 2s ease-in-out infinite;
  }
  @keyframes glow { 0%,100%{opacity:0} 50%{opacity:1} }

  /* ── Speed hero ── */
  [part~="hero"] {
    padding: 16px 16px 8px;
    display: flex; align-items: center; gap: 6px;
  }
  [part~="speed"] {
    font-family: var(--ks-mono); font-size: 54px; font-weight: 300;
    line-height: 1; letter-spacing: -.03em;
    color: var(--primary-text-color); transition: color .4s;
  }
  [part~="speed"].running { color: var(--ks-running); }
  .spd-unit {
    font-size: 11px; color: var(--secondary-text-color);
    letter-spacing: .1em;
  }

  /* ── Speed +/- buttons ── */
  .spd-ctrl-wrap {
    display: flex; align-items: center;
    justify-content: flex-end;
    flex: 1;
  }
  .spd-ctrl-row { display: flex; gap: 20px; }

  [part~="btn-spd-down"],
  [part~="btn-spd-up"] {
    width: 52px; height: 52px; border-radius: 13px;
    border: 1px solid var(--divider-color, rgba(0,0,0,0.12));
    background: var(--secondary-background-color, rgba(0,0,0,0.04));
    color: var(--primary-text-color);
    display: flex; align-items: center; justify-content: center;
    cursor: pointer; font-size: 26px; font-weight: 300; line-height: 1;
    transition: background .2s, border-color .2s, color .2s, transform .1s;
    flex-shrink: 0;
  }
  [part~="btn-spd-down"]:hover,
  [part~="btn-spd-up"]:hover {
    background: var(--divider-color, rgba(0,0,0,0.1));
    border-color: color-mix(in srgb, var(--primary-color, #03a9f4) 40%, transparent);
    color: var(--primary-color, #03a9f4);
  }
  [part~="btn-spd-down"]:active,
  [part~="btn-spd-up"]:active { transform: scale(.9); }

  /* Countdown overlay on speed */
  .countdown-badge {
    display: none;
    font-family: var(--ks-mono); font-size: 11px; font-weight: 500;
    color: var(--ks-countdown); letter-spacing: .08em;
    padding-bottom: 9px;
    animation: blink .7s ease-in-out infinite;
  }
  .countdown-badge.show { display: block; }
  @keyframes blink { 0%,100%{opacity:1} 50%{opacity:.35} }

  /* ── Stats grid ── */
  [part~="stats"] {
    display: grid; grid-template-columns: repeat(4,1fr);
    gap: 1px;
    background: var(--divider-color, rgba(0,0,0,0.1));
    border-top: 1px solid var(--divider-color, rgba(0,0,0,0.1));
    border-bottom: 1px solid var(--divider-color, rgba(0,0,0,0.1));
    margin-top: 12px;
  }
  [part~="stat"] {
    background: var(--secondary-background-color, rgba(0,0,0,0.04));
    padding: 11px 8px; text-align: center;
  }
  [part~="stat-value"] {
    font-family: var(--ks-mono); font-size: 15px;
    color: var(--primary-text-color); letter-spacing: -.01em;
  }
  [part~="stat-label"] {
    font-size: 8.5px; color: var(--secondary-text-color);
    text-transform: uppercase; letter-spacing: .12em; margin-top: 3px;
  }

  /* ── Controls ── */
  [part~="controls"] { padding: 11px 14px 13px; }
  .ctrlrow { display: flex; gap: 7px; }

  .cbtn {
    flex: 1; padding: 9px 4px; border-radius: 9px;
    border: 1px solid var(--divider-color, rgba(0,0,0,0.12));
    background: var(--secondary-background-color, rgba(0,0,0,0.04));
    color: var(--primary-text-color);
    font-family: var(--ks-font); font-size: 10.5px; font-weight: 500;
    letter-spacing: .05em; cursor: pointer;
    display: flex; align-items: center; justify-content: center; gap: 5px;
    transition: background .2s, border-color .2s, color .2s, transform .1s;
  }
  .cbtn svg { width: 11px; height: 11px; flex-shrink: 0; }
  .cbtn:hover  { filter: brightness(1.08); }
  .cbtn:active { transform: scale(.95); }

  [part~="btn-startstop"].start-st {
    border-color: color-mix(in srgb, var(--ks-running) 35%, transparent);
    color: var(--ks-running);
  }
  [part~="btn-startstop"].stop-st {
    border-color: color-mix(in srgb, var(--ks-error) 35%, transparent);
    color: var(--ks-error);
  }
  [part~="btn-startstop"].countdown-st {
    border-color: color-mix(in srgb, var(--ks-countdown) 35%, transparent);
    color: var(--ks-countdown);
    animation: blink .7s ease-in-out infinite;
  }
  [part~="btn-connect"] {
    border-color: color-mix(in srgb, var(--primary-color, #03a9f4) 35%, transparent);
    color: var(--primary-color, #03a9f4);
  }

  /* ── Disconnected notice ── */
  .disc-notice {
    display: none; align-items: center; justify-content: center; gap: 6px;
    padding: 5px 14px; font-size: 10px;
    color: var(--ks-error);
    background: color-mix(in srgb, var(--ks-error) 8%, transparent);
    border-top: 1px solid color-mix(in srgb, var(--ks-error) 18%, transparent);
    letter-spacing: .06em;
  }
  .disc-notice.show { display: flex; }
  .disc-dot {
    width: 5px; height: 5px; border-radius: 50%;
    background: var(--ks-error);
  }

  /* ── Goal popup ── */
  .gov {
    display: none; position: absolute; inset: 0;
    background: color-mix(in srgb, var(--ha-card-background, var(--card-background-color, #fff)) 88%, transparent);
    backdrop-filter: blur(8px);
    border-radius: var(--ha-card-border-radius, 12px);
    z-index: 10; align-items: center; justify-content: center;
  }
  .gov.show { display: flex; }

  .popup {
    background: var(--ha-card-background, var(--card-background-color, #fff));
    border: 1px solid var(--divider-color, rgba(0,0,0,0.12));
    border-radius: calc(var(--ha-card-border-radius, 12px) - 2px);
    padding: 20px; width: 220px;
    display: flex; flex-direction: column; gap: 15px;
    box-shadow: 0 4px 24px rgba(0,0,0,0.18);
  }
  .ptitle { font-size: 13px; font-weight: 600; letter-spacing: .04em; color: var(--primary-text-color); }

  .chkgrp { display: flex; flex-direction: column; gap: 9px; }
  .chklbl {
    display: flex; align-items: center; gap: 9px;
    font-size: 12px; color: var(--secondary-text-color); cursor: pointer; transition: color .2s;
  }
  .chklbl:has(input:checked) { color: var(--primary-text-color); }
  .chklbl input[type=checkbox] {
    appearance: none; width: 14px; height: 14px;
    border: 1px solid var(--secondary-text-color); border-radius: 4px;
    background: transparent; cursor: pointer; flex-shrink: 0;
    transition: background .2s, border-color .2s; position: relative;
  }
  .chklbl input[type=checkbox]:checked {
    background: var(--primary-color, #03a9f4);
    border-color: var(--primary-color, #03a9f4);
  }
  .chklbl input[type=checkbox]:checked::after {
    content: '✓'; position: absolute; top: -1px; left: 2px;
    font-size: 10px; color: #fff; font-weight: 700;
  }

  .inpwrap { display: flex; flex-direction: column; gap: 5px; }
  .inplbl  { font-size: 9.5px; text-transform: uppercase; letter-spacing: .1em; color: var(--secondary-text-color); }
  .numinp {
    background: var(--secondary-background-color, rgba(0,0,0,0.04));
    border: 1px solid var(--divider-color, rgba(0,0,0,0.12));
    border-radius: 8px; padding: 8px 12px;
    font-family: var(--ks-mono); font-size: 22px;
    color: var(--primary-text-color); width: 100%; outline: none;
    -moz-appearance: textfield; transition: border-color .2s;
  }
  .numinp::-webkit-outer-spin-button,
  .numinp::-webkit-inner-spin-button { -webkit-appearance: none; }
  .numinp:focus {
    border-color: color-mix(in srgb, var(--primary-color, #03a9f4) 60%, transparent);
  }

  .pacts { display: flex; gap: 7px; }
  .pbtn {
    flex: 1; padding: 8px 4px; border-radius: 8px;
    border: 1px solid var(--divider-color, rgba(0,0,0,0.12));
    font-family: var(--ks-font); font-size: 10.5px; font-weight: 600;
    letter-spacing: .05em; cursor: pointer; transition: background .2s;
  }
  .pbtn:active { transform: scale(.96); }
  .pbtn.cancel {
    background: var(--secondary-background-color, rgba(0,0,0,0.05));
    color: var(--secondary-text-color);
  }
  .pbtn.set {
    background: var(--primary-color, #03a9f4);
    border-color: var(--primary-color, #03a9f4);
    color: var(--text-primary-color, #fff);
  }
`;

const SVG = {
  plus: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>`,
  play: `<svg viewBox="0 0 24 24" fill="currentColor"><polygon points="5,3 19,12 5,21"/></svg>`,
  stop: `<svg viewBox="0 0 24 24" fill="currentColor"><rect x="4" y="4" width="16" height="16" rx="2"/></svg>`,
  bt:   `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="12 2 17.5 7.5 12 13"/><polyline points="12 13 17.5 18.5 12 24"/><polyline points="6.5 6.5 17.5 17.5"/><polyline points="17.5 6.5 6.5 17.5"/></svg>`,
};

// ─── Defaults — exact entity IDs from your integration ───────────────────────
// These are the actual auto-discovered defaults matching your device name "walkingpad"
// Override in YAML or via the UI editor if your device name differs.

const DEFAULTS = {
  name:               "WalkingPad",
  // Sensors (from sensor.py)
  entity_speed:       "",   // sensor.*_speed           → km/h float
  entity_distance:    "",   // sensor.*_distance         → METRES int (card divides /1000)
  entity_energy:      "",   // sensor.*_energy           → kcal int (raw)
  entity_steps:       "",   // sensor.*_steps            → int
  entity_elapsed_time:"",   // sensor.*_elapsed_time     → "HH:MM:SS" string
  // Connection
  entity_connected:   "",   // binary_sensor.*_connected → true/false
  // Control
  entity_control:       "",   // media_player.*_control    → playing/paused/idle/countdown N
  entity_speed_control: "",   // number.*_speed_control    → set speed (km/h)
  entity_heart_rate:    "",   // sensor.*_heart_rate       → bpm (optional, shows heart icon)
  button_connect:     "",   // button.*_connect          → manual BT reconnect
  // Goal helpers — written by the card, read by the automations
  helper_goal_distance: "input_number.walkingpad_goal_distance",
  helper_goal_calories: "input_number.walkingpad_goal_calories",
  helper_goal_type:     "input_select.walkingpad_goal_type",
  helper_goal_reached:  "input_boolean.walkingpad_goal_reached",
};

class KingsmithCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._cfg        = { ...DEFAULTS };
    this._hass       = null;
    this._goal       = null;
    this._disc       = {};
    this._discovered = false;
  }

  setConfig(config) {
    this._cfg = { ...DEFAULTS, ...config };
    this._render();
  }

  set hass(hass) {
    const first = !this._hass;
    this._hass = hass;
    if (!this._discovered) this._autoDiscover();
    if (first) {
      this._render();
      // Eagerly restore goal from HA helpers after first render
      // so navigating away and back restores the progress bar immediately
      this._restoreGoalFromHelpers();
    } else {
      this._live();
    }
  }

  getCardSize() { return 4; }
  static getConfigElement() { return document.createElement("kingsmith-card-editor"); }
  static getStubConfig()    { return { ...DEFAULTS }; }

  /* ── Auto-discovery — matches actual entity unique_id suffixes ─────────── */
  _autoDiscover() {
    if (!this._hass?.states) return;
    const disc = {};

    for (const [eid] of Object.entries(this._hass.states)) {
      const id = eid.toLowerCase();
      if (!id.includes("walkingpad") && !id.includes("kingsmith") && !id.includes("walking_pad")) continue;

      // Sensors — match unique_id suffixes from sensor.py
      if (eid.startsWith("sensor.")) {
        if (id.match(/_speed$/))                      disc.entity_speed        ??= eid;
        if (id.match(/_distance$/))                   disc.entity_distance     ??= eid;
        if (id.match(/_energy$/) && !id.match(/_(daily|weekly|monthly|total)_energy$/))
                                                      disc.entity_energy       ??= eid;
        if (id.match(/_steps$/))                      disc.entity_steps        ??= eid;
        if (id.match(/_elapsed_time/))                disc.entity_elapsed_time ??= eid;
      }

      // Binary sensor — connectivity
      if (eid.startsWith("binary_sensor.") && id.match(/_connected$/))
                                                      disc.entity_connected ??= eid;

      // Media player — control entity (unique_id: {mac}_media)
      if (eid.startsWith("media_player."))            disc.entity_control        ??= eid;
      if (eid.startsWith("sensor.") && id.match(/_(heart_rate|heartrate|hr)$/)) disc.entity_heart_rate ??= eid;
      if (eid.startsWith("number.") && id.match(/_speed/)) disc.entity_speed_control ??= eid;

      // Button — connect (unique_id: {mac}_connect)
      if (eid.startsWith("button.") && id.match(/_connect$/))
                                                      disc.button_connect   ??= eid;
    }

    this._disc = disc;
    this._discovered = Object.keys(disc).length > 0;
  }

  /* ── Helpers ────────────────────────────────────────────────────────────── */
  _e(key) { return this._cfg[key] || this._disc[key] || null; }

  _state(key, fallback = "—") {
    const e = this._e(key);
    return (e && this._hass) ? (this._hass.states[e]?.state ?? fallback) : fallback;
  }

  /* ── Service calls ──────────────────────────────────────────────────────── */
  _toggleControl() {
    const eid = this._e("entity_control");
    if (!eid || !this._hass) return;
    const st = this._hass.states[eid]?.state ?? "idle";
    // "playing" or countdown in progress → stop; otherwise → play
    if (st === "playing" || st.startsWith("countdown")) {
      this._hass.callService("media_player", "media_pause", { entity_id: eid });
    } else {
      this._hass.callService("media_player", "media_play", { entity_id: eid });
    }
  }

  _pressButton(key) {
    const e = this._e(key);
    if (e && this._hass) this._hass.callService("button", "press", { entity_id: e });
  }

  /* ── Restore goal from HA helpers on card load / page return ───────────── */
  _restoreGoalFromHelpers() {
    if (!this._hass) return;
    const type = this._state("helper_goal_type", "none");
    if (type === "none" || type === "—") return;

    const numEid = type === "calories"
      ? this._e("helper_goal_calories")
      : this._e("helper_goal_distance");
    if (!numEid) return;

    const val = parseFloat(this._hass.states[numEid]?.state ?? 0);
    if (val > 0) {
      this._goal = { type, value: val };
      this._live();   // re-render with restored goal
    }
  }

  /* ── Write goal to HA helpers so automations stay in sync ─────────────── */
  _writeGoalHelpers(type, value) {
    if (!this._hass) return;

    // Set the goal type selector (distance | calories)
    const typeEid = this._e("helper_goal_type");
    if (typeEid) {
      this._hass.callService("input_select", "select_option", {
        entity_id: typeEid,
        option: type,
      });
    }

    // Set the numeric goal value in the correct helper
    const numEid = type === "calories"
      ? this._e("helper_goal_calories")
      : this._e("helper_goal_distance");
    if (numEid) {
      this._hass.callService("input_number", "set_value", {
        entity_id: numEid,
        value: String(value),
      });
    }

    // Reset the goal_reached flag so the automation can fire for this new goal
    const reachedEid = this._e("helper_goal_reached");
    if (reachedEid) {
      this._hass.callService("input_boolean", "turn_off", {
        entity_id: reachedEid,
      });
    }
  }

  /* ── Render ─────────────────────────────────────────────────────────────── */
  _render() {
    const hasConnect = !!this._e("button_connect");

    this.shadowRoot.innerHTML = `
      <style>${CARD_STYLE}</style>
      <ha-card>

        <div part="header">
          <div class="hl">
            <div class="pip" id="pip"></div>
            <span class="devname">${this._cfg.name}</span>
            <div class="hr-widget" id="hr-widget" style="display:none">
              <svg class="hr-icon" id="hr-icon" viewBox="0 0 24 24"></svg>
              <span class="hr-bpm" id="hr-bpm">—</span>
            </div>
          </div>
          <div class="hr">
            <span part="goal-chip" id="gchip">NO GOAL</span>
            <div part="plus-btn" id="btn-goal" role="button" aria-label="Set goal">
              ${SVG.plus}
            </div>
          </div>
        </div>

        <div part="goal-bar">
          <div part="goal-fill" id="gfill" style="width:0%"></div>
        </div>

        <div part="hero">
          <span part="speed" id="vspd">0.0</span>
          <span class="spd-unit">KM/H</span>
          <span class="countdown-badge" id="countdown-badge"></span>
          <div class="spd-ctrl-wrap" id="spd-ctrl-wrap" style="display:none">
            <div class="spd-ctrl-row">
              <button part="btn-spd-down" id="btn-spd-down" aria-label="Speed down">−</button>
              <button part="btn-spd-up"   id="btn-spd-up"   aria-label="Speed up">+</button>
            </div>
          </div>
        </div>

        <div part="stats">
          <div part="stat"><div part="stat-value" id="vdist">—</div><div part="stat-label">KM</div></div>
          <div part="stat"><div part="stat-value" id="vcal">—</div><div part="stat-label">KCAL</div></div>
          <div part="stat"><div part="stat-value" id="vsteps">—</div><div part="stat-label">STEPS</div></div>
          <div part="stat"><div part="stat-value" id="vtime">—</div><div part="stat-label">TIME</div></div>
        </div>

        <div part="controls">
          <div class="ctrlrow">
            <button part="btn-startstop" class="cbtn start-st" id="btn-ss">
              ${SVG.play}<span>START</span>
            </button>
            ${hasConnect ? `
            <button part="btn-connect" class="cbtn" id="btn-connect">
              ${SVG.bt}CONNECT
            </button>` : ""}
          </div>
        </div>

        <div class="disc-notice" id="disc-notice">
          <div class="disc-dot"></div>DEVICE NOT CONNECTED
        </div>

        <!-- Goal popup -->
        <div class="gov" id="gov">
          <div class="popup">
            <div class="ptitle">Set Workout Goal</div>
            <div class="chkgrp">
              <label class="chklbl"><input type="checkbox" id="chk-cal"> Calories (kcal)</label>
              <label class="chklbl"><input type="checkbox" id="chk-dist"> Distance (km)</label>
            </div>
            <div class="inpwrap">
              <div class="inplbl">Target value</div>
              <input class="numinp" type="number" id="gval" min="1" placeholder="0">
            </div>
            <div class="pacts">
              <button class="pbtn cancel" id="gcancel">Cancel</button>
              <button class="pbtn set"    id="gset">Set Goal</button>
            </div>
          </div>
        </div>

      </ha-card>`;

    this._bind();
    this._live();
  }

  /* ── Events ─────────────────────────────────────────────────────────────── */
  _bind() {
    const $ = id => this.shadowRoot.getElementById(id);

    $("btn-goal").onclick = () => {
      if (this._goal) {
        // Use locally stored goal
        $("chk-cal").checked  = this._goal.type === "calories";
        $("chk-dist").checked = this._goal.type === "distance";
        $("gval").value = this._goal.value;
      } else {
        // Pre-fill from HA helpers (in case another device set a goal)
        const helperType = this._state("helper_goal_type", "none");
        if (helperType !== "none") {
          $("chk-cal").checked  = helperType === "calories";
          $("chk-dist").checked = helperType === "distance";
          const numEid = helperType === "calories"
            ? this._e("helper_goal_calories")
            : this._e("helper_goal_distance");
          if (numEid && this._hass?.states[numEid]) {
            $("gval").value = this._hass.states[numEid].state;
          }
        }
      }
      $("gov").classList.add("show");
    };
    $("gcancel").onclick   = () => $("gov").classList.remove("show");
    $("chk-cal").onchange  = e => { if (e.target.checked) $("chk-dist").checked = false; };
    $("chk-dist").onchange = e => { if (e.target.checked) $("chk-cal").checked  = false; };
    $("gset").onclick = () => {
      const calC = $("chk-cal").checked, disC = $("chk-dist").checked;
      const val  = parseFloat($("gval").value);
      if ((!calC && !disC) || isNaN(val) || val <= 0) return;
      const type = calC ? "calories" : "distance";
      this._goal = { type, value: val };
      $("gov").classList.remove("show");

      // Write goal to HA helpers so automations pick it up
      this._writeGoalHelpers(type, val);

      this._live();
    };

    $("btn-ss").onclick = () => this._toggleControl();

    const conn = $("btn-connect");
    if (conn) conn.onclick = () => this._pressButton("button_connect");

    // Speed −/+ buttons
    $("btn-spd-down")?.addEventListener("click", () => this._adjustSpeed(-0.1));
    $("btn-spd-up")?.addEventListener("click",   () => this._adjustSpeed(+0.1));
  }

  /* ── Heart rate color scale ─────────────────────────────────────────────── */
  // Returns a CSS color string based on BPM:
  //   < 60   → teal green (resting)
  //   60-100 → green (normal)
  //   100-140→ amber (elevated)
  //   140-160→ red (high)
  //   > 160  → dark red (max)
  _hrColor(bpm) {
    if (bpm < 60)  return '#10d9a0';
    if (bpm < 100) return '#22c55e';
    if (bpm < 140) return '#f59e0b';
    if (bpm < 160) return '#ef4444';
    return '#be123c';
  }

  /* ── Speed control ─────────────────────────────────────────────────────── */
  _adjustSpeed(delta) {
    const eid = this._e("entity_speed_control");
    if (!eid || !this._hass) return;
    const stateObj = this._hass.states[eid];
    if (!stateObj) return;
    const current = parseFloat(stateObj.state) || 0;
    const min     = parseFloat(stateObj.attributes?.min  ?? 0.5);
    const max     = parseFloat(stateObj.attributes?.max  ?? 6);
    const step    = parseFloat(stateObj.attributes?.step ?? 0.1);
    // Round to avoid floating point drift, clamp within min/max
    const newVal  = Math.min(max, Math.max(min,
      Math.round((current + delta) / step) * step
    ));
    this._hass.callService("number", "set_value", {
      entity_id: eid,
      value: String(newVal.toFixed(1)),
    });
  }

  /* ── Live updates ───────────────────────────────────────────────────────── */
  _live() {
    const root = this.shadowRoot;
    const $ = id => root.getElementById(id);
    if (!$("vspd")) return;

    // ── Speed (km/h float from device)
    const spd = parseFloat(this._state("entity_speed", "0")) || 0;
    $("vspd").textContent = spd.toFixed(1);

    // ── Speed control widget visibility + target label
    const spdCtrlEid  = this._e("entity_speed_control");
    const spdCtrlWrap = $("spd-ctrl-wrap");
    if (spdCtrlWrap) {
      if (spdCtrlEid) {
        spdCtrlWrap.style.display = "";

      } else {
        spdCtrlWrap.style.display = "none";
      }
    }

    // ── media_player state — the authoritative running state
    const mpState = this._state("entity_control", "idle").toLowerCase();
    const isCountdown = mpState.startsWith("countdown");
    const isRunning   = mpState === "playing";
    const isPaused    = mpState === "paused";

    // ── binary_sensor.connected — BLE connection
    const connected = this._state("entity_connected", "on").toLowerCase();
    const isConnected = connected === "on" || connected === "true";

    // Pip state priority: running > countdown > paused > disconnected > connected/idle
    const pip = $("pip");
    pip.className = "pip"
      + (isRunning   ? " running"
       : isCountdown ? " countdown"
       : isPaused    ? " paused"
       : !isConnected ? " disconnected"
       : " connected");

    $("vspd").classList.toggle("running", isRunning);

    // Disconnected notice
    $("disc-notice")?.classList.toggle("show", !isConnected);

    // Countdown badge (shows "3", "2", "1" next to speed)
    const cdBadge = $("countdown-badge");
    if (isCountdown) {
      const num = mpState.replace("countdown", "").trim();
      cdBadge.textContent = num;
      cdBadge.classList.add("show");
    } else {
      cdBadge.classList.remove("show");
    }

    // Start/Stop button
    const btn = $("btn-ss");
    btn.setAttribute("part", "btn-startstop");
    if (isRunning || isCountdown) {
      btn.className = isCountdown ? "cbtn countdown-st" : "cbtn stop-st";
      btn.innerHTML = `${SVG.stop}<span>${isCountdown ? mpState.toUpperCase() : "STOP"}</span>`;
    } else {
      btn.className = "cbtn start-st";
      btn.innerHTML = `${SVG.play}<span>START</span>`;
    }

    // ── Heart rate widget
    const hrEid    = this._e("entity_heart_rate");
    const hrWidget = $("hr-widget");
    if (hrWidget) {
      if (hrEid) {
        const bpm   = parseInt(this._hass?.states[hrEid]?.state ?? 0) || 0;
        const color = this._hrColor(bpm);
        hrWidget.style.display = "";
        hrWidget.style.setProperty("--ks-hr-color", color);
        // Rebuild SVG with correct gradient color
        const iconEl = $("hr-icon");
        if (iconEl) {
          const gid = "hg-" + color.replace("#", "");
          iconEl.innerHTML = `
            <defs>
              <radialGradient id="${gid}" cx="40%" cy="35%" r="60%">
                <stop offset="0%" stop-color="${color}" stop-opacity="0.85"/>
                <stop offset="100%" stop-color="${color}" stop-opacity="1"/>
              </radialGradient>
            </defs>
            <path d="M12 21l-1.45-1.32C5.4 15.36 2 12.27 2 8.5 2 5.41 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.08C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.41 22 8.5c0 3.77-3.4 6.86-8.55 11.18L12 21z"
              fill="url(#${gid})"/>`;
          iconEl.style.filter = `drop-shadow(0 0 3px ${color})`;
        }
        const bpmEl = $("hr-bpm");
        if (bpmEl) bpmEl.textContent = bpm > 0 ? bpm : "—";
      } else {
        hrWidget.style.display = "none";
      }
    }

    // ── Distance: stored in METRES, display in km
    const distMetres = parseFloat(this._state("entity_distance", "0")) || 0;
    const distKm     = distMetres / 1000;
    $("vdist").textContent = distKm.toFixed(2);

    // ── Energy (kcal)
    const cal = parseFloat(this._state("entity_energy", "0")) || 0;
    $("vcal").textContent = Math.round(cal);

    // ── Steps
    const steps = parseFloat(this._state("entity_steps", "0")) || 0;
    $("vsteps").textContent = Math.round(steps).toLocaleString();

    // ── Elapsed time — already "HH:MM:SS" formatted string from integration
    const timeStr = this._state("entity_elapsed_time", "00:00:00");
    // Show as MM:SS if under an hour, otherwise HH:MM:SS
    if (timeStr && timeStr !== "—") {
      const parts = timeStr.split(":");
      if (parts.length === 3 && parts[0] === "00") {
        $("vtime").textContent = `${parts[1]}:${parts[2]}`;
      } else {
        $("vtime").textContent = timeStr;
      }
    } else {
      $("vtime").textContent = "0:00";
    }

    // ── Goal progress bar
    // goal_reached comes from the HA helper (set by automation when belt stops)
    const goalReached = this._state("helper_goal_reached", "off") === "on";

    const fill = $("gfill"), chip = $("gchip");
    if (this._goal) {
      const cur   = this._goal.type === "calories" ? cal : distKm;
      const pct   = Math.min(100, (cur / this._goal.value) * 100);
      fill.style.width = pct.toFixed(2) + "%";

      if (goalReached) {
        // Automation has already stopped the belt — show completion state
        chip.textContent = "✓ GOAL REACHED";
      } else {
        const unit  = this._goal.type === "calories" ? "KCAL" : "KM";
        const shown = this._goal.type === "calories" ? Math.round(cur) : cur.toFixed(2);
        chip.textContent = `${shown} / ${this._goal.value} ${unit}`;
      }
      chip.classList.add("active");
    } else {
      fill.style.width = "0%";
      chip.textContent = "NO GOAL";
      chip.classList.remove("active");
    }
  }
}

// ─── UI Config Editor ─────────────────────────────────────────────────────────

const EDITOR_FIELDS = [
  // Sensors
  ["entity_speed",          "Speed (sensor)",       "sensor"],
  ["entity_speed_control",  "Speed control",        "number"],
  ["entity_heart_rate",     "Heart Rate",           "sensor"],
  ["entity_distance",       "Distance (m)",         "sensor"],
  ["entity_energy",         "Energy / Calories",    "sensor"],
  ["entity_steps",          "Steps",                "sensor"],
  ["entity_elapsed_time",   "Elapsed Time",         "sensor"],
  // Binary sensor
  ["entity_connected",      "BLE Connected",        "binary_sensor"],
  // Controls
  ["entity_control",        "Start / Stop",         "media_player"],
  ["button_connect",        "Connect / BT",         "button"],
  // Goal helpers
  ["helper_goal_distance",  "Goal – Distance",      "input_number"],
  ["helper_goal_calories",  "Goal – Calories",      "input_number"],
  ["helper_goal_type",      "Goal – Type selector", "input_select"],
  ["helper_goal_reached",   "Goal – Reached flag",  "input_boolean"],
];

class KingsmithCardEditor extends HTMLElement {
  constructor() {
    super();
    this._cfg   = { ...DEFAULTS };
    this._hass  = null;
    this._built = false;
  }

  setConfig(config) {
    this._cfg = { ...DEFAULTS, ...config };
    if (this._built) this._syncPickers();
  }

  set hass(hass) {
    this._hass = hass;
    if (this._built) {
      this.querySelectorAll("ha-entity-picker").forEach(p => { p.hass = hass; });
    } else {
      this._build();
    }
  }

  _build() {
    this.style.cssText = "display:block;padding:0 16px 8px";

    this._section("General");

    // Card name
    const nameWrap = document.createElement("div");
    nameWrap.style.cssText = "margin-bottom:12px";
    const nameField = document.createElement("ha-textfield");
    nameField.setAttribute("label", "Card Name");
    nameField.setAttribute("value", this._cfg.name || "WalkingPad");
    nameField.style.cssText = "width:100%;display:block";
    nameField.addEventListener("change", e => { this._cfg.name = e.target.value; this._fire(); });
    nameField.addEventListener("input",  e => { this._cfg.name = e.target.value; this._fire(); });
    nameWrap.appendChild(nameField);
    this.appendChild(nameWrap);

    this._section("Sensors");
    let inControls = false;

    EDITOR_FIELDS.forEach(([key, label, domain]) => {
      if (key === "entity_speed_control") {
        // no extra section needed — stays in Sensors group
      }
      if (key === "entity_connected" && !inControls) {
        this._section("Connection");
      }
      if (key === "entity_control" && !inControls) {
        this._section("Controls");
        inControls = true;
      }
      if (key === "helper_goal_distance") {
        this._section("Goal Helpers");
      }

      const wrap = document.createElement("div");
      wrap.style.cssText = "margin-bottom:12px";

      const picker = document.createElement("ha-entity-picker");
      picker.setAttribute("id", `ksp-${key}`);
      picker.setAttribute("label", label);
      picker.setAttribute("allow-custom-entity", "");
      if (domain) picker.setAttribute("include-domains", domain);
      picker.style.cssText = "width:100%;display:block";
      if (this._cfg[key]) picker.setAttribute("value", this._cfg[key]);
      if (this._hass) picker.hass = this._hass;
      picker.addEventListener("value-changed", e => {
        this._cfg[key] = e.detail?.value ?? "";
        this._fire();
      });

      wrap.appendChild(picker);
      this.appendChild(wrap);
    });

    this._built = true;
  }

  _section(title) {
    const h = document.createElement("div");
    h.style.cssText = [
      "font-size:11px", "font-weight:600", "letter-spacing:.1em",
      "text-transform:uppercase", "color:var(--primary-color,#03a9f4)",
      "border-bottom:1px solid color-mix(in srgb,var(--primary-color,#03a9f4) 20%,transparent)",
      "padding-bottom:4px", "margin:16px 0 10px",
    ].join(";");
    h.textContent = title;
    this.appendChild(h);
  }

  _syncPickers() {
    EDITOR_FIELDS.forEach(([key]) => {
      const p = this.querySelector(`#ksp-${key}`);
      if (p) {
        p.value = this._cfg[key] || "";
        if (this._hass) p.hass = this._hass;
      }
    });
    const n = this.querySelector("ha-textfield");
    if (n) n.value = this._cfg.name || "WalkingPad";
  }

  _fire() {
    this.dispatchEvent(new CustomEvent("config-changed", {
      detail: { config: { ...this._cfg } },
      bubbles: true, composed: true,
    }));
  }
}

// ─── Register ─────────────────────────────────────────────────────────────────

customElements.define("kingsmith-card",        KingsmithCard);
customElements.define("kingsmith-card-editor", KingsmithCardEditor);

window.customCards ??= [];
window.customCards.push({
  type:        "kingsmith-card",
  name:        "Kingsmith WalkingPad Card",
  description: "HA theme-aware · card_mod · media_player Start/Stop · binary_sensor connected · exact entity model from kingsmith_walkingpad integration.",
  preview:     false,
});