import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Settings, Plus, Trash2, Table } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface ManageTablesModalProps {
  tables: { id: string; table_number: number; name: string | null }[];
  onAddTable: () => Promise<any>;
  onDeleteTable: (tableId: string) => Promise<boolean>;
}

export function ManageTablesModal({ tables, onAddTable, onDeleteTable }: ManageTablesModalProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleAddTable = async () => {
    setIsLoading(true);
    await onAddTable();
    setIsLoading(false);
  };

  const handleDeleteTable = async (tableId: string) => {
    setIsLoading(true);
    await onDeleteTable(tableId);
    setIsLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Settings className="w-4 h-4" />
          Gerir Mesas
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Table className="w-5 h-5" />
            Gerir Mesas
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              {tables.length} tables configured
            </span>
            <Button onClick={handleAddTable} disabled={isLoading} size="sm" className="gap-2">
              <Plus className="w-4 h-4" />
              Addicinoar Mesa
            </Button>
          </div>
          
          <ScrollArea className="h-64 border rounded-lg p-2">
            <div className="space-y-2">
              {tables.map(table => (
                <div 
                  key={table.id} 
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-md bg-primary/10">
                      <Table className="w-4 h-4 text-primary" />
                    </div>
                    <span className="font-medium">{table.name || `Table ${table.table_number}`}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={() => handleDeleteTable(table.id)}
                    disabled={isLoading}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
              
              {tables.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Table className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p>No tables configured</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}