
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { LayoutDashboard, GanttChart as GanttIcon, LogIn, LogOut, User as UserIcon, Loader2 } from 'lucide-react';
import { useAuth, useUser, initiateGoogleSignIn } from '@/firebase';
import { signOut } from 'firebase/auth';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';

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
            <div className="flex items-center gap-2 sm:gap-4">
              <div className="hidden md:flex flex-col items-end mr-1">
                <span className="text-xs font-bold leading-none mb-0.5">{user.displayName}</span>
                <span className="text-[10px] text-muted-foreground leading-none">{user.email}</span>
              </div>
              <Avatar className="h-7 w-7 sm:h-8 sm:w-8 border">
                <AvatarImage src={user.photoURL || undefined} />
                <AvatarFallback className="bg-primary/10 text-primary">
                  <UserIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </AvatarFallback>
              </Avatar>
              <Button variant="ghost" size="sm" onClick={handleLogout} className="text-muted-foreground h-8 px-2 sm:px-3 text-xs sm:text-sm">
                <LogOut className="w-3.5 h-3.5 sm:w-4 sm:h-4 sm:mr-2" />
                <span className="hidden sm:inline">Sign Out</span>
              </Button>
            </div>
          ) : (
            <Button size="sm" onClick={handleLogin} disabled={isLoggingIn} className="h-8 sm:h-9 text-xs sm:text-sm px-3 sm:px-4">
              {isLoggingIn ? (
                <Loader2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 sm:mr-2 animate-spin" />
              ) : (
                <LogIn className="w-3.5 h-3.5 sm:w-4 sm:h-4 sm:mr-2" />
              )}
              Sign In
            </Button>
          )
        )}
      </div>
    </nav>
  );
}
