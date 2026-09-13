# Inventory dashboard
Run `npm install`, then `npm run setup-auth`, then `npm run dev`. The setup command prints a generated password once and writes only ignored `.env.local`; rerun after removing `DASHBOARD_PASSWORD_HASH` to rotate.

Set `MONGODB_URI` and optional `MONGODB_DB` for Atlas. Use a least-privilege application user and a replica-set/Atlas deployment for inventory transactions. HTTPS is required in production.

Without MongoDB the app is explicitly read-preview demo mode: no mutations or commits are persisted. Sample TCS sheets can produce aggregate previews (sales and returns), but cannot identify products; explicit mappings are required before inventory movements. Money is integer paise, quantities are nonnegative integers. Gross sales and return invoice value are separate; net sales is gross minus returns, not profit.
