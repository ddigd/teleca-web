import { getCollections, getHeroSettings } from "@/lib/queries";
import { mapCollection } from "@/lib/mapper";
import SiteClient from "@/components/SiteClient";

export const dynamic = "force-dynamic"; // Always fetch fresh data

export default async function Page() {
  const [rawCollections, heroSettings] = await Promise.all([
    getCollections(),
    getHeroSettings(),
  ]);

  const collections = rawCollections.map(mapCollection);

  return (
    <SiteClient
      initialCollections={collections}
      initialHeroSettings={{
        title: heroSettings.title,
        subtitle: heroSettings.subtitle,
        featuredId: heroSettings.featured_id,
      }}
    />
  );
}
