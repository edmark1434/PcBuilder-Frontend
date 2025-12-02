import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Logo from '../components/logo';

const Automate = () => {
    const navigate = useNavigate();

    const [selectedUse, setSelectedUse] = useState('');
    const [selectedUses, setSelectedUses] = useState([]);
    const [isMixedUse, setIsMixedUse] = useState(false);
    const [priceRange, setPriceRange] = useState({ min: '', max: '' });

    const useCases = [
        'Gaming',
        'School',
        'Office Work',
        'Video Editing',
        'Photo Editing',
        'Graphic Design',
        'Streaming',
        '3D Modeling',
        'Programming',
        'Content Creation'
    ];

    const useCaseMinPrice = {
        Gaming: 30000,
        School: 15000,
        "Office Work": 18000,
        "Video Editing": 40000,
        "Photo Editing": 25000,
        "Graphic Design": 35000,
        Streaming: 30000,
        "3D Modeling": 45000,
        Programming: 20000,
        "Content Creation": 35000,
    };

    const getMinPrice = () => {
        if (isMixedUse && selectedUses.length > 0) {
            // Return the highest minimum among selected uses
            return Math.max(...selectedUses.map(u => useCaseMinPrice[u] || 0));
        } else if (!isMixedUse && selectedUse) {
            return useCaseMinPrice[selectedUse] || 0;
        }
        return 0;
    };

    const handleUseCaseClick = (useCase) => {
        if (isMixedUse) {
            // Toggle selection for mixed use
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

    const handleSubmit = () => {
        const minAllowed = getMinPrice();
        if ((isMixedUse && selectedUses.length > 0) || (!isMixedUse && selectedUse)) {
            if (priceRange.max && Number(priceRange.max) < minAllowed) {
                alert(`Maximum cannot be below the minimum price of ₱${minAllowed.toLocaleString()}`);
                return;
            }
            console.log('Selected Use(s):', isMixedUse ? selectedUses : selectedUse);
            console.log('Price Range:', priceRange);
            navigate('/lists');
        } else {
            alert('Please select at least one use case.');
        }
    };

    return (
        <div className="min-h-screen bg-black text-white p-8">
            <Logo />
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
                        <div className="flex flex-wrap gap-3">
                            {useCases.map((useCase) => {
                                const isSelected = isMixedUse
                                    ? selectedUses.includes(useCase)
                                    : selectedUse === useCase;

                                return (
                                    <button
                                        key={useCase}
                                        onClick={() => handleUseCaseClick(useCase)}
                                        className={`px-6 py-2 rounded-full border-2 transition-colors duration-200 ${isSelected
                                            ? 'bg-white text-black border-white'
                                            : 'bg-transparent text-white border-white hover:bg-white hover:text-black'
                                            }`}
                                    >
                                        {useCase}
                                    </button>
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
                                            // Make sure max is not below new min
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
                        className="bg-pink-500 hover:bg-pink-600 text-white font-semibold px-8 py-3 rounded-lg transition-colors duration-200"
                    >
                        Continue
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Automate;
