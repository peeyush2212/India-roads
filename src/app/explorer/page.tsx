import { Suspense } from "react";
import modelInputs from "@/data/model_inputs.json";
import type { ModelInputs } from "@/lib/types";
import { AppInitializer } from "@/components/app/app-initializer";
import { Explorer } from "@/components/app/explorer";

export default function Page() {
  return (
    <>
      <Suspense fallback={null}>
        <AppInitializer inputs={modelInputs as unknown as ModelInputs} />
      </Suspense>
      <Explorer />
    </>
  );
}
