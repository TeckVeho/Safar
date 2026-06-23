const functions = require('@google-cloud/functions-framework');
const { google } = require('googleapis');

/** Short wait to catch immediate patch errors; instance start/stop may continue async. */
const OPERATION_WAIT_MS = 90_000;
const OPERATION_POLL_MS = 3000;

/**
 * HTTP Cloud Function Gen2. Query: ?action=start|stop
 * Patches Cloud SQL activationPolicy: ALWAYS (start) or NEVER (stop).
 */
functions.http('setSqlActivation', async (req, res) => {
  const projectId =
    process.env.GCP_PROJECT || process.env.GOOGLE_CLOUD_PROJECT || process.env.GCLOUD_PROJECT;
  const instance = process.env.SQL_INSTANCE;
  const action = req.query.action;

  if (!projectId || !instance) {
    res.status(500).json({ error: 'Missing GCP_PROJECT/GOOGLE_CLOUD_PROJECT or SQL_INSTANCE' });
    return;
  }

  let activationPolicy;
  if (action === 'stop') {
    activationPolicy = 'NEVER';
  } else if (action === 'start') {
    activationPolicy = 'ALWAYS';
  } else {
    res.status(400).json({ error: 'Query param action=start|stop is required' });
    return;
  }

  const auth = new google.auth.GoogleAuth({
    scopes: ['https://www.googleapis.com/auth/cloud-platform'],
  });
  const sqladmin = google.sqladmin({ version: 'v1beta4', auth });

  try {
    const patch = await sqladmin.instances.patch({
      project: projectId,
      instance,
      requestBody: {
        settings: {
          activationPolicy,
        },
      },
    });

    const opName = patch.data?.name;
    let syncComplete = false;
    if (opName) {
      const waitResult = await waitSqlOperation(sqladmin, projectId, opName, OPERATION_WAIT_MS);
      syncComplete = waitResult.ok;
      if (!waitResult.ok) {
        console.warn('Operation wait incomplete:', waitResult.error);
      }
    }

    if (!syncComplete) {
      const inst = await sqladmin.instances.get({ project: projectId, instance });
      const currentPolicy = inst.data?.settings?.activationPolicy;
      if (currentPolicy !== activationPolicy) {
        res.status(500).json({
          error: 'activationPolicy not applied',
          expected: activationPolicy,
          actual: currentPolicy,
          instance,
        });
        return;
      }
      res.status(200).json({ ok: true, instance, activationPolicy, async: true });
      return;
    }

    res.status(200).json({ ok: true, instance, activationPolicy });
  } catch (e) {
    console.error(e);
    res.status(500).json({
      error: e.message || String(e),
      instance,
      activationPolicy,
    });
  }
});

/**
 * Poll a Cloud SQL admin operation until DONE or maxMs elapses.
 * @returns {{ ok: true } | { ok: false, error: string }}
 */
async function waitSqlOperation(sqladmin, projectId, operationName, maxMs) {
  const operationId = operationName.split('/').pop();
  const deadline = Date.now() + maxMs;
  while (Date.now() < deadline) {
    const op = await sqladmin.operations.get({
      project: projectId,
      operation: operationId,
    });
    const status = op.data?.status;
    if (status === 'DONE') {
      if (op.data?.error) {
        const err = op.data.error;
        return { ok: false, error: err.message || JSON.stringify(err) };
      }
      return { ok: true };
    }
    await new Promise((r) => setTimeout(r, OPERATION_POLL_MS));
  }
  return { ok: false, error: 'Timeout waiting for Cloud SQL operation' };
}
