import Link from "next/link";
import {
  AlertTriangle,
  ArrowUpRight,
  Boxes,
  CircleDollarSign,
  ClipboardCheck,
  PackageCheck,
  PackageX,
  RotateCcw,
  ShoppingCart,
  Upload,
} from "lucide-react";

import { PageHeader, StatusBadge, TableEmpty } from "@/components/dashboard-ui";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { overview, products } from "@/lib/server/reads";

const money = (value: number): string =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(value / 100);

export default async function Overview() {
  const demo = !process.env.MONGODB_URI;
  const [data, list] = await Promise.all([overview(), products()]);
  const metrics = [
    { label: "Gross sales", value: money(data.grossSales), icon: CircleDollarSign, tone: "bg-indigo-50 text-indigo-600" },
    { label: "Orders", value: data.orderCount, icon: ShoppingCart, tone: "bg-blue-50 text-blue-600" },
    { label: "Returns value", value: money(data.returnsValue), icon: RotateCcw, tone: "bg-violet-50 text-violet-600" },
    { label: "Returns", value: data.returnsCount, icon: PackageX, tone: "bg-rose-50 text-rose-600" },
    { label: "Available units", value: data.available, icon: PackageCheck, tone: "bg-emerald-50 text-emerald-600" },
    { label: "Damaged units", value: data.damaged, icon: AlertTriangle, tone: "bg-amber-50 text-amber-600" },
    { label: "Pending QC", value: data.pendingQc, icon: ClipboardCheck, tone: "bg-orange-50 text-orange-600" },
    { label: "Stock value", value: money(data.stockValue), icon: Boxes, tone: "bg-cyan-50 text-cyan-600" },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Dashboard"
        title="Overview"
        description="A live view of inventory, sales, and operational activity."
        actions={
          <Button asChild>
            <Link href="/imports">
              <Upload data-icon="inline-start" />
              Upload slip
            </Link>
          </Button>
        }
      />

      <Alert className={demo ? "border-amber-200 bg-amber-50/70" : "border-emerald-200 bg-emerald-50/70"}>
        {demo ? <AlertTriangle className="text-amber-600" /> : <PackageCheck className="text-emerald-600" />}
        <AlertTitle>{demo ? "Demo mode" : "MongoDB connected"}</AlertTitle>
        <AlertDescription>
          {demo
            ? "You are viewing sample data. Connect MongoDB to create products and save inventory changes."
            : "Your changes are stored with audited inventory movements."}
        </AlertDescription>
      </Alert>

      <section aria-label="Inventory metrics" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map(({ label, value, icon: Icon, tone }) => (
          <Card key={label} className="gap-3 shadow-sm shadow-slate-200/40">
            <CardHeader className="grid grid-cols-[1fr_auto] items-center">
              <CardDescription className="font-medium">{label}</CardDescription>
              <div className={`grid size-9 place-items-center rounded-lg ${tone}`}>
                <Icon className="size-4.5" aria-hidden="true" />
              </div>
            </CardHeader>
            <CardContent>
              <p className="num text-2xl font-semibold tracking-tight">{value}</p>
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)]">
        <Card className="shadow-sm shadow-slate-200/40">
          <CardHeader className="border-b">
            <CardTitle>Inventory health</CardTitle>
            <CardDescription>Current sellable and damaged balances by product.</CardDescription>
          </CardHeader>
          <CardContent className="px-0">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="pl-4">Product</TableHead>
                  <TableHead className="text-right">Available</TableHead>
                  <TableHead className="pr-4 text-right">Damaged</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {list.length ? (
                  list.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell className="pl-4 font-medium">{product.name}</TableCell>
                      <TableCell className="num text-right">{product.available}</TableCell>
                      <TableCell className="num pr-4 text-right">{product.damaged}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableEmpty colSpan={3}>
                    No products yet. <Link href="/products" className="font-medium text-primary hover:underline">Add one.</Link>
                  </TableEmpty>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="shadow-sm shadow-slate-200/40">
          <CardHeader className="border-b">
            <CardTitle>Operations feed</CardTitle>
            <CardDescription>Items that may need your attention.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="rounded-xl border bg-muted/35 p-4">
              <div className="flex items-start gap-3">
                <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-amber-100 text-amber-700">
                  <AlertTriangle className="size-4" />
                </div>
                <div>
                  <p className="font-medium">Attention</p>
                  <p className="mt-1 text-sm leading-5 text-muted-foreground">
                    {demo
                      ? "Sample imports require explicit product mapping."
                      : "Review unmapped events and pending return quality checks."}
                  </p>
                </div>
              </div>
            </div>

            <div>
              <div className="mb-3 flex items-center justify-between">
                <h3 className="font-medium">Recent imports</h3>
                <Button asChild variant="ghost" size="sm">
                  <Link href="/imports">View all <ArrowUpRight data-icon="inline-end" /></Link>
                </Button>
              </div>
              {data.recentImports.length ? (
                <ul className="space-y-3">
                  {data.recentImports.map((item) => (
                    <li key={item.sha256} className="flex items-center gap-3 rounded-lg border p-3">
                      <StatusBadge status={item.type} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-mono text-xs">{item.sha256.slice(0, 10)}…</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {item.rows} rows · {item.createdAt.toLocaleDateString("en-IN")}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="rounded-lg border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
                  No persisted imports yet.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
