import Link from 'next/link';
import { LayoutDashboard, GanttChartSquare } from 'lucide-react';

export default function Navbar() {
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
        <Link href="/" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2">
          <LayoutDashboard className="w-4 h-4" />
          Projects
        </Link>
      </div>
    </nav>
  );
}