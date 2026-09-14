import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { AddCategoryModal } from '@/components/modals/AddCategoryModal';
import { AddSupplierModal } from '@/components/modals/AddSupplierModal';
import { DateRangePickerModal } from '@/components/modals/DateRangePickerModal';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Receipt, Plus, Package, FileText, Building2, MoreVertical, Pencil, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useExpensesPage } from '@/hooks/useExpensesPage';
import { useState } from 'react';

function ExpensesContent() {
  const {
    currentStore,
    isManager,
    deleteExpense,
    categories,
    addCategory,
    ingredients,
    suppliers,
    addSupplier,
    showForm,
    setShowForm,
    isSubmitting,
    amount,
    setAmount,
    categoryId,
    setCategoryId,
    description,
    setDescription,
    ingredientId,
    setIngredientId,
    ingredientQty,
    setIngredientQty,
    supplierId,
    setSupplierId,
    invoiceNo,
    setInvoiceNo,
    isIvaDeductible,
    setIsIvaDeductible,
    paymentMethod,
    setPaymentMethod,
    isStockCategory,
    totalExpenses,
    stockExpenses,
    combinedExpenses,
    loading,
    handleSubmit,
    handleExportCSV,
    handleExportPDF,
    getSupplierName,
    // Edit Modal
    showEditModal,
    setShowEditModal,
    openEditModal,
    handleEditSubmit,
    isEditingSubmitting,
    editAmount,
    setEditAmount,
    editCategoryId,
    setEditCategoryId,
    editDescription,
    setEditDescription,
    editIngredientId,
    setEditIngredientId,
    editIngredientQty,
    setEditIngredientQty,
    editSupplierId,
    setEditSupplierId,
    editInvoiceNo,
    setEditInvoiceNo,
    editIsIvaDeductible,
    setEditIsIvaDeductible,
    editPaymentMethod,
    setEditPaymentMethod,
    editIsStockCategory,
  } = useExpensesPage();

  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Despesas</h1>
          <p className="text-muted-foreground">{currentStore?.name} • Gestão de Despesas</p>
        </div>
        <div className="flex gap-2">
          <AddCategoryModal onSubmit={addCategory} />
          <DateRangePickerModal onExportCSV={handleExportCSV} onExportPDF={handleExportPDF} />
          <Button onClick={() => setShowForm(!showForm)} className="gap-2">
            <Plus className="w-4 h-4" />
            Adicionar Despesas
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-lg bg-destructive/20">
              <Receipt className="w-6 h-6 text-destructive" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Despesas Totais</p>
              <p className="text-2xl font-bold">{totalExpenses.toLocaleString()} MT</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-amber-500/30">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-lg bg-amber-500/20">
              <Package className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Mercadoria Pre-Gasta</p>
              <p className="text-2xl font-bold text-amber-600">{stockExpenses.toLocaleString()} MT</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-lg bg-muted">
              <Receipt className="w-6 h-6 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Transações</p>
              <p className="text-2xl font-bold">{combinedExpenses.length}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {showForm && (
        <Card className="border-primary/30">
          <CardHeader className="pb-3">
            <CardTitle>Registrar Nova Despesa</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Quantia (MT)</Label>
                  <Input type="number" placeholder="" value={amount} onChange={e => setAmount(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Categoria</Label>
                  <Select value={categoryId} onValueChange={setCategoryId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(cat => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Supplier and Invoice Row */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Fornecedor</Label>
                  <div className="flex gap-2">
                    <Select value={supplierId} onValueChange={setSupplierId}>
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Select supplier (optional)" />
                      </SelectTrigger>
                      <SelectContent>
                        {suppliers.map(sup => (
                          <SelectItem key={sup.id} value={sup.id}>
                            {sup.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <AddSupplierModal onSubmit={addSupplier} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Número da Fatura</Label>
                  <Input placeholder="INV-001" value={invoiceNo} onChange={e => setInvoiceNo(e.target.value)} />
                </div>
              </div>

              {/* Payment Method and IVA Row */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Método de Pagamento</Label>
                  <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select payment method" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">Cash</SelectItem>
                      <SelectItem value="pos">POS</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>IVA Dedutivel</Label>
                  <div className="flex items-center gap-3 h-10">
                    <Switch checked={isIvaDeductible} onCheckedChange={setIsIvaDeductible} />
                    <span className="text-sm text-muted-foreground">{isIvaDeductible ? 'Yes' : 'No'}</span>
                  </div>
                </div>
              </div>

              {isStockCategory && (
                <div className="grid gap-4 md:grid-cols-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                  <div className="space-y-2">
                    <Label>Item Comprado</Label>
                    <Select value={ingredientId} onValueChange={setIngredientId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select item" />
                      </SelectTrigger>
                      <SelectContent>
                        {ingredients.map(ing => (
                          <SelectItem key={ing.id} value={ing.id}>
                            {ing.name} ({ing.unit})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Quantia</Label>
                    <Input
                      type="number"
                      placeholder="5"
                      value={ingredientQty}
                      onChange={e => setIngredientQty(e.target.value)}
                    />
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label>Descrição</Label>
                <Input
                  placeholder="Descrição da despesa"
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                />
              </div>

              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={() => setShowForm(false)} disabled={isSubmitting}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Registrando...' : 'Registrar Despesa'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Recent Expenses List */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold">Despesas Recentes</h2>
        {loading ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">Processando...</CardContent>
          </Card>
        ) : combinedExpenses.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              <Receipt className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>No expenses recorded</p>
            </CardContent>
          </Card>
        ) : (
          combinedExpenses.slice(0, 20).map(expense => (
            <Card key={expense.id}>
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-2 rounded-lg bg-muted">
                    <Receipt className={cn('w-5 h-5', expense.source === 'financial' && 'text-primary')} />
                  </div>
                  <div>
                    <p className="font-medium">{expense.description}</p>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <Badge variant="outline" className="text-xs">
                        {expense.category}
                      </Badge>
                      {expense.category === 'Stock' && !(expense as any).is_deducted && (
                        <Badge variant="secondary" className="text-xs bg-amber-500/20 text-amber-700">
                          Pre-spent
                        </Badge>
                      )}
                      {expense.is_iva_deductible && (
                        <Badge variant="secondary" className="text-xs bg-green-500/20 text-green-700">
                          IVA
                        </Badge>
                      )}
                      {expense.payment_method && expense.payment_method !== 'N/A' && (
                        <Badge variant="outline" className="text-xs">
                          {expense.payment_method.toUpperCase()}
                        </Badge>
                      )}
                      {expense.source === 'financial' && (
                        <Badge variant="secondary" className="text-xs">
                          Finance
                        </Badge>
                      )}
                    </div>
                    {((expense as any).supplier_id || expense.invoice_no) && (
                      <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                        {getSupplierName((expense as any).supplier_id) && (
                          <span className="flex items-center gap-1">
                            <Building2 className="w-3 h-3" />
                            {getSupplierName((expense as any).supplier_id)}
                          </span>
                        )}
                        {expense.invoice_no && (
                          <span className="flex items-center gap-1">
                            <FileText className="w-3 h-3" />
                            {expense.invoice_no}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-xl font-bold text-destructive">
                      -{Number(expense.amount).toLocaleString()} MT
                    </p>
                    <p className="text-xs text-muted-foreground">{new Date(expense.date).toLocaleString()}</p>
                  </div>

                  {/* Manager Actions Menu (...) */}
                  {isManager && expense.source === 'operational' && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEditModal(expense as any)}>
                          <Pencil className="w-4 h-4 mr-2" />
                          Editar Despesa
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() => setDeleteTargetId(expense.id)}
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Eliminar Despesa
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Edit Expense Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Editar Despesa</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4 py-2">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Quantia (MT)</Label>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={editAmount}
                  onChange={e => setEditAmount(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Categoria</Label>
                <Select value={editCategoryId} onValueChange={setEditCategoryId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecionar Categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(cat => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Fornecedor</Label>
                <Select value={editSupplierId} onValueChange={setEditSupplierId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecionar fornecedor" />
                  </SelectTrigger>
                  <SelectContent>
                    {suppliers.map(sup => (
                      <SelectItem key={sup.id} value={sup.id}>
                        {sup.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Número da Fatura</Label>
                <Input
                  placeholder="INV-001"
                  value={editInvoiceNo}
                  onChange={e => setEditInvoiceNo(e.target.value)}
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Método de Pagamento</Label>
                <Select value={editPaymentMethod} onValueChange={setEditPaymentMethod}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecionar método" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="pos">POS</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>IVA Dedutivel</Label>
                <div className="flex items-center gap-3 h-10">
                  <Switch checked={editIsIvaDeductible} onCheckedChange={setEditIsIvaDeductible} />
                  <span className="text-sm text-muted-foreground">{editIsIvaDeductible ? 'Yes' : 'No'}</span>
                </div>
              </div>
            </div>

            {editIsStockCategory && (
              <div className="grid gap-4 md:grid-cols-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                <div className="space-y-2">
                  <Label>Item Comprado</Label>
                  <Select value={editIngredientId} onValueChange={setEditIngredientId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecionar item" />
                    </SelectTrigger>
                    <SelectContent>
                      {ingredients.map(ing => (
                        <SelectItem key={ing.id} value={ing.id}>
                          {ing.name} ({ing.unit})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Quantia</Label>
                  <Input
                    type="number"
                    placeholder="5"
                    value={editIngredientQty}
                    onChange={e => setEditIngredientQty(e.target.value)}
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label>Descrição</Label>
              <Input
                placeholder="Descrição da despesa"
                value={editDescription}
                onChange={e => setEditDescription(e.target.value)}
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowEditModal(false)}
                disabled={isEditingSubmitting}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isEditingSubmitting}>
                {isEditingSubmitting ? 'A guardar...' : 'Guardar Alterações'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Alert Dialog */}
      <AlertDialog open={!!deleteTargetId} onOpenChange={open => !open && setDeleteTargetId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar Despesa</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja eliminar esta despesa? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteTargetId(null)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteTargetId) {
                  deleteExpense(deleteTargetId);
                  setDeleteTargetId(null);
                }
              }}
              className="bg-destructive hover:bg-destructive/90"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default function Expenses() {
  return (
    <MainLayout>
      <ExpensesContent />
    </MainLayout>
  );
}
