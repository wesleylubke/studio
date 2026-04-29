
"use client";

import Link from 'next/link';
import { LayoutDashboard, GanttChartSquare, LogIn, LogOut, User as UserIcon } from 'lucide-react';
import { useAuth, useUser } from '@/firebase';
import { GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export default function Navbar() {
  const auth = useAuth();
  const { user, isUserLoading } = useUser();

  const handleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Login failed:", error);
    }
  };

  const handleLogout = () => signOut(auth);

  return (
    <nav className="border-b bg-card px-6 py-4 flex items-center justify-between sticky top-0 z-50">
      <Link href="/" className="flex items-center gap-2 group">
        <div className="bg-primary p-2 rounded-lg group-hover:scale-110 transition-transform">
          <GanttChartSquare className="w-5 h-5 text-primary-foreground" />
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
