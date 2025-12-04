import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Logo from '../components/logo';

const SignUp = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        fullname: '',
        email: '',
        password: '',
        confirmPassword: ''
    });
    const [isLoading, setIsLoading] = useState(false);
    const [errors, setErrors] = useState({});
    const [success, setSuccess] = useState('');

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
        
        if (errors[e.target.name]) {
            setErrors({
                ...errors,
                [e.target.name]: ''
            });
        }
    };

    const validateForm = () => {
        const newErrors = {};
        
        if (!formData.fullname.trim()) {
            newErrors.fullname = 'Full name is required';
        } else if (formData.fullname.length < 3) {
            newErrors.fullname = 'Full name must be at least 3 characters';
        }
        
        if (!formData.email.trim()) {
            newErrors.email = 'Email is required';
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            newErrors.email = 'Email is invalid';
        }
        
        if (!formData.password) {
            newErrors.password = 'Password is required';
        } else if (formData.password.length < 6) {
            newErrors.password = 'Password must be at least 6 characters';
        }
        
        if (formData.password !== formData.confirmPassword) {
            newErrors.confirmPassword = 'Passwords do not match';
        }
        
        return newErrors;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        const validationErrors = validateForm();
        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            return;
        }
        
        setIsLoading(true);
        setErrors({});
        setSuccess('');

        try {
            const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/signup`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({
                    fullname: formData.fullname,
                    email: formData.email,
                    password: formData.password,
                    password_confirmation: formData.confirmPassword
                })
            });

            const data = await response.json();
            
            if (response.ok && data.success) {
                setSuccess('Account created successfully! Redirecting to automate page...');
                
                if (data.data && data.data.user) {
                    sessionStorage.setItem('user', JSON.stringify(data.data.user));
                }
                
                setTimeout(() => {
                    navigate('/');
                    window.location.reload();
                }, 1500);
            } else {
                if (data.errors) {
                    const apiErrors = {};
                    Object.keys(data.errors).forEach(key => {
                        apiErrors[key] = data.errors[key][0];
                    });
                    setErrors(apiErrors);
                } else {
                    setErrors({ general: data.message || 'Registration failed' });
                }
            }
        } catch (err) {
            setErrors({ general: 'Network error. Please try again.' });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-black text-white p-8">
            <Logo />
            
            <div className="max-w-md mx-auto mt-12">
                <div className="border border-gray-600 rounded-lg p-8">
                    <h2 className="text-2xl font-bold mb-6 text-center">Create Account</h2>
                    
                    {errors.general && (
                        <div className="mb-4 p-3 bg-red-900/30 border border-red-700 rounded-lg text-sm text-red-400">
                            {errors.general}
                        </div>
                    )}
                    
                    {success && (
                        <div className="mb-4 p-3 bg-green-900/30 border border-green-700 rounded-lg text-sm text-green-400">
                            {success}
                        </div>
                    )}
                    
                    <form onSubmit={handleSubmit}>
                        <div className="mb-4">
                            <label className="block text-gray-300 mb-2">Full Name</label>
                            <input
                                type="text"
                                name="fullname"
                                value={formData.fullname}
                                onChange={handleChange}
                                placeholder="Enter your full name"
                                className={`w-full bg-transparent border-2 text-white px-4 py-3 rounded-lg focus:outline-none transition-colors ${
                                    errors.fullname 
                                    ? 'border-red-600' 
                                    : 'border-gray-600 focus:border-pink-500'
                                }`}
                                disabled={isLoading}
                            />
                            {errors.fullname && (
                                <p className="text-sm text-red-500 mt-1">{errors.fullname}</p>
                            )}
                        </div>
                        
                        <div className="mb-4">
                            <label className="block text-gray-300 mb-2">Email</label>
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                placeholder="Enter your email"
                                className={`w-full bg-transparent border-2 text-white px-4 py-3 rounded-lg focus:outline-none transition-colors ${
                                    errors.email 
                                    ? 'border-red-600' 
                                    : 'border-gray-600 focus:border-pink-500'
                                }`}
                                disabled={isLoading}
                            />
                            {errors.email && (
                                <p className="text-sm text-red-500 mt-1">{errors.email}</p>
                            )}
                        </div>
                        
                        <div className="mb-4">
                            <label className="block text-gray-300 mb-2">Password</label>
                            <input
                                type="password"
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                placeholder="Create a password"
                                className={`w-full bg-transparent border-2 text-white px-4 py-3 rounded-lg focus:outline-none transition-colors ${
                                    errors.password 
                                    ? 'border-red-600' 
                                    : 'border-gray-600 focus:border-pink-500'
                                }`}
                                disabled={isLoading}
                            />
                            {errors.password && (
                                <p className="text-sm text-red-500 mt-1">{errors.password}</p>
                            )}
                        </div>
                        
                        <div className="mb-8">
                            <label className="block text-gray-300 mb-2">Confirm Password</label>
                            <input
                                type="password"
                                name="confirmPassword"
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                placeholder="Confirm your password"
                                className={`w-full bg-transparent border-2 text-white px-4 py-3 rounded-lg focus:outline-none transition-colors ${
                                    errors.confirmPassword 
                                    ? 'border-red-600' 
                                    : 'border-gray-600 focus:border-pink-500'
                                }`}
                                disabled={isLoading}
                            />
                            {errors.confirmPassword && (
                                <p className="text-sm text-red-500 mt-1">{errors.confirmPassword}</p>
                            )}
                        </div>
                        
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-pink-500 hover:bg-pink-600 text-white font-semibold px-6 py-3 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed mb-4"
                        >
                            {isLoading ? 'Creating Account...' : 'Sign Up'}
                        </button>
                        
                        <div className="text-center text-gray-400">
                            Already have an account?{' '}
                            <Link 
                                to="/login" 
                                className="text-pink-500 hover:text-pink-400 transition-colors font-medium"
                            >
                                Sign in here
                            </Link>
                        </div>
                    </form>
                </div>
                
                <div className="mt-8 text-center text-gray-500 text-sm">
                    <p>By signing up, you agree to our Terms of Service and Privacy Policy</p>
                </div>
            </div>
        </div>
    );
};

export default SignUp;