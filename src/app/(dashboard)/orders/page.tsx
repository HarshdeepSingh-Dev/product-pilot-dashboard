import Link from "next/link";
import { Upload } from "lucide-react";

import { PageHeader, StatusBadge, TableEmpty } from "@/components/dashboard-ui";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { orderEvents } from "@/lib/server/reads";

export default async function Orders() {
  const rows = await orderEvents();

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Sales"
        title="Orders"
        description="Review sale events imported from marketplace spreadsheets."
        actions={
          <Button asChild>
            <Link href="/imports"><Upload data-icon="inline-start" />Import orders</Link>
          </Button>
        }
      />
      <Card className="shadow-sm shadow-slate-200/40">
        <CardHeader className="border-b">
          <CardTitle>Imported order events</CardTitle>
          <CardDescription>{rows.length} event{rows.length !== 1 ? "s" : ""} recorded</CardDescription>
        </CardHeader>
        <CardContent className="px-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="pl-4">Date</TableHead>
                <TableHead>Sub-order</TableHead>
                <TableHead className="text-right">Quantity</TableHead>
                <TableHead className="pr-4 text-right">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length ? rows.map((row) => (
                <TableRow key={row.identity}>
                  <TableCell className="pl-4 text-muted-foreground">{row.date || "—"}</TableCell>
                  <TableCell className="font-medium">{row.subOrderNumber}</TableCell>
                  <TableCell className="num text-right">{row.quantity}</TableCell>
                  <TableCell className="pr-4 text-right"><StatusBadge status={row.status} /></TableCell>
                </TableRow>
              )) : (
                <TableEmpty colSpan={4}>
                  No orders yet. <Link href="/imports" className="font-medium text-primary hover:underline">Upload a sales slip.</Link>
                </TableEmpty>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
