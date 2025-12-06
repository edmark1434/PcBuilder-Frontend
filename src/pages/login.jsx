import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Logo from '../components/logo';
import { User } from 'lucide-react';

const Login = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!formData.email.trim() || !formData.password) {
            setError('Please fill in all fields');
            return;
        }

        setIsLoading(true);
        setError('');

        try {
            const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify(formData)
            });

            const data = await response.json();
            
            if (response.ok && data.success) {
                // Store user data in sessionStorage
                if (data.data && data.data.user) {
                    sessionStorage.setItem('user', JSON.stringify(data.data.user));
                }
                
                navigate('/automate');
                window.location.reload();
            } else {
                setError(data.message || 'Invalid credentials');
            }
        } catch (err) {
            setError('Network error. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleContinueAsGuest = () => {
        sessionStorage.removeItem('user');
        navigate('/automate');
        window.location.reload();
    };

    const handleForgotPassword = () => {
        navigate('/forgot-password');
    };

    return (
        <div className="min-h-screen bg-black text-white p-8">
            <Logo />
            
            <div className="max-w-md mx-auto mt-12">
                <div className="border border-gray-600 rounded-lg p-8">
                    <h2 className="text-2xl font-bold mb-6 text-center">Welcome</h2>
                    
                    {error && (
                        <div className="mb-4 p-3 bg-red-900/30 border border-red-700 rounded-lg text-sm text-red-400">
                            {error}
                        </div>
                    )}
                    
                    <form onSubmit={handleSubmit}>
                        <div className="mb-6">
                            <label className="block text-gray-300 mb-2">Email</label>
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                placeholder="Enter your email"
                                className="w-full bg-transparent border-2 border-gray-600 text-white px-4 py-3 rounded-lg focus:outline-none focus:border-pink-500 transition-colors"
                                disabled={isLoading}
                            />
                        </div>
                        
                        <div className="mb-2">
                            <label className="block text-gray-300 mb-2">Password</label>
                            <input
                                type="password"
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                placeholder="Enter your password"
                                className="w-full bg-transparent border-2 border-gray-600 text-white px-4 py-3 rounded-lg focus:outline-none focus:border-pink-500 transition-colors"
                                disabled={isLoading}
                            />
                        </div>
                        
                        {/* Forgot Password Link */}
                        <div className="mb-6 text-right">
                            <button
                                type="button"
                                onClick={handleForgotPassword}
                                className="text-sm text-pink-500 hover:text-pink-400 transition-colors font-medium"
                            >
                                Forgot password?
                            </button>
                        </div>
                        
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-pink-500 hover:bg-pink-600 text-white font-semibold px-6 py-3 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed mb-4"
                        >
                            {isLoading ? 'Signing in...' : 'Sign In'}
                        </button>
                        
                        {/* Divider */}
                        <div className="relative mb-4">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-gray-700"></div>
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="px-2 bg-black text-gray-400">Or</span>
                            </div>
                        </div>
                        
                        {/* Continue as Guest Button */}
                        <button
                            type="button"
                            onClick={handleContinueAsGuest}
                            disabled={isLoading}
                            className="w-full bg-transparent border-2 border-gray-600 hover:border-gray-500 hover:bg-gray-900 text-white font-semibold px-6 py-3 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed mb-4 flex items-center justify-center gap-2"
                        >
                            <User size={18} />
                            Continue as Guest
                        </button>
                        
                        <div className="text-center text-gray-400">
                            Don't have an account?{' '}
                            <Link 
                                to="/signup" 
                                className="text-pink-500 hover:text-pink-400 transition-colors font-medium"
                            >
                                Sign up here
                            </Link>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Login;