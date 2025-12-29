import * as XLSX from 'xlsx';
import type { 
  IncomeSource, 
  ExpenseParentCategory, 
  ExpenseCategoryWithParent, 
  FinancialTransaction 
} from '@/hooks/useFinanceData';

interface ExportData {
  month: number;
  year: number;
  lockDate: string;
  totalIncome: number;
  totalExpenses: number;
  globalBalance: number;
  incomeBySource: { source: IncomeSource; amount: number }[];
  expensesByParentCategory: { parent: ExpenseParentCategory; amount: number }[];
  transactions: FinancialTransaction[];
  budgetVsActual: {
    category: ExpenseCategoryWithParent;
    parentName: string;
    budget: number;
    actual: number;
    variance: number;
    percent: number;
  }[];
  storeName: string;
}

export function exportFinancialReport(data: ExportData) {
  const wb = XLSX.utils.book_new();
  const monthName = getMonthName(data.month);
  
  // Sheet 1: Summary
  const summaryData = [
    ['FINANCIAL REPORT'],
    [`MONTH: ${monthName} ${data.year}`],
    [`LOCK DATE: ${data.lockDate}`],
    [`STORE: ${data.storeName}`],
    [],
    ['FINANCIAL SUMMARY'],
    ['Total Income:', formatCurrency(data.totalIncome)],
    ['Total Expenses:', formatCurrency(data.totalExpenses)],
    ['Global Balance:', formatCurrency(data.globalBalance)],
    [],
    ['INCOME BY SOURCE'],
    ...data.incomeBySource.map(item => [item.source.name, formatCurrency(item.amount)]),
    [],
    ['EXPENSES BY CATEGORY'],
    ...data.expensesByParentCategory.map(item => [item.parent.name, formatCurrency(item.amount)]),
  ];
  
  const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
  summarySheet['!cols'] = [{ wch: 25 }, { wch: 20 }];
  XLSX.utils.book_append_sheet(wb, summarySheet, 'Summary');

  // Sheet 2: Detailed Transactions
  const transactionsData = [
    ['Date', 'Type', 'Supplier', 'Amount (MT)', 'Category', 'Source', 'Invoice', 'Description'],
    ...data.transactions.map(t => [
      t.date,
      t.type.charAt(0).toUpperCase() + t.type.slice(1),
      t.supplier || '-',
      Number(t.amount),
      t.expense_category_id || '-',
      t.source_id || '-',
      t.invoice_no || '-',
      t.description || '-'
    ])
  ];
  
  const transactionsSheet = XLSX.utils.aoa_to_sheet(transactionsData);
  transactionsSheet['!cols'] = [
    { wch: 12 }, { wch: 10 }, { wch: 20 }, { wch: 15 }, 
    { wch: 20 }, { wch: 15 }, { wch: 15 }, { wch: 30 }
  ];
  XLSX.utils.book_append_sheet(wb, transactionsSheet, 'Transactions');

  // Sheet 3: Budget vs Actual
  const budgetData = [
    ['Category', 'Budget (MT)', 'Actual (MT)', 'Variance (MT)', '%'],
    ...data.budgetVsActual.map(item => [
      `${item.parentName} → ${item.category.name}`,
      item.budget,
      item.actual,
      item.variance,
      `${item.percent.toFixed(0)}%`
    ])
  ];
  
  const budgetSheet = XLSX.utils.aoa_to_sheet(budgetData);
  budgetSheet['!cols'] = [{ wch: 30 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 10 }];
  XLSX.utils.book_append_sheet(wb, budgetSheet, 'Budget vs Actual');

  // Download
  const fileName = `Financial_Report_${monthName}_${data.year}.xlsx`;
  XLSX.writeFile(wb, fileName);
  
  return fileName;
}

function formatCurrency(amount: number): string {
  return `${amount.toLocaleString()} MT`;
}

function getMonthName(month: number): string {
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 
                  'July', 'August', 'September', 'October', 'November', 'December'];
  return months[month - 1] || '';
}