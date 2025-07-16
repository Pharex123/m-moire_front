import { Link } from 'react-router-dom'

export function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 bg-white shadow-lg z-50">
      <div className="mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo section */}
          <Link to="/" className="flex items-center">
            <svg 
              className="h-8 w-8 text-blue-600" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
              />
            </svg>
            <span className="ml-2 text-xl font-bold text-gray-800">Domus</span>
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-6">
            <Link
              to="/dashboard"
              className="text-gray-600 hover:text-blue-600 transition-colors duration-200"
            >
              Dashboard
            </Link>
            <Link
              to="/add-devices"
              className="text-gray-600 hover:text-blue-600 transition-colors duration-200"
            >
              Ajouter un appareil
            </Link>
            <Link
              to="/voice-test"
              className="text-gray-600 hover:text-blue-600 transition-colors duration-200"
            >
              Test vocal
            </Link>
            <Link
              to="/voice-list"
              className="text-gray-600 hover:text-blue-600 transition-colors duration-200"
            >
              Liste des voix
            </Link>
            
            
            <div className="pl-6 border-l border-gray-200">
              <Link
                to="/register"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors duration-200"
              >
                S'inscrire
              </Link>
            </div>
          </div>

          {/* Mobile menu button */}
          <button className="md:hidden p-2 rounded-md text-gray-600 hover:text-gray-900">
            <svg
              className="h-6 w-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>
        </div>
      </div>
    </nav>
  )
}

export default Navbar
