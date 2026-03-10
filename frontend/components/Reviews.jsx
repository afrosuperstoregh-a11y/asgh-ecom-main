import { Star } from 'lucide-react';

export default function Reviews({ reviews, averageRating, totalReviews }) {
  const renderStars = (rating) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${
          i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
        }`}
      />
    ));
  };

  const renderRatingBars = () => {
    const ratings = [5, 4, 3, 2, 1];
    const ratingCounts = ratings.map(rating => 
      reviews.filter(review => review.rating === rating).length
    );

    return ratings.map((rating, index) => {
      const count = ratingCounts[index];
      const percentage = totalReviews > 0 ? (count / totalReviews) * 100 : 0;
      
      return (
        <div key={rating} className="flex items-center space-x-3">
          <div className="flex items-center space-x-1 text-sm">
            <span>{rating}</span>
            <Star className="h-4 w-4 text-yellow-400 fill-current" />
          </div>
          <div className="flex-1 bg-gray-200 rounded-full h-2">
            <div
              className="bg-yellow-400 h-2 rounded-full transition-all duration-300"
              style={{ width: `${percentage}%` }}
            />
          </div>
          <span className="text-sm text-gray-600 w-12 text-right">{count}</span>
        </div>
      );
    });
  };

  return (
    <div className="space-y-6">
      {/* Rating Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6 bg-gray-50 rounded-lg">
        <div className="text-center">
          <div className="text-3xl font-bold text-gray-900">{averageRating}</div>
          <div className="flex justify-center space-x-1 mt-1">
            {renderStars(Math.round(averageRating))}
          </div>
          <div className="text-sm text-gray-600 mt-1">{totalReviews} reviews</div>
        </div>
        
        <div className="md:col-span-2 space-y-2">
          {renderRatingBars()}
        </div>
      </div>

      {/* Individual Reviews */}
      <div className="space-y-4">
        {reviews.map((review) => (
          <div key={review.id} className="border-b border-gray-200 pb-4 last:border-0">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-1">
                    {renderStars(review.rating)}
                  </div>
                  <span className="text-sm text-gray-600">{review.date}</span>
                  {review.verified && (
                    <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">
                      Verified Purchase
                    </span>
                  )}
                </div>
                <div className="mt-2">
                  <div className="font-medium text-gray-900">{review.user}</div>
                  <p className="text-gray-700 mt-1">{review.comment}</p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Load More Reviews Button */}
      {reviews.length > 3 && (
        <button className="w-full py-2 px-4 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors">
          Load More Reviews
        </button>
      )}
    </div>
  );
}
