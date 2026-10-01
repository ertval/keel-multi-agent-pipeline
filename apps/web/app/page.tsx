import { VariantSwitcher } from "./landing/VariantSwitcher";
import { VARIANT_OPTIONS, renderVariant, resolveVariant } from "./landing/registry";

/**
 * The landing route.
 *
 * `?v=<key>` selects one of eleven designs. The lookup happens here, on the
 * server, so a variant is chosen before anything is sent — no client-side
 * variant swap, no flash, and no `useSearchParams()` (which would oblige the
 * route to sit inside a Suspense boundary). An unrecognised key renders the
 * default rather than erroring.
 *
 * Cost of resolving on the server: `/` is no longer prerendered as static
 * content, because reading `searchParams` opts the route into dynamic
 * rendering. `VARIANT_OPTIONS` is plain data, so only the switcher crosses the
 * client boundary.
 */

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const variant = resolveVariant(params.v);
  const content = renderVariant(variant);

  return (
    // The switcher is `fixed bottom-0` and wraps to two rows below `sm`, so the
    // landing content needs matching bottom padding or its last lines sit
    // permanently underneath it. Measured bar height: 86px at <=768px, 46px
    // above. The reserve is deliberately larger than the bar because the
    // tallest footer (blueprint) still overlapped a 64px reserve at 768px.
    <div className="pb-28 sm:pb-24">
      {content}
      <VariantSwitcher current={variant} options={VARIANT_OPTIONS} />
    </div>
  );
}
