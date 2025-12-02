import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Logo from '../components/logo';

const Automate = () => {
    const navigate = useNavigate();

    const [selectedUse, setSelectedUse] = useState(''); 
    const [selectedUses, setSelectedUses] = useState([]); 
    const [isMixedUse, setIsMixedUse] = useState(false); 
    const [priceRange, setPriceRange] = useState('');

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

    const handleUseCaseClick = (useCase) => {
        if (isMixedUse) {
            if (selectedUses.includes(useCase)) {
                setSelectedUses(selectedUses.filter(u => u !== useCase));
            } else {
                setSelectedUses([...selectedUses, useCase]);
            }
        } else {
            setSelectedUse(useCase);
        }
    };

    const handleSubmit = () => {
        if ((isMixedUse && selectedUses.length > 0) || (!isMixedUse && selectedUse)) {
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
                                        className={`px-6 py-2 rounded-full border-2 transition-colors duration-200 ${
                                            isSelected
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
                            Set Your Price Range.
                        </label>
                        <input
                            type="number"
                            value={priceRange}
                            onChange={(e) => setPriceRange(e.target.value)}
                            placeholder="Enter your budget"
                            className="w-full max-w-md bg-transparent border-b-2 border-gray-600 text-white px-2 py-2 focus:outline-none focus:border-pink-500 transition-colors"
                        />
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
