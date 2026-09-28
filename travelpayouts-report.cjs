#!/usr/bin/env node
/*
 * Prints a compact, account-level Travelpayouts performance report.
 * Keep TRAVELPAYOUTS_API_TOKEN in the shell environment; it is never written
 * to source files, generated assets, or the website.
 *
 * npm run report:affiliate -- --from=2026-09-01 --to=2026-10-01
 */

const DAY = 24 * 60 * 60 * 1000;

function dateOnly(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value || '')) return null;
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isNaN(date.getTime()) ? null : value;
}

function option(name) {
  const prefix = `--${name}=`;
  return process.argv.find(value => value.startsWith(prefix))?.slice(prefix.length);
}

function defaultRange() {
  const until = new Date();
  until.setUTCHours(0, 0, 0, 0);
  const from = new Date(until.getTime() - 30 * DAY);
  return {
    from: from.toISOString().slice(0, 10),
    to: until.toISOString().slice(0, 10)
  };
}

async function main() {
  const token = process.env.TRAVELPAYOUTS_API_TOKEN;
  if (!token) throw new Error('Set TRAVELPAYOUTS_API_TOKEN before running this report.');

  const defaults = defaultRange();
  const from = dateOnly(option('from') || defaults.from);
  const to = dateOnly(option('to') || defaults.to);
  if (!from || !to || from >= to) {
    throw new Error('Use valid ISO dates where --from is earlier than --to.');
  }

  const body = {
    fields: [
      'clicks_count', 'redirects_count', 'searches_count', 'actions_count',
      'processing_actions_count', 'paid_actions_count', 'cancelled_actions_count',
      'paid_profit_usd_sum', 'processing_profit_usd_sum'
    ],
    filters: [
      { field: 'date', op: 'ge', value: from },
      { field: 'date', op: 'lt', value: to }
    ]
  };
  const response = await fetch('https://api.travelpayouts.com/statistics/v1/execute_query', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Access-Token': token },
    body: JSON.stringify(body)
  });
  if (!response.ok) throw new Error(`Travelpayouts API returned ${response.status}.`);

  const payload = await response.json();
  const metrics = payload.results?.[0] || {};
  console.log(JSON.stringify({ period: { from, to }, metrics }, null, 2));
}

main().catch(error => {
  console.error(`Affiliate report failed: ${error.message}`);
  process.exitCode = 1;
});
