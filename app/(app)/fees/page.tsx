'use client';

import { useState, useEffect, useMemo } from 'react';
import { useProfile } from '@/lib/hooks/useProfile';
import { feeService, type FeeSummary } from '@/lib/services/fee.service';
import { FEE_TYPE_LABELS, FEE_TYPES } from '@/lib/constants';
import { formatCurrency, formatDate, getLocalDateString } from '@/lib/utils/formatters';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { feeSchema, paymentSchema, type FeeFormData, type PaymentFormData } from '@/schemas/fee';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CountUp } from '@/components/ui/count-up';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Trash2, Pencil, CheckCircle2, AlertCircle, CreditCard } from 'lucide-react';
import { toast } from 'sonner';
import type { Fee, Payment, FeeType, FeeStatus } from '@/types/database';

export default function FeesPage() {
  const { profile } = useProfile();
  const semesterId = profile ? `semester-${profile.currentSemester}` : undefined;
  const [fees, setFees] = useState<Fee[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [summary, setSummary] = useState<FeeSummary | null>(null);
  const [feeDialogOpen, setFeeDialogOpen] = useState(false);
  const [editingFee, setEditingFee] = useState<Fee | null>(null);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [selectedFeeForPayment, setSelectedFeeForPayment] = useState<Fee | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'fee' | 'payment'; id: string; name: string } | null>(null);
  const [activeTab, setActiveTab] = useState<'fees' | 'payments'>('fees');

  // Lifetime (all semesters) data
  const [allFees, setAllFees] = useState<Fee[]>([]);
  const [allPayments, setAllPayments] = useState<Payment[]>([]);

  const loadData = async () => {
    if (!semesterId) return;
    const [f, p, af, ap] = await Promise.all([
      feeService.getBySemester(semesterId),
      feeService.getPaymentsBySemester(semesterId),
      feeService.getAll(),
      feeService.getAllPayments(),
    ]);
    setFees(f);
    setPayments(p);
    setSummary(feeService.calculateSummary(f, p));
    setAllFees(af);
    setAllPayments(ap);
  };

  // Lifetime summary calculated from all semesters
  const lifetimeSummary = useMemo(() => {
    // Group fees and payments by semester
    const semFees = new Map<string, Fee[]>();
    const semPayments = new Map<string, Payment[]>();

    for (const f of allFees) {
      const arr = semFees.get(f.semesterId) || [];
      arr.push(f);
      semFees.set(f.semesterId, arr);
    }
    for (const p of allPayments) {
      const arr = semPayments.get(p.semesterId) || [];
      arr.push(p);
      semPayments.set(p.semesterId, arr);
    }

    // Get all unique semester IDs
    const allSemIds = new Set([...semFees.keys(), ...semPayments.keys()]);

    let totalFees = 0;
    let totalPaid = 0;
    let remaining = 0;

    const semesters: { id: string; number: number; fees: number; paid: number; remaining: number }[] = [];

    for (const semId of allSemIds) {
      const fees = semFees.get(semId) || [];
      const payments = semPayments.get(semId) || [];
      const sum = feeService.calculateSummary(fees, payments);

      totalFees += sum.totalFees;
      totalPaid += sum.totalPaid;
      remaining += sum.remainingDue;

      semesters.push({
        id: semId,
        number: parseInt(semId.replace('semester-', ''), 10) || 0,
        fees: sum.totalFees,
        paid: sum.totalPaid,
        remaining: sum.remainingDue,
      });
    }

    semesters.sort((a, b) => a.number - b.number);

    return { totalFees, totalPaid, remaining, semesters };
  }, [allFees, allPayments]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- data-fetching from IndexedDB
    void loadData();
  }, [semesterId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Map feeId -> total paid for that fee
  const feePaidMap = payments.reduce<Record<string, number>>((acc, p) => {
    if (p.feeId) {
      acc[p.feeId] = (acc[p.feeId] || 0) + p.amount;
    }
    return acc;
  }, {});

  const handleEditFee = (fee: Fee) => {
    setEditingFee(fee);
    setFeeDialogOpen(true);
  };

  const handlePayFee = (fee: Fee) => {
    setSelectedFeeForPayment(fee);
    setPaymentDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      if (deleteTarget.type === 'fee') await feeService.deleteFee(deleteTarget.id);
      else await feeService.deletePayment(deleteTarget.id);
      toast.success('Deleted successfully.');
      setDeleteTarget(null);
      await loadData();
    } catch { toast.error('Failed to delete.'); }
  };

  if (!profile) return null;

  const pendingFees = fees.filter((f) => f.status !== 'paid');

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Fees & Payments</h1>
        <p className="text-sm text-muted-foreground">
          Semester {profile.currentSemester} · Track departmental dues & payments
        </p>
      </div>

      {/* Clear Financial Summary Cards */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Card className="border-border/70 animate-slide-fade-up stagger-1">
          <CardContent className="p-4">
            <p className="text-xs font-medium text-muted-foreground mb-1">Total Fees</p>
            <p className="text-xl sm:text-2xl font-semibold text-foreground">
              <CountUp value={formatCurrency(summary?.totalFees || 0)} />
            </p>
            <p className="text-[0.7rem] text-muted-foreground mt-1">All charges for this semester</p>
          </CardContent>
        </Card>

        <Card className="border-border/70 animate-slide-fade-up stagger-2">
          <CardContent className="p-4">
            <p className="text-xs font-medium text-muted-foreground mb-1">Total Paid</p>
            <p className="text-xl sm:text-2xl font-semibold text-emerald-600 dark:text-emerald-400">
              <CountUp value={formatCurrency(summary?.totalPaid || 0)} />
            </p>
            <p className="text-[0.7rem] text-muted-foreground mt-1">{summary?.paidFeesCount || 0} fee(s) fully cleared</p>
          </CardContent>
        </Card>

        <Card className="border-border/70 animate-slide-fade-up stagger-3">
          <CardContent className="p-4">
            <p className="text-xs font-medium text-muted-foreground mb-1">Remaining Due</p>
            <p className={`text-xl sm:text-2xl font-semibold ${(summary?.remainingDue || 0) > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
              <CountUp value={formatCurrency(summary?.remainingDue || 0)} />
            </p>
            <p className="text-[0.7rem] text-muted-foreground mt-1">
              {(summary?.remainingDue || 0) > 0 ? 'Amount pending to be paid' : 'All cleared! No dues ✅'}
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/70 animate-slide-fade-up stagger-4">
          <CardContent className="p-4">
            <p className="text-xs font-medium text-muted-foreground mb-1">Payment Status</p>
            <div className="flex items-center gap-1.5 mt-1">
              {(summary?.remainingDue || 0) === 0 && (summary?.totalFees || 0) > 0 ? (
                <>
                  <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                  <span className="text-sm font-semibold text-emerald-600">All Cleared</span>
                </>
              ) : (summary?.totalFees || 0) === 0 ? (
                <span className="text-sm text-muted-foreground">No fees added</span>
              ) : (
                <>
                  <AlertCircle className="h-5 w-5 text-amber-500" />
                  <span className="text-sm font-semibold text-amber-600">{summary?.pendingFeesCount} Due Pending</span>
                </>
              )}
            </div>
            <p className="text-[0.7rem] text-muted-foreground mt-1">{payments.length} payment record(s)</p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'fees' | 'payments')} className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 max-w-sm">
          <TabsTrigger value="fees">Fees ({fees.length})</TabsTrigger>
          <TabsTrigger value="payments">Payments & Dues ({payments.length})</TabsTrigger>
        </TabsList>

        {/* ── TAB 1: FEES ────────────────────────── */}
        <TabsContent value="fees" className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">List of fees charged by college for this semester</p>
            <Dialog open={feeDialogOpen} onOpenChange={(open) => {
              setFeeDialogOpen(open);
              if (!open) setEditingFee(null);
            }}>
              <Button size="sm" onClick={() => { setEditingFee(null); setFeeDialogOpen(true); }}>
                <Plus className="mr-1.5 h-4 w-4" /> Add Fee
              </Button>
              <DialogContent className="max-w-md">
                <FeeForm
                  key={editingFee?.id || 'new'}
                  fee={editingFee}
                  onSubmit={async (data) => {
                    if (!semesterId) return;
                    if (editingFee) {
                      await feeService.updateFee(editingFee.id, data);
                      toast.success('Fee updated.');
                    } else {
                      await feeService.createFee(semesterId, data);
                      toast.success('Fee added.');
                    }
                    setFeeDialogOpen(false);
                    setEditingFee(null);
                    await loadData();
                  }}
                  onCancel={() => { setFeeDialogOpen(false); setEditingFee(null); }}
                />
              </DialogContent>
            </Dialog>
          </div>

          {fees.length === 0 ? (
            <Card>
              <CardContent className="py-10 text-center text-muted-foreground">
                <p className="font-medium text-foreground mb-1">No fees recorded yet</p>
                <p className="text-xs mb-4">Add your semester fee, admission fee, or exam fee.</p>
                <Button size="sm" onClick={() => { setEditingFee(null); setFeeDialogOpen(true); }}>
                  <Plus className="mr-1.5 h-4 w-4" /> Add First Fee
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {fees.map((fee) => {
                const paidForThisFee = feePaidMap[fee.id] || (fee.status === 'paid' ? fee.amount : 0);
                const dueForThisFee = Math.max(0, fee.amount - paidForThisFee);
                const isPaid = fee.status === 'paid';

                return (
                  <Card key={fee.id} className="border hover:border-primary/40 transition-colors">
                    <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-sm">{FEE_TYPE_LABELS[fee.type] || fee.type}</p>
                          <Badge
                            variant="outline"
                            className={`text-xs font-semibold ${
                              isPaid
                                ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/40'
                                : 'bg-rose-500/15 text-rose-700 dark:text-rose-400 border-rose-500/40'
                            }`}
                          >
                            {isPaid ? 'Paid ✓' : 'Unpaid'}
                          </Badge>
                        </div>
                        <div className="text-xs text-muted-foreground flex items-center gap-3">
                          <span>Total: <strong className="text-foreground">{formatCurrency(fee.amount)}</strong></span>
                          <span>Paid: <strong className="text-emerald-600">{formatCurrency(paidForThisFee)}</strong></span>
                          {!isPaid && (
                            <span>Due: <strong className="text-rose-600">{formatCurrency(dueForThisFee)}</strong></span>
                          )}
                        </div>
                        {fee.note && <p className="text-xs text-muted-foreground italic">Note: {fee.note}</p>}
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {/* Direct Pay Fee Button */}
                        {!isPaid && (
                          <Button
                            size="sm"
                            variant="default"
                            className="bg-emerald-600 hover:bg-emerald-700 text-white h-8 text-xs font-semibold"
                            onClick={() => handlePayFee(fee)}
                          >
                            <CreditCard className="mr-1.5 h-3.5 w-3.5" /> Pay This Fee
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-primary"
                          title="Edit Fee"
                          onClick={() => handleEditFee(fee)}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          title="Delete Fee"
                          onClick={() => setDeleteTarget({ type: 'fee', id: fee.id, name: FEE_TYPE_LABELS[fee.type] })}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* ── TAB 2: PAYMENTS & DUES ──────────────────── */}
        <TabsContent value="payments" className="space-y-6">
          {/* Quick Pay for Pending Fees (User specifically requested seeing fees here to mark as payment) */}
          {pendingFees.length > 0 && (
            <Card className="border-amber-500/30 bg-amber-500/5">
              <CardHeader className="pb-2 pt-4 px-4">
                <CardTitle className="text-sm font-semibold flex items-center gap-2 text-amber-700 dark:text-amber-400">
                  <AlertCircle className="h-4 w-4" />
                  Fees Waiting for Payment ({pendingFees.length})
                </CardTitle>
                <p className="text-xs text-muted-foreground">
                  Tap &quot;Mark as Paid&quot; to quickly record payment for any fee below:
                </p>
              </CardHeader>
              <CardContent className="p-4 pt-1 space-y-2">
                {pendingFees.map((fee) => {
                  const paid = feePaidMap[fee.id] || 0;
                  const due = Math.max(0, fee.amount - paid);
                  return (
                    <div
                      key={fee.id}
                      className="flex items-center justify-between p-2.5 rounded-lg border border-amber-500/20 bg-card"
                    >
                      <div>
                        <p className="text-sm font-semibold">{FEE_TYPE_LABELS[fee.type] || fee.type}</p>
                        <p className="text-xs text-muted-foreground">
                          Fee: {formatCurrency(fee.amount)} · Due: <strong className="text-rose-600">{formatCurrency(due)}</strong>
                        </p>
                      </div>
                      <Button
                        size="sm"
                        className="bg-emerald-600 hover:bg-emerald-700 text-white h-8 text-xs font-semibold"
                        onClick={() => handlePayFee(fee)}
                      >
                        <CreditCard className="mr-1.5 h-3.5 w-3.5" /> Mark as Paid
                      </Button>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          )}

          {/* Payment History */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold">Payment History</h3>
                <p className="text-xs text-muted-foreground">All money transactions recorded</p>
              </div>
              <Dialog open={paymentDialogOpen} onOpenChange={(open) => {
                setPaymentDialogOpen(open);
                if (!open) setSelectedFeeForPayment(null);
              }}>
                <Button size="sm" onClick={() => { setSelectedFeeForPayment(null); setPaymentDialogOpen(true); }}>
                  <Plus className="mr-1.5 h-4 w-4" /> Add Payment
                </Button>
                <DialogContent className="max-w-md">
                  <PaymentForm
                    fees={fees}
                    preselectedFee={selectedFeeForPayment}
                    feePaidMap={feePaidMap}
                    onSubmit={async (data) => {
                      if (!semesterId) return;
                      await feeService.createPayment(semesterId, data);
                      toast.success('Payment recorded successfully.');
                      setPaymentDialogOpen(false);
                      setSelectedFeeForPayment(null);
                      await loadData();
                    }}
                    onCancel={() => { setPaymentDialogOpen(false); setSelectedFeeForPayment(null); }}
                  />
                </DialogContent>
              </Dialog>
            </div>

            {payments.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground text-sm">
                  No payment receipts recorded yet.
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2">
                {payments.map((p) => {
                  const linkedFee = fees.find((f) => f.id === p.feeId);
                  return (
                    <Card key={p.id} className="border">
                      <CardContent className="p-3.5 flex items-center justify-between">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                              {formatCurrency(p.amount)}
                            </p>
                            {linkedFee ? (
                              <Badge variant="secondary" className="text-[0.7rem]">
                                For: {FEE_TYPE_LABELS[linkedFee.type]}
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-[0.7rem]">General Payment</Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {formatDate(p.date)} {p.method ? `· Method: ${p.method}` : ''}
                          </p>
                          {p.note && <p className="text-xs text-muted-foreground italic">Note: {p.note}</p>}
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          onClick={() => setDeleteTarget({ type: 'payment', id: p.id, name: formatCurrency(p.amount) })}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* ── LIFETIME COST SUMMARY ────────────── */}
      {lifetimeSummary.semesters.length > 0 && (
        <Card className="border-border/70">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-primary" />
              Lifetime Cost Summary
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              Total costs across all semesters of your CSE journey
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Lifetime totals */}
            <div className="grid gap-3 grid-cols-3">
              <div className="rounded-lg border border-border/60 bg-muted/30 p-3 text-center">
                <p className="text-[0.65rem] font-medium text-muted-foreground uppercase tracking-wider mb-1">Total Cost</p>
                <p className="text-lg font-bold">{formatCurrency(lifetimeSummary.totalFees)}</p>
              </div>
              <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3 text-center">
                <p className="text-[0.65rem] font-medium text-muted-foreground uppercase tracking-wider mb-1">Total Paid</p>
                <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(lifetimeSummary.totalPaid)}</p>
              </div>
              <div className={`rounded-lg border p-3 text-center ${
                lifetimeSummary.remaining > 0
                  ? 'border-rose-500/20 bg-rose-500/5'
                  : 'border-emerald-500/20 bg-emerald-500/5'
              }`}>
                <p className="text-[0.65rem] font-medium text-muted-foreground uppercase tracking-wider mb-1">Remaining</p>
                <p className={`text-lg font-bold ${
                  lifetimeSummary.remaining > 0
                    ? 'text-rose-600 dark:text-rose-400'
                    : 'text-emerald-600 dark:text-emerald-400'
                }`}>
                  {lifetimeSummary.remaining > 0 ? formatCurrency(lifetimeSummary.remaining) : 'All Clear ✅'}
                </p>
              </div>
            </div>

            {/* Per-semester breakdown */}
            {lifetimeSummary.semesters.length > 1 && (
              <div className="rounded-lg border border-border/60 overflow-hidden">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-muted/50 border-b border-border/60">
                      <th className="text-left px-3 py-2 font-semibold text-muted-foreground">Semester</th>
                      <th className="text-right px-3 py-2 font-semibold text-muted-foreground">Fees</th>
                      <th className="text-right px-3 py-2 font-semibold text-muted-foreground">Paid</th>
                      <th className="text-right px-3 py-2 font-semibold text-muted-foreground">Due</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lifetimeSummary.semesters.map((sem) => (
                      <tr key={sem.id} className={`border-b border-border/40 last:border-0 ${
                        sem.id === semesterId ? 'bg-primary/5' : ''
                      }`}>
                        <td className="px-3 py-2 font-medium">
                          Semester {sem.number}
                          {sem.id === semesterId && (
                            <Badge variant="secondary" className="ml-1.5 text-[9px] px-1 py-0">Current</Badge>
                          )}
                        </td>
                        <td className="text-right px-3 py-2">{formatCurrency(sem.fees)}</td>
                        <td className="text-right px-3 py-2 text-emerald-600 dark:text-emerald-400">{formatCurrency(sem.paid)}</td>
                        <td className={`text-right px-3 py-2 font-medium ${
                          sem.remaining > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'
                        }`}>
                          {sem.remaining > 0 ? formatCurrency(sem.remaining) : '✅'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-muted/50 border-t border-border/60 font-bold">
                      <td className="px-3 py-2">Total</td>
                      <td className="text-right px-3 py-2">{formatCurrency(lifetimeSummary.totalFees)}</td>
                      <td className="text-right px-3 py-2 text-emerald-600 dark:text-emerald-400">{formatCurrency(lifetimeSummary.totalPaid)}</td>
                      <td className={`text-right px-3 py-2 ${
                        lifetimeSummary.remaining > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'
                      }`}>
                        {lifetimeSummary.remaining > 0 ? formatCurrency(lifetimeSummary.remaining) : '✅'}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {deleteTarget?.name}?</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ── Fee Form Modal ─────────────────────────────────────

function FeeForm({
  fee,
  onSubmit,
  onCancel,
}: {
  fee: Fee | null;
  onSubmit: (data: FeeFormData) => Promise<void>;
  onCancel: () => void;
}) {
  const [submitting, setSubmitting] = useState(false);
  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<FeeFormData>({
    resolver: zodResolver(feeSchema),
    defaultValues: {
      type: fee?.type || 'semester',
      amount: fee?.amount || 0,
      status: fee?.status || 'pending',
      note: fee?.note || '',
    },
  });

  const doSubmit = async (data: FeeFormData) => {
    setSubmitting(true);
    try {
      await onSubmit(data);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(doSubmit)}>
      <DialogHeader>
        <DialogTitle>{fee ? 'Edit Fee' : 'Add Fee'}</DialogTitle>
        <DialogDescription>
          {fee ? 'Update this fee details.' : 'Record a new fee charged by Dhaka City College.'}
        </DialogDescription>
      </DialogHeader>
      <div className="space-y-4 py-4">
        <div className="space-y-2">
          <Label>Fee Type *</Label>
          <Select value={watch('type')} onValueChange={(v) => { if (v) setValue('type', v as FeeType); }}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {FEE_TYPES.map((t) => (
                <SelectItem key={t} value={t}>{FEE_TYPE_LABELS[t]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Amount (৳) *</Label>
          <Input type="number" step="0.01" {...register('amount', { valueAsNumber: true })} />
          {errors.amount && <p className="text-xs text-destructive">{errors.amount.message}</p>}
        </div>
        <div className="space-y-2">
          <Label>Status</Label>
          <Select value={watch('status')} onValueChange={(v) => { if (v) setValue('status', v as FeeStatus); }}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="pending">Pending (Unpaid)</SelectItem>
              <SelectItem value="paid">Paid (Fully Cleared)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Note</Label>
          <Textarea placeholder="e.g. Semester 5 first installment" {...register('note')} />
        </div>
      </div>
      <DialogFooter>
        <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>
        <Button type="submit" disabled={submitting}>
          {submitting ? 'Saving...' : fee ? 'Update Fee' : 'Add Fee'}
        </Button>
      </DialogFooter>
    </form>
  );
}

// ── Payment Form Modal ─────────────────────────────────

function PaymentForm({
  fees,
  preselectedFee,
  feePaidMap,
  onSubmit,
  onCancel,
}: {
  fees: Fee[];
  preselectedFee: Fee | null;
  feePaidMap: Record<string, number>;
  onSubmit: (data: PaymentFormData) => Promise<void>;
  onCancel: () => void;
}) {
  const [submitting, setSubmitting] = useState(false);

  // Determine initial amount
  const initialFeeId = preselectedFee?.id || '';
  const initialDue = preselectedFee
    ? Math.max(0, preselectedFee.amount - (feePaidMap[preselectedFee.id] || 0))
    : 0;

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<PaymentFormData>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      feeId: initialFeeId,
      amount: initialDue > 0 ? initialDue : preselectedFee?.amount || 0,
      date: getLocalDateString(),
      method: 'bKash',
      note: preselectedFee ? `Payment for ${FEE_TYPE_LABELS[preselectedFee.type]}` : '',
    },
  });

  const selectedFeeId = watch('feeId');

  const handleSelectFee = (val: string | null) => {
    const fId = !val || val === 'none' ? undefined : val;
    setValue('feeId', fId);
    if (fId) {
      const targetFee = fees.find((f) => f.id === fId);
      if (targetFee) {
        const paid = feePaidMap[fId] || 0;
        const remaining = Math.max(0, targetFee.amount - paid);
        setValue('amount', remaining > 0 ? remaining : targetFee.amount);
        setValue('note', `Payment for ${FEE_TYPE_LABELS[targetFee.type]}`);
      }
    }
  };

  const doSubmit = async (data: PaymentFormData) => {
    setSubmitting(true);
    try {
      await onSubmit(data);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(doSubmit)}>
      <DialogHeader>
        <DialogTitle>Record Payment</DialogTitle>
        <DialogDescription>
          Record a payment receipt and mark related fees as paid.
        </DialogDescription>
      </DialogHeader>
      <div className="space-y-4 py-4">
        {/* Link to Fee */}
        <div className="space-y-2">
          <Label>Apply to Fee</Label>
          <Select value={selectedFeeId || 'none'} onValueChange={handleSelectFee}>
            <SelectTrigger><SelectValue placeholder="Select fee" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">General / No specific fee</SelectItem>
              {fees.map((f) => {
                const paid = feePaidMap[f.id] || 0;
                const due = Math.max(0, f.amount - paid);
                return (
                  <SelectItem key={f.id} value={f.id}>
                    {FEE_TYPE_LABELS[f.type]} — {formatCurrency(f.amount)} (Due: {formatCurrency(due)})
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Amount (৳) *</Label>
          <Input type="number" step="0.01" {...register('amount', { valueAsNumber: true })} />
          {errors.amount && <p className="text-xs text-destructive">{errors.amount.message}</p>}
        </div>

        <div className="space-y-2">
          <Label>Payment Date *</Label>
          <Input type="date" {...register('date')} />
          {errors.date && <p className="text-xs text-destructive">{errors.date.message}</p>}
        </div>

        <div className="space-y-2">
          <Label>Payment Method</Label>
          <Select value={watch('method') || 'bKash'} onValueChange={(v) => { if (v) setValue('method', v); }}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="bKash">bKash</SelectItem>
              <SelectItem value="Nagad">Nagad</SelectItem>
              <SelectItem value="Rocket">Rocket</SelectItem>
              <SelectItem value="Bank Transfer">Bank Transfer / Slip</SelectItem>
              <SelectItem value="Cash">Cash</SelectItem>
              <SelectItem value="Card">Debit / Credit Card</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Transaction / Receipt Note</Label>
          <Textarea placeholder="e.g. TrxID: 9X7AB42, receipt #401" {...register('note')} />
        </div>
      </div>
      <DialogFooter>
        <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>
        <Button type="submit" disabled={submitting} className="bg-emerald-600 hover:bg-emerald-700 text-white">
          {submitting ? 'Recording...' : 'Record Payment'}
        </Button>
      </DialogFooter>
    </form>
  );
}
