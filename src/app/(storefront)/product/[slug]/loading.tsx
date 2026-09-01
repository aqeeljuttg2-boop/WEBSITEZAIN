export default function ProductLoading() {
  return (
    <div className="w-full bg-white min-h-screen py-10 animate-pulse">
      <div className="max-w-7xl mx-auto px-4">
        {/* Breadcrumb */}
        <div className="h-4 w-56 bg-gray-200 rounded mb-8" />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Image gallery skeleton */}
          <div className="space-y-4">
            <div className="aspect-square bg-gray-200 rounded-2xl" />
            <div className="flex gap-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="w-16 h-16 bg-gray-200 rounded-lg" />
              ))}
            </div>
          </div>

          {/* Product info skeleton */}
          <div className="space-y-5">
            <div className="h-3 w-24 bg-gray-200 rounded" />
            <div className="h-8 w-3/4 bg-gray-200 rounded" />
            <div className="h-4 w-1/3 bg-gray-200 rounded" />
            <div className="h-10 w-1/2 bg-gray-200 rounded" />
            <div className="space-y-2 mt-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-3 bg-gray-100 rounded w-full" />
              ))}
            </div>
            <div className="flex gap-3 mt-6">
              <div className="h-12 flex-1 bg-gray-200 rounded-xl" />
              <div className="h-12 w-12 bg-gray-200 rounded-xl" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
