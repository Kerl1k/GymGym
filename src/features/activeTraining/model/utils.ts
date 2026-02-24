import { ApiSchemas } from "@/shared/schema";

export const getIndex = (arr: ApiSchemas["ActiveTraining"]["exercises"]) => {
  return arr.findIndex((ex) => {
    const doneSetsCount = ex.sets.filter((set) => set.done).length;
    return doneSetsCount !== ex.sets.length;
  });
};
