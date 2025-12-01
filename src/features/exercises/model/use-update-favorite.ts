import { rqClient } from "@/shared/api/instance";
import { useQueryClient } from "@tanstack/react-query";
import { startTransition, useOptimistic } from "react";

export function useUpdateFavorite() {
  const queryClient = useQueryClient();

  const [favorite, setFavorite] = useOptimistic<Record<string, boolean>>({});

  const updateFavoriteMutation = rqClient.useMutation(
    "put",
    "/exercises/{exerciseId}",
    {
      onSettled: async () => {
        await queryClient.invalidateQueries(
          rqClient.queryOptions("get", "/exercises"),
        );
      },
    },
  );

  const toggle = (exercises: { id: string; favorite: boolean }) => {
    startTransition(async () => {
      setFavorite((prev) => ({
        ...prev,
        [exercises.id]: !exercises.favorite,
      }));
      await updateFavoriteMutation.mutateAsync({
        params: { path: { exerciseId: exercises.id } },
        body: { favorite: !exercises.favorite },
      });
    });
  };

  const isOptimisticFavorite = (exercises: { id: string; favorite: boolean }) =>
    favorite[exercises.id] ?? exercises.favorite;

  return {
    toggle,
    isOptimisticFavorite,
  };
}
