// Helper Node do vault-entrypoint: resolve o token e imprime os segredos do KV v2
// como linhas `KEY='value'`. Silencioso (exit 0) se não der.
//
//   dev  → VAULT_TOKEN (token estático).
//   prod → VAULT_ROLE + VAULT_AUTH (método por cloud): aws | azure | gcp.
//          • aws   → assina sts:GetCallerIdentity (sigv4) com a IAM role da task.
//          • azure → JWT da Managed Identity (IMDS) + metadata → auth/azure/login.
//          • gcp   → identity token do metadata server → auth/gcp/login.
import crypto from 'node:crypto';

const addr = process.env.VAULT_ADDR;
const path = process.env.VAULT_SECRET_PATH;
const staticToken = process.env.VAULT_TOKEN;
const role = process.env.VAULT_ROLE;
const method = process.env.VAULT_AUTH || 'aws';
const region = process.env.AWS_REGION || 'us-east-1';

if (!addr || !path) process.exit(0);
if (!staticToken && !role) process.exit(0);

const TIMEOUT = 8000;
async function http(url, opts = {}) {
  const ac = new AbortController();
  const t = setTimeout(() => ac.abort(), opts.timeout || TIMEOUT);
  try {
    return await fetch(url, { ...opts, signal: ac.signal });
  } finally {
    clearTimeout(t);
  }
}

// ── AWS IAM ────────────────────────────────────────────────────────────────
const hmac = (key, data) => crypto.createHmac('sha256', key).update(data).digest();
const sha256hex = (data) => crypto.createHash('sha256').update(data).digest('hex');

async function awsCreds() {
  if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
    return { accessKeyId: process.env.AWS_ACCESS_KEY_ID, secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY, sessionToken: process.env.AWS_SESSION_TOKEN };
  }
  const rel = process.env.AWS_CONTAINER_CREDENTIALS_RELATIVE_URI;
  const url = rel ? `http://169.254.170.2${rel}` : process.env.AWS_CONTAINER_CREDENTIALS_FULL_URI;
  if (!url) throw new Error('sem credenciais AWS');
  const j = await (await http(url)).json();
  return { accessKeyId: j.AccessKeyId, secretAccessKey: j.SecretAccessKey, sessionToken: j.Token };
}

async function loginAws() {
  const creds = await awsCreds();
  const host = `sts.${region}.amazonaws.com`;
  const body = 'Action=GetCallerIdentity&Version=2011-06-15';
  const amzDate = new Date().toISOString().replace(/[:-]|\.\d{3}/g, '');
  const dateStamp = amzDate.slice(0, 8);
  const headers = { 'content-type': 'application/x-www-form-urlencoded; charset=utf-8', host, 'x-amz-date': amzDate };
  if (creds.sessionToken) headers['x-amz-security-token'] = creds.sessionToken;
  // ordem de BYTES (exigida pelo SigV4) com compare explícito — NÃO usar localeCompare (colação de locale quebraria a assinatura).
  const keys = Object.keys(headers).sort((a, b) => (a < b ? -1 : Number(a > b))); // -1|0|1 (ternário único, sem aninhar)
  const signed = keys.join(';');
  const canonHeaders = keys.map((k) => `${k}:${headers[k]}\n`).join('');
  const canon = ['POST', '/', '', canonHeaders, signed, sha256hex(body)].join('\n');
  const scope = `${dateStamp}/${region}/sts/aws4_request`;
  const sts = ['AWS4-HMAC-SHA256', amzDate, scope, sha256hex(canon)].join('\n');
  let sk = hmac(`AWS4${creds.secretAccessKey}`, dateStamp);
  sk = hmac(sk, region); sk = hmac(sk, 'sts'); sk = hmac(sk, 'aws4_request');
  const sig = crypto.createHmac('sha256', sk).update(sts).digest('hex');
  const authz = `AWS4-HMAC-SHA256 Credential=${creds.accessKeyId}/${scope}, SignedHeaders=${signed}, Signature=${sig}`;
  const headerMap = {};
  for (const [k, v] of Object.entries({ ...headers, authorization: authz })) headerMap[k] = [String(v)];
  const payload = {
    role,
    iam_http_request_method: 'POST',
    iam_request_url: Buffer.from(`https://${host}/`).toString('base64'),
    iam_request_body: Buffer.from(body).toString('base64'),
    iam_request_headers: Buffer.from(JSON.stringify(headerMap)).toString('base64'),
  };
  const r = await http(`${addr}/v1/auth/aws/login`, { method: 'POST', body: JSON.stringify(payload) });
  if (!r.ok) throw new Error(`aws login HTTP ${r.status}`);
  return (await r.json()).auth.client_token;
}

// ── Azure (Managed Identity via IMDS) ────────────────────────────────────────
async function loginAzure() {
  const imds = 'http://169.254.169.254/metadata';
  const tok = await (await http(`${imds}/identity/oauth2/token?api-version=2018-02-01&resource=https://management.azure.com/`, { headers: { Metadata: 'true' } })).json();
  const inst = await (await http(`${imds}/instance?api-version=2021-02-01`, { headers: { Metadata: 'true' } })).json();
  const c = inst.compute || {};
  const payload = { role, jwt: tok.access_token, subscription_id: c.subscriptionId, resource_group_name: c.resourceGroupName, vm_name: c.name };
  if (c.vmScaleSetName) payload.vmss_name = c.vmScaleSetName;
  const r = await http(`${addr}/v1/auth/azure/login`, { method: 'POST', body: JSON.stringify(payload) });
  if (!r.ok) throw new Error(`azure login HTTP ${r.status}`);
  return (await r.json()).auth.client_token;
}

// ── GCP (GCE identity token via metadata server) ─────────────────────────────
async function loginGcp() {
  const aud = `vault/${role}`;
  const jwt = await (await http(`http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/identity?audience=${encodeURIComponent(aud)}&format=full`, { headers: { 'Metadata-Flavor': 'Google' } })).text();
  const r = await http(`${addr}/v1/auth/gcp/login`, { method: 'POST', body: JSON.stringify({ role, jwt }) });
  if (!r.ok) throw new Error(`gcp login HTTP ${r.status}`);
  return (await r.json()).auth.client_token;
}

async function getToken() {
  if (staticToken) return staticToken;
  if (method === 'aws') return loginAws();
  if (method === 'azure') return loginAzure();
  if (method === 'gcp') return loginGcp();
  throw new Error(`VAULT_AUTH desconhecido: ${method}`);
}

let token;
try {
  token = await getToken();
} catch (e) {
  process.stderr.write(`[vault] login (${method}) falhou: ${e.message}\n`);
  process.exit(0);
}

const res = await http(`${addr}/v1/${path}`, { headers: { 'X-Vault-Token': token } });
if (!res.ok) {
  process.stderr.write(`[vault] fetch ${path}: HTTP ${res.status}\n`);
  process.exit(0);
}
const data = (await res.json())?.data?.data ?? {};
// aspa simples dentro de '...' no shell: fecha, escapa a aspa, reabre. String.raw evita escapar a barra
// (e mora FORA do template externo → sem template literal aninhado).
const SQ = String.raw`'\''`;
for (const [key, value] of Object.entries(data)) {
  process.stdout.write(`${key}='${String(value).replaceAll("'", SQ)}'\n`);
}
