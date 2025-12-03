import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Logo from '../components/logo';

const Automate = () => {
    const navigate = useNavigate();
    const [selectedUse, setSelectedUse] = useState('');
    const [selectedUses, setSelectedUses] = useState([]);
    const [isMixedUse, setIsMixedUse] = useState(false);
    const [priceRange, setPriceRange] = useState({ min: '', max: '' });
    const [useCases, setUseCases] = useState([]);
    const [useCaseMinPrice, setUseCaseMinPrice] = useState({});
    const [isLoading, setIsLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        const fetchList = async() => {
            const response = await fetch("http://127.0.0.1:8000/api/category");
            const res = await response.json();
            const keys = res.map(item => Object.keys(item)[0]);
            const result = {};
            res.forEach(item => {
                const key = Object.keys(item)[0];
                result[key] = Number(item[key]); // convert string to number
            });
            setUseCases(keys);
            setUseCaseMinPrice(result);
        }
        fetchList();
    },[selectedUse]);

    const getMinPrice = () => {
        if (isMixedUse && selectedUses.length > 0) {
            return Math.max(...selectedUses.map(u => useCaseMinPrice[u] || 0));
        } else if (!isMixedUse && selectedUse) {
            return useCaseMinPrice[selectedUse] || 0;
        }
        return 0;
    };

    const handleUseCaseClick = (useCase) => {
        if (isMixedUse) {
            if (selectedUses.includes(useCase)) {
                setSelectedUses(selectedUses.filter(u => u !== useCase));
            } else {
                setSelectedUses([...selectedUses, useCase]);
            }
        } else {
            if (selectedUse === useCase) {
                setSelectedUse('');
            } else {
                setSelectedUse(useCase);
            }
        }
    };

    const handleSubmit = async() => {
        const minAllowed = getMinPrice();
        if ((isMixedUse && selectedUses.length > 0) || (!isMixedUse && selectedUse)) {
            if (priceRange.max && Number(priceRange.max) < minAllowed) {
                alert(`Maximum cannot be below the minimum price of ₱${minAllowed.toLocaleString()}`);
                return;
            }
            
            const passData = {
                'min': priceRange.min,
                'max': Number(priceRange.max),
                'category': selectedUse
            };
            
            setIsLoading(true);
            setIsModalOpen(true);

            try {
                const response = await fetch("http://127.0.0.1:8000/api/min-price", {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json',
                    },
                    body: JSON.stringify(passData)
                });
                
                if (response.ok) {
                    const result = await response.json();
                    console.log(result);
                    sessionStorage.setItem('builds', JSON.stringify(result));
                    navigate('/lists');
                } else {
                    alert('Error submitting data. Please try again.');
                }
            } catch (err) {
                console.log(err);
                alert('Network error. Please check your connection.');
            } finally {
                setIsLoading(false);
                setIsModalOpen(false);
            }
            
        } else {
            alert('Please select at least one use case.');
        }
    };

    return (
        <div className="min-h-screen bg-black text-white p-8">
            <Logo />
            
            {/* Loading Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50">
                    <div className="bg-gray-900 border border-gray-700 rounded-xl p-8 max-w-md w-full mx-4 flex flex-col items-center">
                        {/* PC Icon */}
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
                        
                        {/* Loading Text */}
                        <h3 className="text-xl font-semibold mb-2">Analyzing Your Needs</h3>
                        <p className="text-gray-400 text-center mb-6">
                            Our AI is building the perfect PC configuration for you...
                        </p>
                        
                        {/* Loading Animation */}
                        <div className="flex space-x-2 mb-6">
                            <div className="w-3 h-3 bg-pink-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                            <div className="w-3 h-3 bg-pink-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                            <div className="w-3 h-3 bg-pink-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                        </div>
                        
                        {/* Loading Percentage (optional) */}
                        {isLoading && (
                            <div className="w-full bg-gray-800 rounded-full h-2 mb-2">
                                <div className="bg-pink-500 h-2 rounded-full animate-pulse w-3/4"></div>
                            </div>
                        )}
                        
                        <p className="text-sm text-gray-500">Please wait while we process your request</p>
                    </div>
                </div>
            )}

            <div className="max-w-4xl mx-auto">
                <p className="flex text-gray-300 mb-8">
                    Please fill in the details below to generate your AI-recommended PC build.
                </p>

                <div className="border border-gray-600 rounded-lg p-8 mb-8">
                    {/* Use Case Selection */}
                    <div className="mb-8">
                        <label className="block text-white mb-4">
                            What Will You Use This PC For?
                        </label>
                        <div className="flex flex-wrap justify-between">
                            {useCases.map((useCase) => {
                                const isSelected = isMixedUse
                                    ? selectedUses.includes(useCase)
                                    : selectedUse === useCase;

                                return (
                                    <div
                                        key={useCase}
                                        className="flex items-center justify-center w-40 h-12 mb-4"
                                    >
                                        <button
                                            onClick={() => handleUseCaseClick(useCase)}
                                            className={`w-full h-full rounded-full transition-colors duration-200
                                                ${isSelected
                                                    ? 'bg-white text-black border-2 border-white'
                                                    : 'bg-transparent text-white border-2 border-white hover:bg-white hover:text-black'
                                                }`}
                                        >
                                            {useCase}
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Mixed Use Checkbox */}
                    <div className="mb-6">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={isMixedUse}
                                onChange={(e) => {
                                    setIsMixedUse(e.target.checked);
                                    setSelectedUse('');
                                    setSelectedUses([]);
                                }}
                                className="w-5 h-5 accent-pink-500"
                            />
                            Mixed Use (Select multiple use cases)
                        </label>
                    </div>

                    {/* Price Range */}
                    <div>
                        <label className="block text-white mb-4">
                            Set Your Price Range
                            {(isMixedUse ? selectedUses.length > 0 : selectedUse) && (
                                <p className="text-xs text-red-500 mt-1">
                                    Minimum price for selected use case(s): ₱{getMinPrice().toLocaleString()}
                                </p>
                            )}
                        </label>

                        <div className="flex items-center gap-6 max-w-md">
                            {/* Minimum */}
                            <div className="flex-1">
                                <p className="text-sm text-gray-400 mb-1">Minimum</p>
                                <input
                                    type="number"
                                    value={priceRange.min || ''}
                                    onChange={(e) => {
                                        const minAllowed = getMinPrice();
                                        const value = Number(e.target.value);
                                        setPriceRange((prev) => ({
                                            ...prev,
                                            min: value < minAllowed ? minAllowed : value,
                                            max: prev.max && prev.max < (value < minAllowed ? minAllowed : value)
                                                ? (value < minAllowed ? minAllowed : value)
                                                : prev.max
                                        }));
                                    }}
                                    placeholder="0"
                                    className="w-full bg-transparent border-b-2 border-gray-600 text-white px-2 py-2 focus:outline-none focus:border-pink-500 transition-colors"
                                />
                            </div>

                            {/* Maximum */}
                            <div className="flex-1">
                                <p className="text-sm text-gray-400 mb-1">Maximum</p>
                                <input
                                    type="number"
                                    value={priceRange.max || ''}
                                    onChange={(e) => setPriceRange((prev) => ({ ...prev, max: e.target.value }))}
                                    placeholder="0"
                                    className="w-full bg-transparent border-b-2 border-gray-600 text-white px-2 py-2 focus:outline-none focus:border-pink-500 transition-colors"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end">
                    <button
                        onClick={handleSubmit}
                        disabled={isLoading}
                        className="bg-pink-500 hover:bg-pink-600 text-white font-semibold px-8 py-3 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isLoading ? 'Processing...' : 'Continue'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Automate;