import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useSessionTimeout } from '@/hooks/useSessionTimeout';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Clock, LogOut } from 'lucide-react';

export const SessionTimeoutDialog: React.FC = () => {
  const { session } = useAuth();
  const { warningState, extendSession, logout } = useSessionTimeout(!!session);

  if (!warningState.type || warningState.secondsRemaining <= 0) {
    return null;
  }

  const minutes = Math.floor(warningState.secondsRemaining / 60);
  const seconds = warningState.secondsRemaining % 60;
  const timeFormatted = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;

  const isIdle = warningState.type === 'idle';

  return (
    <Dialog open={true} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md [&>button]:hidden">
        <DialogHeader>
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 text-amber-600 mb-2">
            <Clock className="h-6 w-6 animate-pulse" />
          </div>
          <DialogTitle className="text-center text-xl">
            {isIdle ? 'Sessão Prestes a Expirar' : 'Limite de Sessão Atingido'}
          </DialogTitle>
          <DialogDescription className="text-center pt-2 text-foreground/80">
            {isIdle ? (
              <>
                Você está inativo há algum tempo. Por razões de segurança, a sua sessão será encerrada em{' '}
                <span className="font-bold text-amber-600 dark:text-amber-400 text-lg">{timeFormatted}</span>.
              </>
            ) : (
              <>
                Atingiu o tempo máximo de sessão contínua (8 horas). A sua sessão será encerrada em{' '}
                <span className="font-bold text-amber-600 dark:text-amber-400 text-lg">{timeFormatted}</span>.
              </>
            )}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex flex-col sm:flex-row gap-2 mt-4 sm:justify-center">
          <Button variant="outline" onClick={logout} className="w-full sm:w-auto">
            <LogOut className="mr-2 h-4 w-4" />
            Sair Agora
          </Button>
          {isIdle && (
            <Button onClick={extendSession} className="w-full sm:w-auto bg-primary text-primary-foreground">
              Continuar Conectado
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
