import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Search, ShoppingBag } from 'lucide-react';

interface SalesItem {
  id: string;
  date: string;
  table_name: string;
  dish_name: string;
  quantity: number;
  unit_price: number;
  total: number;
  payment_method: string;
}

interface ItemizedSalesSummaryProps {
  salesData: SalesItem[];
}

export function ItemizedSalesSummary({ salesData }: ItemizedSalesSummaryProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const aggregatedItems = useMemo(() => {
    // 1. Exclude self-consumption ('self')
    const filteredData = salesData.filter((item) => item.payment_method !== 'self');

    // 2. Group and sum by dish_name
    const groups: { [key: string]: { dish_name: string; total_quantity: number; total_revenue: number } } = {};

    filteredData.forEach((item) => {
      const name = item.dish_name || 'Unknown';
      if (!groups[name]) {
        groups[name] = {
          dish_name: name,
          total_quantity: 0,
          total_revenue: 0,
        };
      }
      groups[name].total_quantity += item.quantity;
      groups[name].total_revenue += item.total;
    });

    // 3. Convert to array and sort alphabetically by item name (case insensitive)
    return Object.values(groups).sort((a, b) =>
      a.dish_name.localeCompare(b.dish_name, undefined, { sensitivity: 'base' })
    );
  }, [salesData]);

  // 4. Filter by search query
  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return aggregatedItems;
    const query = searchQuery.toLowerCase();
    return aggregatedItems.filter((item) =>
      item.dish_name.toLowerCase().includes(query)
    );
  }, [aggregatedItems, searchQuery]);

  // Calculations for the footer/summary of the filtered results
  const totalQty = filteredItems.reduce((sum, item) => sum + item.total_quantity, 0);
  const totalRev = filteredItems.reduce((sum, item) => sum + item.total_revenue, 0);

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
        <CardTitle className="flex items-center gap-2 text-xl font-bold">
          <ShoppingBag className="w-5 h-5 text-primary" />
          Itemized Sales Summary
        </CardTitle>
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search items..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8"
          />
        </div>
      </CardHeader>
      <CardContent>
        {filteredItems.length === 0 ? (
          <div className="py-6 text-center text-muted-foreground">
            {searchQuery ? 'No matching items found.' : 'No sales data to display.'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item Name</TableHead>
                  <TableHead className="text-right">Total Quantity</TableHead>
                  <TableHead className="text-right">Total Revenue</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredItems.map((item) => (
                  <TableRow key={item.dish_name}>
                    <TableCell className="font-medium">{item.dish_name}</TableCell>
                    <TableCell className="text-right">{item.total_quantity}</TableCell>
                    <TableCell className="text-right">
                      {item.total_revenue.toLocaleString()} MT
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow className="font-bold bg-muted/50">
                  <TableCell>Total</TableCell>
                  <TableCell className="text-right">{totalQty}</TableCell>
                  <TableCell className="text-right">
                    {totalRev.toLocaleString()} MT
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
