import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Logo from '../components/logo';
const BASE_URL = import.meta.env.VITE_API_BASE_URL;

const Automate = () => {
    const navigate = useNavigate();
    const [selectedUse, setSelectedUse] = useState('');
    const [selectedUses, setSelectedUses] = useState([]); // For multiple selection
    const [priceRange, setPriceRange] = useState({ min: '', max: '' });
    const [useCases, setUseCases] = useState([]);
    const [useCaseMinPrice, setUseCaseMinPrice] = useState({});
    const [isLoading, setIsLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // New state variables
    const [conversionRate, setConversionRate] = useState(null);
    const [conversionLoading, setConversionLoading] = useState(false);
    const [multipleSelection, setMultipleSelection] = useState(false);

    // Exchange Rate API
    const EXCHANGE_API_KEY = '391e07669e1a5aa7dd44cc53';
    const EXCHANGE_API_URL = `https://v6.exchangerate-api.com/v6/${EXCHANGE_API_KEY}/pair/USD/PHP`;

    // Fetch conversion rate
    const fetchConversionRate = async () => {
        try {
            setConversionLoading(true);

            const response = await fetch(EXCHANGE_API_URL);
            if (!response.ok) {
                throw new Error(`Failed to fetch exchange rate: ${response.status}`);
            }

            const data = await response.json();

            if (data.result === 'success') {
                setConversionRate(data.conversion_rate);
                // Store in localStorage for caching
                localStorage.setItem('usd_to_php_rate', JSON.stringify({
                    rate: data.conversion_rate,
                    timestamp: Date.now()
                }));
            } else {
                throw new Error(data['error-type'] || 'Failed to get conversion rate');
            }
        } catch (error) {
            console.error('Error fetching conversion rate:', error);

            // Try to use cached rate if available
            const cachedRate = JSON.parse(localStorage.getItem('usd_to_php_rate'));
            if (cachedRate && (Date.now() - cachedRate.timestamp) < 3600000) {
                setConversionRate(cachedRate.rate);
            }
        } finally {
            setConversionLoading(false);
        }
    };

    // Convert USD to PHP for display
    const convertToPHP = (usdAmount) => {
        if (!conversionRate || !usdAmount) return 0;
        return usdAmount * conversionRate;
    };

    // Format PHP price for display
    const formatPHPPrice = (usdPrice) => {
        const priceNum = Number(usdPrice) || 0;
        if (conversionRate) {
            const phpAmount = convertToPHP(priceNum);
            return `₱${phpAmount.toLocaleString('en-PH', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
        }
        return `$${priceNum.toLocaleString('en-US')}`;
    };

    // Format USD price (for fallback)
    const formatUSDPrice = (usdPrice) => {
        const priceNum = Number(usdPrice) || 0;
        return `$${priceNum.toLocaleString('en-US')}`;
    };

    useEffect(() => {
        const fetchList = async () => {
            let res = JSON.parse(localStorage.getItem('categories'));
            if (!res) {
                const response = await fetch(`${BASE_URL}/category`);
                res = await response.json();
                localStorage.setItem('categories', JSON.stringify(res));
            }
            const keys = res.map(item => Object.keys(item)[0]);
            const result = {};
            res.forEach(item => {
                const key = Object.keys(item)[0];
                result[key] = Number(item[key]);
            });
            setUseCases(keys);
            setUseCaseMinPrice(result);
        };
        localStorage.removeItem('favoriteBuilds');
        fetchList();
        fetchConversionRate();
    }, []);

    const getMinPrice = () => {
        if (multipleSelection) {
            if (selectedUses.length === 0) return 0;
            // Get the highest minimum price among selected use cases
            const minPrices = selectedUses.map(useCase => useCaseMinPrice[useCase] || 0);
            return Math.max(...minPrices);
        }
        return selectedUse ? useCaseMinPrice[selectedUse] || 0 : 0;
    };

    const handleUseCaseClick = (useCase) => {
        if (multipleSelection) {
            if (selectedUses.includes(useCase)) {
                // Remove from selection
                setSelectedUses(prev => prev.filter(item => item !== useCase));
            } else {
                // Add to selection
                setSelectedUses(prev => [...prev, useCase]);
            }

            // Don't update price range for multiple selection (it's hidden)
        } else {
            if (selectedUse === useCase) {
                setSelectedUse('');
                setPriceRange({ min: '', max: '' });
            } else {
                setSelectedUse(useCase);
                const minPrice = useCaseMinPrice[useCase] || 0;
                setPriceRange({
                    min: minPrice,
                    max: ''
                });
            }
        }
    };

    const handlePriceChange = (field, value) => {
        const numericValue = value === '' ? '' : Number(value);

        setPriceRange(prev => ({
            ...prev,
            [field]: numericValue
        }));
    };

    const handleSubmit = async () => {
        const minAllowed = getMinPrice();

        // Validate multiple selection
        if (multipleSelection && selectedUses.length === 0) {
            alert('Please select at least one use case.');
            return;
        }

        // Validate single selection
        if (!multipleSelection && !selectedUse) {
            alert('Please select a use case.');
            return;
        }

        if (!multipleSelection) {
            // Regular validation for price range (only for single selection)
            if (priceRange.max && Number(priceRange.max) < minAllowed) {
                const displayMinAllowed = conversionRate
                    ? convertToPHP(minAllowed)
                    : minAllowed;
                const displayFormat = conversionRate ? '₱' : '$';
                alert(`Maximum cannot be below the minimum price of ${displayFormat}${displayMinAllowed.toLocaleString()}`);
                return;
            }
        }

        let passData = {
            category: multipleSelection ? selectedUses.join(', ') : selectedUse
        };
        if (!multipleSelection) {
            passData = {
                ...passData,
                min: priceRange.min ? Number(priceRange.min) : undefined,
                max: priceRange.max ? Number(priceRange.max) : undefined
            }
        }
        console.log('Sending to backend:', passData); // Debug log

        setIsLoading(true);
        setIsModalOpen(true);
        sessionStorage.setItem('category', JSON.stringify(
            multipleSelection ? selectedUses.join(', ') : selectedUse
        ));

        try {
            const response = await fetch(`${BASE_URL}/min-price`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
                body: JSON.stringify(passData)
            });

            if (response.ok) {
                const result = await response.json();
                sessionStorage.setItem('builds', JSON.stringify(result));
                navigate('/lists');
            } else {
                const errorData = await response.json().catch(() => null);
                alert(errorData?.message || 'Error submitting data. Please try again.');
            }
        } catch (err) {
            alert('Network error. Please check your connection.');
        } finally {
            setIsLoading(false);
            setIsModalOpen(false);
        }
    };

    // Handle multiple selection checkbox change
    const handleMultipleSelectionChange = () => {
        const newValue = !multipleSelection;
        setMultipleSelection(newValue);

        // Clear selections when switching modes
        setSelectedUse('');
        setSelectedUses([]);
        setPriceRange({ min: '', max: '' });
    };

    // Helper function to check if a use case is selected
    const isUseCaseSelected = (useCase) => {
        if (multipleSelection) {
            return selectedUses.includes(useCase);
        } else {
            return selectedUse === useCase;
        }
    };

    // Get display price for min price
    const getDisplayMinPrice = () => {
        const minPrice = getMinPrice();
        return conversionRate ? formatPHPPrice(minPrice) : formatUSDPrice(minPrice);
    };

    // Get display price for current min input
    const getDisplayCurrentMinPrice = () => {
        if (!priceRange.min) return '';
        return conversionRate ? formatPHPPrice(priceRange.min) : formatUSDPrice(priceRange.min);
    };

    // Get display price for current max input
    const getDisplayCurrentMaxPrice = () => {
        if (!priceRange.max) return '';
        return conversionRate ? formatPHPPrice(priceRange.max) : formatUSDPrice(priceRange.max);
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

                {/* Exchange Rate Info */}
                <div className="mb-6">
                    {conversionLoading ? (
                        <div className="text-sm text-gray-400 flex items-center gap-2">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400"></div>
                            Loading exchange rate...
                        </div>
                    ) : conversionRate ? (
                        <div className="text-sm text-gray-400">
                            Current exchange rate: 1 USD = {conversionRate.toFixed(4)} PHP
                        </div>
                    ) : (
                        <div className="text-sm text-yellow-400">
                            Exchange rate not available. Displaying USD prices.
                        </div>
                    )}
                </div>

                <div className="border border-gray-600 rounded-lg p-8 mb-8">
                    {/* Selection Mode Toggle */}
                    <div className="mb-8">
                        <div className="flex flex-wrap gap-4 mb-6">
                            <label className="flex items-center gap-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={multipleSelection}
                                    onChange={handleMultipleSelectionChange}
                                    className="w-5 h-5 rounded border-gray-600 bg-gray-800 text-pink-500 focus:ring-pink-500 focus:ring-offset-gray-900"
                                />
                                <span className="text-white">
                                    Select Multiple Use Cases
                                </span>
                            </label>
                        </div>

                        {/* Use Cases Selection */}
                        <div>
                            <label className="block text-white mb-4">
                                {multipleSelection
                                    ? 'Select One or More Use Cases'
                                    : 'What Will You Use This PC For?'}
                                {multipleSelection && selectedUses.length > 0 && (
                                    <span className="ml-2 text-pink-400">
                                        ({selectedUses.length} selected)
                                    </span>
                                )}
                            </label>

                            <div className="flex flex-wrap justify-between">
                                {useCases.map((useCase) => {
                                    const isSelected = isUseCaseSelected(useCase);

                                    return (
                                        <div
                                            key={useCase}
                                            className="flex items-center justify-center w-40 h-12 mb-4"
                                        >
                                            <button
                                                onClick={() => handleUseCaseClick(useCase)}
                                                className={`w-full h-full rounded-full transition-all duration-200 flex items-center justify-center gap-2
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
                    </div>

                    {/* Price Range (only show if not multiple selection) */}
                    {!multipleSelection && (
                        <div>
                            <label className="block text-white mb-4">
                                Set Your Price Range (in USD)
                                {selectedUse && (
                                    <p className="text-xs text-red-500 mt-1">
                                        Minimum price for {selectedUse}: {getDisplayMinPrice()}
                                    </p>
                                )}
                            </label>

                            <div className="flex items-center gap-6 max-w-md">
                                <div className="flex-1">
                                    <p className="text-sm text-gray-400 mb-1">Minimum (USD)</p>
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
                                    <p className="text-sm text-gray-400 mb-1">Maximum (USD)</p>
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

                            {/* PHP conversion display */}
                            {conversionRate && (priceRange.min || priceRange.max) && (
                                <div className="flex items-center gap-6 max-w-md mt-4">
                                    <div className="flex-1">
                                        {priceRange.min && (
                                            <p className="text-sm text-gray-400">
                                                ≈ {getDisplayCurrentMinPrice()}
                                            </p>
                                        )}
                                    </div>
                                    <div className="flex-1">
                                        {priceRange.max && (
                                            <p className="text-sm text-gray-400">
                                                ≈ {getDisplayCurrentMaxPrice()}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Summary of selections */}
                    <div className="mt-8 p-4 bg-gray-900/50 rounded-lg">
                        <h4 className="text-white font-semibold mb-2">Summary</h4>
                        <div className="text-sm text-gray-300 space-y-1">
                            {multipleSelection ? (
                                <>
                                    <p>• Mode: Multiple Selection</p>
                                    <p>• Selected: {selectedUses.length} use case{selectedUses.length !== 1 ? 's' : ''}</p>
                                    <p>• Use Cases: {selectedUses.join(', ') || 'None'}</p>
                                </>
                            ) : (
                                <>
                                    <p>• Mode: Single Selection</p>
                                    <p>• Use Case: {selectedUse || 'None'}</p>
                                    <p>• Price Range:
                                        {priceRange.min ? ` ${getDisplayCurrentMinPrice()}` : ' None'}
                                        {priceRange.max ? ` - ${getDisplayCurrentMaxPrice()}` : ' - No limit'}
                                    </p>
                                </>
                            )}
                        </div>
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
                            'Continue'
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Automate;