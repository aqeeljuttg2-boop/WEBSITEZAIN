export default function StorefrontLoading() {
  return (
    <div className="w-full min-h-screen animate-pulse">
      {/* Hero skeleton */}
      <div className="w-full h-[500px] bg-gray-900" />
      {/* Category grid skeleton */}
      <div className="py-20 max-w-7xl mx-auto px-4">
        <div className="h-6 w-48 bg-gray-200 rounded mx-auto mb-12" />
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-96 bg-gray-200 rounded-2xl" />
          ))}
        </div>
      </div>
    </div>
  );
}
