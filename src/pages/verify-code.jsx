import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Logo from '../components/logo';
import { ArrowLeft, Shield } from 'lucide-react';

const VerifyCode = () => {
    const navigate = useNavigate();
    const [code, setCode] = useState(['', '', '', '', '', '']);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [resendCooldown, setResendCooldown] = useState(0);

    const handleChange = (index, value) => {
        if (value.length <= 1 && /^\d*$/.test(value)) {
            const newCode = [...code];
            newCode[index] = value;
            setCode(newCode);
            
            // Auto-focus next input
            if (value && index < 5) {
                document.getElementById(`code-input-${index + 1}`).focus();
            }
            
            setError('');
        }
    };

    const handleKeyDown = (index, e) => {
        if (e.key === 'Backspace' && !code[index] && index > 0) {
            document.getElementById(`code-input-${index - 1}`).focus();
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        const verificationCode = code.join('');
        if (verificationCode.length !== 6) {
            setError('Please enter the 6-digit verification code');
            return;
        }

        setIsLoading(true);
        setError('');

        try {
            const email = sessionStorage.getItem('resetEmail');
            const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/verify-reset-code`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, code: verificationCode })
            });

            const data = await response.json();
            
            if (response.ok) {
                // Store verification token
                if (data.data?.token) {
                    sessionStorage.setItem('resetToken', data.data.token);
                }
                navigate('/reset-password');
            } else {
                setError(data.message || 'Invalid verification code');
            }
        } catch (err) {
            setError('Network error. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleResendCode = async () => {
        if (resendCooldown > 0) return;

        const email = sessionStorage.getItem('resetEmail');
        if (!email) {
            setError('Email not found. Please restart the process.');
            return;
        }

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
                // Start 60-second cooldown
                setResendCooldown(60);
                const timer = setInterval(() => {
                    setResendCooldown((prev) => {
                        if (prev <= 1) {
                            clearInterval(timer);
                            return 0;
                        }
                        return prev - 1;
                    });
                }, 1000);
            } else {
                setError(data.message || 'Failed to resend code');
            }
        } catch (err) {
            setError('Network error. Please try again.');
        }
    };

    const handleBack = () => {
        navigate('/forgot-password');
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
                            <Shield className="text-pink-500" size={32} />
                        </div>
                    </div>
                    
                    <h2 className="text-2xl font-bold mb-2 text-center">Verify Code</h2>
                    <p className="text-gray-400 text-center mb-8">
                        Enter the 6-digit code sent to your email
                    </p>
                    
                    {error && (
                        <div className="mb-6 p-3 bg-red-900/30 border border-red-700 rounded-lg text-sm text-red-400">
                            {error}
                        </div>
                    )}
                    
                    <form onSubmit={handleSubmit}>
                        <div className="mb-8">
                            <div className="flex justify-center gap-2 mb-6">
                                {code.map((digit, index) => (
                                    <input
                                        key={index}
                                        id={`code-input-${index}`}
                                        type="text"
                                        value={digit}
                                        onChange={(e) => handleChange(index, e.target.value)}
                                        onKeyDown={(e) => handleKeyDown(index, e)}
                                        maxLength={1}
                                        className="w-12 h-12 bg-transparent border-2 border-gray-600 text-white text-center text-xl rounded-lg focus:outline-none focus:border-pink-500 transition-colors"
                                        disabled={isLoading}
                                    />
                                ))}
                            </div>
                            
                            <div className="text-center">
                                <button
                                    type="button"
                                    onClick={handleResendCode}
                                    disabled={resendCooldown > 0 || isLoading}
                                    className="text-sm text-pink-500 hover:text-pink-400 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {resendCooldown > 0 
                                        ? `Resend code in ${resendCooldown}s` 
                                        : 'Didn\'t receive code? Resend'}
                                </button>
                            </div>
                        </div>
                        
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-pink-500 hover:bg-pink-600 text-white font-semibold px-6 py-3 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isLoading ? 'Verifying...' : 'Verify Code'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default VerifyCode;