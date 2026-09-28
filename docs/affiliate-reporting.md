# Affiliate performance report

Run this locally to retrieve the account-level Travelpayouts results. The token
stays in your shell environment and is never added to the website, Git history,
or a public client script.

```powershell
$env:TRAVELPAYOUTS_API_TOKEN = 'your-token'
npm run report:affiliate
Remove-Item Env:TRAVELPAYOUTS_API_TOKEN
```

The default period is the last 30 complete days. For a specific period, use an
exclusive end date:

```powershell
npm run report:affiliate -- --from=2026-09-01 --to=2026-10-01
```

The report shows clicks, redirects, searches, bookings by status, and paid or
pending commission in USD. For detailed conversion filtering by marker, tool,
or referring domain, use the Reports area in the Travelpayouts account.
