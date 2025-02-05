import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Star } from 'lucide-react';
import { api } from '../lib/api';
import { AxiosError } from 'axios';

interface ReviewData {
    guestName: string;
    stayDate: string;
    rating: number | null;
    reviewText: string;
    hotelId: string;
}

interface RatingStarsProps {
    rating: number | null;
    onRatingChange: (rating: number) => void;
    hoveredRating: number | null;
    onHoverChange: (rating: number | null) => void;
    disabled?: boolean;
}

const RatingStars: React.FC<RatingStarsProps> = ({ rating, onRatingChange, hoveredRating, onHoverChange, disabled }) => (
    <div className="flex flex-col items-center space-y-4 mb-8">
        <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
                <button
                    key={star}
                    onClick={() => !disabled && onRatingChange(star)}
                    onMouseEnter={() => !disabled && onHoverChange(star)}
                    onMouseLeave={() => !disabled && onHoverChange(null)}
                    className={`p-1 transition-all duration-200 ${
                        disabled
                            ? 'cursor-not-allowed opacity-50'
                            : 'hover:scale-110 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-full'
                    }`}
                    type="button"
                    disabled={disabled}
                >
                    <Star
                        size={40}
                        className="transition-colors duration-200"
                        fill={star <= (hoveredRating || rating || 0) ? '#4285f4' : 'transparent'}
                        color={star <= (hoveredRating || rating || 0) ? '#4285f4' : '#dadce0'}
                    />
                </button>
            ))}
        </div>
        <span className="text-sm text-gray-600">{rating ? 'Thanks for rating!' : 'Select a rating'}</span>
    </div>
);

const ReviewForm: React.FC = () => {
    const [searchParams] = useSearchParams();
    const hotelId = searchParams.get('hotel');
    const token = searchParams.get('token');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [hoveredRating, setHoveredRating] = useState<number | null>(null);
    const [showAlert, setShowAlert] = useState(false);
    const [alertType, setAlertType] = useState<'success' | 'error'>('success');
    const [alertMessage, setAlertMessage] = useState<string>('');

    const [reviewData, setReviewData] = useState<ReviewData>({
        guestName: '',
        stayDate: '',
        rating: null,
        reviewText: '',
        hotelId: hotelId || '',
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!reviewData.rating || !token || !hotelId) return;

        setIsSubmitting(true);

        try {
            await api.post('/api/reviews/internal', {
                ...reviewData,
                token,
                hotelId,
            });

            setAlertType('success');
            setAlertMessage('Thank you for your feedback!');
            setShowAlert(true);

            // Redirect to thank you page after successful submission
            window.location.href = '/thank-you';
        } catch (error) {
            console.error('Review submission error:', error);
            setAlertType('error');
            setAlertMessage(
                error instanceof AxiosError
                    ? error.response?.data?.error || 'Failed to submit review'
                    : 'Failed to submit review. Please try again.',
            );
            setShowAlert(true);
            setIsSubmitting(false);
        }
    };

    const currentDate = new Date().toISOString().split('T')[0];

    const inputBaseClasses =
        'w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500 text-black placeholder:text-gray-400';

    return (
        <div className="min-h-screen bg-gray-50 py-8 px-4">
            <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-sm">
                <div className="p-6 text-center border-b border-gray-100">
                    <h1 className="text-2xl font-normal text-gray-900">Share your experience</h1>
                </div>
                <div className="p-6">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <RatingStars
                            rating={reviewData.rating}
                            onRatingChange={(rating) => setReviewData({ ...reviewData, rating })}
                            hoveredRating={hoveredRating}
                            onHoverChange={setHoveredRating}
                            disabled={isSubmitting}
                        />

                        <div className="space-y-4">
                            <div>
                                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                                    Name
                                </label>
                                <input
                                    id="name"
                                    required
                                    value={reviewData.guestName}
                                    onChange={(e) => setReviewData({ ...reviewData, guestName: e.target.value })}
                                    className={inputBaseClasses}
                                    disabled={isSubmitting}
                                    placeholder="Enter your name"
                                />
                            </div>

                            <div>
                                <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">
                                    Date of stay
                                </label>
                                <input
                                    id="date"
                                    type="date"
                                    required
                                    max={currentDate}
                                    value={reviewData.stayDate}
                                    onChange={(e) => setReviewData({ ...reviewData, stayDate: e.target.value })}
                                    className={`${inputBaseClasses} [color-scheme:light]`}
                                    disabled={isSubmitting}
                                />
                            </div>

                            <div>
                                <label htmlFor="review" className="block text-sm font-medium text-gray-700 mb-1">
                                    Share details of your experience
                                </label>
                                <textarea
                                    id="review"
                                    required
                                    value={reviewData.reviewText}
                                    onChange={(e) => setReviewData({ ...reviewData, reviewText: e.target.value })}
                                    className={`${inputBaseClasses} h-32 resize-none`}
                                    disabled={isSubmitting}
                                    placeholder="What did you like or dislike? What should other guests know about this property?"
                                />
                            </div>
                        </div>

                        <div className="flex justify-end gap-4 pt-2">
                            <button
                                type="button"
                                onClick={() => window.close()}
                                disabled={isSubmitting}
                                className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-md disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={isSubmitting || !reviewData.rating}
                                className="px-8 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-200 disabled:text-gray-500"
                            >
                                {isSubmitting ? (
                                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                ) : (
                                    'Post'
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            {showAlert && (
                <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50">
                    <div
                        className={`min-w-[320px] p-4 rounded-lg shadow-lg ${
                            alertType === 'success'
                                ? 'bg-green-50 text-green-800 border border-green-200'
                                : 'bg-red-50 text-red-800 border border-red-200'
                        }`}
                    >
                        {alertMessage}
                    </div>
                </div>
            )}
        </div>
    );
};

export default ReviewForm;
