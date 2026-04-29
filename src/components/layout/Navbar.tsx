
"use client";

import Link from 'next/link';
import { LayoutDashboard, GanttChart, LogIn, LogOut, User as UserIcon } from 'lucide-react';
import { useAuth, useUser } from '@/firebase';
import { GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';

export default function Navbar() {
  const auth = useAuth();
  const { user, isUserLoading } = useUser();
  const { toast } = useToast();

  const handleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error: any) {
      console.error("Firebase Auth Error:", error);
      
      if (error.code === 'auth/operation-not-allowed') {
        toast({
          title: "Sign-in Provider Disabled",
          description: "Google Sign-In must be enabled in the Firebase Console. Go to Authentication > Sign-in method and enable the Google provider.",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Login Failed",
          description: error.message || "An unexpected error occurred. Please try again.",
          variant: "destructive"
        });
      }
    }
  };

  const handleLogout = () => signOut(auth);

  return (
    <nav className="border-b bg-card px-6 py-4 flex items-center justify-between sticky top-0 z-50">
      <Link href="/" className="flex items-center gap-2 group">
        <div className="bg-primary p-2 rounded-lg group-hover:scale-110 transition-transform">
          <GanttChart className="w-5 h-5 text-primary-foreground" />
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

        {!isUserLoading && (
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
            <Button size="sm" onClick={handleLogin}>
              <LogIn className="w-4 h-4 mr-2" />
              Sign In
            </Button>
          )
        )}
      </div>
    </nav>
  );
}
