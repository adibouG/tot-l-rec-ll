import React from 'react';
import { User } from '../types';
import { User as UserIcon, LogOut, ShieldCheck } from 'lucide-react';

interface UserProfileProps {
  user: User;
  onLogout: () => void;
  onLogin: (name: string) => void;
}

const UserProfile: React.FC<UserProfileProps> = ({ user, onLogout, onLogin }) => {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const [tempName, setTempName] = React.useState('');

  return (
    <div className="relative">
      <button 
        onClick={() => setIsMenuOpen(!isMenuOpen)}
        className="flex items-center gap-3 pl-2 pr-4 py-2 rounded-full hover:bg-white hover:shadow-sm transition-all duration-300"
      >
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center text-gray-600 shadow-inner">
            <UserIcon size={20} />
        </div>
        <div className="text-left hidden md:block">
            <div className="text-xs font-bold text-gray-800 uppercase tracking-wide">
                {user.isTemp ? 'Guest' : user.name}
            </div>
            <div className="text-[10px] text-gray-400">
                {user.isTemp ? 'Temp Access' : 'Pro Account'}
            </div>
        </div>
      </button>

      {isMenuOpen && (
        <div className="absolute top-14 right-0 w-64 bg-white rounded-2xl shadow-xl border border-gray-100 p-4 z-20 animate-fade-in-down">
            {user.isTemp ? (
                <div className="space-y-3">
                    <p className="text-xs text-gray-500 mb-2">Create an account to sync your reminders across devices.</p>
                    <input 
                        type="text" 
                        placeholder="Enter Username" 
                        value={tempName}
                        onChange={(e) => setTempName(e.target.value)}
                        className="w-full text-sm bg-gray-50 p-2 rounded-lg border border-gray-200 outline-none focus:border-gray-400"
                    />
                    <button 
                        onClick={() => { if(tempName) { onLogin(tempName); setIsMenuOpen(false); } }}
                        className="w-full bg-gray-800 text-white text-sm py-2 rounded-lg hover:bg-gray-900"
                    >
                        Create Account
                    </button>
                    <div className="text-[10px] text-center text-gray-400 mt-2">
                        Currently using a temporary session ID.
                    </div>
                </div>
            ) : (
                <div className="space-y-3">
                     <div className="flex items-center gap-2 text-green-600 text-xs bg-green-50 p-2 rounded-lg">
                        <ShieldCheck size={14} />
                        Account Active
                     </div>
                     <button 
                        onClick={() => { onLogout(); setIsMenuOpen(false); }}
                        className="w-full flex items-center justify-center gap-2 text-red-500 hover:bg-red-50 text-sm py-2 rounded-lg transition-colors"
                    >
                        <LogOut size={16} />
                        Logout
                    </button>
                </div>
            )}
        </div>
      )}
    </div>
  );
};

export default UserProfile;