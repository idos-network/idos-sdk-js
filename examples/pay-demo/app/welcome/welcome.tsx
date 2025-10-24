import { useSiwe } from "../providers/siwe-provider";

export function Welcome() {
  const { address, isAuthenticated, signIn, signOut } = useSiwe();

  return (
    <main className="flex min-h-screen items-center justify-center bg-white dark:bg-gray-950">
      <div className="flex flex-col items-center gap-8 p-8">
        <header className="flex flex-col items-center gap-6">
          <h1 className="text-center font-bold text-3xl text-gray-900 dark:text-white">
            Welcome to idOS Pay Demo
          </h1>
          <p className="text-center text-gray-600 dark:text-gray-300">
            Get started by logging in to your account
          </p>
        </header>

        <button
          type="button"
          className="cursor-pointer rounded-lg bg-blue-600 px-8 py-4 font-semibold text-lg text-white transition-colors hover:bg-blue-700"
          onClick={() => (isAuthenticated ? signOut() : signIn())}
        >
          {isAuthenticated
            ? `Disconnect (${address?.slice(0, 6)}...${address?.slice(-4)})`
            : "Login to continue"}
        </button>
      </div>
    </main>
  );
}
