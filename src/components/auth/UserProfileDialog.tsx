
'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { User, Loader2, Save, Image as ImageIcon } from 'lucide-react';
import { updateProfile, User as FirebaseUser } from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';

interface UserProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: FirebaseUser;
}

export default function UserProfileDialog({ open, onOpenChange, user }: UserProfileDialogProps) {
  const [displayName, setDisplayName] = useState('');
  const [photoURL, setPhotoURL] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (open && user) {
      setDisplayName(user.displayName || '');
      setPhotoURL(user.photoURL || '');
    }
  }, [open, user]);

  const handleSave = async () => {
    if (!displayName.trim()) return;
    setIsLoading(true);
    try {
      await updateProfile(user, {
        displayName: displayName.trim(),
        photoURL: photoURL.trim(),
      });
      toast({
        title: "Perfil atualizado!",
        description: "Suas alterações foram salvas com sucesso.",
      });
      onOpenChange(false);
    } catch (error: any) {
      console.error("Error updating profile:", error);
      toast({
        title: "Erro ao atualizar",
        description: error.message || "Ocorreu um erro ao salvar seu perfil.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95%] sm:max-w-[420px] rounded-3xl p-6 sm:p-8">
        <DialogHeader className="mb-4">
          <DialogTitle className="text-xl sm:text-2xl font-black text-left flex items-center gap-3">
            <User className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />
            Editar Perfil
          </DialogTitle>
          <DialogDescription className="text-sm sm:text-base text-left">
            Atualize suas informações de identificação no GanttFlow.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-6 py-2">
          <div className="grid gap-2">
            <Label htmlFor="displayName" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Nome de Exibição</Label>
            <Input 
              id="displayName" 
              placeholder="Seu nome" 
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="h-10 sm:h-12 rounded-xl bg-muted/30 border-none focus-visible:ring-primary text-sm sm:text-base"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="photoURL" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
              <ImageIcon className="w-3 h-3" /> URL do Avatar
            </Label>
            <Input 
              id="photoURL" 
              placeholder="https://exemplo.com/foto.jpg" 
              value={photoURL}
              onChange={(e) => setPhotoURL(e.target.value)}
              className="h-10 sm:h-12 rounded-xl bg-muted/30 border-none focus-visible:ring-primary text-sm sm:text-base"
            />
          </div>
        </div>
        <DialogFooter className="mt-8 flex flex-col-reverse sm:flex-row gap-2">
          <Button variant="outline" className="rounded-full h-10 sm:h-12 font-bold px-6" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button 
            className="rounded-full h-10 sm:h-12 bg-primary hover:bg-primary/90 font-bold px-8 shadow-lg min-w-[120px]" 
            onClick={handleSave}
            disabled={isLoading || !displayName.trim()}
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <Save className="w-5 h-5 mr-2" />
                Salvar
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
