import { Suspense } from "react";
import modelInputs from "@/data/model_inputs.json";
import type { ModelInputs } from "@/lib/types";
import { AppInitializer } from "@/components/app/app-initializer";
import { PremiumPage } from "@/components/app/premium";

export default function Page() {
  return (
    <>
      <Suspense fallback={null}>
        <AppInitializer inputs={modelInputs as unknown as ModelInputs} />
      </Suspense>
      <Suspense fallback={null}>
        <PremiumPage />
      </Suspense>
    </>
  );
}
