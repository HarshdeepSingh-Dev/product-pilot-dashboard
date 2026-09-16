import { PageHeader, TableEmpty } from "@/components/dashboard-ui";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { OperationForm } from "@/features/operations/forms";
import { expenses } from "@/lib/server/reads";

const fmt = (iso: string | null) => iso ? new Date(iso).toLocaleDateString("en-IN") : "—";
const money = (paise: number) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(paise / 100);

export default async function Expenses() {
  const rows = await expenses();

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Operations"
        title="Expenses"
        description="Track operating costs alongside your inventory activity."
      />
      <div className="grid items-start gap-6 xl:grid-cols-[minmax(340px,0.8fr)_minmax(0,1.2fr)]">
        <OperationForm kind="expense" disabled={!process.env.MONGODB_URI} />
        <Card className="shadow-sm shadow-slate-200/40">
          <CardHeader className="border-b">
            <CardTitle>Expense history</CardTitle>
            <CardDescription>{rows.length} expense{rows.length !== 1 ? "s" : ""} recorded</CardDescription>
          </CardHeader>
          <CardContent className="px-0">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="pl-4">Date</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="pr-4">Note</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.length ? rows.map((row, index) => (
                  <TableRow key={index}>
                    <TableCell className="pl-4 text-muted-foreground">{fmt(row.createdAt)}</TableCell>
                    <TableCell className="num text-right font-medium">{money(row.amount)}</TableCell>
                    <TableCell className="max-w-md truncate pr-4 text-muted-foreground">{row.note}</TableCell>
                  </TableRow>
                )) : <TableEmpty colSpan={3}>No expenses recorded yet.</TableEmpty>}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
