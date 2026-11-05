const jobs = new Map();

function createJob(type, payload) {
  const jobId = 'job_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7);
  const job = {
    id: jobId,
    type,
    status: 'QUEUED',
    progress: 0,
    payload,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  jobs.set(jobId, job);

  setImmediate(() => {
    const current = jobs.get(jobId);
    if (current) {
      current.status = 'PROCESSING';
      current.progress = 25;
      current.updatedAt = new Date().toISOString();
    }
  });

  return job;
}

function getJob(jobId) {
  return jobs.get(jobId) || null;
}

function listJobs() {
  return Array.from(jobs.values());
}

module.exports = { createJob, getJob, listJobs };
