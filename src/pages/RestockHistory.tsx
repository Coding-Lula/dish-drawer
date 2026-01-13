import { useState } from 'react';
import { MainLayout, useCurrentStore } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useInventoryLogs, useIngredients, useSuppliers } from '@/hooks/useSupabaseData';
import { Package, Calendar, Search, Download, TrendingUp, DollarSign } from 'lucide-react';
import { cn } from '@/lib/utils';

function RestockHistoryContent() {
  const { currentStore } = useCurrentStore();
  const { logs, loading } = useInventoryLogs(currentStore?.id || null);
  const { ingredients } = useIngredients();
  const { suppliers } = useSuppliers();
  const [search, setSearch] = useState('');
  const [dateFilter, setDateFilter] = useState('all');

  // Filter only purchase logs
  const purchaseLogs = logs.filter(log => log.reason === 'purchase');

  // Apply search filter
  const filteredLogs = purchaseLogs.filter(log => {
    const ingredient = ingredients.find(i => i.id === log.ingredient_id);
    const matchesSearch = !search || 
      ingredient?.name.toLowerCase().includes(search.toLowerCase());
    
    if (dateFilter === 'today') {
      const today = new Date().toISOString().split('T')[0];
      const logDate = new Date(log.date).toISOString().split('T')[0];
      return matchesSearch && logDate === today;
    }
    if (dateFilter === 'week') {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return matchesSearch && new Date(log.date) >= weekAgo;
    }
    if (dateFilter === 'month') {
      const monthAgo = new Date();
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      return matchesSearch && new Date(log.date) >= monthAgo;
    }
    return matchesSearch;
  });

  // Calculate totals
  const totalPurchaseValue = filteredLogs.reduce((sum, log) => sum + (log.purchase_price || 0), 0);
  const totalQuantity = filteredLogs.reduce((sum, log) => sum + log.change_amount, 0);

  const handleExport = () => {
    const lines = [
      `RESTOCK HISTORY - ${currentStore?.name}`,
      `Generated: ${new Date().toLocaleString()}`,
      `Filter: ${dateFilter === 'all' ? 'All Time' : dateFilter}`,
      ``,
      `${'Date'.padEnd(12)} | ${'Ingredient'.padEnd(25)} | ${'Qty'.padEnd(10)} | ${'Unit Cost'.padEnd(12)} | ${'Total'.padEnd(12)} | Supplier`,
      '─'.repeat(100),
      ...filteredLogs.map(log => {
        const ingredient = ingredients.find(i => i.id === log.ingredient_id);
        const supplier = suppliers.find(s => s.id === log.supplier_id);
        const date = new Date(log.date).toLocaleDateString();
        const name = (ingredient?.name || 'Unknown').substring(0, 24).padEnd(25);
        const qty = `${log.change_amount} ${ingredient?.unit || ''}`.padEnd(10);
        const unitCost = log.unit_cost ? `${log.unit_cost.toFixed(2)} MT`.padEnd(12) : 'N/A'.padEnd(12);
        const total = log.purchase_price ? `${log.purchase_price.toFixed(2)} MT`.padEnd(12) : 'N/A'.padEnd(12);
        const supplierName = supplier?.name || 'N/A';
        return `${date.padEnd(12)} | ${name} | ${qty} | ${unitCost} | ${total} | ${supplierName}`;
      }),
      '─'.repeat(100),
      `TOTAL PURCHASE VALUE: ${totalPurchaseValue.toLocaleString()} MT`,
      `TOTAL QUANTITY RESTOCKED: ${totalQuantity.toLocaleString()} units`
    ];

    const content = lines.join('\n');
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `restock-history-${currentStore?.name?.toLowerCase().replace(/\s/g, '-')}-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <Package className="w-8 h-8" />
            Histórico de Reposição
          </h1>
          <p className="text-muted-foreground">{currentStore?.name} - Registo de todas as compras de stock</p>
        </div>
        <Button onClick={handleExport} variant="outline" className="gap-2">
          <Download className="w-4 h-4" />
          Exportar
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <DollarSign className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Valor Total</p>
                <p className="text-2xl font-bold">{totalPurchaseValue.toLocaleString()} MT</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-accent/10">
                <TrendingUp className="w-5 h-5 text-accent" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Registos</p>
                <p className="text-2xl font-bold">{filteredLogs.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-secondary/10">
                <Package className="w-5 h-5 text-secondary-foreground" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Qtd. Total</p>
                <p className="text-2xl font-bold">{totalQuantity.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Pesquisar ingrediente..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              {['all', 'today', 'week', 'month'].map((filter) => (
                <Button
                  key={filter}
                  variant={dateFilter === filter ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setDateFilter(filter)}
                >
                  {filter === 'all' ? 'Tudo' : filter === 'today' ? 'Hoje' : filter === 'week' ? 'Semana' : 'Mês'}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* History List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Registo de Compras
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <p className="text-muted-foreground">A carregar...</p>
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <Package className="w-12 h-12 mb-2 opacity-30" />
              <p>Nenhum registo de reposição encontrado</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredLogs.map((log) => {
                const ingredient = ingredients.find(i => i.id === log.ingredient_id);
                const supplier = suppliers.find(s => s.id === log.supplier_id);
                
                return (
                  <div
                    key={log.id}
                    className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-muted/20 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <Package className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{ingredient?.name || 'Unknown'}</p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <span>{new Date(log.date).toLocaleDateString()}</span>
                          {supplier && (
                            <>
                              <span>•</span>
                              <span>{supplier.name}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant="secondary" className="mb-1">
                        +{log.change_amount} {ingredient?.unit}
                      </Badge>
                      <div className="flex items-center gap-2 text-sm">
                        {log.unit_cost && (
                          <span className="text-muted-foreground">{log.unit_cost.toFixed(2)} MT/un</span>
                        )}
                        {log.purchase_price && (
                          <span className="font-medium text-foreground">{log.purchase_price.toFixed(2)} MT</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function RestockHistory() {
  return (
    <MainLayout>
      <RestockHistoryContent />
    </MainLayout>
  );
}
