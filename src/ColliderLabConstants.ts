/**
 * ColliderLabConstants.ts
 *
 * Named constants for the simulation: layout sizes in view pixels and the
 * model's physical parameters.
 *
 * Model units (see doc/model.md):
 *   energy / mass / momentum   GeV, GeV/c², GeV/c
 *   length                     metres (m)
 *   magnetic field             tesla (T)
 *   time                       seconds (s)
 *
 * Layout / chrome values are in screen pixels.
 * Colour strings live in ColliderLabColors.ts; display strings in strings_*.json.
 */

import { Dimension2, Range } from "scenerystack/dot";
import { PhetFont } from "scenerystack/scenery-phet";
import ColliderLabNamespace from "./ColliderLabNamespace.js";

/** Margin (view px) between screen content and the layoutBounds edges. */
export const SCREEN_VIEW_MARGIN = 20;

/** Corner radius (view px) for every panel. */
export const PANEL_CORNER_RADIUS = 6;

/** Panel margins (view px). */
export const PANEL = {
  X_MARGIN: 12,
  Y_MARGIN: 10,
} as const;

/** Fonts shared across screens (CSS font strings for RichText/Text). */
export const FONTS = {
  PANEL: "13px sans-serif",
  PANEL_BOLD: "bold 13px sans-serif",
  SMALL: "11px sans-serif",
  SMALL_BOLD: "bold 11px sans-serif",
  SMALL_ITALIC: "italic 11px sans-serif",
  FORMULA: "italic 12px sans-serif",
  PROCESS: "14px serif",
  PROCESS_BOLD: "bold 14px sans-serif",
  SANS_14: "14px sans-serif",
  SANS_14_BOLD: "bold 14px sans-serif",
  GAME_PROMPT: "bold 14px sans-serif",
  GAME_ANSWER: "15px serif",
  TRUTH_LABEL: "bold 16px serif",
  MISSING_PT: "bold 12px sans-serif",
  AXIS: "13px sans-serif",
  TICK: "12px sans-serif",
  RESONANCE_LABEL: "bold 13px sans-serif",
  CREDIT: "11px sans-serif",
  PAIR_MASS: "bold 16px sans-serif",
} as const;

/** Preferences dialog fonts and spacing (px). */
export const PREFERENCES = {
  TITLE_FONT: new PhetFont({ size: 18, weight: "bold" }),
  LABEL_FONT: new PhetFont(14),
  CHECKBOX_SPACING: 8,
  SECTION_SPACING: 12,
} as const;

/** Shared control dimensions and spacing (px); arrow-button scale is dimensionless. */
export const CONTROLS = {
  THUMB_SIZE: new Dimension2(12, 22),
  STANDALONE_TRACK_SIZE: new Dimension2(150, 3),
  NUMBER_CONTROL_TRACK_SIZE: new Dimension2(110, 3),
  CHECKBOX_BOX_WIDTH: 16,
  CHECKBOX_SPACING: 4,
  ARROW_BUTTON_SCALE: 0.75,
  SLIDER_PADDING: 4,
  ARROW_BUTTON_SPACING: 3,
  VERTICAL_SPACING: 4,
  RADIO_RADIUS: 7,
  RADIO_SPACING: 4,
} as const;

/**
 * PDG 2024 rest masses and related particle data (GeV/c² unless noted).
 * DimuonDataset uses MUON_MASS_GEV_ENCODED (more digits) so packed CMS bytes stay bit-stable;
 * MASS.MUON is the rounded value for event-display physics.
 */
export const MASS = {
  MUON: 0.10566,
  ELECTRON: 0.000511,
  PION: 0.13957,
  PI0: 0.13498,
  K_SHORT: 0.497611,
  PROTON: 0.938272,
  ETA: 0.5479,
  RHO_OMEGA: 0.7753,
  PHI: 1.0195,
  JPSI: 3.0969,
  PSI2S: 3.6861,
  UPSILON_1S: 9.4603,
  UPSILON_2S: 10.0233,
  UPSILON_3S: 10.3552,
  Z: 91.188,
  W: 80.369,
  HIGGS: 125.2,
  TOP: 172.6,
} as const;

/** Magnetic field in the tracker (T). */
export const B_FIELD = {
  RANGE: new Range(0.5, 4),
  DEFAULT: 3.8,
  /** pT [GeV/c] = 0.3 · B [T] · r [m]. */
  PT_PER_TESLA_METRE: 0.3,
  CONTROL_DELTA: 0.1,
} as const;

/**
 * CMS-like barrel detector radii (m). Tracks bend only inside the tracker;
 * outside it they are drawn straight.
 */
export const DETECTOR_GEOMETRY = {
  TRACKER_LAYERS: [0.04, 0.07, 0.11, 0.16, 0.22, 0.3, 0.38, 0.46, 0.55, 0.64, 0.73, 0.82, 0.91, 1.0, 1.08] as const,
  TRACKER_RADIUS: 1.1,
  ECAL_INNER: 1.25,
  ECAL_OUTER: 1.6,
  HCAL_INNER: 1.7,
  HCAL_OUTER: 2.6,
  SOLENOID_INNER: 2.7,
  SOLENOID_OUTER: 2.9,
  MUON_LAYERS: [3.1, 3.35, 3.6, 3.85] as const,
  DETECTOR_RADIUS: 4.0,
  /** Hit resolution along each layer (r-φ), m: 50 µm, silicon-strip-like. */
  HIT_RESOLUTION: 0.00005,
} as const;

/** K⁰_S lifetime and flight-length window used by the event display. */
export const K_SHORT = {
  /** Mean decay length cτ, m (PDG: 2.684 cm). */
  C_TAU: 0.02684,
  /** Mean proper lifetime, s. */
  LIFETIME: 0.8954e-10,
  /** Accepted transverse flight length, m (closer is unresolvable; farther leaves too few hits). */
  MIN_FLIGHT_LENGTH: 0.03,
  MAX_FLIGHT_LENGTH: 0.6,
  /** Display scale: proper time shown in units of 10⁻¹⁰ s. */
  DISPLAY_TIME_SCALE: 1e-10,
} as const;

/** Speed of light, m/s. */
export const SPEED_OF_LIGHT = 2.99792458e8;

/** Event-generator kinematics and detector smearing. */
export const EVENT_GEN = {
  /** Default RNG seed for the Event Display screen. */
  DEFAULT_SEED: 1964,
  /** Per-event seed is drawn from [0, 2³¹). */
  SEED_RANGE: 2 ** 31,
  /** Min turning-angle epsilon when intersecting layers (rad). */
  ANGLE_EPSILON: 1e-9,
  /** Skip tracker layers within this distance of the production point (m). */
  LAYER_SKIP_MARGIN: 0.005,
  /** Cap exit angle at a half-turn (rad). */
  MAX_EXIT_ANGLE: Math.PI,
  /** Missing-pT smear σ per component (GeV/c). */
  MISSING_PT_SMEAR: 0.8,
  /** Beam-spot σ (m). */
  BEAM_SPOT_SIGMA: 0.0005,
  /** Recoil hadron only if parent pT exceeds this (GeV/c). */
  RECOIL_PT_THRESHOLD: 1,
  Z_WIDTH: 2.5,
  Z_MASS_MIN: 80,
  Z_MASS_MAX: 100,
  W_WIDTH: 2.1,
  W_MASS_MIN: 65,
  W_MASS_MAX: 95,
  /** Parent pT Gaussian σ for Z and W (GeV/c). */
  VECTOR_BOSON_PT_SIGMA: 4,
  VECTOR_BOSON_RAPIDITY: 1.2,
  PI0_PT_MIN: 1.5,
  PI0_PT_MAX: 5,
  PI0_RAPIDITY: 1,
  K_SHORT_PT_MIN: 1,
  K_SHORT_PT_MAX: 5,
  K_SHORT_RAPIDITY: 1,
} as const;

/** Circle-fit / sagitta numerics. */
export const CIRCLE_FIT = {
  /** Singular 3×3 determinant threshold. */
  SINGULAR_THRESHOLD: 1e-18,
  /** Minimum hits required for a fit or sagitta. */
  MIN_HITS: 3,
} as const;

/** Z-peak fit (Bump Hunt). */
export const Z_FIT = {
  /** ħ in GeV·s (CODATA 2018). */
  HBAR_GEV_S: 6.582119569e-25,
  PDG_WIDTH_GEV: 2.4955,
  WINDOW_MIN: 70,
  WINDOW_MAX: 110,
  /** Min events in the fit window. */
  MIN_EVENTS: 30,
  /** Width bounds in the NLL (GeV). */
  MIN_WIDTH: 0.01,
  MAX_WIDTH: 30,
  /** Starting width guess (GeV). */
  START_WIDTH: 2.5,
  /** FWHM ↔ σ factor 2√(2 ln 2). */
  FWHM_SIGMA_FACTOR: 2.354820045,
  /** Display scale: lifetime shown in units of 10⁻²⁵ s. */
  DISPLAY_LIFETIME_SCALE: 1e-25,
} as const;

/** Bump Hunt streaming and resolution controls. */
export const BUMP_HUNT = {
  STREAM_RATE_RANGE: new Range(10, 20000),
  DEFAULT_STREAM_RATE: 500,
  RESOLUTION_RANGE: new Range(0, 3),
  DEFAULT_RESOLUTION: 1.3,
  /** Fixed shuffle seed so a classroom sees the same event sequence. */
  SHUFFLE_SEED: 20111,
  RESOLUTION_DELTA: 0.1,
  /** log₁₀(rate) slider step (also used to quantize the thumb). */
  LOG_RATE_KEYBOARD_STEP: 0.25,
  LOG_RATE_PAGE_STEP: 1,
} as const;

/** Energy Frontier beam-energy axis and formatting. */
export const ENERGY_FRONTIER = {
  LOG_ENERGY_RANGE: new Range(0, 12),
  /** Default log₁₀(E/GeV) → 100 GeV. */
  DEFAULT_LOG_ENERGY: 2,
  /** √s chart y-axis: log₁₀ from 1 GeV to 10⁶ GeV. */
  LOG_Y_MIN: 0,
  LOG_Y_MAX: 6,
  /** formatEnergy switches to scientific notation above this (GeV). */
  SCIENTIFIC_THRESHOLD: 1e4,
  SMALL_VALUE_THRESHOLD: 10,
  LOG_SLIDER_KEYBOARD_STEP: 0.1,
  LOG_SLIDER_PAGE_STEP: 1,
} as const;

/** Event Display screen layout (view px). */
export const EVENT_DISPLAY_LAYOUT = {
  DETECTOR_PIXELS: 285,
  RIGHT_WIDTH: 390,
  LABEL_MAX_WIDTH: 170,
  B_CONTROL_TITLE_MAX_WIDTH: 160,
  LEGEND_SPACING: 1,
  LEGEND_EDGE_INSET: 6,
  LEGEND_OPACITY: 0.85,
  MODE_RADIO_SPACING: 16,
  PROCESS_RADIO_SPACING: 12,
  EXPLORE_ROW_SPACING: 6,
  CONTROL_PANEL_SPACING: 7,
  CHECKBOX_ROW_SPACING: 10,
  RIGHT_COLUMN_SPACING: 8,
  RIGHT_COLUMN_TOP_INSET: 8,
  PANEL_CONTENT_INSET: 20,
  BUTTON_WIDTH_INSET: 40,
  FORMULA_OPACITY: 0.8,
  NOTE_OPACITY: 0.75,
  MEASUREMENT_SPACING: 5,
  MEASUREMENT_ROW_SPACING: 12,
  GAME_GRID_SPACING: 8,
  GAME_PANEL_SPACING: 8,
} as const;

/** Detector drawing (px unless noted). */
export const DETECTOR_VIEW = {
  /** Tracker gets this fraction of outerPixels when not zoomed. */
  TRACKER_PIXEL_FRACTION: 0.5,
  CLIP_PADDING: 2,
  TRACKER_FILL_OPACITY: 0.6,
  LAYER_LINE_WIDTH: 0.6,
  MUON_RING_LINE_WIDTH: 6,
  LAYER_LABEL_OPACITY: 0.6,
  BEAM_SPOT_RADIUS: 2.5,
  MIN_TRACK_STEPS: 12,
  TRACK_STEPS_PER_RADIAN: 40,
  /** Radial step (m) for the straight post-tracker segment. */
  STRAIGHT_RADIAL_STEP: 0.05,
  /** Deposit depth: inner + (outer−inner)·min(1, BASE + log₁₀(1+E)/SCALE). */
  DEPOSIT_DEPTH_BASE: 0.25,
  DEPOSIT_DEPTH_LOG_SCALE: 2.2,
  /** Deposit half-width in φ (rad). */
  DEPOSIT_HALF_PHI: 0.05,
  MUON_HIT_RADIUS: 4,
  /** Electron / hadron stop past calorimeter entry (m). */
  ELECTRON_STOP_PAST_ECAL: 0.1,
  HADRON_STOP_PAST_HCAL: 0.2,
  SELECTED_TRACK_WIDTH: 2.5,
  TRACK_WIDTH: 1.5,
  HIT_AREA_WIDTH: 12,
  SELECTED_HIT_RADIUS: 2.6,
  HIT_RADIUS: 1.8,
  FIT_CIRCLE_SAMPLES: 720,
  FIT_DASH: [5, 4] as const,
  FIT_LINE_WIDTH: 1.5,
  MARKER_RADIUS: 4,
  FLIGHT_DASH: [2, 3] as const,
  FLIGHT_OPACITY: 0.7,
  /** Missing pT (GeV/c) below which the arrow is hidden. */
  MISSING_PT_THRESHOLD: 3,
  MISSING_PT_PIXELS_PER_GEV: 3,
  MISSING_PT_MAX_LENGTH_FRACTION: 0.9,
  ARROW_TAIL_WIDTH: 3,
  ARROW_HEAD_WIDTH: 12,
  ARROW_HEAD_HEIGHT: 12,
  ARROW_OPACITY: 0.9,
  MISSING_PT_LABEL_TIP_FACTOR: 1.08,
  MISSING_PT_LABEL_Y_OFFSET: -10,
  /** Truth-label reach radii (m). */
  ZOOMED_LABEL_REACH_FRACTION: 0.85,
  MUON_LABEL_REACH: 3.0,
  NEUTRINO_LABEL_REACH: 2.2,
  OTHER_LABEL_REACH: 1.15,
} as const;

/** Bump Hunt screen layout (view px). */
export const BUMP_HUNT_LAYOUT = {
  CHART_WIDTH: 530,
  CHART_HEIGHT: 480,
  CHART_LEFT: 24,
  CHART_TOP: 20,
  PANEL_WIDTH: 330,
  LABEL_INSET: 40,
  STATUS_BOTTOM_INSET: 6,
  CREDIT_OPACITY: 0.7,
  RADIO_SPACING: 5,
  CONTROLS_SPACING: 7,
  PLAY_PAUSE_RADIUS: 18,
  STREAM_ROW_SPACING: 14,
  STREAM_TITLE_SPACING: 12,
  RIGHT_COLUMN_TOP_INSET: 10,
  FIT_CONTENT_INSET: 10,
  FIT_LABEL_INSET: 20,
  PDG_OPACITY: 0.8,
  PAIR_GRID_X_SPACING: 10,
  PAIR_GRID_Y_SPACING: 3,
  PAIR_BUTTON_INSET: 20,
  PAIR_PANEL_SPACING: 8,
} as const;

/** Mass-spectrum chart drawing. */
export const MASS_SPECTRUM_CHART = {
  BAR_OPACITY: 0.85,
  FIT_LINE_WIDTH: 2.5,
  X_AXIS_OFFSET: 22,
  Y_AXIS_OFFSET: -38,
  LOG_Y_FLOOR: 0.5,
  LOG_Y_HEADROOM: 1.5,
  LINEAR_Y_HEADROOM: 1.15,
  FIT_MASS_STEP: 0.1,
  TICK_LABEL_OFFSET: 4,
  TARGET_X_TICKS: 6,
  TARGET_Y_TICKS: 5,
  LABEL_OPACITY: 0.55,
  LABEL_PACK_GAP: 4,
  LABEL_ROW_HEIGHT: 16,
  LABEL_LINE_DASH: [3, 4] as const,
  UNCLEAR_PEAK_OPACITY: 0.5,
} as const;

/** Energy Frontier screen layout (view px). */
export const ENERGY_FRONTIER_LAYOUT = {
  RIGHT_WIDTH: 330,
  TEXT_MAX_WIDTH_INSET: 30,
  RICH_LINE_WRAP_INSET: 24,
  CHART_WIDTH_EXTRA: 50,
  CHART_HEIGHT_INSET: 90,
  CHART_X_OFFSET: 50,
  BEAM_RADIO_SPACING: 16,
  PANEL_SPACING: 7,
  RIGHT_COLUMN_TOP_INSET: 8,
  PARTON_NOTE_OPACITY: 0.75,
  AXIS_OFFSET_BOTTOM: 22,
  AXIS_OFFSET_LEFT: -34,
  X_GRID_STEP: 2,
  TICK_OFFSET: 4,
  THRESHOLD_DASH: [4, 5] as const,
  THRESHOLD_OPACITY: 0.55,
  CURVE_LOG_STEP: 0.05,
  CURVE_LINE_WIDTH: 3,
  COLLIDER_LABEL_AT_ENERGY: 1e8,
  FIXED_LABEL_AT_ENERGY: 1e4,
  CURVE_LABEL_OFFSET: 6,
  MACHINE_LABEL_OFFSET: 9,
  MACHINE_DOT_RADIUS: 5,
  CURRENT_LINE_WIDTH: 1.5,
  CURRENT_MARKER_RADIUS: 6,
  CLIP_LEFT: -60,
  CLIP_TOP: -10,
  CLIP_RIGHT_PAD: 70,
  CLIP_BOTTOM_PAD: 40,
} as const;

/** Display unit conversion factors. */
export const DISPLAY_UNITS = {
  /** Metres → millimetres (sagitta readout). */
  M_TO_MM: 1000,
  /** Metres → centimetres (flight length readout). */
  M_TO_CM: 100,
} as const;

/** Settings for bump-hunt/model/DimuonDataset.ts. */
export const DIMUON_DATASET_SETTINGS = {
  /**
   * Muon rest mass used when packing/decoding CMS dimuon bytes (GeV/c²).
   * More precise than MASS.MUON so the offline-encoded JSON stays bit-stable;
   * use MASS.MUON for event-display physics.
   */
  MUON_MASS_GEV_ENCODED: 0.1056583755,
  /** One event: an opposite-sign muon pair. */
  BYTES_PER_MUON: 6,
} as const;

/** Settings for bump-hunt/view/PairCalculatorPanel.ts. Layout lengths are in px; counts and ratios are dimensionless. */
export const PAIR_CALCULATOR_PANEL_SETTINGS = {
  MASS_SQUARED_PROPERTY_DIGITS: 2, // digits
  MASS_FIXED_DIGITS: 3, // digits

  DEFAULT_DIGITS: 2,
} as const;

/** Settings for bump-hunt/view/ZFitPanel.ts. Layout lengths are in px; counts and ratios are dimensionless. */
export const Z_FIT_PANEL_SETTINGS = {
  MASS_VALUE_DECIMAL_PLACES: 2, // digits
  MASS_ERROR_DECIMAL_PLACES: 2, // digits
  WIDTH_VALUE_DECIMAL_PLACES: 2, // digits
  WIDTH_ERROR_DECIMAL_PLACES: 2, // digits
  PDG_TEXT_DECIMAL_PLACES: 2, // digits

  TOO_FEW_TEXT_MAX_WIDTH_OFFSET: 90, // px

  RESULTS_SPACING: 3,
  /** Vertical spacing of the panel's root VBox (px). */
  PANEL_SPACING: 6,
} as const;

/** Settings for common/ColliderLabScreenIcons.ts. Layout lengths are in px; counts and ratios are dimensionless. */
export const COLLIDER_LAB_SCREEN_ICONS_SETTINGS = {
  /** Stroke width for the curved charged tracks in the Event Display icon (px). */
  CREATE_EVENT_DISPLAY_ICON_TRACK_LINE_WIDTH: 7, // px
  CREATE_EVENT_DISPLAY_ICON_CONTROL_1_X_SEGMENT_2: -30, // px
  CREATE_EVENT_DISPLAY_ICON_CONTROL_1_Y_SEGMENT_2: 15, // px
  CREATE_EVENT_DISPLAY_ICON_CONTROL_2_X_SEGMENT_2: -105, // px
  CREATE_EVENT_DISPLAY_ICON_CONTROL_2_Y_SEGMENT_2: 42, // px
  CREATE_EVENT_DISPLAY_ICON_END_X_SEGMENT_2: -150, // px
  CREATE_EVENT_DISPLAY_ICON_END_Y_SEGMENT_2: 49, // px
  CREATE_EVENT_DISPLAY_ICON_RADIUS_SEGMENT_2: 7, // px
  CREATE_BUMP_HUNT_ICON_ITEM_4_LINE_WIDTH: 4, // px
  CREATE_ENERGY_FRONTIER_ICON_START_X_SEGMENT_2: 438, // px
  CREATE_ENERGY_FRONTIER_ICON_END_X_SEGMENT_2: 338, // px
  CREATE_ENERGY_FRONTIER_ICON_ITEM_5_X: 468, // px
  CREATE_ENERGY_FRONTIER_ICON_X_SEGMENT_2: 70, // px
  CREATE_ENERGY_FRONTIER_ICON_Y_SEGMENT_2: 190, // px
  CREATE_ENERGY_FRONTIER_ICON_Y_SEGMENT_3: 325, // px
  CREATE_ENERGY_FRONTIER_ICON_X_SEGMENT_3: 490, // px
  CREATE_ENERGY_FRONTIER_ICON_ITEM_7_LINE_WIDTH: 4, // px
  CREATE_ENERGY_FRONTIER_ICON_START_X_SEGMENT_3: 80, // px
  CREATE_ENERGY_FRONTIER_ICON_START_Y_SEGMENT_2: 315, // px
  CREATE_ENERGY_FRONTIER_ICON_END_X_SEGMENT_3: 475, // px
  CREATE_ENERGY_FRONTIER_ICON_END_Y_SEGMENT_2: 190, // px
  CREATE_ENERGY_FRONTIER_ICON_ITEM_8_LINE_WIDTH: 8, // px
  CREATE_ENERGY_FRONTIER_ICON_X_MOVE_TO_Y: 315, // px
  CREATE_ENERGY_FRONTIER_ICON_CONTROL_X_QUADRATIC_CURVE_TO_END_X: 475, // px
  CREATE_ENERGY_FRONTIER_ICON_CONTROL_X_QUADRATIC_CURVE_TO_END_Y: 253, // px
  CREATE_ENERGY_FRONTIER_ICON_ITEM_9_LINE_WIDTH: 8, // px

  CREATE_EVENT_DISPLAY_ICON_LINE_WIDTH: 2,
  /** Create event display icon opacity (dimensionless). */
  CREATE_EVENT_DISPLAY_ICON_OPACITY: 0.35,
  CREATE_EVENT_DISPLAY_ICON_CONTROL_1_X: 28,
  CREATE_EVENT_DISPLAY_ICON_CONTROL_1_Y: -14,
  CREATE_EVENT_DISPLAY_ICON_CONTROL_2_X: 91,
  CREATE_EVENT_DISPLAY_ICON_CONTROL_2_Y: -58,
  CREATE_EVENT_DISPLAY_ICON_END_X: 112,
  CREATE_EVENT_DISPLAY_ICON_END_Y: -112,
  CREATE_EVENT_DISPLAY_ICON_RADIUS: 9,
  LEFT: 60,
  BIN_COUNT: 25,
  CREATE_BUMP_HUNT_ICON_LINE_WIDTH: 7,
  CREATE_BUMP_HUNT_ICON_Y: 45,
  ARROWS_HEAD_HEIGHT: 26,
  ARROWS_HEAD_WIDTH: 34,
  ARROWS_TAIL_WIDTH: 12,
  CREATE_ENERGY_FRONTIER_ICON_START_X: 110,
  CREATE_ENERGY_FRONTIER_ICON_START_Y: 110,
  CREATE_ENERGY_FRONTIER_ICON_END_X: 210,
  CREATE_ENERGY_FRONTIER_ICON_END_Y: 110,
  CREATE_ENERGY_FRONTIER_ICON_RADIUS: 24,
  CREATE_ENERGY_FRONTIER_ICON_X: 80,
  CREATE_ENERGY_FRONTIER_ICON_Y: 110,
  CREATE_ENERGY_FRONTIER_ICON_LINE_WIDTH: 6,
  CREATE_ENERGY_FRONTIER_ICON_CONTROL_X: 205,
  CREATE_ENERGY_FRONTIER_ICON_CONTROL_Y: 285,
} as const;

/** Settings for common/model/nelderMead.ts. */
export const NELDER_MEAD_SETTINGS = {
  /** Fallback finite-difference step in parameter coordinates. */
  HESSIAN_STEP: 1e-3,
  /** Smallest invertible matrix pivot (dimensionless). */
  MIN_PIVOT: 1e-300,
  /** Default maximum iterations (dimensionless). */
  DEFAULT_MAXIMUM_ITERATIONS: 4000,
  /** Default tolerance (dimensionless). */
  DEFAULT_TOLERANCE: 1e-9,
} as const;

/** Settings for energy-frontier/view/EnergyFrontierScreenView.ts. Layout lengths are in px; counts and ratios are dimensionless. */
export const ENERGY_FRONTIER_SCREEN_VIEW_SETTINGS = {
  FORMAT_ENERGY_DECIMAL_PLACES: 2, // digits

  REACH_GRID_X_SPACING: 12,
  REACH_GRID_Y_SPACING: 2,
} as const;

/** Settings for event-display/view/detector overlays. Layout lengths are in px; counts and ratios are dimensionless. */
export const DETECTOR_NODE_SETTINGS = {
  /** Stroke width of the displaced-vertex marker circle (px). */
  VERTEX_MARKER_LINE_WIDTH: 2,
} as const;

/** Settings for event-display/view/MeasurementPanel.ts. Layout lengths are in px; counts and ratios are dimensionless. */
export const MEASUREMENT_PANEL_SETTINGS = {
  SAGITTA_DECIMAL_PLACES: 2, // digits
  KAON_PT_DECIMAL_PLACES: 2, // digits
  PROPER_TIME_DECIMAL_PLACES: 2, // digits
  ESTIMATE_DECIMAL_PLACES: 2, // digits

  FIT_RADIUS_PRECISION: 3, // digits
  /** Significant figures for fitted / sagitta / true pT display. */
  PT_SIGNIFICANT_FIGURES: 3, // digits

  K_BOX_SPACING: 3,
} as const;

/** Layout lengths in px; precision values count digits; factors are dimensionless. */
export const SQRT_S_CHART_NODE_SETTINGS = {
  /** Base for decade tick labels on the log–log √s chart (10^d). */
  LOG_DECADE_BASE: 10, // dimensionless
} as const;

/** Layout lengths in px; precision values count digits; factors are dimensionless. */
export const MASS_SPECTRUM_CHART_NODE_SETTINGS = {
  DRAW_LABELS_TOP_OFFSET: 6, // px
} as const;

/** Numerical settings; units are specified per value. */
export const RANDOM_NUMERICS = {
  /** Floor for a uniform variate before taking its logarithm (dimensionless). */
  MIN_UNIFORM: 1e-12,
  /** Number of possible unsigned 32-bit random states (2^32). */
  UINT32_STATES: 4294967296,
  /** Mulberry32 integer state increment. */
  STATE_INCREMENT: 0x6d2b79f5,
} as const;

ColliderLabNamespace.register("ColliderLabConstants", {
  SCREEN_VIEW_MARGIN,
  PANEL_CORNER_RADIUS,
  PANEL,
  FONTS,
  PREFERENCES,
  CONTROLS,
  MASS,
  B_FIELD,
  DETECTOR_GEOMETRY,
  K_SHORT,
  SPEED_OF_LIGHT,
  EVENT_GEN,
  CIRCLE_FIT,
  Z_FIT,
  BUMP_HUNT,
  ENERGY_FRONTIER,
  EVENT_DISPLAY_LAYOUT,
  DETECTOR_VIEW,
  BUMP_HUNT_LAYOUT,
  MASS_SPECTRUM_CHART,
  ENERGY_FRONTIER_LAYOUT,
  DISPLAY_UNITS,
});
