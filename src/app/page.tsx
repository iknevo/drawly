import { FeatureGrid } from "@/components/home/feature-grid";
import { HomeHeader } from "@/components/home/home-header";

export default function Page() {
  return (
    <div className="mx-auto flex min-h-svh w-full max-w-5xl flex-col px-6">
      <HomeHeader />
      <div className="flex flex-1 flex-col items-center justify-center py-16">
        <FeatureGrid />
      </div>
    </div>
  );
}
