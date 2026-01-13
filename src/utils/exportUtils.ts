import type { Expense } from '@/hooks/useSupabaseData';
import type { TableSalesBreakdown } from '@/hooks/useTransactionItems';

export function exportExpensesToCSV(expenses: Expense[], filename: string) {
  const headers = ['Date', 'Category', 'Description', 'Amount (MT)', 'Status'];
  const rows = expenses.map(exp => [
    new Date(exp.date).toLocaleDateString(),
    exp.category || 'Uncategorized',
    exp.description || '',
    exp.amount.toFixed(2),
    exp.is_deducted ? 'Deducted' : 'Pending'
  ]);
  
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n');
  
  downloadFile(csvContent, `${filename}.csv`, 'text/csv');
}

export function exportExpensesToPDF(expenses: Expense[], storeName: string, dateRange: string) {
  // Simple text-based PDF content (for production, use a library like jsPDF)
  const content = [
    `EXPENSE REPORT`,
    `Store: ${storeName}`,
    `Period: ${dateRange}`,
    `Generated: ${new Date().toLocaleString()}`,
    '',
    '═'.repeat(60),
    '',
    ...expenses.map(exp => [
      `Date: ${new Date(exp.date).toLocaleDateString()}`,
      `Category: ${exp.category || 'Uncategorized'}`,
      `Description: ${exp.description || 'N/A'}`,
      `Amount: ${exp.amount.toLocaleString()} MT`,
      `Status: ${exp.is_deducted ? 'Deducted' : 'Pending'}`,
      '─'.repeat(40)
    ].join('\n')),
    '',
    '═'.repeat(60),
    `TOTAL: ${expenses.reduce((sum, e) => sum + e.amount, 0).toLocaleString()} MT`
  ].join('\n');
  
  downloadFile(content, `expense-report-${storeName.toLowerCase().replace(/\s/g, '-')}.txt`, 'text/plain');
}

export function exportDailyReportPDF(
  storeName: string,
  grandTotal: number,
  allocations: { name: string; amount: number; percent: number }[],
  stockExpenses: number,
  tableSales?: TableSalesBreakdown[]
) {
  const lines = [
    `DAILY REVENUE ALLOCATION REPORT`,
    `Store: ${storeName}`,
    `Date: ${new Date().toLocaleDateString()}`,
    `Generated: ${new Date().toLocaleString()}`,
    '',
    '═'.repeat(80),
    '',
    `GRAND TOTAL: ${grandTotal.toLocaleString()} MT`,
    '',
    '─'.repeat(40),
    'ALLOCATIONS:',
    '─'.repeat(40),
    ...allocations.map(a => `${a.name}: ${a.amount.toLocaleString()} MT (${a.percent.toFixed(1)}%)`),
    '',
    '─'.repeat(40),
    `Stock Expenses Deducted: ${stockExpenses.toLocaleString()} MT`,
    ''
  ];

  // Add table sales breakdown if provided
  if (tableSales && tableSales.length > 0) {
    lines.push('═'.repeat(80));
    lines.push('');
    lines.push('SALES BY TABLE:');
    lines.push('─'.repeat(80));
    
    tableSales.forEach(table => {
      lines.push('');
      lines.push(`📍 ${table.table_name} - Total: ${table.total.toLocaleString()} MT`);
      lines.push('─'.repeat(60));
      lines.push(`${'Item'.padEnd(35)} | ${'Qty'.padEnd(6)} | ${'Price'.padEnd(12)} | Subtotal`);
      lines.push('─'.repeat(60));
      
      // Aggregate items by dish
      const itemMap = new Map<string, { name: string; quantity: number; unitPrice: number }>();
      table.items.forEach(item => {
        const key = item.dish_id || 'unknown';
        const existing = itemMap.get(key);
        if (existing) {
          existing.quantity += item.quantity;
        } else {
          itemMap.set(key, {
            name: item.dish_name || 'Unknown Item',
            quantity: item.quantity,
            unitPrice: item.unit_price
          });
        }
      });
      
      itemMap.forEach(item => {
        const subtotal = item.quantity * item.unitPrice;
        const name = item.name.substring(0, 34).padEnd(35);
        const qty = item.quantity.toString().padEnd(6);
        const price = `${item.unitPrice.toFixed(0)} MT`.padEnd(12);
        lines.push(`${name} | ${qty} | ${price} | ${subtotal.toLocaleString()} MT`);
      });
    });
    
    lines.push('');
  }

  lines.push('═'.repeat(80));
  
  const content = lines.join('\n');
  
  downloadFile(content, `daily-report-${storeName.toLowerCase().replace(/\s/g, '-')}-${new Date().toISOString().split('T')[0]}.txt`, 'text/plain');
}

function downloadFile(content: string, filename: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}