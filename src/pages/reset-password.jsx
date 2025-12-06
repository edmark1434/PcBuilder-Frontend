import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Logo from '../components/logo';
import { ArrowLeft, Lock, Eye, EyeOff } from 'lucide-react';

const ResetPassword = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        password: '',
        confirmPassword: ''
    });
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
        setError('');
    };

    const validatePassword = (password) => {
        const errors = [];
        if (password.length < 6) errors.push('at least 6 characters');
        return errors;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!formData.password || !formData.confirmPassword) {
            setError('Please fill in all fields');
            return;
        }

        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        const passwordErrors = validatePassword(formData.password);
        if (passwordErrors.length > 0) {
            setError(`Password must contain ${passwordErrors.join(', ')}`);
            return;
        }

        setIsLoading(true);
        setError('');
        setSuccess('');

        try {
            const email = sessionStorage.getItem('resetEmail');
            
            const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/change-password`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ 
                    email, 
                    new_password: formData.password,
                })
            });

            const data = await response.json();
            
            if (response.ok) {
                setSuccess(data.message || 'Password reset successfully!');
                
                // Clear reset data from sessionStorage
                sessionStorage.removeItem('resetEmail');
                // Navigate to login after 2 seconds
                setTimeout(() => {
                    navigate('/login');
                }, 2000);
            } else {
                setError(data.message || 'Failed to reset password');
            }
        } catch (err) {
            setError('Network error. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleBack = () => {
        navigate('/verify-code');
    };

    return (
        <div className="min-h-screen bg-black text-white p-8">
            <Logo />
            
            <div className="max-w-md mx-auto mt-12">
                <button
                    onClick={handleBack}
                    className="flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors"
                >
                    <ArrowLeft size={20} />
                    Back
                </button>
                
                <div className="border border-gray-600 rounded-lg p-8">
                    <div className="flex justify-center mb-6">
                        <div className="bg-pink-500/20 p-3 rounded-full">
                            <Lock className="text-pink-500" size={32} />
                        </div>
                    </div>
                    
                    <h2 className="text-2xl font-bold mb-2 text-center">Reset Password</h2>
                    <p className="text-gray-400 text-center mb-8">
                        Create a new strong password for your account
                    </p>
                    
                    {error && (
                        <div className="mb-6 p-3 bg-red-900/30 border border-red-700 rounded-lg text-sm text-red-400">
                            {error}
                        </div>
                    )}
                    
                    {success && (
                        <div className="mb-6 p-3 bg-green-900/30 border border-green-700 rounded-lg text-sm text-green-400">
                            {success}
                        </div>
                    )}
                    
                    <form onSubmit={handleSubmit}>
                        <div className="mb-6">
                            <label className="block text-gray-300 mb-2">New Password</label>
                            <div className="relative">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    placeholder="Enter new password"
                                    className="w-full bg-transparent border-2 border-gray-600 text-white px-4 py-3 rounded-lg focus:outline-none focus:border-pink-500 transition-colors pr-10"
                                    disabled={isLoading}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-3 text-gray-400 hover:text-white"
                                >
                                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                </button>
                            </div>
                            <div className="mt-2 text-xs text-gray-400">
                                Must contain: 6+ characters
                            </div>
                        </div>
                        
                        <div className="mb-8">
                            <label className="block text-gray-300 mb-2">Confirm New Password</label>
                            <div className="relative">
                                <input
                                    type={showConfirmPassword ? "text" : "password"}
                                    name="confirmPassword"
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    placeholder="Confirm new password"
                                    className="w-full bg-transparent border-2 border-gray-600 text-white px-4 py-3 rounded-lg focus:outline-none focus:border-pink-500 transition-colors pr-10"
                                    disabled={isLoading}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute right-3 top-3 text-gray-400 hover:text-white"
                                >
                                    {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                </button>
                            </div>
                        </div>
                        
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-pink-500 hover:bg-pink-600 text-white font-semibold px-6 py-3 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isLoading ? 'Resetting...' : 'Reset Password'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ResetPassword;