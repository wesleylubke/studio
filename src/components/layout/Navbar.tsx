
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { LayoutDashboard, GanttChart as GanttIcon, LogIn, LogOut, User as UserIcon, Loader2 } from 'lucide-react';
import { useAuth, useUser, initiateGoogleSignIn } from '@/firebase';
import { signOut } from 'firebase/auth';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export default function Navbar() {
  const auth = useAuth();
  const { user, isUserLoading } = useUser();
  const { toast } = useToast();
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleLogin = async () => {
    setIsLoggingIn(true);
    try {
      await initiateGoogleSignIn(auth);
    } catch (error: any) {
      if (error.code === 'auth/popup-closed-by-user') return;
      
      console.error("Detailed Login Error:", error);
      
      let errorMessage = error.message || "An unexpected error occurred. Please try again.";
      let title = "Login Failed";

      if (error.code === 'auth/operation-not-allowed') {
        title = "Provider Disabled";
        errorMessage = "Google Sign-In is not enabled in Firebase Console.";
      } else if (error.code === 'auth/unauthorized-domain') {
        title = "Unauthorized Domain";
        const domain = typeof window !== 'undefined' ? window.location.hostname : 'this domain';
        errorMessage = `Please add ${domain} to Firebase authorized domains.`;
      }

      toast({
        title,
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = () => signOut(auth);

  return (
    <nav className="border-b bg-card px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between sticky top-0 z-50">
      <Link href="/" className="flex items-center gap-2 group">
        <div className="bg-primary p-1.5 sm:p-2 rounded-lg group-hover:scale-110 transition-transform">
          <GanttIcon className="w-4 h-4 sm:w-5 sm:h-5 text-primary-foreground" />
        </div>
        <span className="font-headline font-bold text-lg sm:text-xl tracking-tight text-foreground">
          Gantt<span className="text-primary">Flow</span>
        </span>
      </Link>
      
      <div className="flex items-center gap-3 sm:gap-6">
        {user && (
          <Link href="/" className="text-xs sm:text-sm font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5 sm:gap-2">
            <LayoutDashboard className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span className="hidden xs:inline">Dashboard</span>
          </Link>
        )}

        {isUserLoading ? (
          <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin text-muted-foreground" />
        ) : (
          user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <div className="flex items-center gap-2 sm:gap-4 cursor-pointer hover:opacity-80 transition-all outline-none">
                  <div className="hidden md:flex flex-col items-end mr-1">
                    <span className="text-xs font-bold leading-none mb-0.5">{user.displayName}</span>
                    <span className="text-[10px] text-muted-foreground leading-none">{user.email}</span>
                  </div>
                  <Avatar className="h-8 w-8 sm:h-9 sm:w-9 border-2 border-primary/20">
                    <AvatarImage src={user.photoURL || undefined} />
                    <AvatarFallback className="bg-primary/10 text-primary">
                      <UserIcon className="w-4 h-4" />
                    </AvatarFallback>
                  </Avatar>
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64 rounded-xl p-2 shadow-2xl">
                <DropdownMenuLabel className="font-normal p-3">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-black leading-none">{user.displayName}</p>
                    <p className="text-[10px] leading-none text-muted-foreground truncate">{user.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  className="text-destructive focus:text-destructive focus:bg-destructive/10 cursor-pointer rounded-lg font-bold p-3"
                  onClick={handleLogout}
                >
                  <LogOut className="mr-3 h-4 w-4" />
                  <span>Sair da Conta</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button size="sm" onClick={handleLogin} disabled={isLoggingIn} className="h-8 sm:h-9 text-xs sm:text-sm px-3 sm:px-4 rounded-full font-bold">
              {isLoggingIn ? (
                <Loader2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 sm:mr-2 animate-spin" />
              ) : (
                <LogIn className="w-3.5 h-3.5 sm:w-4 sm:h-4 sm:mr-2" />
              )}
              Entrar
            </Button>
          )
        )}
      </div>
    </nav>
  );
}
