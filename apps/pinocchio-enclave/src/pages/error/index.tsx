import { useLocation, useNavigate } from "react-router";

export default function ErrorPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const errorMessage = location.state?.message || "An unexpected error occurred";

  const handleBackToLogin = () => {
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white flex items-center justify-center px-4">
      <div className="max-w-2xl w-full text-center space-y-8">
        <div className="space-y-6">
          <div className="text-6xl">⚠️</div>
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-red-400 to-orange-500 bg-clip-text text-transparent">
            Something went wrong
          </h1>
          <p className="text-lg text-gray-300 max-w-md mx-auto">{errorMessage}</p>
        </div>

        <div className="pt-8">
          <button
            type="button"
            onClick={handleBackToLogin}
            className="px-6 py-3 bg-primary hover:bg-primary-dark rounded-lg font-medium transition-colors text-primary-foreground cursor-pointer"
          >
            Back to home
          </button>
        </div>
      </div>
    </div>
  );
}
