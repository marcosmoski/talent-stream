import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getDataProvider } from "@/lib/dataProvider";
import type { Candidate, CandidateInsert } from "@/lib/jobs";
import { queryKeys } from "./keys";

export function useCandidates() {
  return useQuery({
    queryKey: queryKeys.candidates,
    queryFn: () => getDataProvider().listCandidates(),
  });
}

export function useSaveCandidate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ input, id }: { input: CandidateInsert; id?: string }) =>
      getDataProvider().saveCandidate(input, id),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.candidates }),
  });
}

export function useDeleteCandidate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => getDataProvider().deleteCandidate(id),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: queryKeys.candidates });
      const prev = qc.getQueryData<Candidate[]>(queryKeys.candidates);
      qc.setQueryData<Candidate[]>(queryKeys.candidates, (old) =>
        old?.filter((c) => c.id !== id),
      );
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(queryKeys.candidates, ctx.prev);
    },
    onSettled: () =>
      qc.invalidateQueries({ queryKey: queryKeys.candidates }),
  });
}
