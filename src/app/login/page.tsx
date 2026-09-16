import { ArrowRight, Boxes, LockKeyhole } from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { signIn } from "./actions";

export default async function Login({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const params = await searchParams;

  return (
    <main className="relative grid min-h-svh place-items-center overflow-hidden bg-slate-950 p-4 sm:p-8">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(79,70,229,0.28),transparent_38%),radial-gradient(circle_at_bottom_right,rgba(59,130,246,0.16),transparent_34%)]" />
      <div className="relative w-full max-w-md">
        <div className="mb-6 flex items-center justify-center gap-3 text-white">
          <div className="grid size-11 place-items-center rounded-xl bg-indigo-500 shadow-lg shadow-indigo-950/30">
            <Boxes className="size-5" />
          </div>
          <div>
            <p className="text-lg font-semibold tracking-tight">StockControl</p>
            <p className="text-xs text-slate-400">Inventory workspace</p>
          </div>
        </div>

        <Card className="border-white/10 shadow-2xl shadow-black/30 ring-white/10">
          <CardHeader className="text-center">
            <div className="mx-auto mb-2 grid size-10 place-items-center rounded-full bg-indigo-50 text-primary">
              <LockKeyhole className="size-4.5" />
            </div>
            <CardTitle className="text-xl">Welcome back</CardTitle>
            <CardDescription>Enter your dashboard password to continue.</CardDescription>
          </CardHeader>
          <CardContent>
            <form action={signIn} className="space-y-4">
              {params.error && (
                <Alert variant="destructive">
                  <AlertDescription>Unable to sign in. Check your password and try again.</AlertDescription>
                </Alert>
              )}
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input id="password" required name="password" type="password" autoComplete="current-password" autoFocus />
              </div>
              <Button type="submit" className="w-full">
                Continue <ArrowRight data-icon="inline-end" />
              </Button>
              <p className="text-center text-xs leading-5 text-muted-foreground">
                Missing configuration? Run <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-foreground">npm run setup-auth</code>.
              </p>
            </form>
          </CardContent>
        </Card>
        <p className="mt-5 text-center text-xs text-slate-500">Secure inventory operations and audited stock movement</p>
      </div>
    </main>
  );
}
