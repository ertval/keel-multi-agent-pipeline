import StatementVariant from "./v1-statement";
import TelemetryVariant from "./v2-telemetry";
import GazetteVariant from "./v3-gazette";
import BlueprintVariant from "./v4-blueprint";
import SwissVariant from "./v5-swiss";
import StateflowVariant from "./v6-stateflow";
import CarbonVariant from "./v7-carbon";
import DuskVariant from "./v8-dusk";
import PleadingVariant from "./v9-pleading";
import RadarVariant from "./v10-radar";
import ManifestVariant from "./v11-manifest";
import type { VariantOption } from "./VariantSwitcher";

/**
 * The eleven landing page designs:
 * - Statement  (printed instrument of account, serif, sparse)
 * - Telemetry  (bridge console at night, HUD readouts)
 * - Gazette    (admiralty broadsheet, newsprint columns)
 * - Blueprint  (naval architecture schematic, cyanotype grid)
 * - Swiss      (international typographic brutalism)
 * - Stateflow  (agent graph / DAG topology)
 * - Carbon     (carbon-paper duplicate receipt, perforated, stencilled mono)
 * - Dusk       (gradient-mesh atmosphere, glass panels, soft light)
 * - Pleading   (filed court document, numbered gutter, red margin rule)
 * - Radar      (plan-position indicator, polar range rings and contacts)
 * - Manifest   (port cargo manifest and container yard, high-vis signage)
 */
export const DEFAULT_VARIANT = "statement";

export const VARIANT_OPTIONS: ReadonlyArray<VariantOption> = [
  { key: "statement", label: "Statement", hint: "Printed instrument of account — serif, hairline rules, sparse" },
  { key: "telemetry", label: "Telemetry", hint: "Bridge console at night — HUD readouts, monospace" },
  { key: "gazette", label: "Gazette", hint: "Admiralty broadsheet — newsprint columns, heavy rules" },
  { key: "blueprint", label: "Blueprint", hint: "Naval architecture schematic — cyanotype grid, dimensions" },
  { key: "swiss", label: "Swiss", hint: "International typographic style — monumental scale, stark" },
  { key: "stateflow", label: "Stateflow", hint: "Agent graph topology — nodes, edges, weather timeline" },
  { key: "carbon", label: "Carbon", hint: "Carbon-paper duplicate receipt — perforated, stencilled mono" },
  { key: "dusk", label: "Dusk", hint: "Gradient-mesh atmosphere — glass panels, soft light" },
  { key: "pleading", label: "Pleading", hint: "Filed court document — numbered gutter, red margin rule" },
  { key: "radar", label: "Radar", hint: "Plan-position indicator — polar rings and plotted contacts" },
  { key: "manifest", label: "Manifest", hint: "Port cargo manifest — slot grid, high-vis signage" },
];

const VARIANTS: Record<string, () => React.JSX.Element> = {
  statement: StatementVariant,
  telemetry: TelemetryVariant,
  gazette: GazetteVariant,
  blueprint: BlueprintVariant,
  swiss: SwissVariant,
  stateflow: StateflowVariant,
  carbon: CarbonVariant,
  dusk: DuskVariant,
  pleading: PleadingVariant,
  radar: RadarVariant,
  manifest: ManifestVariant,
};

/** Unknown or absent `?v=` falls back to the default rather than 404ing. */
export function resolveVariant(value: string | string[] | undefined): string {
  const key = Array.isArray(value) ? value[0] : value;
  return key && key in VARIANTS ? key : DEFAULT_VARIANT;
}

/**
 * Invokes the variant and returns its element rather than handing back a
 * component for `<Variant />`. Binding the lookup to a local and rendering it
 * as JSX trips `react-hooks/static-components` ("cannot create components
 * during render"). Every variant is a pure server render function with no
 * hooks or state, so calling it here is equivalent and lints clean.
 */
export function renderVariant(key: string): React.JSX.Element {
  return (VARIANTS[key] ?? VARIANTS[DEFAULT_VARIANT])();
}
