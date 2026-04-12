import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

export function useStatus() {
  return useQuery({ queryKey: ['status'], queryFn: api.getStatus });
}

export function useSessions(limit = 50, source = '') {
  return useQuery({ queryKey: ['sessions', limit, source], queryFn: () => api.getSessions(limit, source) });
}

export function useSession(id) {
  return useQuery({ queryKey: ['session', id], queryFn: () => api.getSession(id), enabled: !!id });
}

export function useDeleteSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => api.deleteSession(id),
    onSuccess: (_data, id) => {
      qc.invalidateQueries({ queryKey: ['sessions'] });
      qc.removeQueries({ queryKey: ['session', id] });
    },
  });
}

export function useSessionSearch(q) {
  return useQuery({ queryKey: ['sessionSearch', q], queryFn: () => api.searchSessions(q), enabled: !!q });
}

export function useMemory(target) {
  return useQuery({ queryKey: ['memory', target], queryFn: () => api.getMemory(target) });
}

export function useSkills() {
  return useQuery({ queryKey: ['skills'], queryFn: api.getSkills });
}

export function useSkill(name) {
  return useQuery({ queryKey: ['skill', name], queryFn: () => api.getSkill(name), enabled: !!name });
}

export function useConfig() {
  return useQuery({ queryKey: ['config'], queryFn: api.getConfig });
}

export function useEnv() {
  return useQuery({ queryKey: ['env'], queryFn: api.getEnv });
}

export function useChannels() {
  return useQuery({ queryKey: ['channels'], queryFn: api.getChannels });
}

export function useJobs() {
  return useQuery({
    queryKey: ['jobs'],
    queryFn: api.getJobs,
    refetchInterval: 10000,
  });
}

export function useJob(id) {
  return useQuery({
    queryKey: ['job', id],
    queryFn: () => api.getJob(id),
    enabled: !!id,
  });
}

function useJobMutation(mutationFn) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['jobs'] }),
  });
}

export function useCreateJob() {
  return useJobMutation((data) => api.createJob(data));
}

export function useUpdateJob() {
  return useJobMutation(({ id, data }) => api.updateJob(id, data));
}

export function useDeleteJob() {
  return useJobMutation((id) => api.deleteJob(id));
}

export function usePauseJob() {
  return useJobMutation((id) => api.pauseJob(id));
}

export function useResumeJob() {
  return useJobMutation((id) => api.resumeJob(id));
}

export function useRunJob() {
  return useJobMutation((id) => api.runJob(id));
}
