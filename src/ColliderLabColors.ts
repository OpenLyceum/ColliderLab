/**
 * ColliderLabColors.ts
 *
 * Defines all dynamic colors for the simulation using ProfileColorProperty.
 *
 * Each color has two profiles:
 *   - "default"   — used in standard (dark) mode
 *   - "projector" — used when the user enables Projector Mode in Preferences
 *
 * SceneryStack switches profiles automatically; no manual toggling is needed.
 *
 * ── Usage ─────────────────────────────────────────────────────────────────────
 * Import ColliderLabColors and pass properties directly to Node's fillProperty or
 * strokeProperty options:
 *
 *   import ColliderLabColors from "../../ColliderLabColors.js";
 *
 *   new Rectangle( 0, 0, 100, 50, {
 *     fillProperty: ColliderLabColors.backgroundColorProperty,
 *   });
 *
 * ── How to add a color ────────────────────────────────────────────────────────
 * Add a new ProfileColorProperty entry to the ColliderLabColors object below.
 * Always provide both "default" and "projector" values.
 */
import { ProfileColorProperty } from "scenerystack/scenery";
import ColliderLabNamespace from "./ColliderLabNamespace.js";

const ColliderLabColors = {
  /**
   * Background color for the simulation screen.
   * Deep navy in default mode; white in projector mode.
   */
  backgroundColorProperty: new ProfileColorProperty(ColliderLabNamespace, "background", {
    default: "#1a1a2e",
    projector: "#ffffff",
  }),

  /**
   * Primary accent color for highlights, selected items, and key UI elements.
   * Sky blue in default mode; dark navy in projector mode.
   */
  accentColorProperty: new ProfileColorProperty(ColliderLabNamespace, "accent", {
    default: "#4fc3f7",
    projector: "#1a1a2e",
  }),

  /**
   * Background fill for control panels and dialogs.
   * Deep blue in default mode; light gray in projector mode.
   */
  panelBackgroundColorProperty: new ProfileColorProperty(ColliderLabNamespace, "panelBackground", {
    default: "#16213e",
    projector: "#f5f5f5",
  }),

  /**
   * Border/stroke color for control panels and dialogs.
   * Teal-navy in default mode; medium gray in projector mode.
   */
  panelBorderColorProperty: new ProfileColorProperty(ColliderLabNamespace, "panelBorder", {
    default: "#0f3460",
    projector: "#999999",
  }),

  /**
   * Text color for labels, readouts, and general UI text.
   * Near-white in default mode; near-black in projector mode.
   */
  textColorProperty: new ProfileColorProperty(ColliderLabNamespace, "text", {
    default: "#e0e0e0",
    projector: "#1a1a1a",
  }),

  // ── Light control surfaces ───────────────────────────────────────────────────
  // White chrome (combo boxes, flat push buttons, editable input fields) stays light
  // in both profiles; its text stays dark. Same values in default and projector mode,
  // but defined here so every color lives in one themeable place.

  /** Fill of light control surfaces: combo-box button/list, editable input fields. */
  controlSurfaceColorProperty: new ProfileColorProperty(ColliderLabNamespace, "controlSurface", {
    default: "#ffffff",
    projector: "#ffffff",
  }),

  /** Fill of a disabled control surface (grayed-out editable input field). */
  controlSurfaceDisabledColorProperty: new ProfileColorProperty(ColliderLabNamespace, "controlSurfaceDisabled", {
    default: "#cccccc",
    projector: "#cccccc",
  }),

  /** Text on light control surfaces: combo items, flat-button labels, field values, preferences. */
  controlSurfaceTextColorProperty: new ProfileColorProperty(ColliderLabNamespace, "controlSurfaceText", {
    default: "#1a1a1a",
    projector: "#1a1a1a",
  }),

  // ── Charts ─────────────────────────────────────────────────────────────────
  chartBackgroundColorProperty: new ProfileColorProperty(ColliderLabNamespace, "chartBackground", {
    default: "#0f1426",
    projector: "#ffffff",
  }),
  gridLineColorProperty: new ProfileColorProperty(ColliderLabNamespace, "gridLine", {
    default: "#2b3456",
    projector: "#d6d6d6",
  }),
  histogramFillColorProperty: new ProfileColorProperty(ColliderLabNamespace, "histogramFill", {
    default: "#4fc3f7",
    projector: "#1f6fb2",
  }),
  /** Fit curve: warm orange, distinct from the blue bars in both profiles. */
  fitCurveColorProperty: new ProfileColorProperty(ColliderLabNamespace, "fitCurve", {
    default: "#ffb74d",
    projector: "#c2410c",
  }),
  resonanceLabelColorProperty: new ProfileColorProperty(ColliderLabNamespace, "resonanceLabel", {
    default: "#f8e16c",
    projector: "#7a4b00",
  }),
  /** Muon charge colours (also used by the Event Display tracks). */
  positiveChargeColorProperty: new ProfileColorProperty(ColliderLabNamespace, "positiveCharge", {
    default: "#ff8a80",
    projector: "#b71c1c",
  }),
  negativeChargeColorProperty: new ProfileColorProperty(ColliderLabNamespace, "negativeCharge", {
    default: "#82b1ff",
    projector: "#0d47a1",
  }),
};

export default ColliderLabColors;
