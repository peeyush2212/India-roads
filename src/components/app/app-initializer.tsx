"use client";

import * as React from "react";
import type { ModelInputs } from "@/lib/types";
import { useIndiaRoadsStore } from "@/lib/store";
import { useSearchParams } from "next/navigation";
import { decodeScenario } from "@/lib/scenarioCodec";

export function AppInitializer({ inputs }: { inputs: ModelInputs }) {
  const init = useIndiaRoadsStore((s) => s.init);
  const currentInputs = useIndiaRoadsStore((s) => s.inputs);
  const setScenario = useIndiaRoadsStore((s) => s.setScenario);
  const searchParams = useSearchParams();
  const appliedRef = React.useRef(false);

  React.useEffect(() => {
    if (!currentInputs) {
      init(inputs);
    }
  }, [currentInputs, init, inputs]);

  React.useEffect(() => {
    if (appliedRef.current) return;
    const s = searchParams.get("s");
    if (!s) return;
    const decoded = decodeScenario(s);
    if (decoded) {
      setScenario(decoded);
      appliedRef.current = true;
    }
  }, [searchParams, setScenario]);

  return null;
}
