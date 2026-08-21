const RESOURCE_TIMEOUT_MS = 7000;
const resourceJobs = new Map();

function withDeadline(task, timeoutMs = RESOURCE_TIMEOUT_MS) {
  return new Promise((resolve) => {
    let settled = false;
    const finish = (outcome) => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timer);
      resolve(outcome);
    };
    const timer = window.setTimeout(() => finish({ status: "timeout" }), timeoutMs);

    Promise.resolve()
      .then(task)
      .then(() => finish({ status: "ready" }))
      .catch(() => finish({ status: "error" }));
  });
}

function decodeImage(url) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    let settled = false;
    const finish = (callback) => {
      if (settled) return;
      settled = true;
      image.onload = null;
      image.onerror = null;
      callback();
    };
    const decode = () => {
      const decoded = typeof image.decode === "function" ? image.decode() : Promise.resolve();
      decoded.then(
        () => finish(resolve),
        () => finish(reject),
      );
    };

    image.decoding = "async";
    image.fetchPriority = "low";
    image.onload = decode;
    image.onerror = () => finish(reject);
    image.src = url;
    if (image.complete && image.naturalWidth > 0) queueMicrotask(decode);
  });
}

function createResourceJob({ key, images, loaders, label }) {
  const listeners = new Set();
  const uniqueImages = [...new Set(images.filter(Boolean))];
  const tasks = [
    ...uniqueImages.map((url) => ({ run: () => decodeImage(url) })),
    ...loaders.map((loader) => ({ run: loader })),
  ];
  let snapshot = {
    key,
    progress: tasks.length ? 0 : 1,
    ready: tasks.length === 0,
    degraded: false,
    status: tasks.length ? label : "PAGE ASSETS READY",
  };
  let started = false;

  const publish = (nextSnapshot) => {
    snapshot = nextSnapshot;
    listeners.forEach((listener) => listener(snapshot));
  };
  const start = () => {
    if (started || !tasks.length) return;
    started = true;
    let completed = 0;
    let failures = 0;

    tasks.forEach((task) => {
      withDeadline(task.run).then((outcome) => {
        completed += 1;
        if (outcome.status !== "ready") failures += 1;
        const ready = completed === tasks.length;
        publish({
          key,
          progress: completed / tasks.length,
          ready,
          degraded: failures > 0,
          status: ready
            ? failures > 0 ? `PAGE ASSETS READY / ${failures} FALLBACK` : "PAGE ASSETS READY"
            : `${label} / ${completed} OF ${tasks.length}`,
        });
      });
    });
  };

  return {
    key,
    subscribe(listener) {
      listeners.add(listener);
      listener(snapshot);
      start();
      return () => listeners.delete(listener);
    },
  };
}

export function subscribeCriticalResources(options, listener) {
  let job = resourceJobs.get(options.key);
  if (!job) {
    job = createResourceJob(options);
    resourceJobs.set(options.key, job);
  }
  return job.subscribe(listener);
}
