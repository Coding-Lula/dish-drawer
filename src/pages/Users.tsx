import { useEffect, useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useStores } from '@/hooks/useSupabaseData';
import { AppRole } from '@/hooks/useAuth';
import { Loader2, UserPlus, UserCog, Mail, Shield } from 'lucide-react';

interface ManagedUser {
  id: string;
  email: string;
  display_name: string | null;
  created_at: string;
  last_sign_in_at: string | null;
  roles: { role: AppRole; store_id: string | null }[];
}

function UsersContent() {
  const { toast } = useToast();
  const { stores } = useStores();
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [role, setRole] = useState<AppRole>('cashier');
  const [globalAccess, setGlobalAccess] = useState(false);
  const [storeIds, setStoreIds] = useState<string[]>([]);

  const loadUsers = async () => {
    setLoading(true);
    const { data, error } = await supabase.functions.invoke('admin-list-users');
    if (error) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    } else if (data?.users) {
      setUsers(data.users);
    }
    setLoading(false);
  };

  useEffect(() => { loadUsers(); }, []);

  const toggleStore = (id: string) => {
    setStoreIds(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]);
  };

  const reset = () => {
    setEmail(''); setPassword(''); setDisplayName('');
    setRole('cashier'); setGlobalAccess(false); setStoreIds([]);
  };

  const handleCreate = async () => {
    if (!email || !password || !displayName) {
      toast({ title: 'Preencha todos os campos', variant: 'destructive' }); return;
    }
    if (role === 'cashier' && storeIds.length === 0) {
      toast({ title: 'Caixas devem ter pelo menos uma loja', variant: 'destructive' }); return;
    }
    if (role === 'manager' && !globalAccess && storeIds.length === 0) {
      toast({ title: 'Selecione lojas ou marque acesso global', variant: 'destructive' }); return;
    }
    setSubmitting(true);
    const { data, error } = await supabase.functions.invoke('admin-create-user', {
      body: { email, password, displayName, role, storeIds, globalAccess },
    });
    setSubmitting(false);
    if (error || data?.error) {
      toast({ title: 'Falha ao criar utilizador', description: error?.message || data?.error, variant: 'destructive' });
      return;
    }
    toast({ title: 'Utilizador criado com sucesso' });
    setOpen(false);
    reset();
    loadUsers();
  };

  const storeName = (id: string | null) => id ? stores.find(s => s.id === id)?.name || '—' : 'Todas as lojas';

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <UserCog className="w-7 h-7 text-primary" />
            Utilizadores
          </h1>
          <p className="text-muted-foreground">Gerir contas, funções e acesso a lojas</p>
        </div>
        <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) reset(); }}>
          <DialogTrigger asChild>
            <Button className="gap-2"><UserPlus className="w-4 h-4" />Novo Utilizador</Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle>Criar Utilizador</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Nome</Label>
                <Input value={displayName} onChange={e => setDisplayName(e.target.value)} placeholder="João Silva" />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="user@email.com" />
              </div>
              <div className="space-y-2">
                <Label>Senha</Label>
                <Input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Mínimo 6 caracteres" />
              </div>
              <div className="space-y-2">
                <Label>Nível de Senioridade</Label>
                <Select value={role} onValueChange={(v: AppRole) => { setRole(v); if (v === 'cashier') setGlobalAccess(false); }}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="manager">Gerente</SelectItem>
                    <SelectItem value="cashier">Caixa</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {role === 'manager' && (
                <div className="flex items-center space-x-2 p-3 rounded-lg bg-muted/50">
                  <Checkbox id="global" checked={globalAccess} onCheckedChange={(c) => { setGlobalAccess(c === true); if (c) setStoreIds([]); }} />
                  <label htmlFor="global" className="text-sm font-medium cursor-pointer">Acesso global (todas as lojas)</label>
                </div>
              )}
              {(!globalAccess || role === 'cashier') && (
                <div className="space-y-2">
                  <Label>Lojas</Label>
                  <div className="border rounded-lg p-2 max-h-40 overflow-y-auto space-y-1">
                    {stores.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-2">Nenhuma loja</p>
                    ) : stores.map(s => (
                      <div key={s.id} className="flex items-center space-x-2">
                        <Checkbox id={`s-${s.id}`} checked={storeIds.includes(s.id)} onCheckedChange={() => toggleStore(s.id)} />
                        <label htmlFor={`s-${s.id}`} className="text-sm cursor-pointer">{s.name}</label>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button onClick={handleCreate} disabled={submitting}>
                {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Criar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader><CardTitle>Todos os Utilizadores ({users.length})</CardTitle></CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
          ) : users.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">Nenhum utilizador encontrado</p>
          ) : (
            <div className="space-y-3">
              {users.map(u => {
                const primaryRole = u.roles[0]?.role;
                const isGlobalManager = u.roles.some(r => r.role === 'manager' && r.store_id === null);
                return (
                  <div key={u.id} className="p-4 border border-border rounded-lg flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <span className="text-sm font-semibold text-primary">{(u.display_name || u.email)[0]?.toUpperCase()}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold truncate">{u.display_name || '—'}</p>
                        <p className="text-sm text-muted-foreground flex items-center gap-1 truncate"><Mail className="w-3 h-3" />{u.email}</p>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {primaryRole && (
                            <Badge variant={primaryRole === 'manager' ? 'default' : 'secondary'} className="gap-1">
                              <Shield className="w-3 h-3" />{primaryRole === 'manager' ? 'Gerente' : 'Caixa'}
                            </Badge>
                          )}
                          {isGlobalManager ? (
                            <Badge variant="outline">Acesso Global</Badge>
                          ) : (
                            u.roles.filter(r => r.store_id).map((r, i) => (
                              <Badge key={i} variant="outline">{storeName(r.store_id)}</Badge>
                            ))
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-right text-xs text-muted-foreground shrink-0">
                      <p>Criado: {new Date(u.created_at).toLocaleDateString()}</p>
                      {u.last_sign_in_at && <p>Último: {new Date(u.last_sign_in_at).toLocaleDateString()}</p>}
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

export default function UsersPage() {
  return <MainLayout><UsersContent /></MainLayout>;
}