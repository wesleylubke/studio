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
      console.error("Detailed Login Error:", error);
      
      let errorMessage = error.message || "An unexpected error occurred. Please try again.";
      let title = "Login Failed";

      if (error.code === 'auth/operation-not-allowed') {
        title = "Sign-in Provider Disabled";
        errorMessage = "Google Sign-In is not enabled. Please enable it in the Firebase Console under Authentication > Sign-in method.";
      } else if (error.code === 'auth/popup-blocked') {
        errorMessage = "The login popup was blocked by your browser. Please allow popups for this site.";
      } else if (error.code === 'auth/unauthorized-domain') {
        errorMessage = "This domain is not authorized for Firebase Authentication. Add it to the list of authorized domains in the Firebase Console.";
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
    <nav className="border-b bg-card px-6 py-4 flex items-center justify-between sticky top-0 z-50">
      <Link href="/" className="flex items-center gap-2 group">
        <div className="bg-primary p-2 rounded-lg group-hover:scale-110 transition-transform">
          <GanttIcon className="w-5 h-5 text-primary-foreground" />
        </div>
        <span className="font-headline font-bold text-xl tracking-tight text-foreground">
          Gantt<span className="text-primary">Flow</span>
        </span>
      </Link>
      
      <div className="flex items-center gap-6">
        {user && (
          <Link href="/" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2">
            <LayoutDashboard className="w-4 h-4" />
            Projects
          </Link>
        )}

        {isUserLoading ? (
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        ) : (
          user ? (
            <div className="flex items-center gap-4">
              <div className="flex flex-col items-end mr-2 hidden sm:flex">
                <span className="text-xs font-bold">{user.displayName}</span>
                <span className="text-[10px] text-muted-foreground">{user.email}</span>
              </div>
              <Avatar className="h-8 w-8 border">
                <AvatarImage src={user.photoURL || undefined} />
                <AvatarFallback className="bg-primary/10 text-primary">
                  <UserIcon className="w-4 h-4" />
                </AvatarFallback>
              </Avatar>
              <Button variant="ghost" size="sm" onClick={handleLogout} className="text-muted-foreground">
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
            </div>
          ) : (
            <Button size="sm" onClick={handleLogin} disabled={isLoggingIn}>
              {isLoggingIn ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <LogIn className="w-4 h-4 mr-2" />
              )}
              Sign In
            </Button>
          )
        )}
      </div>
    </nav>
  );
}
