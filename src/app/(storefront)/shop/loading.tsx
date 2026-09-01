export default function ShopLoading() {
  return (
    <div className="w-full bg-gray-50 min-h-screen py-10 animate-pulse">
      <div className="max-w-7xl mx-auto px-4 space-y-8">
        {/* Breadcrumb skeleton */}
        <div className="h-4 w-48 bg-gray-200 rounded" />

        {/* Title */}
        <div className="h-8 w-64 bg-gray-200 rounded" />

        <div className="flex gap-8">
          {/* Sidebar skeleton */}
          <div className="hidden lg:block w-56 shrink-0 space-y-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-8 bg-gray-200 rounded" />
            ))}
          </div>

          {/* Product grid skeleton */}
          <div className="flex-1 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
                <div className="h-48 bg-gray-200" />
                <div className="p-4 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4" />
                  <div className="h-3 bg-gray-100 rounded w-1/2" />
                  <div className="h-5 bg-gray-200 rounded w-1/3 mt-2" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
