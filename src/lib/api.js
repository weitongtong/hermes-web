const BASE = '/api';

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`${res.status}: ${body || res.statusText}`);
  }
  return res.json();
}

export const api = {
  getStatus: () => request('/status'),
  getModels: () => request('/models'),

  getSessions: (limit = 50, source = '') => {
    const params = new URLSearchParams({ limit });
    if (source) params.set('source', source);
    return request(`/sessions?${params}`);
  },
  getSession: (id) => request(`/sessions/${encodeURIComponent(id)}`),
  deleteSession: (id) => request(`/sessions/${encodeURIComponent(id)}`, { method: 'DELETE' }),
  searchSessions: (q) => request(`/sessions/search?q=${encodeURIComponent(q)}`),

  getMemory: (target) => request(`/memory/${target}`),

  getSkills: () => request('/skills'),
  getSkill: (name) => request(`/skills/${encodeURIComponent(name)}`),
  getSkillFiles: (name) => request(`/skills/${encodeURIComponent(name)}/files`),

  getConfig: () => request('/config'),
  patchConfig: (patch) => request('/config', { method: 'PATCH', body: JSON.stringify(patch) }),

  getEnv: () => request('/env'),
  putEnv: (key, value) => request(`/env/${encodeURIComponent(key)}`, { method: 'PUT', body: JSON.stringify({ value }) }),

  getChannels: () => request('/channels'),

  getJobs: () => request('/jobs?include_disabled=true'),
  getJob: (id) => request(`/jobs/${encodeURIComponent(id)}`),
  createJob: (data) => request('/jobs', { method: 'POST', body: JSON.stringify(data) }),
  updateJob: (id, data) => request(`/jobs/${encodeURIComponent(id)}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteJob: (id) => request(`/jobs/${encodeURIComponent(id)}`, { method: 'DELETE' }),
  pauseJob: (id) => request(`/jobs/${encodeURIComponent(id)}/pause`, { method: 'POST' }),
  resumeJob: (id) => request(`/jobs/${encodeURIComponent(id)}/resume`, { method: 'POST' }),
  runJob: (id) => request(`/jobs/${encodeURIComponent(id)}/run`, { method: 'POST' }),
};
