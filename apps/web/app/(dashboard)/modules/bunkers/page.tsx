import { ModuleLedger, DisabledField, DisabledActionButton } from "@/components/ModuleLedger";

export default function BunkersModulePage() {
  return (
    <ModuleLedger
      title="Bunkers"
      description={
        <p style={{ margin: 0 }}>
          The question is fitness for use under the specification clause, not a table tick.
        </p>
      }
      actions={<DisabledActionButton label="Assess bunker fitness" />}
      ledgerTitle="Output areas"
      columns={[
        { key: "metric", label: "Output" },
        { key: "value", label: "Figure", align: "right", mono: true },
      ]}
      rows={[
        { label: "Protest deadline", values: { value: "—" } },
        { label: "Quantity variance", values: { value: "—" } },
      ]}
    >
      <section
        className="card-flat"
        style={{
          background: "var(--card)",
          display: "grid",
          gap: "1rem",
        }}
      >
        <h2 style={{ fontSize: "0.8125rem", fontWeight: 600, margin: 0, letterSpacing: "0.02em" }}>
          Inputs
        </h2>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(14rem, 1fr))",
            gap: "1rem",
          }}
        >
          <DisabledField label="BDN" placeholder="No BDN loaded" />
          <DisabledField label="Sample record" placeholder="No sample record loaded" />
          <DisabledField label="Specification clause" placeholder="No clause loaded" />
        </div>
      </section>
    </ModuleLedger>
  );
}
