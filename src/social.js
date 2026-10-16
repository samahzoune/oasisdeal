// OAuth, token storage, publishing, and scheduled delivery for OasisDeal.
// Secrets are read from Cloudflare Worker env and never returned to clients.

const DEFAULT_ALLOWED_ORIGINS = ['https://oasisdeal.com', 'http://localhost:4173'];
const SESSION_COOKIE = 'od_social_session';
const META_DEFAULT_SCOPES = [
  'pages_show_list',
  'pages_read_engagement',
  'pages_manage_posts',
  'instagram_basic',
  'instagram_content_publish'
];

class SocialError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.status = status;
  }
}

function allowedOrigins(env) {
  return String(env.SOCIAL_ALLOWED_ORIGINS || DEFAULT_ALLOWED_ORIGINS.join(','))
    .split(',')
    .map(value => value.trim())
    .filter(Boolean);
}

function corsHeaders(request, env) {
  const origin = request.headers.get('Origin');
  const headers = {
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '600',
    'Cache-Control': 'no-store'
  };
  if (origin && allowedOrigins(env).includes(origin)) {
    headers['Access-Control-Allow-Origin'] = origin;
    headers['Access-Control-Allow-Credentials'] = 'true';
    headers.Vary = 'Origin';
  }
  return headers;
}

function json(value, status, request, env, extraHeaders = {}) {
  return new Response(JSON.stringify(value), {
    status: status || 200,
    headers: { 'Content-Type': 'application/json; charset=utf-8', ...corsHeaders(request, env), ...extraHeaders }
  });
}

function withCors(response, request, env) {
  const headers = new Headers(response.headers);
  for (const [key, value] of Object.entries(corsHeaders(request, env))) headers.set(key, value);
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}

function base64Url(bytes) {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function fromBase64Url(value) {
  const padded = String(value).replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((String(value).length + 3) % 4);
  const binary = atob(padded);
  return Uint8Array.from(binary, char => char.charCodeAt(0));
}

function encode(value) {
  return base64Url(new TextEncoder().encode(value));
}

function decode(value) {
  return new TextDecoder().decode(fromBase64Url(value));
}

async function hmac(value, secret) {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  return base64Url(new Uint8Array(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(value))));
}

function constantTimeEqual(left, right) {
  if (!left || !right || left.length !== right.length) return false;
  let result = 0;
  for (let index = 0; index < left.length; index++) result |= left.charCodeAt(index) ^ right.charCodeAt(index);
  return result === 0;
}

async function signedPayload(payload, secret) {
  if (!secret) throw new SocialError('Social session secret is not configured.', 503);
  const body = encode(JSON.stringify(payload));
  return `${body}.${await hmac(body, secret)}`;
}

async function readSignedPayload(value, secret) {
  if (!value || !secret) return null;
  const separator = value.lastIndexOf('.');
  if (separator < 1) return null;
  const body = value.slice(0, separator);
  const signature = value.slice(separator + 1);
  const expected = await hmac(body, secret);
  if (!constantTimeEqual(signature, expected)) return null;
  try {
    const payload = JSON.parse(decode(body));
    if (!payload.exp || payload.exp < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

function getCookie(request, name) {
  const cookie = request.headers.get('Cookie') || '';
  const match = cookie.split(';').map(value => value.trim()).find(value => value.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.slice(name.length + 1)) : '';
}

async function getSession(request, env) {
  const bearer = request.headers.get('Authorization') || '';
  const token = bearer.startsWith('Bearer ') ? bearer.slice(7) : getCookie(request, SESSION_COOKIE);
  return readSignedPayload(token, env.SOCIAL_SESSION_SECRET);
}

function requireDb(env) {
  if (!env.SOCIAL_DB) throw new SocialError('Social database is not configured yet.', 503);
  return env.SOCIAL_DB;
}

function requireEncryptionKey(env) {
  if (!env.SOCIAL_TOKEN_ENCRYPTION_KEY) throw new SocialError('Social token encryption key is not configured yet.', 503);
  const key = fromBase64Url(env.SOCIAL_TOKEN_ENCRYPTION_KEY);
  if (key.length !== 32) throw new SocialError('Social token encryption key must decode to 32 bytes.', 503);
  return key;
}

async function encryptToken(value, env) {
  const key = await crypto.subtle.importKey('raw', requireEncryptionKey(env), { name: 'AES-GCM' }, false, ['encrypt']);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ciphertext = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, new TextEncoder().encode(value)));
  return `v1.${base64Url(iv)}.${base64Url(ciphertext)}`;
}

async function decryptToken(value, env) {
  if (!value) return '';
  const parts = String(value).split('.');
  if (parts.length !== 3 || parts[0] !== 'v1') throw new SocialError('Stored social token format is invalid.', 500);
  const key = await crypto.subtle.importKey('raw', requireEncryptionKey(env), { name: 'AES-GCM' }, false, ['decrypt']);
  const plaintext = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: fromBase64Url(parts[1]) }, key, fromBase64Url(parts[2]));
  return new TextDecoder().decode(plaintext);
}

function callbackUrl(request, platform, env) {
  const base = String(env.SOCIAL_PUBLIC_BASE_URL || new URL(request.url).origin).replace(/\/$/, '');
  return `${base}/api/social/callback/${platform}`;
}

function safeReturnTo(value, env) {
  const fallback = String(env.SOCIAL_DASHBOARD_URL || 'http://localhost:4173/');
  if (!value) return fallback;
  try {
    const candidate = new URL(value);
    if (!allowedOrigins(env).includes(candidate.origin)) return fallback;
    return candidate.toString();
  } catch {
    return fallback;
  }
}

function redirectTo(returnTo, params = {}) {
  const target = new URL(returnTo);
  const hash = new URLSearchParams(params).toString();
  target.hash = hash;
  return Response.redirect(target.toString(), 302);
}

function providerConfig(platform, env) {
  const version = String(env.META_GRAPH_VERSION || 'v24.0');
  if (platform === 'meta') {
    return {
      clientId: env.META_APP_ID,
      clientSecret: env.META_APP_SECRET,
      authUrl: `https://www.facebook.com/${version}/dialog/oauth`,
      tokenUrl: `https://graph.facebook.com/${version}/oauth/access_token`,
      scopes: String(env.META_OAUTH_SCOPES || META_DEFAULT_SCOPES.join(','))
    };
  }
  if (platform === 'pinterest') {
    return {
      clientId: env.PINTEREST_APP_ID,
      clientSecret: env.PINTEREST_APP_SECRET,
      authUrl: 'https://www.pinterest.com/oauth/',
      tokenUrl: 'https://api.pinterest.com/v5/oauth/token',
      scopes: String(env.PINTEREST_OAUTH_SCOPES || 'boards:read,boards:write,pins:read,pins:write,user_accounts:read')
    };
  }
  if (platform === 'tiktok') {
    return {
      clientId: env.TIKTOK_CLIENT_KEY,
      clientSecret: env.TIKTOK_CLIENT_SECRET,
      authUrl: 'https://www.tiktok.com/v2/auth/authorize/',
      tokenUrl: 'https://open.tiktokapis.com/v2/oauth/token/',
      scopes: String(env.TIKTOK_OAUTH_SCOPES || 'user.info.basic,video.publish')
    };
  }
  throw new SocialError('Unsupported social platform.', 404);
}

function ensureClient(config) {
  if (!config.clientId || !config.clientSecret) throw new SocialError('This social platform is not configured yet.', 503);
}

async function apiJson(url, options = {}) {
  const response = await fetch(url, options);
  const data = await response.json().catch(() => ({}));
  if (!response.ok || data.error) {
    const message = data.error?.message || data.error_description || data.message || `Remote API returned ${response.status}.`;
    throw new SocialError(message, response.status >= 500 ? 502 : 400);
  }
  return data;
}

async function beginOAuth(request, env, platform) {
  const config = providerConfig(platform, env);
  ensureClient(config);
  const existing = await getSession(request, env);
  const ownerId = existing?.ownerId || crypto.randomUUID();
  const requestUrl = new URL(request.url);
  const returnTo = safeReturnTo(requestUrl.searchParams.get('return_to'), env);
  const state = await signedPayload({ platform, ownerId, returnTo, exp: Date.now() + 10 * 60 * 1000, nonce: crypto.randomUUID() }, env.SOCIAL_SESSION_SECRET);
  const redirect = new URL(config.authUrl);
  redirect.searchParams.set('client_id', config.clientId);
  redirect.searchParams.set('redirect_uri', callbackUrl(request, platform, env));
  redirect.searchParams.set('response_type', 'code');
  redirect.searchParams.set('state', state);
  redirect.searchParams.set('scope', config.scopes);
  return Response.redirect(redirect.toString(), 302);
}

async function exchangeMeta(code, redirectUri, env) {
  const config = providerConfig('meta', env);
  const first = await apiJson(`${config.tokenUrl}?${new URLSearchParams({ client_id: config.clientId, client_secret: config.clientSecret, redirect_uri: redirectUri, code })}`);
  const version = String(env.META_GRAPH_VERSION || 'v24.0');
  const longLived = await apiJson(`https://graph.facebook.com/${version}/oauth/access_token?${new URLSearchParams({ grant_type: 'fb_exchange_token', client_id: config.clientId, client_secret: config.clientSecret, fb_exchange_token: first.access_token })}`);
  const userToken = longLived.access_token || first.access_token;
  const accounts = await apiJson(`https://graph.facebook.com/${version}/me/accounts?fields=id,name,access_token,instagram_business_account&access_token=${encodeURIComponent(userToken)}`);
  const selected = (accounts.data || []).find(page => env.META_PAGE_ID && String(page.id) === String(env.META_PAGE_ID)) || ((accounts.data || []).length === 1 ? accounts.data[0] : null);
  if (!selected) throw new SocialError('Meta returned multiple Pages. Configure META_PAGE_ID before connecting.', 400);
  const connections = [{
    platform: 'facebook',
    accountId: String(selected.id),
    accountName: selected.name || 'Facebook Page',
    accessToken: selected.access_token,
    expiresAt: longLived.expires_in ? Date.now() + Number(longLived.expires_in) * 1000 : null,
    metadata: { pageId: String(selected.id), pageName: selected.name || '' }
  }];
  const igId = selected.instagram_business_account?.id;
  if (igId) connections.push({
    platform: 'instagram',
    accountId: String(igId),
    accountName: 'Instagram professional account',
    accessToken: selected.access_token,
    expiresAt: longLived.expires_in ? Date.now() + Number(longLived.expires_in) * 1000 : null,
    metadata: { pageId: String(selected.id), instagramUserId: String(igId), pageName: selected.name || '' }
  });
  return connections;
}

async function exchangePinterest(code, redirectUri, env) {
  const config = providerConfig('pinterest', env);
  const basic = btoa(`${config.clientId}:${config.clientSecret}`);
  const token = await apiJson(config.tokenUrl, {
    method: 'POST',
    headers: { Authorization: `Basic ${basic}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'authorization_code', code, redirect_uri: redirectUri }).toString()
  });
  const account = await apiJson('https://api.pinterest.com/v5/user_account', { headers: { Authorization: `Bearer ${token.access_token}` } });
  const boards = await apiJson('https://api.pinterest.com/v5/boards?page_size=100', { headers: { Authorization: `Bearer ${token.access_token}` } });
  return [{
    platform: 'pinterest',
    accountId: String(account.username || account.id || 'pinterest'),
    accountName: account.username || account.business_name || 'Pinterest account',
    accessToken: token.access_token,
    refreshToken: token.refresh_token || '',
    expiresAt: token.expires_in ? Date.now() + Number(token.expires_in) * 1000 : null,
    metadata: { boards: (boards.items || []).map(board => ({ id: String(board.id), name: board.name || '' })) }
  }];
}

async function exchangeTikTok(code, redirectUri, env) {
  const config = providerConfig('tiktok', env);
  const token = await apiJson(config.tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ client_key: config.clientId, client_secret: config.clientSecret, code, grant_type: 'authorization_code', redirect_uri: redirectUri }).toString()
  });
  let profile = {};
  try {
    profile = await apiJson('https://open.tiktokapis.com/v2/user/info/?fields=open_id,display_name,avatar_url', { headers: { Authorization: `Bearer ${token.access_token}` } });
  } catch {
    // The connection remains usable if profile fields are not approved yet.
  }
  const user = profile.data?.user || {};
  return [{
    platform: 'tiktok',
    accountId: String(token.open_id || user.open_id || 'tiktok'),
    accountName: user.display_name || 'TikTok account',
    accessToken: token.access_token,
    refreshToken: token.refresh_token || '',
    expiresAt: token.expires_in ? Date.now() + Number(token.expires_in) * 1000 : null,
    metadata: { openId: String(token.open_id || user.open_id || '') }
  }];
}

async function upsertConnection(env, ownerId, connection) {
  const db = requireDb(env);
  const now = new Date().toISOString();
  await db.prepare(`INSERT INTO social_connections (owner_id, platform, account_id, account_name, access_token, refresh_token, expires_at, metadata_json, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(owner_id, platform) DO UPDATE SET account_id=excluded.account_id, account_name=excluded.account_name,
      access_token=excluded.access_token, refresh_token=excluded.refresh_token, expires_at=excluded.expires_at,
      metadata_json=excluded.metadata_json, updated_at=excluded.updated_at`)
    .bind(ownerId, connection.platform, connection.accountId, connection.accountName, await encryptToken(connection.accessToken, env), connection.refreshToken ? await encryptToken(connection.refreshToken, env) : null, connection.expiresAt ? new Date(connection.expiresAt).toISOString() : null, JSON.stringify(connection.metadata || {}), now, now)
    .run();
}

async function handleCallback(request, env, platform) {
  const url = new URL(request.url);
  const state = await readSignedPayload(url.searchParams.get('state'), env.SOCIAL_SESSION_SECRET);
  const code = url.searchParams.get('code');
  if (!state || state.platform !== platform) throw new SocialError('OAuth state expired. Please start the connection again.', 400);
  if (!code) throw new SocialError('OAuth authorization was not completed.', 400);
  const redirectUri = callbackUrl(request, platform, env);
  let connections;
  if (platform === 'meta') connections = await exchangeMeta(code, redirectUri, env);
  if (platform === 'pinterest') connections = await exchangePinterest(code, redirectUri, env);
  if (platform === 'tiktok') connections = await exchangeTikTok(code, redirectUri, env);
  for (const connection of connections || []) await upsertConnection(env, state.ownerId, connection);
  const session = await signedPayload({ ownerId: state.ownerId, exp: Date.now() + 7 * 24 * 60 * 60 * 1000 }, env.SOCIAL_SESSION_SECRET);
  const response = redirectTo(state.returnTo, { social_connected: connections?.map(item => item.platform).join(',') || platform, social_session: session });
  response.headers.append('Set-Cookie', `${SESSION_COOKIE}=${encodeURIComponent(session)}; Max-Age=604800; Path=/; HttpOnly; Secure; SameSite=None`);
  return response;
}

async function readConnection(env, ownerId, platform) {
  const row = await requireDb(env).prepare('SELECT * FROM social_connections WHERE owner_id = ? AND platform = ?').bind(ownerId, platform).first();
  if (!row) return null;
  const accessToken = await decryptToken(row.access_token, env);
  const refreshToken = row.refresh_token ? await decryptToken(row.refresh_token, env) : '';
  return { ...row, accessToken, refreshToken, metadata: JSON.parse(row.metadata_json || '{}') };
}

async function listConnections(env, ownerId) {
  const result = await requireDb(env).prepare('SELECT platform, account_id, account_name, expires_at, metadata_json, updated_at FROM social_connections WHERE owner_id = ? ORDER BY platform').bind(ownerId).all();
  return (result.results || []).map(row => ({ platform: row.platform, accountId: row.account_id, accountName: row.account_name, expiresAt: row.expires_at, metadata: JSON.parse(row.metadata_json || '{}'), updatedAt: row.updated_at }));
}

async function refreshConnectionIfNeeded(env, connection) {
  if (!connection.expires_at || new Date(connection.expires_at).getTime() > Date.now() + 5 * 60 * 1000) return connection;
  if (!connection.refreshToken) return connection;
  let token;
  if (connection.platform === 'pinterest') {
    const config = providerConfig('pinterest', env);
    token = await apiJson(config.tokenUrl, {
      method: 'POST',
      headers: { Authorization: `Basic ${btoa(`${config.clientId}:${config.clientSecret}`)}`, 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ grant_type: 'refresh_token', refresh_token: connection.refreshToken }).toString()
    });
  } else if (connection.platform === 'tiktok') {
    const config = providerConfig('tiktok', env);
    token = await apiJson(config.tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ client_key: config.clientId, client_secret: config.clientSecret, grant_type: 'refresh_token', refresh_token: connection.refreshToken }).toString()
    });
  } else {
    return connection;
  }
  connection.accessToken = token.access_token;
  connection.refreshToken = token.refresh_token || connection.refreshToken;
  connection.expires_at = token.expires_in ? new Date(Date.now() + Number(token.expires_in) * 1000).toISOString() : connection.expires_at;
  const now = new Date().toISOString();
  await requireDb(env).prepare('UPDATE social_connections SET access_token = ?, refresh_token = ?, expires_at = ?, updated_at = ? WHERE owner_id = ? AND platform = ?')
    .bind(await encryptToken(connection.accessToken, env), connection.refreshToken ? await encryptToken(connection.refreshToken, env) : null, connection.expires_at, now, connection.owner_id, connection.platform).run();
  return connection;
}

function fullCaption(post) {
  const text = [post.caption, post.hashtags].filter(Boolean).join('\n\n').trim();
  return post.link ? `${text}${text ? '\n\n' : ''}${post.link}` : text;
}

function requireHttpsUrl(value) {
  let url;
  try { url = new URL(String(value)); } catch { throw new SocialError('A public HTTPS media URL is required.', 400); }
  if (url.protocol !== 'https:') throw new SocialError('A public HTTPS media URL is required.', 400);
  return url.toString();
}

async function publishFacebook(connection, post, env) {
  const version = String(env.META_GRAPH_VERSION || 'v24.0');
  const pageId = connection.metadata.pageId || connection.account_id;
  const body = new URLSearchParams({ url: requireHttpsUrl(post.media_url), caption: fullCaption(post), access_token: connection.accessToken });
  const data = await apiJson(`https://graph.facebook.com/${version}/${pageId}/photos`, { method: 'POST', body });
  return String(data.post_id || data.id || '');
}

async function publishInstagram(connection, post, env) {
  const version = String(env.META_GRAPH_VERSION || 'v24.0');
  const igId = connection.metadata.instagramUserId || connection.account_id;
  const media = await apiJson(`https://graph.facebook.com/${version}/${igId}/media`, {
    method: 'POST',
    body: new URLSearchParams({ image_url: requireHttpsUrl(post.media_url), caption: fullCaption(post), access_token: connection.accessToken })
  });
  const published = await apiJson(`https://graph.facebook.com/${version}/${igId}/media_publish`, {
    method: 'POST',
    body: new URLSearchParams({ creation_id: media.id, access_token: connection.accessToken })
  });
  return String(published.id || media.id || '');
}

async function publishPinterest(connection, post, env) {
  const boardId = env.PINTEREST_BOARD_ID || connection.metadata.boardId || (connection.metadata.boards || []).length === 1 && connection.metadata.boards[0].id;
  if (!boardId) throw new SocialError('Configure PINTEREST_BOARD_ID before publishing.', 400);
  const data = await apiJson('https://api.pinterest.com/v5/pins', {
    method: 'POST',
    headers: { Authorization: `Bearer ${connection.accessToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      board_id: String(boardId),
      title: String(post.title || '').slice(0, 100),
      description: fullCaption(post).slice(0, 800),
      link: post.link || 'https://oasisdeal.com',
      media_source: { source_type: 'image_url', url: requireHttpsUrl(post.media_url), is_standard: true }
    })
  });
  return String(data.id || '');
}

async function publishTikTok(connection, post) {
  const headers = { Authorization: `Bearer ${connection.accessToken}`, 'Content-Type': 'application/json; charset=UTF-8' };
  const creator = await apiJson('https://open.tiktokapis.com/v2/post/publish/creator_info/query/', { method: 'POST', headers, body: '{}' });
  const options = creator.data?.privacy_level_options || ['SELF_ONLY'];
  const privacy = options.includes('PUBLIC_TO_EVERYONE') ? 'PUBLIC_TO_EVERYONE' : options[0];
  const data = await apiJson('https://open.tiktokapis.com/v2/post/publish/content/init/', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      post_info: { title: String(post.title || '').slice(0, 90), description: fullCaption(post).slice(0, 4000), privacy_level: privacy, brand_organic_toggle: true, auto_add_music: true },
      source_info: { source: 'PULL_FROM_URL', photo_cover_index: 0, photo_images: [requireHttpsUrl(post.media_url)] },
      post_mode: 'DIRECT_POST',
      media_type: 'PHOTO'
    })
  });
  return String(data.data?.publish_id || '');
}

async function publishPost(env, post, connection) {
  const current = await refreshConnectionIfNeeded(env, connection);
  if (post.platform === 'facebook') return publishFacebook(current, post, env);
  if (post.platform === 'instagram') return publishInstagram(current, post, env);
  if (post.platform === 'pinterest') return publishPinterest(current, post, env);
  if (post.platform === 'tiktok') return publishTikTok(current, post, env);
  throw new SocialError('Unsupported social platform.', 400);
}

function cleanPost(data) {
  const platform = String(data.platform || '').toLowerCase();
  if (!['facebook', 'instagram', 'tiktok', 'pinterest'].includes(platform)) throw new SocialError('Unsupported social platform.', 400);
  const clientId = String(data.clientId ?? data.id ?? '').slice(0, 120);
  if (!clientId) throw new SocialError('Post id is required.', 400);
  const parsedDate = new Date(`${data.date || ''}T${data.time || '00:00'}:00`);
  if (Number.isNaN(parsedDate.getTime())) throw new SocialError('Post date is invalid.', 400);
  const scheduledAt = parsedDate.toISOString();
  return {
    clientId,
    platform,
    title: String(data.title || '').slice(0, 200),
    caption: String(data.caption || '').slice(0, 10000),
    hashtags: String(data.hashtags || '').slice(0, 3000),
    link: String(data.link || 'https://oasisdeal.com').slice(0, 2000),
    mediaUrl: requireHttpsUrl(data.mediaUrl || data.image),
    scheduledAt,
    autoPublish: data.auto !== false && data.autoPublish !== false
  };
}

async function savePost(env, ownerId, data) {
  const post = cleanPost(data);
  const now = new Date().toISOString();
  const db = requireDb(env);
  await db.prepare(`INSERT INTO social_posts (owner_id, client_id, platform, title, caption, hashtags, link, media_url, scheduled_at, status, attempts, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?)
    ON CONFLICT(owner_id, client_id) DO UPDATE SET platform=excluded.platform, title=excluded.title, caption=excluded.caption,
      hashtags=excluded.hashtags, link=excluded.link, media_url=excluded.media_url, scheduled_at=excluded.scheduled_at,
      status=CASE WHEN social_posts.status = 'published' THEN social_posts.status ELSE 'scheduled' END, updated_at=excluded.updated_at`)
    .bind(ownerId, post.clientId, post.platform, post.title, post.caption, post.hashtags, post.link, post.mediaUrl, post.scheduledAt, post.autoPublish ? 'scheduled' : 'draft', now, now)
    .run();
  return post;
}

async function publishOne(env, row) {
  const db = requireDb(env);
  const claimed = await db.prepare(`UPDATE social_posts SET status = 'publishing', attempts = attempts + 1, updated_at = ? WHERE id = ? AND status = 'scheduled'`).bind(new Date().toISOString(), row.id).run();
  if (!claimed.meta?.changes) return { skipped: true };
  try {
    const connection = await readConnection(env, row.owner_id, row.platform);
    if (!connection) throw new SocialError(`No ${row.platform} connection is available.`, 400);
    const externalId = await publishPost(env, row, connection);
    await db.prepare(`UPDATE social_posts SET status = 'published', external_id = ?, last_error = NULL, published_at = ?, updated_at = ? WHERE id = ?`)
      .bind(externalId, new Date().toISOString(), new Date().toISOString(), row.id).run();
    return { published: true, externalId };
  } catch (error) {
    const message = String(error?.message || 'Publishing failed.').slice(0, 1000);
    await db.prepare(`UPDATE social_posts SET status = 'failed', last_error = ?, updated_at = ? WHERE id = ?`).bind(message, new Date().toISOString(), row.id).run();
    return { published: false, error: message };
  }
}

export async function runSocialScheduler(env) {
  if (!env.SOCIAL_DB) return { skipped: true, reason: 'database-not-configured' };
  const now = new Date().toISOString();
  const result = await env.SOCIAL_DB.prepare(`SELECT * FROM social_posts WHERE status = 'scheduled' AND scheduled_at <= ? ORDER BY scheduled_at LIMIT 25`).bind(now).all();
  const results = [];
  for (const row of result.results || []) results.push(await publishOne(env, row));
  return { processed: results.length, results };
}

async function requireSession(request, env) {
  const session = await getSession(request, env);
  if (!session?.ownerId) throw new SocialError('Connectez-vous à votre espace social avant de continuer.', 401);
  return session;
}

export async function handleSocialRequest(request, env) {
  const url = new URL(request.url);
  if (!url.pathname.startsWith('/api/social/')) return null;
  if (request.method === 'OPTIONS') return json({}, 204, request, env);
  try {
    const parts = url.pathname.split('/').filter(Boolean);
    const action = parts[2] || '';
    const platform = parts[3] || '';
    // Await async route handlers so their failures stay inside this try/catch
    // and become a useful JSON error instead of an uncaught Worker 1101.
    if (request.method === 'GET' && action === 'connect') return await beginOAuth(request, env, platform);
    if (request.method === 'GET' && action === 'callback') return await handleCallback(request, env, platform);
    const session = await requireSession(request, env);
    if (request.method === 'GET' && action === 'status') return json({ ok: true, connections: await listConnections(env, session.ownerId) }, 200, request, env);
    if (request.method === 'POST' && action === 'posts') {
      const body = await request.json().catch(() => null);
      const items = Array.isArray(body?.posts) ? body.posts : [body];
      const saved = [];
      for (const item of items) if (item) saved.push(await savePost(env, session.ownerId, item));
      return json({ ok: true, saved: saved.length }, 200, request, env);
    }
    if (request.method === 'POST' && action === 'publish') {
      const body = await request.json().catch(() => null);
      const clientId = String(body?.clientId || body?.id || '');
      const row = await requireDb(env).prepare('SELECT * FROM social_posts WHERE owner_id = ? AND client_id = ?').bind(session.ownerId, clientId).first();
      if (!row) throw new SocialError('Post not found.', 404);
      await requireDb(env).prepare("UPDATE social_posts SET status = 'scheduled', scheduled_at = ? WHERE id = ?").bind(new Date().toISOString(), row.id).run();
      const result = await publishOne(env, { ...row, status: 'scheduled' });
      return json({ ok: Boolean(result.published), ...result }, result.published ? 200 : 502, request, env);
    }
    throw new SocialError('Social route not found.', 404);
  } catch (error) {
    const status = error instanceof SocialError ? error.status : 500;
    return json({ ok: false, error: status >= 500 ? 'Social service is temporarily unavailable.' : String(error.message || 'Request failed.') }, status, request, env);
  }
}
