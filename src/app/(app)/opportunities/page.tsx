import { PageHeader } from "@/components/layout/app-shell";
import { OpportunitiesDashboard } from "@/components/opportunities/opportunities-dashboard";
import { dataSourceLabel, getOpportunities } from "@/lib/data/opportunities";

/** Always fetch fresh permit/operator data (required for Vercel runtime env). */
export const dynamic = "force-dynamic";

export default async function OpportunitiesPage() {
  const { data, source } = await getOpportunities();

  return (
    <>
      <PageHeader
        title="Opportunities"
        description="Sales lead dashboard for oilfield service demand — scored from live permit and operator activity in the Bakken."
      />
      <OpportunitiesDashboard
        data={data}
        source={source}
        sourceLabel={dataSourceLabel(source)}
      />
    </>
  );
}
