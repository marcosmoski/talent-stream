import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getDataProvider } from "@/lib/dataProvider";
import type { Job, JobInsert, JobStatus } from "@/lib/jobs";
import { queryKeys } from "./keys";

export function useJobs() {
  return useQuery({
    queryKey: queryKeys.jobs,
    queryFn: () => getDataProvider().listJobs(),
  });
}

export function useSaveJob() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ input, id }: { input: JobInsert; id?: string }) =>
      getDataProvider().saveJob(input, id),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.jobs }),
  });
}

export function useSetJobStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: JobStatus }) =>
      getDataProvider().setJobStatus(id, status),
    onMutate: async ({ id, status }) => {
      await qc.cancelQueries({ queryKey: queryKeys.jobs });
      const prev = qc.getQueryData<Job[]>(queryKeys.jobs);
      qc.setQueryData<Job[]>(queryKeys.jobs, (old) =>
        old?.map((j) => (j.id === id ? { ...j, status } : j)),
      );
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(queryKeys.jobs, ctx.prev);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: queryKeys.jobs }),
  });
}

export function useDeleteJob() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => getDataProvider().deleteJob(id),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: queryKeys.jobs });
      const prev = qc.getQueryData<Job[]>(queryKeys.jobs);
      qc.setQueryData<Job[]>(queryKeys.jobs, (old) =>
        old?.filter((j) => j.id !== id),
      );
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(queryKeys.jobs, ctx.prev);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: queryKeys.jobs }),
  });
}
