import { ModuleLedger, DisabledField, DisabledActionButton } from "@/components/ModuleLedger";

export default function SpeedModulePage() {
  return (
    <ModuleLedger
      title="Speed & consumption"
      description={
        <p style={{ margin: 0 }}>
          Charterer-side defence only: this module will compare a time-charter performance warranty
          with documents the charterer already holds—noon reports and the charterparty. Shared sensor
          or voyage data covered by the BIMCO Energy Efficiency Data Sharing Clause 2025 default is
          not an input, because that clause keeps shared data from being used for claims against owners.
        </p>
      }
      actions={<DisabledActionButton label="Compare warranty" />}
      notes={
        <p
          className="weather-pill"
          style={{
            width: "fit-content",
            maxWidth: "100%",
            whiteSpace: "normal",
            height: "auto",
            lineHeight: 1.45,
            borderRadius: "var(--radius)",
          }}
        >
          Speed and off-hire are not applied to the same hours.
        </p>
      }
      ledgerTitle="Result ledger"
      columns={[
        { key: "metric", label: "Output" },
        { key: "value", label: "Figure", align: "right", mono: true },
      ]}
      rows={[
        { label: "Time lost", values: { value: "—" } },
        { label: "Fuel difference", values: { value: "—" } },
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
          Intended inputs
        </h2>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(14rem, 1fr))",
            gap: "1rem",
          }}
        >
          <DisabledField label="Performance warranty (charterparty)" placeholder="No warranty loaded" />
          <DisabledField label="Noon reports" placeholder="No noon reports loaded" />
          <DisabledField label="Charterparty excerpt" placeholder="No clause excerpt loaded" />
        </div>
      </section>
    </ModuleLedger>
  );
}
