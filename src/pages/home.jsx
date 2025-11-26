import { useNavigate } from 'react-router-dom';

const Home = () => {
    const navigate = useNavigate();
    
    const handleAutomateBuild = () => {
        navigate('/automate');
    };

    return (
        <div className="min-h-screen bg-black flex items-center justify-center px-4">
            <div className="text-center">
                <h1 className="text-white text-6xl md:text-7xl font-bold mb-6">
                    AutoBuild PC
                </h1>
                <p className="text-gray-400 text-lg md:text-xl mb-12">
                    Your perfect PC—automatically built by AI.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                    <button 
                    onClick={handleAutomateBuild}
                    className="bg-pink-600 hover:bg-pink-700 text-white font-semibold px-8 py-4 rounded-lg transition-colors duration-200">
                        Automate Build
                    </button>

                </div>
            </div>
        </div>
    );
}

export default Home;