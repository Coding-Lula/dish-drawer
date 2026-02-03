import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, AppRole } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Store } from 'lucide-react';
import { z } from 'zod';
import { useStores } from '@/hooks/useSupabaseData';

const emailSchema = z.string().email('Invalid email address');
const passwordSchema = z.string().min(6, 'Password must be at least 6 characters');

export default function Auth() {
  const navigate = useNavigate();
  const { user, role, loading, signIn, signUp } = useAuth();
  const { stores, loading: storesLoading } = useStores();
  const { toast } = useToast();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupName, setSignupName] = useState('');
  const [signupRole, setSignupRole] = useState<AppRole>('cashier');
  const [selectedStoreIds, setSelectedStoreIds] = useState<string[]>([]);
  const [globalManagerAccess, setGlobalManagerAccess] = useState(false);

  useEffect(() => {
    // Only redirect if user exists AND has a role assigned
    // This prevents the cycle where Auth redirects to / but ProtectedRoute redirects back
    if (!loading && user && role) {
      navigate('/pos');
    }
  }, [user, role, loading, navigate]);

  // Reset store selection when role changes
  useEffect(() => {
    if (signupRole === 'cashier') {
      setGlobalManagerAccess(false);
    }
  }, [signupRole]);

  const toggleStoreSelection = (storeId: string) => {
    setSelectedStoreIds(prev => 
      prev.includes(storeId) 
        ? prev.filter(id => id !== storeId)
        : [...prev, storeId]
    );
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      emailSchema.parse(loginEmail);
      passwordSchema.parse(loginPassword);
    } catch (err) {
      if (err instanceof z.ZodError) {
        toast({
          title: 'Erro de Validação',
          description: err.errors[0].message,
          variant: 'destructive',
        });
        return;
      }
    }
    
    setIsSubmitting(true);
    const { error } = await signIn(loginEmail, loginPassword);
    setIsSubmitting(false);
    
    if (error) {
      toast({
        title: 'Falha no Login',
        description: error.message === 'Invalid login credentials' 
          ? 'Email ou senha inválidos' 
          : error.message,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Bem-vindo de volta!',
        description: 'Login realizado com sucesso.',
      });
      // Navigation will happen via useEffect once role is loaded
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      emailSchema.parse(signupEmail);
      passwordSchema.parse(signupPassword);
      if (!signupName.trim()) throw new Error('Nome é obrigatório');
      
      // Validate store selection
      if (signupRole === 'cashier' && selectedStoreIds.length === 0) {
        toast({
          title: 'Erro de Validação',
          description: 'Caixas devem ser atribuídos a pelo menos uma loja',
          variant: 'destructive',
        });
        return;
      }
      
      if (signupRole === 'manager' && !globalManagerAccess && selectedStoreIds.length === 0) {
        toast({
          title: 'Erro de Validação',
          description: 'Selecione lojas ou marque acesso global',
          variant: 'destructive',
        });
        return;
      }
    } catch (err) {
      if (err instanceof z.ZodError) {
        toast({
          title: 'Erro de Validação',
          description: err.errors[0].message,
          variant: 'destructive',
        });
        return;
      }
      if (err instanceof Error) {
        toast({
          title: 'Erro de Validação',
          description: err.message,
          variant: 'destructive',
        });
        return;
      }
    }
    
    setIsSubmitting(true);
    
    // Determine store IDs to pass
    const storeIdsToAssign = (signupRole === 'manager' && globalManagerAccess) 
      ? undefined // null store_id for global access
      : selectedStoreIds;
    
    const { error } = await signUp(signupEmail, signupPassword, signupName, signupRole, storeIdsToAssign);
    setIsSubmitting(false);
    
    if (error) {
      const message = error.message.includes('already registered')
        ? 'Este email já está registrado. Por favor, faça login.'
        : error.message;
      toast({
        title: 'Falha no Cadastro',
        description: message,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Conta Criada!',
        description: 'Agora você pode acessar o sistema.',
      });
      // Navigation will happen via useEffect once role is loaded
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-primary/10 rounded-full">
              <Store className="h-8 w-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl">Nexus POS</CardTitle>
          <CardDescription>Entre para acessar o sistema</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="login">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="login">Login</TabsTrigger>
             {/* <TabsTrigger value="signup">Cadastrar</TabsTrigger>*/}
            </TabsList>
            
            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email">Email</Label>
                  <Input
                    id="login-email"
                    type="email"
                    placeholder="seu@email.com"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login-password">Senha</Label>
                  <Input
                    id="login-password"
                    type="password"
                    placeholder="••••••••"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Entrando...
                    </>
                  ) : (
                    'Entrar'
                  )}
                </Button>
              </form>
            </TabsContent>
            
            <TabsContent value="signup">
              <form onSubmit={handleSignup} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-name">Nome</Label>
                  <Input
                    id="signup-name"
                    type="text"
                    placeholder="João Silva"
                    value={signupName}
                    onChange={(e) => setSignupName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="seu@email.com"
                    value={signupEmail}
                    onChange={(e) => setSignupEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Senha</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    placeholder="Mínimo 6 caracteres"
                    value={signupPassword}
                    onChange={(e) => setSignupPassword(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-role">Função</Label>
                  <Select value={signupRole} onValueChange={(value: AppRole) => setSignupRole(value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecionar função" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="manager">Gerente</SelectItem>
                      <SelectItem value="cashier">Caixa</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {/* Store Assignment Section */}
                <div className="space-y-3">
                  <Label>Atribuição de Lojas</Label>
                  
                  {signupRole === 'manager' && (
                    <div className="flex items-center space-x-2 p-3 rounded-lg bg-muted/50">
                      <Checkbox
                        id="global-access"
                        checked={globalManagerAccess}
                        onCheckedChange={(checked) => {
                          setGlobalManagerAccess(checked === true);
                          if (checked) setSelectedStoreIds([]);
                        }}
                      />
                      <label
                        htmlFor="global-access"
                        className="text-sm font-medium leading-none cursor-pointer"
                      >
                        Acesso global (todas as lojas)
                      </label>
                    </div>
                  )}
                  
                  {(!globalManagerAccess || signupRole === 'cashier') && (
                    <div className="space-y-2 max-h-32 overflow-y-auto border rounded-lg p-2">
                      {storesLoading ? (
                        <div className="flex items-center justify-center py-4">
                          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                        </div>
                      ) : stores.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-2">
                          Nenhuma loja disponível
                        </p>
                      ) : (
                        stores.map(store => (
                          <div key={store.id} className="flex items-center space-x-2">
                            <Checkbox
                              id={`store-${store.id}`}
                              checked={selectedStoreIds.includes(store.id)}
                              onCheckedChange={() => toggleStoreSelection(store.id)}
                            />
                            <label
                              htmlFor={`store-${store.id}`}
                              className="text-sm leading-none cursor-pointer"
                            >
                              {store.name}
                            </label>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                  
                  {signupRole === 'cashier' && (
                    <p className="text-xs text-muted-foreground">
                      Caixas devem ser atribuídos a pelo menos uma loja
                    </p>
                  )}
                </div>
                
                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Criando conta...
                    </>
                  ) : (
                    'Criar Conta'
                  )}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
