export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white dark:bg-mbjj-dark">
      <div className="text-center">
        <h1 className="text-6xl font-heading font-bold text-mbjj-red mb-4">404</h1>
        <p className="text-2xl text-gray-600 dark:text-gray-400 mb-8">Page Not Found</p>
        <a
          href="/"
          className="inline-block bg-mbjj-blue hover:bg-mbjj-accent-light text-white font-heading font-bold px-8 py-3 rounded-lg transition shadow-md"
        >
          Return Home
        </a>
      </div>
    </div>
  );
}
