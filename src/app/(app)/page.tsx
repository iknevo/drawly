import { FeatureGrid } from "@/components/home/feature-grid";

export const metadata = {
  title: { absolute: "Drawly - Sketch, write, and plan" },
  description: "Sketch, write, and plan - draw your ideas.",
};

export default function Page() {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col items-center justify-center px-6 py-16">
      <FeatureGrid />
    </div>
  );
}
