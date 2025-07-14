import React, { useState } from 'react';
import {
  analyzeSentiment,
  checkReviewLegitimacy,
  translateReview
} from '../services/apiService.js';
import { TranslateIcon, SparklesIcon, ShieldCheckIcon } from './Icons.jsx';
import Spinner from './Spinner.jsx';

const ReviewCard = ({ review }) => {
  const [analysisResult, setAnalysisResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [currentReviewText, setCurrentReviewText] = useState(review.text);

  const handleAction = async (action) => {
    setIsLoading(true);
    setAnalysisResult(null);
    try {
      let result;
      switch (action) {
        case 'translate':
          const translatedText = await translateReview(currentReviewText, 'auto');
          setCurrentReviewText(translatedText);
          result = `Translated to English.`;
          break;
        case 'sentiment':
          const sentiment = await analyzeSentiment(currentReviewText);
          result = `Sentiment: ${sentiment.sentiment}`;
          break;
        case 'legitimacy':
          const legitimacy = await checkReviewLegitimacy(currentReviewText);
          result = `Legitimacy: ${legitimacy.isLegit ? 'Likely Genuine' : 'Potentially Fake'}.`;
          break;
      }
      setAnalysisResult(result);
    } catch (error) {
      console.error(`Error during ${action}:`, error);
      setAnalysisResult(`Failed to perform ${action}. Please try again.`);
    } finally {
      setIsLoading(false);
    }
  };

  const renderStars = (rating) => {
    return (
      <div className="flex items-center">
        {[...Array(5)].map((_, i) => (
          <svg
            key={i}
            className={`h-5 w-5 flex-shrink-0 ${i < rating ? 'text-yellow-400' : 'text-gray-300 dark:text-gray-600'}`}
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M10.868 2.884c.321-.662 1.215-.662 1.536 0l1.815 3.724 4.106.597c.725.105 1.016.993.49 1.503l-2.97 2.895.7 4.09c.124.721-.632 1.275-1.282.946L10 15.347l-3.663 1.925c-.65.329-1.406-.225-1.282-.946l.7-4.09-2.97-2.895c-.525-.51-.235-1.398.49-1.503l4.106-.597L9.132 2.884z"
              clipRule="evenodd"
            />
          </svg>
        ))}
      </div>
    );
  };

  const getSentimentColor = (sentiment) => {
    if (sentiment.includes('Positive') || sentiment.includes('Genuine')) return 'text-green-500';
    if (sentiment.includes('Negative') || sentiment.includes('Fake')) return 'text-red-500';
    if (sentiment.includes('Neutral')) return 'text-yellow-500';
    return 'text-gray-500 dark:text-gray-400';
  };

  return (
    <div className="py-6 border-b border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <div className="flex-shrink-0 h-10 w-10 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold">
            {review.author.charAt(0)}
          </div>
          <div className="ml-4">
            <h4 className="text-sm font-bold text-gray-900 dark:text-white">{review.author}</h4>
            <div className="mt-1 flex items-center">{renderStars(review.rating)}</div>
          </div>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400">{review.date}</p>
      </div>

      <div className="mt-4 space-y-6 text-base italic text-gray-600 dark:text-gray-300">
        <p>{currentReviewText}</p>
      </div>

      <div className="mt-6 flex items-center gap-4">
        <button onClick={() => handleAction('translate')} className="flex items-center gap-1 text-sm text-indigo-600 dark:text-indigo-400 hover:underline" disabled={isLoading}>
          <TranslateIcon className="h-4 w-4" /> Translate
        </button>
        <button onClick={() => handleAction('sentiment')} className="flex items-center gap-1 text-sm text-indigo-600 dark:text-indigo-400 hover:underline" disabled={isLoading}>
          <SparklesIcon className="h-4 w-4" /> Sentiment
        </button>
        <button onClick={() => handleAction('legitimacy')} className="flex items-center gap-1 text-sm text-indigo-600 dark:text-indigo-400 hover:underline" disabled={isLoading}>
          <ShieldCheckIcon className="h-4 w-4" /> Legitimacy
        </button>
      </div>

      {isLoading && <div className="mt-4"><Spinner /></div>}

      {analysisResult && !isLoading && (
        <div className={`mt-4 p-3 rounded-lg bg-gray-100 dark:bg-gray-800 text-sm ${getSentimentColor(analysisResult)}`}>
          <p>{analysisResult}</p>
        </div>
      )}
    </div>
  );
};

export default ReviewCard;
