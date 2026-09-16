import { Search } from "lucide-react";

import { PageHeader, TableEmpty } from "@/components/dashboard-ui";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CreateProduct, ProductMenu } from "@/features/products/product-forms";
import { products } from "@/lib/server/reads";

export default async function Products({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const query = (await searchParams).q?.trim().toLowerCase() ?? "";
  const allProducts = await products();
  const items = allProducts.filter((product) =>
    `${product.name} ${product.sku ?? ""}`.toLowerCase().includes(query),
  );
  const demo = !process.env.MONGODB_URI;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Catalog"
        title="Products"
        description="Manage product details and audited inventory balances."
        actions={<CreateProduct disabled={demo} />}
      />

      <Card className="shadow-sm shadow-slate-200/40">
        <CardHeader className="border-b">
          <CardTitle>Product catalog</CardTitle>
          <CardDescription>{items.length} of {allProducts.length} products shown</CardDescription>
          <form className="mt-3 flex w-full max-w-lg items-end gap-2" role="search">
            <div className="flex-1 space-y-2">
              <Label htmlFor="q">Search products</Label>
              <div className="relative">
                <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input id="q" name="q" defaultValue={query} className="pl-9" placeholder="Search name or SKU" />
              </div>
            </div>
            <Button type="submit" variant="outline">Search</Button>
          </form>
        </CardHeader>
        <CardContent className="px-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="pl-4">Product</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead className="text-right">Available</TableHead>
                <TableHead className="text-right">Damaged</TableHead>
                <TableHead className="text-right">Unit cost</TableHead>
                <TableHead className="w-16 pr-4 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.length ? (
                items.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell className="pl-4 font-medium">{product.name}</TableCell>
                    <TableCell className="text-muted-foreground">{product.sku || "—"}</TableCell>
                    <TableCell className="num text-right">{product.available}</TableCell>
                    <TableCell className="num text-right">{product.damaged}</TableCell>
                    <TableCell className="num text-right">₹{(product.unitCostPaise / 100).toFixed(2)}</TableCell>
                    <TableCell className="pr-4 text-right">
                      <ProductMenu id={product.id} revision={product.revision} disabled={demo} />
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableEmpty colSpan={6}>
                  {query ? "No products match this search." : "No products have been created yet."}
                </TableEmpty>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
