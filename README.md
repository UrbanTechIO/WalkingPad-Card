# WalkingPad Card

[![hacs_badge](https://img.shields.io/badge/HACS-Custom-orange.svg)](https://github.com/hacs/integration)
[![GitHub release](https://img.shields.io/github/release/UrbanTechIO/WalkingPad-Card.svg)](https://github.com/UrbanTechIO/WalkingPad-Card/releases)
![Lovelace](https://img.shields.io/badge/Lovelace-Custom%20Card-blue)

A modern, minimalist Home Assistant Lovelace card built specifically for the **KingSmith WalkingPad** integration. Displays live workout data, controls the belt, tracks session goals, and adapts to any HA theme automatically.

> Designed to work with the [KingSmith WalkingPad](https://github.com/UrbanTechIO/KingSmith-WalkingPad) integration by UrbanTechIO.

---

## Features

- **Live stats** — speed, distance (km), calories, steps, and elapsed time updated in real time
- **Start / Stop** — single toggle button wired to `media_player.walkingpad_control`
- **Speed control** — `−` and `+` buttons adjust belt speed in 0.1 km/h increments via a `number` entity
- **Heart rate indicator** — animated heart icon next to the device name, glows green → amber → red → dark red based on BPM (optional, shown only when entity is configured)
- **Session goal progress bar** — set a distance (km) or calorie target via the `+` button; a gradient progress bar acts as the separator between the header and the card body
- **Auto-stop automation** — companion HA automations stop the belt and mark the goal reached when the target is hit, even when the dashboard is closed
- **Goal persistence** — goal is stored in HA `input_number` / `input_select` helpers so it survives page navigation and browser reloads
- **BLE connection status** — status pip in the header reflects connected / running / paused / disconnected states
- **Auto-discovery** — automatically finds all KingSmith WalkingPad entities in HA without any manual YAML entity mapping
- **HA theme-aware** — all colors use standard HA CSS variables (`--primary-text-color`, `--card-background-color`, `--primary-color`, etc.) and adapt to any light or dark theme
- **`card_mod` compatible** — every section exposes a CSS `part` attribute for surgical styling overrides
- **Native UI config editor** — uses `ha-entity-picker` dropdowns with domain filtering and free-type support; no YAML required

---

## Screenshots

> *Screenshots coming soon*

---

## Requirements

- [KingSmith WalkingPad](https://github.com/UrbanTechIO/KingSmith-WalkingPad) integration installed and configured
- [HACS](https://hacs.xyz) installed in Home Assistant

---

## Installation

### Via HACS (recommended)

1. Open **HACS** in Home Assistant
2. Go to **Frontend**
3. Click the **⋮ menu** (top right) → **Custom repositories**
4. Add `https://github.com/UrbanTechIO/WalkingPad-Card` with category **Lovelace**
5. Click **Download**
6. Reload the browser

### Manual

1. Download `kingsmith-card.js` from the [latest release](https://github.com/UrbanTechIO/WalkingPad-Card/releases/latest)
2. Copy it to `/config/www/kingsmith-card.js`
3. Go to **Settings → Dashboards → Resources → + Add resource**
   - URL: `/local/kingsmith-card.js`
   - Type: **JavaScript module**
4. Reload the browser

---

## Goal Helpers Setup

The goal system uses four HA helpers to persist the session goal and communicate with the auto-stop automations. Create them once under **Settings → Devices & Services → Helpers**:

| Type | Entity ID | Settings |
|------|-----------|----------|
| Number | `input_number.walkingpad_goal_distance` | min 0.1 · max 50 · step 0.1 · unit km |
| Number | `input_number.walkingpad_goal_calories` | min 10 · max 2000 · step 10 · unit kcal |
| Dropdown | `input_select.walkingpad_goal_type` | options: `none`, `distance`, `calories` |
| Toggle | `input_boolean.walkingpad_goal_reached` | initial: off |

---

## Auto-Stop Automations

Import the automations below to automatically stop the belt when the goal is reached — this runs server-side so it works even when the dashboard is closed.

**Distance automation:**
```yaml
alias: "WalkingPad - Stop on Distance Goal"
triggers:
  - trigger: state
    entity_id: sensor.walkingpad_distance
conditions:
  - condition: state
    entity_id: media_player.walkingpad_control
    state: "playing"
  - condition: state
    entity_id: input_select.walkingpad_goal_type
    state: "distance"
  - condition: state
    entity_id: input_boolean.walkingpad_goal_reached
    state: "off"
  - condition: template
    value_template: >
      {{ (states('sensor.walkingpad_distance') | float(0) / 1000)
         >= (states('input_number.walkingpad_goal_distance') | float(0)) }}
actions:
  - action: media_player.media_pause
    target:
      entity_id: media_player.walkingpad_control
  - action: input_boolean.turn_on
    target:
      entity_id: input_boolean.walkingpad_goal_reached
mode: single
max_exceeded: silent
```

**Calories automation:**
```yaml
alias: "WalkingPad - Stop on Calorie Goal"
triggers:
  - trigger: state
    entity_id: sensor.walkingpad_energy
conditions:
  - condition: state
    entity_id: media_player.walkingpad_control
    state: "playing"
  - condition: state
    entity_id: input_select.walkingpad_goal_type
    state: "calories"
  - condition: state
    entity_id: input_boolean.walkingpad_goal_reached
    state: "off"
  - condition: template
    value_template: >
      {{ (states('sensor.walkingpad_energy') | float(0))
         >= (states('input_number.walkingpad_goal_calories') | float(0)) }}
actions:
  - action: media_player.media_pause
    target:
      entity_id: media_player.walkingpad_control
  - action: input_boolean.turn_on
    target:
      entity_id: input_boolean.walkingpad_goal_reached
mode: single
max_exceeded: silent
```

**Reset flag on new session:**
```yaml
alias: "WalkingPad - Reset Goal Flag on Start"
triggers:
  - trigger: state
    entity_id: media_player.walkingpad_control
    to: "playing"
actions:
  - action: input_boolean.turn_off
    target:
      entity_id: input_boolean.walkingpad_goal_reached
mode: single
```

---

## Configuration

### Minimal (auto-discovery)

The card automatically discovers all KingSmith WalkingPad entities. Just add:

```yaml
type: custom:kingsmith-card
name: WalkingPad
```

### Full YAML reference

```yaml
type: custom:kingsmith-card
name: WalkingPad

# Sensors
entity_speed: sensor.walkingpad_speed
entity_distance: sensor.walkingpad_distance
entity_energy: sensor.walkingpad_energy
entity_steps: sensor.walkingpad_steps
entity_elapsed_time: sensor.walkingpad_elapsed_time
entity_heart_rate: sensor.walkingpad_heart_rate   # optional

# Connection
entity_connected: binary_sensor.walkingpad_connected

# Controls
entity_control: media_player.walkingpad_control
entity_speed_control: number.walkingpad_speed_control
button_connect: button.walkingpad_connect

# Goal helpers
helper_goal_distance: input_number.walkingpad_goal_distance
helper_goal_calories: input_number.walkingpad_goal_calories
helper_goal_type: input_select.walkingpad_goal_type
helper_goal_reached: input_boolean.walkingpad_goal_reached
```

### UI Editor

Open the card editor in the dashboard UI — all entity fields use native `ha-entity-picker` dropdowns with domain filtering. No YAML required.

---

## card_mod Styling

Every section of the card exposes a CSS `part` attribute for overrides via [card_mod](https://github.com/thomasloven/lovelace-card-mod):

| Part | Element |
|------|---------|
| `header` | Top bar (name, heart rate, goal chip, + button) |
| `goal-bar` | The 3px progress bar separator |
| `goal-fill` | The colored fill inside the progress bar |
| `hero` | Speed number area |
| `speed` | The large speed number |
| `stats` | The 4-cell stat grid |
| `stat` | Individual stat cell |
| `stat-value` | Number inside a stat cell |
| `stat-label` | Label inside a stat cell |
| `controls` | Button row wrapper |
| `btn-startstop` | Start / Stop toggle button |
| `btn-connect` | Connect / BT button |
| `btn-spd-down` | Speed − button |
| `btn-spd-up` | Speed + button |
| `goal-chip` | Goal progress chip in the header |
| `plus-btn` | The ＋ goal button |

**Example:**
```yaml
card_mod:
  style: |
    ha-card {
      border-radius: 24px;
    }
    :host::part(goal-fill) {
      background: linear-gradient(90deg, teal, navy);
    }
    :host::part(speed) {
      font-size: 72px;
    }
    :host::part(stat-value) {
      color: var(--primary-color);
    }
```

---

## Heart Rate Color Scale

When `entity_heart_rate` is configured, the animated heart icon in the header changes color based on BPM:

| BPM | Color | Zone |
|-----|-------|------|
| < 60 | Teal | Resting |
| 60 – 100 | Green | Normal |
| 100 – 140 | Amber | Elevated |
| 140 – 160 | Red | High |
| > 160 | Dark Red | Max |

---

## License

MIT License — see [LICENSE](LICENSE) for details.

---

## Related

- [KingSmith WalkingPad Integration](https://github.com/UrbanTechIO/KingSmith-WalkingPad) — the HA integration this card is built for
