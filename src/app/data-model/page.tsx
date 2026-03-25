import { Suspense } from "react";
import modelInputs from "@/data/model_inputs.json";
import type { ModelInputs } from "@/lib/types";
import { AppInitializer } from "@/components/app/app-initializer";
import { DataModel } from "@/components/app/data-model";

export default function Page() {
  return (
    <>
      <Suspense fallback={null}>
        <AppInitializer inputs={modelInputs as unknown as ModelInputs} />
      </Suspense>
      <DataModel />
    </>
  );
}
