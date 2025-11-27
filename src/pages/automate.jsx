import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Logo from '../components/logo';

const Automate = () => {
    const navigate = useNavigate();

    const [selectedUse, setSelectedUse] = useState('');
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
        'Everyday Use',
        'Mixed Use',
        'Content Creation',
        'Other'
    ];

    const handleSubmit = () => {
        if (selectedUse && priceRange) {
            console.log('Selected Use:', selectedUse);
            console.log('Price Range:', priceRange);
            // Handle form submission
            navigate('/lists');
        }
    };

    return (
        <div className="min-h-screen bg-black text-white p-8">
            {/* Logo/Brand */}
            {/* <div className="mb-16">
                <h1 className="text-pink-500 text-3xl font-bold">AutoBuild PC</h1>
            </div> */}
            <Logo />

            {/* Main Content */}
            <div className="max-w-4xl mx-auto">
                <p className="flex text-gray-300 mb-8">
                    Please fill in the details below to generate your AI-recommended PC build.
                </p>

                {/* Form Container */}
                <div className="border border-gray-600 rounded-lg p-8 mb-8">
                    {/* Use Case Selection */}
                    <div className="mb-8">
                        <label className="block text-white mb-4">
                            What Will You Use This PC For?
                        </label>
                        <div className="flex flex-wrap gap-3">
                            {useCases.map((useCase) => (
                                <button
                                    key={useCase}
                                    onClick={() => setSelectedUse(useCase)}
                                    className={`px-6 py-2 rounded-full border-2 transition-colors duration-200 ${
                                        selectedUse === useCase
                                            ? 'bg-white text-black border-white'
                                            : 'bg-transparent text-white border-white hover:bg-white hover:text-black'
                                    }`}
                                >
                                    {useCase}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Price Range */}
                    <div>
                        <label className="block text-white mb-4">
                            Set Your Price Range.
                        </label>
                        <input
                            type="text"
                            value={priceRange}
                            onChange={(e) => setPriceRange(e.target.value)}
                            placeholder="Enter your budget"
                            className="w-full max-w-md bg-transparent border-b-2 border-gray-600 text-white px-2 py-2 focus:outline-none focus:border-pink-500 transition-colors"
                        />
                    </div>
                </div>

                {/* Continue Button */}
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
}

export default Automate;