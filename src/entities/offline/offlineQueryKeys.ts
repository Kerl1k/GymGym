export const activeTrainingKey = ["get", "/api/active-training", { params: {} }] as const;

export function trainingByIdKey(id: string) {
  return ["get", "/api/training/{id}", { params: { path: { id } } }] as const;
}

export function trainingHistoryByIdKey(id: string) {
  return ["get", "/api/training-history/{id}", { params: { path: { id } } }] as const;
}
