import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  Cpu, 
  Heart,
  History,
  Menu, 
  X,
  LogOut,
  LogIn,
  UserPlus,
  Home as HomeIcon
} from 'lucide-react';

const Layout = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  // Check if user is logged in (including guest)
  const isLoggedIn = () => {
    const user = sessionStorage.getItem('user');
    return !!user; // Returns true if user exists (including guest)
  };

  const showSidebar = isLoggedIn();

  // Sidebar menu items for logged-in users
  const menuItems = [
    {
      name: 'Automate',
      icon: <Cpu size={20} />,
      path: '/automate',
      color: 'text-pink-400'
    },
    {
      name: 'Favorites',
      icon: <Heart size={20} />,
      path: '/favorites',
      color: 'text-red-400'
    }

  ];

  // Navigation items for guest (no sidebar, just top links)
  const guestNavItems = [
    {
      name: 'Home',
      icon: <HomeIcon size={20} />,
      path: '/'
    },
    {
      name: 'Automate',
      icon: <Cpu size={20} />,
      path: '/automate'
    },
    {
      name: 'Parts List',
      icon: <History size={20} />,
      path: '/lists'
    },
    {
      name: 'Ask AI',
      icon: <Heart size={20} />,
      path: '/ask'
    }
  ];

  const handleLogout = () => {
    sessionStorage.removeItem('user');
    navigate('/');
    window.location.reload();
  };

  const getUserInitials = () => {
    const user = JSON.parse(sessionStorage.getItem('user'));
    if (user && user.fullname) {
      const names = user.fullname.split(' ');
      if (names.length >= 2) {
        return (names[0][0] + names[names.length - 1][0]).toUpperCase();
      }
      return user.fullname.substring(0, 2).toUpperCase();
    }
    return 'U';
  };

  const getUserName = () => {
    const user = JSON.parse(sessionStorage.getItem('user'));
    if (user) {
      return user.isGuest ? 'Guest User' : user.fullname;
    }
    return 'User';
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const toggleMobileSidebar = () => {
    setIsMobileSidebarOpen(!isMobileSidebarOpen);
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Show different header based on login status */}
      {showSidebar ? (
        // Logged-in user header (mobile)
        <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-gray-900 border-b border-gray-800 p-4 flex items-center justify-between">
          <button
            onClick={toggleMobileSidebar}
            className="p-2 rounded-lg hover:bg-gray-800 transition-colors"
          >
            {isMobileSidebarOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
          
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-pink-500 rounded-full flex items-center justify-center text-sm font-bold">
              {getUserInitials()}
            </div>
            <span className="text-sm font-medium">{getUserName()}</span>
          </div>
        </div>
      ) : (
        // Guest Navigation Header (no sidebar)
        <div className="fixed top-0 left-0 right-0 z-40 bg-gray-900 border-b border-gray-800 p-4">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-3">
              <div className="w-10 h-10 bg-pink-500 rounded-lg flex items-center justify-center">
                <Cpu size={24} />
              </div>
              <div>
                <h1 className="font-bold text-lg">PC Builder</h1>
                <p className="text-xs text-gray-400">AI Powered</p>
              </div>
            </Link>

            {/* Guest Navigation Links */}
            <div className="hidden md:flex items-center gap-6">
              {guestNavItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-2 hover:text-pink-400 transition-colors ${
                    location.pathname === item.path ? 'text-pink-400' : 'text-gray-300'
                  }`}
                >
                  {item.icon}
                  <span>{item.name}</span>
                </Link>
              ))}
            </div>

            {/* Login/Signup Buttons */}
            <div className="flex items-center gap-4">
              <Link
                to="/login"
                className="flex items-center gap-2 px-4 py-2 rounded-lg border border-pink-500 text-pink-500 hover:bg-pink-500 hover:text-white transition-colors"
              >
                <LogIn size={18} />
                <span>Login</span>
              </Link>
              <Link
                to="/signup"
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-pink-500 text-white hover:bg-pink-600 transition-colors"
              >
                <UserPlus size={18} />
                <span>Sign Up</span>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Sidebar (Only for logged-in users) */}
      {showSidebar && (
        <div className={`fixed top-0 left-0 h-full bg-gray-900 border-r border-gray-800 z-40 transition-all duration-300 ${
          isSidebarOpen ? 'w-64' : 'w-20'
        } lg:block ${isMobileSidebarOpen ? 'block' : 'hidden'} pt-16 lg:pt-0`}>
          
          {/* Desktop Toggle Button */}
          <div className="hidden lg:flex items-center justify-end p-4">
            <button
              onClick={toggleSidebar}
              className="p-2 rounded-lg hover:bg-gray-800 transition-colors"
            >
              {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>

          {/* Logo */}
          <div className="p-4 border-b border-gray-800">
            <Link to="/" className="flex items-center gap-3">
              <div className="w-10 h-10 bg-pink-500 rounded-lg flex items-center justify-center">
                <Cpu size={24} />
              </div>
              {isSidebarOpen && (
                <div>
                  <h1 className="font-bold text-lg">PC Builder</h1>
                  <p className="text-xs text-gray-400">AI Powered</p>
                </div>
              )}
            </Link>
          </div>

          {/* Navigation Menu */}
          <nav className="p-4">
            <ul className="space-y-2">
              {menuItems.map((item) => (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    onClick={() => setIsMobileSidebarOpen(false)}
                    className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                      location.pathname === item.path
                        ? 'bg-gray-800 text-white'
                        : 'hover:bg-gray-800 text-gray-300'
                    }`}
                  >
                    <span className={item.color}>{item.icon}</span>
                    {isSidebarOpen && <span>{item.name}</span>}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* User Profile Section */}
          <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-800">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-pink-500 rounded-full flex items-center justify-center text-sm font-bold">
                {getUserInitials()}
              </div>
              {isSidebarOpen && (
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{getUserName()}</p>
                  <p className="text-xs text-gray-400 truncate">
                    {JSON.parse(sessionStorage.getItem('user'))?.isGuest ? 'Guest Account' : 'PC Builder User'}
                  </p>
                </div>
              )}
            </div>

            <button
              onClick={handleLogout}
              className="flex items-center gap-3 w-full p-3 rounded-lg hover:bg-gray-800 transition-colors text-gray-300"
            >
              <LogOut size={20} />
              {isSidebarOpen && <span>Logout</span>}
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className={`min-h-screen transition-all duration-300 ${
        showSidebar && isSidebarOpen ? 'lg:ml-64' : showSidebar ? 'lg:ml-20' : ''
      } ${showSidebar ? 'pt-16 lg:pt-0' : 'pt-20'}`}>
        
        {/* Backdrop for mobile sidebar */}
        {isMobileSidebarOpen && showSidebar && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
            onClick={() => setIsMobileSidebarOpen(false)}
          />
        )}

        {/* Page Content */}
        <div className="p-4 lg:p-8">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Layout;