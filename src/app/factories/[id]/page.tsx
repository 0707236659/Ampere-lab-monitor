import { FactoryDetailPage } from "@/components/dashboard/factory-detail";

export default async function FactoryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <FactoryDetailPage factoryId={id} />;
}
