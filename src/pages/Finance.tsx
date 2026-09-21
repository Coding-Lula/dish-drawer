import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useState } from 'react';
import {
  TrendingUp,
  Wallet,
  Plus,
  Trash2,
  Lock,
  ArrowRightLeft,
  AlertTriangle,
  Building2,
  Settings,
  FileText,
  ChevronDown,
  ChevronRight,
  Download,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { useFinancePage } from '@/hooks/useFinancePage';

function FinanceContent() {
  const [isOperationalExpanded, setIsOperationalExpanded] = useState(true);
  const [isFinancialExpanded, setIsFinancialExpanded] = useState(true);

  const {
    currentStore,
    isManager,
    dateRange,
    setDateRange,
    monthStart,
    monthEnd,
    showTransferModal,
    setShowTransferModal,
    showSourcesDialog,
    setShowSourcesDialog,
    showAddSourceModal,
    setShowAddSourceModal,
    transferForm,
    setTransferForm,
    newSourceName,
    setNewSourceName,
    editingAllocations,
    setEditingAllocations,
    showAddEnvelopeModal,
    setShowAddEnvelopeModal,
    newEnvelope,
    setNewEnvelope,
    marginThreshold,
    setMarginThreshold,
    showAllLowMargin,
    setShowAllLowMargin,
    sources,
    deleteSource,
    allocationCategories,
    deleteAllocationCategory,
    currentStoreSummary,
    incomeStatement,
    revenueByPaymentMethod,
    expensesByPaymentMethod,
    performanceAnalytics,
    lowMarginItems,
    isCurrentMonthLocked,
    lockMonth,
    handleAddSource,
    handleSaveAllocations,
    handleAddEnvelope,
    handleInternalTransfer,
    handleExportData,
  } = useFinancePage();

  if (!currentStore) {
    return <div className="flex items-center justify-center h-full">Loading...</div>;
  }

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Wallet className="w-8 h-8 text-primary" />
            Financial Management
          </h1>
          <p className="text-muted-foreground">{currentStore.name} • Store financial overview & controls</p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <DateRangePicker date={dateRange} setDate={setDateRange} />

          <Button variant="outline" className="gap-2" onClick={handleExportData}>
            <Download className="w-4 h-4" />
            Exportar Relatório
          </Button>

          {dateRange?.from && (
            <Badge variant="secondary" className="gap-1">
              {isCurrentMonthLocked ? (
                <>
                  <Lock className="w-3 h-3" /> Locked
                </>
              ) : (
                <>
                  <TrendingUp className="w-3 h-3" /> Active
                </>
              )}
            </Badge>
          )}
        </div>
      </div>

      {/* Quick Actions Bar */}
      <div className="flex gap-2 flex-wrap bg-muted/30 p-4 rounded-lg border border-dashed">
        {isManager && (
          <Dialog open={showTransferModal} onOpenChange={setShowTransferModal}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" disabled={isCurrentMonthLocked}>
                <ArrowRightLeft className="w-4 h-4 mr-2" /> Transfer Funds
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Transfer Funds Between Accounts</DialogTitle>
                <DialogDescription>
                  Move money between accounts/payment methods for {currentStore.name}.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>From Account (Origin)</Label>
                    <Select
                      value={transferForm.from_source_id}
                      onValueChange={v => setTransferForm(prev => ({ ...prev, from_source_id: v }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Origin account" />
                      </SelectTrigger>
                      <SelectContent>
                        {sources.map(s => (
                          <SelectItem key={s.id} value={s.id}>
                            {s.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>To Account (Destination)</Label>
                    <Select
                      value={transferForm.to_source_id}
                      onValueChange={v => setTransferForm(prev => ({ ...prev, to_source_id: v }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Destination account" />
                      </SelectTrigger>
                      <SelectContent>
                        {sources.map(s => (
                          <SelectItem key={s.id} value={s.id}>
                            {s.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Amount (MT)</Label>
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={transferForm.amount}
                    onChange={e => setTransferForm(prev => ({ ...prev, amount: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Description</Label>
                  <Input
                    placeholder="Reason for transfer"
                    value={transferForm.description}
                    onChange={e => setTransferForm(prev => ({ ...prev, description: e.target.value }))}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowTransferModal(false)}>
                  Cancel
                </Button>
                <Button onClick={handleInternalTransfer}>Complete Transfer</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}

        <Dialog open={showSourcesDialog} onOpenChange={setShowSourcesDialog}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              <Settings className="w-4 h-4 mr-2" /> Manage Sources
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Income Sources Management</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <Label>Registered Sources</Label>
                <Button size="sm" onClick={() => setShowAddSourceModal(true)}>
                  <Plus className="w-4 h-4 mr-1" /> Add
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {sources.map(s => (
                  <div key={s.id} className="flex items-center justify-between p-3 border rounded-lg bg-card">
                    <div className="flex items-center gap-2">
                      <Wallet className="w-4 h-4 text-muted-foreground" />
                      <span className="font-medium">{s.name}</span>
                    </div>
                    {!s.is_default && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive"
                        onClick={() => deleteSource(s.id)}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={showAddSourceModal} onOpenChange={setShowAddSourceModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Income Source</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Source Name</Label>
                <Input
                  placeholder="e.g. Bank Account"
                  value={newSourceName}
                  onChange={e => setNewSourceName(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAddSourceModal(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddSource}>Save Source</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* 1. Financial Summary Card (Store-Specific) */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-primary" />
            Financial Summary - {currentStore.name}
          </CardTitle>
          <CardDescription>
            Revenue, expenses, and net total for {currentStore.name} ({monthStart} to {monthEnd})
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="p-4 rounded-lg bg-muted/40 border">
              <p className="text-sm text-muted-foreground font-medium">Store Revenue</p>
              <p className="text-2xl font-bold mt-1 text-green-600">
                {currentStoreSummary.revenue.toLocaleString()} MT
              </p>
            </div>
            <div className="p-4 rounded-lg bg-muted/40 border">
              <p className="text-sm text-muted-foreground font-medium">Store Expenses</p>
              <p className="text-2xl font-bold mt-1 text-destructive">
                {currentStoreSummary.expenses.toLocaleString()} MT
              </p>
            </div>
            <div className="p-4 rounded-lg bg-muted/40 border">
              <p className="text-sm text-muted-foreground font-medium">Net Total</p>
              <p
                className={cn(
                  'text-2xl font-bold mt-1',
                  currentStoreSummary.netTotal >= 0 ? 'text-green-600' : 'text-destructive'
                )}
              >
                {currentStoreSummary.netTotal.toLocaleString()} MT
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Income Statement (Demonstração de Resultados - DRE) Card */}
      <Card className="border-primary/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            Demonstração de Resultados (DRE) - {currentStore.name}
          </CardTitle>
          <CardDescription>
            Relatório de desempenho financeiro ({monthStart} a {monthEnd})
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="p-4 rounded-lg bg-muted/30 border">
                <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider block">
                  Receita Bruta
                </span>
                <span className="text-xl font-bold text-green-600 mt-1 block">
                  {incomeStatement.grossRevenue.toLocaleString()} MT
                </span>
              </div>

              <div className="p-4 rounded-lg bg-muted/30 border">
                <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider block">
                  Custo de Mercadorias (CMV)
                </span>
                <span className="text-xl font-bold text-destructive mt-1 block">
                  - {incomeStatement.cogs.toLocaleString()} MT
                </span>
              </div>

              <div className="p-4 rounded-lg bg-muted/30 border">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider block">
                    Lucro Bruto
                  </span>
                  <Badge variant="outline" className="text-xs">
                    {incomeStatement.grossMarginPercent.toFixed(1)}%
                  </Badge>
                </div>
                <span
                  className={cn(
                    'text-xl font-bold mt-1 block',
                    incomeStatement.grossProfit >= 0 ? 'text-green-600' : 'text-destructive'
                  )}
                >
                  {incomeStatement.grossProfit.toLocaleString()} MT
                </span>
              </div>

              <div className="p-4 rounded-lg bg-muted/30 border">
                <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider block">
                  Despesas Operacionais e Fin.
                </span>
                <span className="text-xl font-bold text-destructive mt-1 block">
                  - {(incomeStatement.totalExpenses ?? (incomeStatement.operationalExpenses + (incomeStatement.financialExpenses || 0))).toLocaleString()} MT
                </span>
              </div>

              <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-primary font-bold uppercase tracking-wider block">
                    Lucro Líquido
                  </span>
                  <Badge
                    className={cn(
                      'text-xs',
                      incomeStatement.netProfit >= 0
                        ? 'bg-green-600 hover:bg-green-700'
                        : 'bg-destructive hover:bg-destructive'
                    )}
                  >
                    {incomeStatement.netMarginPercent.toFixed(1)}%
                  </Badge>
                </div>
                <span
                  className={cn(
                    'text-xl font-bold mt-1 block',
                    incomeStatement.netProfit >= 0 ? 'text-green-600' : 'text-destructive'
                  )}
                >
                  {incomeStatement.netProfit.toLocaleString()} MT
                </span>
              </div>
            </div>

            <Table className="mt-4 border rounded-lg">
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="font-bold">Item de Demonstração (DRE)</TableHead>
                  <TableHead className="text-right font-bold">Valor (MT)</TableHead>
                  <TableHead className="text-right font-bold">% da Receita</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-semibold text-green-700">(+) Receita Bruta de Vendas</TableCell>
                  <TableCell className="text-right font-bold text-green-700">
                    {incomeStatement.grossRevenue.toLocaleString()} MT
                  </TableCell>
                  <TableCell className="text-right font-medium">100.0%</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium text-destructive">
                    (-) Custo das Mercadorias Vendidas (CMV)
                  </TableCell>
                  <TableCell className="text-right font-medium text-destructive">
                    - {incomeStatement.cogs.toLocaleString()} MT
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    {incomeStatement.grossRevenue > 0
                      ? ((incomeStatement.cogs / incomeStatement.grossRevenue) * 100).toFixed(1)
                      : '0.0'}
                    %
                  </TableCell>
                </TableRow>
                <TableRow className="bg-muted/30 font-bold">
                  <TableCell>
                    (=) Lucro Bruto
                  </TableCell>
                  <TableCell
                    className={cn(
                      'text-right',
                      incomeStatement.grossProfit >= 0 ? 'text-green-600' : 'text-destructive'
                    )}
                  >
                    {incomeStatement.grossProfit.toLocaleString()} MT
                  </TableCell>
                  <TableCell className="text-right">
                    {incomeStatement.grossMarginPercent.toFixed(1)}%
                  </TableCell>
                </TableRow>
                {/* Expandable Operational Expenses Row */}
                <TableRow
                  className="cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => setIsOperationalExpanded(!isOperationalExpanded)}
                >
                  <TableCell className="font-medium text-destructive flex items-center gap-2">
                    {isOperationalExpanded ? (
                      <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                    )}
                    (-) Despesas Operacionais
                  </TableCell>
                  <TableCell className="text-right font-medium text-destructive">
                    - {incomeStatement.operationalExpenses.toLocaleString()} MT
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    {incomeStatement.grossRevenue > 0
                      ? ((incomeStatement.operationalExpenses / incomeStatement.grossRevenue) * 100).toFixed(1)
                      : '0.0'}
                    %
                  </TableCell>
                </TableRow>

                {isOperationalExpanded && (
                  <>
                    {incomeStatement.operationalBreakdown && incomeStatement.operationalBreakdown.length > 0 ? (
                      incomeStatement.operationalBreakdown.map((item) => (
                        <TableRow key={item.categoryName} className="bg-muted/20 border-l-4 border-l-destructive/40">
                          <TableCell className="pl-8 text-sm text-muted-foreground font-medium">
                            {item.categoryName}
                          </TableCell>
                          <TableCell className="text-right text-sm text-destructive font-medium">
                            - {item.totalAmount.toLocaleString()} MT
                          </TableCell>
                          <TableCell className="text-right text-xs text-muted-foreground">
                            {incomeStatement.grossRevenue > 0
                              ? ((item.totalAmount / incomeStatement.grossRevenue) * 100).toFixed(1)
                              : '0.0'}
                            %
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow className="bg-muted/20 border-l-4 border-l-destructive/40">
                        <TableCell className="pl-8 text-sm text-muted-foreground italic">
                          Nenhuma despesa operacional registada
                        </TableCell>
                        <TableCell className="text-right text-sm text-muted-foreground">0 MT</TableCell>
                        <TableCell className="text-right text-xs text-muted-foreground">0.0%</TableCell>
                      </TableRow>
                    )}
                  </>
                )}

                {/* Expandable Financial Expenses Row */}
                <TableRow
                  className="cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => setIsFinancialExpanded(!isFinancialExpanded)}
                >
                  <TableCell className="font-medium text-destructive flex items-center gap-2">
                    {isFinancialExpanded ? (
                      <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                    )}
                    (-) Despesas Financeiras
                  </TableCell>
                  <TableCell className="text-right font-medium text-destructive">
                    - {(incomeStatement.financialExpenses || 0).toLocaleString()} MT
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    {incomeStatement.grossRevenue > 0
                      ? (((incomeStatement.financialExpenses || 0) / incomeStatement.grossRevenue) * 100).toFixed(1)
                      : '0.0'}
                    %
                  </TableCell>
                </TableRow>

                {isFinancialExpanded && (
                  <>
                    {incomeStatement.financialBreakdown && incomeStatement.financialBreakdown.length > 0 ? (
                      incomeStatement.financialBreakdown.map((item) => (
                        <TableRow key={item.categoryName} className="bg-muted/20 border-l-4 border-l-destructive/40">
                          <TableCell className="pl-8 text-sm text-muted-foreground font-medium">
                            {item.categoryName}
                          </TableCell>
                          <TableCell className="text-right text-sm text-destructive font-medium">
                            - {item.totalAmount.toLocaleString()} MT
                          </TableCell>
                          <TableCell className="text-right text-xs text-muted-foreground">
                            {incomeStatement.grossRevenue > 0
                              ? ((item.totalAmount / incomeStatement.grossRevenue) * 100).toFixed(1)
                              : '0.0'}
                            %
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow className="bg-muted/20 border-l-4 border-l-destructive/40">
                        <TableCell className="pl-8 text-sm text-muted-foreground italic">
                          Nenhuma despesa financeira registada
                        </TableCell>
                        <TableCell className="text-right text-sm text-muted-foreground">0 MT</TableCell>
                        <TableCell className="text-right text-xs text-muted-foreground">0.0%</TableCell>
                      </TableRow>
                    )}
                  </>
                )}
                <TableRow className="bg-primary/10 font-bold text-lg border-t-2">
                  <TableCell className="text-primary">(=) Lucro Líquido do Período</TableCell>
                  <TableCell
                    className={cn(
                      'text-right',
                      incomeStatement.netProfit >= 0 ? 'text-green-600' : 'text-destructive'
                    )}
                  >
                    {incomeStatement.netProfit.toLocaleString()} MT
                  </TableCell>
                  <TableCell className="text-right">
                    {incomeStatement.netMarginPercent.toFixed(1)}%
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* 2. Revenue Allocation Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5 text-primary" />
              Revenue Allocation Envelopes
            </CardTitle>
            <CardDescription>
              Virtual distribution of store revenue for {currentStore.name}
            </CardDescription>
          </div>
          <Dialog open={showAddEnvelopeModal} onOpenChange={setShowAddEnvelopeModal}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="w-4 h-4 mr-2" /> Add Envelope
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Envelope</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Envelope Name</Label>
                  <Input
                    placeholder="e.g. Savings"
                    value={newEnvelope.name}
                    onChange={e => setNewEnvelope(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Default Percentage (%)</Label>
                  <Input
                    type="number"
                    value={newEnvelope.percent}
                    onChange={e => setNewEnvelope(prev => ({ ...prev, percent: Number(e.target.value) }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Color</Label>
                  <Input
                    type="color"
                    className="h-10 p-1"
                    value={newEnvelope.color}
                    onChange={e => setNewEnvelope(prev => ({ ...prev, color: e.target.value }))}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowAddEnvelopeModal(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddEnvelope}>Add Envelope</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {allocationCategories.map(cat => {
              const percent = editingAllocations[cat.id] ?? cat.percent;
              const value = (currentStoreSummary.revenue * percent) / 100;
              return (
                <Card key={cat.id} className="border-l-4" style={{ borderLeftColor: cat.color || '#ccc' }}>
                  <CardContent className="pt-4">
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-semibold">{cat.name}</span>
                      <div className="flex items-center gap-1">
                        <Input
                          className="w-16 h-8 text-right p-1"
                          type="number"
                          value={percent}
                          onChange={e =>
                            setEditingAllocations(prev => ({ ...prev, [cat.id]: Number(e.target.value) }))
                          }
                        />
                        <span className="text-sm text-muted-foreground">%</span>
                      </div>
                    </div>
                    <div className="text-2xl font-bold">{value.toLocaleString()} MT</div>
                    <Progress value={percent} className="h-1 mt-2" />
                    <div className="flex justify-end mt-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-destructive opacity-20 hover:opacity-100"
                        onClick={() => deleteAllocationCategory(cat.id)}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
          {Object.keys(editingAllocations).length > 0 && (
            <div className="flex justify-end">
              <Button onClick={handleSaveAllocations}>Save Allocation Values</Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 3. Dual-Column Cash Flow Card */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-600" />
              Income by Payment Method ({currentStore.name})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Method</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Object.entries(revenueByPaymentMethod)
                  .filter(([_, amount]) => amount > 0)
                  .map(([method, amount]) => (
                    <TableRow key={method}>
                      <TableCell className="capitalize">{method.replace('_', ' ')}</TableCell>
                      <TableCell className="text-right font-medium">{amount.toLocaleString()} MT</TableCell>
                    </TableRow>
                  ))}
                {Object.keys(revenueByPaymentMethod).length === 0 && (
                  <TableRow>
                    <TableCell colSpan={2} className="text-center text-muted-foreground">
                      No income recorded for this store
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-destructive rotate-180" />
              Expenses by Payment Method ({currentStore.name})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Method</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Object.entries(expensesByPaymentMethod)
                  .filter(([_, amount]) => amount > 0)
                  .map(([method, amount]) => (
                    <TableRow key={method}>
                      <TableCell className="capitalize">{method.replace('_', ' ')}</TableCell>
                      <TableCell className="text-right font-medium">{amount.toLocaleString()} MT</TableCell>
                    </TableRow>
                  ))}
                {Object.keys(expensesByPaymentMethod).length === 0 && (
                  <TableRow>
                    <TableCell colSpan={2} className="text-center text-muted-foreground">
                      No expenses recorded for this store
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* 4. Performance Analytics Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            Performance Analytics - {currentStore.name}
          </CardTitle>
          <CardDescription>
            Top selling categories by revenue and items by quantity for {currentStore.name}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                Top Categories (Revenue)
              </h4>
              {performanceAnalytics.topCategories.map(cat => (
                <div key={cat.name} className="flex justify-between items-center text-sm p-2 rounded border">
                  <span className="truncate pr-2 font-medium">{cat.name}</span>
                  <span className="font-bold whitespace-nowrap text-primary">
                    {cat.revenue.toLocaleString()} MT
                  </span>
                </div>
              ))}
              {performanceAnalytics.topCategories.length === 0 && (
                <p className="text-xs text-muted-foreground italic">No category data recorded</p>
              )}
            </div>
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                Top Items (Quantity)
              </h4>
              {performanceAnalytics.topItems.map(item => (
                <div key={item.name} className="flex justify-between items-center text-sm p-2 rounded border">
                  <span className="truncate pr-2 font-medium">{item.name}</span>
                  <span className="font-bold whitespace-nowrap">{item.quantity} sold</span>
                </div>
              ))}
              {performanceAnalytics.topItems.length === 0 && (
                <p className="text-xs text-muted-foreground italic">No item data recorded</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 5. Low Profit Margin Items Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="w-5 h-5" />
              Low Profit Margin Items (≤ {marginThreshold}%)
            </CardTitle>
            <CardDescription>
              Menu items with margins below threshold (Ingredient Cost + Overheads vs Price).
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Label htmlFor="threshold" className="text-xs whitespace-nowrap">
              Threshold %
            </Label>
            <Input
              id="threshold"
              type="number"
              className="w-16 h-8 text-right"
              value={marginThreshold}
              onChange={e => setMarginThreshold(Number(e.target.value))}
            />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item Name</TableHead>
                <TableHead className="text-right">Price</TableHead>
                <TableHead className="text-right">Cost</TableHead>
                <TableHead className="text-right">Margin</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(showAllLowMargin ? lowMarginItems : lowMarginItems.slice(0, 10)).map(item => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell className="text-right">{item.selling_price.toLocaleString()} MT</TableCell>
                  <TableCell className="text-right">{item.totalCost.toFixed(2)} MT</TableCell>
                  <TableCell
                    className={cn(
                      'text-right font-bold',
                      item.margin < 0 ? 'text-destructive' : 'text-amber-600'
                    )}
                  >
                    {(item.margin * 100).toFixed(1)}%
                  </TableCell>
                </TableRow>
              ))}
              {lowMarginItems.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground italic">
                    All items have healthy margins
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          {lowMarginItems.length > 10 && (
            <div className="flex justify-center mt-4">
              <Button variant="outline" onClick={() => setShowAllLowMargin(!showAllLowMargin)}>
                {showAllLowMargin ? 'Show Less' : `View All (${lowMarginItems.length} Items)`}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 6. Period Locking (Month-End) */}
      <Card className="border-primary/50 bg-primary/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="w-5 h-5 text-primary" />
            Period Locking & Finalization ({currentStore.name})
          </CardTitle>
          <CardDescription>
            Lock the current period for {currentStore.name} to prevent further changes to transactions.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 bg-background rounded-lg border">
            <div>
              <h3 className="font-bold">
                Period: {monthStart} to {monthEnd}
              </h3>
              <p className="text-sm text-muted-foreground">
                Status: {isCurrentMonthLocked ? 'Locked' : 'Active'}
              </p>
            </div>
            <Button
              variant={isCurrentMonthLocked ? 'outline' : 'default'}
              onClick={() => {
                if (dateRange?.from) {
                  lockMonth(dateRange.from.getFullYear(), dateRange.from.getMonth() + 1, 'Manager', 'Monthly closeout');
                }
              }}
              disabled={isCurrentMonthLocked || !dateRange?.from}
            >
              {isCurrentMonthLocked ? 'Period is Locked' : 'Lock Period'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function Finance() {
  return (
    <MainLayout>
      <FinanceContent />
    </MainLayout>
  );
}
