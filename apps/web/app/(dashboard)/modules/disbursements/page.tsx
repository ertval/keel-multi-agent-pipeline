import { ModuleLedger, EmptyColumn, DisabledActionButton } from "@/components/ModuleLedger";

export default function DisbursementsModulePage() {
  return (
    <ModuleLedger
      title="Disbursements"
      description={
        <p style={{ margin: 0 }}>
          Compare port tariff lines against invoice lines once both sides are loaded. Nothing is
          calculated until those inputs arrive.
        </p>
      }
      actions={<DisabledActionButton label="Match tariff to invoice" />}
      ledgerTitle="Match ledger"
      columns={[
        { key: "metric", label: "Line" },
        { key: "value", label: "Status", align: "right", mono: true },
      ]}
      rows={[
        { label: "Tariff ↔ invoice", values: { value: "—" } },
      ]}
    >
      <section
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(16rem, 1fr))",
          gap: "1rem",
        }}
      >
        <EmptyColumn title="Tariff line" subtitle="Port tariff entries — empty" />
        <EmptyColumn title="Invoice line" subtitle="Disbursement invoice entries — empty" />
      </section>
    </ModuleLedger>
  );
}
