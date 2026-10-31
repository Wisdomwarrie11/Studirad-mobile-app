import React, { useEffect, useState } from 'react';
import { adminAuth } from '../../firebase';
import { useAuth } from '../../context/AuthContext';
import { ShieldAlert } from 'lucide-react';
import { AdminDashboardSkeleton } from '../common/Skeletons';

interface AdminProtectedRouteProps {
  children: React.ReactNode;
}

export const AdminProtectedRoute: React.FC<AdminProtectedRouteProps> = ({ children }) => {
  const { openAuthWithTab, currentUser } = useAuth();
  const [user, setUser] = useState<any>(adminAuth.currentUser || (currentUser?.isAdmin ? currentUser : null));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Listen for auth state changes on adminAuth (studirad-admin-portal)
    const unsubscribe = adminAuth.onAuthStateChanged((currentUser: any) => {
      setUser(currentUser || (currentUser?.isAdmin ? currentUser : null));
      setLoading(false);
    });

    // Cleanup subscription
    return () => unsubscribe();
  }, [currentUser]);

  // Show AdminDashboardSkeleton while checking auth status
  if (loading) {
    return <AdminDashboardSkeleton />;
  }

  // Redirect to login if user is not authenticated
  if (!user && !currentUser?.isAdmin) {
    return (
      <div className="min-h-screen w-full bg-[#0B0F17] text-slate-100 flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md bg-[#121824] border border-slate-800 rounded-3xl p-6 text-center shadow-2xl">
          <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-center mx-auto mb-4">
            <ShieldAlert className="w-7 h-7" />
          </div>
          <h2 className="text-base font-bold text-white mb-2">Administrator Access Required</h2>
          <p className="text-xs text-slate-400 mb-6 leading-relaxed">
            This dashboard is strictly protected. Please sign in with verified administrator credentials provisioned in the admin portal.
          </p>
          <button
            onClick={() => openAuthWithTab('adminLogin')}
            className="w-full h-11 rounded-xl bg-[#FF7F32] hover:bg-[#e86f26] text-white font-bold text-xs flex items-center justify-center transition-colors cursor-pointer"
          >
            Go to Admin Login
          </button>
        </div>
      </div>
    );
  }

  // Render children if authenticated
  return <>{children}</>;
};

export default AdminProtectedRoute;
