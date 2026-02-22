import { ApiSchemas } from "@/shared/schema";

export const getIndex = (arr: ApiSchemas["ActiveTraining"]["exercises"]) => {
  const index = arr.findIndex((ex) => {
    const doneSetsCount = ex.sets.filter((set) => set.done).length;
    console.log(doneSetsCount, ex.sets.length);
    return doneSetsCount !== ex.sets.length;
  });
  console.log(index);
  return index;
};
