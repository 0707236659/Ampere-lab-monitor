import { Suspense } from "react";
import { FactoryDetailPage } from "@/components/dashboard/factory-detail";
import { Skeleton } from "@/components/ui/skeleton";

export default async function FactoryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <Suspense
      fallback={
        <div className="space-y-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-72" />
          <div className="grid gap-4 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-32 rounded-2xl" />
            ))}
          </div>
          <Skeleton className="h-96 rounded-2xl" />
        </div>
      }
    >
      <FactoryDetailPage factoryId={id} />
    </Suspense>
  );
}
