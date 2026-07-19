/** Eagerly load all main route modules so offline navigation has chunks in cache. */
export async function prefetchProtectedRouteModules(): Promise<void> {
  if (typeof navigator !== "undefined" && navigator.onLine === false) {
    return;
  }

  await Promise.allSettled([
    import("@/features/exercises/exercises.page"),
    import("@/features/trainingList/training.page"),
    import("@/features/activeTraining/ActiveTraining.page"),
    import("@/features/profile/profile.page"),
    import("@/features/trainingStart/training-start.page"),
    import("@/features/trainingEnd/training-end.page"),
    import("@/features/trainingHistory/training-history.page"),
    import("@/features/statistics/statistics.page"),
    import("@/features/auth/login.page"),
    import("@/features/auth/register.page"),
  ]);
}
