import { Link } from 'react-router-dom';

const Logo = () => {
    return (
        <div className="mb-8">
            <Link to="/">
                <h1 className="text-pink-500 text-3xl font-bold cursor-pointer">
                    AutoBuild PC
                </h1>
            </Link>
        </div>
    );
}

export default Logo;
