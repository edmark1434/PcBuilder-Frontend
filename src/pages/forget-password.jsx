import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Logo from '../components/logo';
import { ArrowLeft, Mail } from 'lucide-react';

const ForgotPassword = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!email.trim()) {
            setError('Please enter your email address');
            return;
        }

        setIsLoading(true);
        setError('');
        setSuccess('');

        try {
            const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/forget-password`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email })
            });

            const data = await response.json();
            
            if (response.ok) {
                setSuccess(data.message || 'Verification code has been sent to your email!');
                // Store email for verification page
                sessionStorage.setItem('resetEmail', email);
                
                // Navigate to verification page after 2 seconds
                setTimeout(() => {
                    navigate('/verify-code');
                }, 2000);
            } else {
                setError(data.message || 'Failed to send verification code');
            }
        } catch (err) {
            setError('Network error. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleBack = () => {
        navigate('/login');
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
                    Back to Login
                </button>
                
                <div className="border border-gray-600 rounded-lg p-8">
                    <div className="flex justify-center mb-6">
                        <div className="bg-pink-500/20 p-3 rounded-full">
                            <Mail className="text-pink-500" size={32} />
                        </div>
                    </div>
                    
                    <h2 className="text-2xl font-bold mb-2 text-center">Forgot Password</h2>
                    <p className="text-gray-400 text-center mb-8">
                        Enter your email to receive a verification code
                    </p>
                    
                    {error && (
                        <div className="mb-4 p-3 bg-red-900/30 border border-red-700 rounded-lg text-sm text-red-400">
                            {error}
                        </div>
                    )}
                    
                    {success && (
                        <div className="mb-4 p-3 bg-green-900/30 border border-green-700 rounded-lg text-sm text-green-400">
                            {success}
                        </div>
                    )}
                    
                    <form onSubmit={handleSubmit}>
                        <div className="mb-6">
                            <label className="block text-gray-300 mb-2">Email Address</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="Enter your email"
                                className="w-full bg-transparent border-2 border-gray-600 text-white px-4 py-3 rounded-lg focus:outline-none focus:border-pink-500 transition-colors"
                                disabled={isLoading}
                            />
                        </div>
                        
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-pink-500 hover:bg-pink-600 text-white font-semibold px-6 py-3 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isLoading ? 'Sending...' : 'Send Verification Code'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;