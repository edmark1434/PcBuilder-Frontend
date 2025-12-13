import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Logo from '../components/logo';

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

const Automate = () => {
    const navigate = useNavigate();
    const [description, setDescription] = useState('');
    const [priceRange, setPriceRange] = useState({ min: '', max: '' });
    const [detailedNeeds, setDetailedNeeds] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Format PHP price for display
    const formatPrice = (price) => {
        const priceNum = Number(price) || 0;
        return `₱${price.toLocaleString('en-PH', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
    };

    const handlePriceChange = (field, value) => {
        // Handle empty input
        if (value === '') {
            setPriceRange(prev => ({
                ...prev,
                [field]: ''
            }));
            return;
        }
        
        // Parse as number, removing leading zeros (except for 0 itself)
        const numericValue = parseInt(value, 10) || 0;
        setPriceRange(prev => ({
            ...prev,
            [field]: numericValue
        }));
    };

    const handleSubmit = async () => {
        // Validate required fields
        if (!description) {
            alert('Please fill in the description field.');
            return;
        }
        let passData = {};
        if(priceRange.min !== '' || priceRange.max !== '' ) {
            
            if (Number(priceRange.min) > Number(priceRange.max)) {
                alert('Minimum price cannot be greater than maximum price.');
                return;
            }
                passData = {
                description: description,
                min:  Number(priceRange.min),
                max:  Number(priceRange.max),
                detailed_needs: detailedNeeds
            };
        } else {
            passData = {
                description: description,
                detailed_needs: detailedNeeds
            };
        }

        console.log('Sending to backend:', passData);

        setIsLoading(true);
        setIsModalOpen(true);

        // Save to sessionStorage for frontend use
        sessionStorage.setItem('buildRequest', JSON.stringify(passData));

        try {
            const response = await fetch(`${BASE_URL}/min-price`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(passData)
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to generate build');
            }

            console.log('Build generated:', data);

            const payload = data.data || data; // support wrapped or raw
            const builds = payload.builds || [];
            const recommendation = payload.recommendation || '';
            const budgetRange = payload.budget_range || null;
            const budgetNote = payload.budget_note || null;

            // Always proceed with builds - AI handles budget constraints in description
            sessionStorage.setItem('builds', JSON.stringify(builds));
            sessionStorage.setItem('aiRecommendation', recommendation);
            if (budgetRange) {
                sessionStorage.setItem('budgetRange', JSON.stringify(budgetRange));
            }
            if (budgetNote) {
                sessionStorage.setItem('budgetNote', budgetNote);
            }

            setIsLoading(false);
            setIsModalOpen(false);
            navigate('/lists');
        } catch (err) {
            console.error('Error:', err);
            alert(err.message || 'Failed to generate build. Please try again.');
            setIsLoading(false);
            setIsModalOpen(false);
        }
    };

    return (
        <div className="min-h-screen bg-black text-white p-8">
            <Logo />

            {/* Loading Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50">
                    <div className="bg-gray-900 border border-gray-700 rounded-xl p-8 max-w-md w-full mx-4 flex flex-col items-center">
                        <div className="relative mb-6">
                            <div className="w-20 h-16 bg-gray-800 rounded-lg flex items-center justify-center border border-gray-600">
                                <div className="w-16 h-12 bg-gray-700 rounded flex items-center justify-center">
                                    <div className="w-12 h-8 bg-gray-600 rounded flex items-center justify-center">
                                        <div className="w-2 h-2 bg-pink-500 rounded-full animate-pulse"></div>
                                    </div>
                                </div>
                            </div>
                            <div className="w-8 h-2 bg-gray-800 absolute -bottom-1 left-1/2 transform -translate-x-1/2"></div>
                        </div>

                        <h3 className="text-xl font-semibold mb-2">Analyzing Your Needs</h3>
                        <p className="text-gray-400 text-center mb-6">
                            Our AI is building the perfect PC configuration for you...
                        </p>

                        <div className="flex space-x-2 mb-6">
                            <div className="w-3 h-3 bg-pink-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                            <div className="w-3 h-3 bg-pink-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                            <div className="w-3 h-3 bg-pink-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                        </div>

                        <p className="text-sm text-gray-500">Please wait while we process your request</p>
                    </div>
                </div>
            )}

            <div className="max-w-4xl mx-auto">
                <p className="flex text-gray-300 mb-8">
                    Please fill in the details below to generate your AI-recommended PC build.
                </p>

                <div className="border border-gray-600 rounded-lg p-8 mb-8">
                    {/* Description */}
                    <div className="mb-8">
                        <label className="block text-white mb-4">
                            Describe how you'll use this PC *
                        </label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="e.g., I need a PC for video editing, streaming, and gaming at 1440p"
                            rows={4}
                            className="w-full bg-transparent border-2 border-gray-600 text-white px-4 py-3 focus:outline-none focus:border-pink-500 transition-colors rounded-lg resize-none"
                        />
                    </div>

                    {/* Price Range */}
                    <div className="mb-8">
                        <label className="block text-white mb-4">
                            Set Your Price Range (in Philippine Peso - ₱)
                            <span className="text-gray-400 text-sm ml-2">(Optional)</span>
                        </label>

                        <div className="flex items-center gap-6 max-w-md">
                            <div className="flex-1">
                                <p className="text-sm text-gray-400 mb-1">Minimum</p>
                                <input
                                    type="number"
                                    value={priceRange.min || ''}
                                    onChange={(e) => handlePriceChange('min', e.target.value)}
                                    placeholder="0"
                                    min={0}
                                    className="w-full bg-transparent border-b-2 border-gray-600 text-white px-2 py-2 focus:outline-none focus:border-pink-500 transition-colors"
                                />
                            </div>

                            <div className="flex-1">
                                <p className="text-sm text-gray-400 mb-1">Maximum</p>
                                <input
                                    type="number"
                                    value={priceRange.max || ''}
                                    onChange={(e) => handlePriceChange('max', e.target.value)}
                                    placeholder="0"
                                    min={priceRange.min || 0}
                                    className="w-full bg-transparent border-b-2 border-gray-600 text-white px-2 py-2 focus:outline-none focus:border-pink-500 transition-colors"
                                />
                            </div>
                        </div>

                        {(priceRange.min || priceRange.max) && (
                            <div className="flex items-center gap-6 max-w-md mt-4">
                                <div className="flex-1">
                                    {priceRange.min && (
                                        <p className="text-sm text-gray-400">
                                            {formatPrice(priceRange.min)}
                                        </p>
                                    )}
                                </div>
                                <div className="flex-1">
                                    {priceRange.max && (
                                        <p className="text-sm text-gray-400">
                                            {formatPrice(priceRange.max)}
                                        </p>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Detailed Needs */}
                    <div>
                        <label className="block text-white mb-4">
                            Additional Requirements
                            <span className="text-gray-400 text-sm ml-2">(Optional)</span>
                        </label>
                        <textarea
                            value={detailedNeeds}
                            onChange={(e) => setDetailedNeeds(e.target.value)}
                            placeholder="e.g., Need RGB lighting, quiet cooling, specific brand preferences"
                            rows={3}
                            className="w-full bg-transparent border-2 border-gray-600 text-white px-4 py-3 focus:outline-none focus:border-pink-500 transition-colors rounded-lg resize-none"
                        />
                    </div>
                </div>

                <div className="flex justify-end">
                    <button
                        onClick={handleSubmit}
                        disabled={isLoading}
                        className="bg-pink-500 hover:bg-pink-600 text-white font-semibold px-8 py-3 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        {isLoading ? (
                            <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                Processing...
                            </>
                        ) : (
                            'Generate Build'
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Automate;