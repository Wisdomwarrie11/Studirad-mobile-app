import React, { useState } from 'react';
import { Star, CheckCircle2 } from 'lucide-react';
import { RatableContentType } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { submitContentRating } from '../../services/firebaseDataService';
import { useContentRatingSummary } from '../../hooks/useContentRatings';

interface StarRatingWidgetProps {
  itemType: RatableContentType;
  itemId: string;
  compact?: boolean;
  interactive?: boolean;
  onRequireAuth?: () => void;
}

export const StarRatingWidget: React.FC<StarRatingWidgetProps> = ({
  itemType,
  itemId,
  compact = false,
  interactive = false,
  onRequireAuth,
}) => {
  const { currentUser, requireAuth } = useAuth();
  const { average, count, userRatings } = useContentRatingSummary(itemType, itemId);
  const [hoveredStar, setHoveredStar] = useState<number>(0);
  const [isSaving, setIsSaving] = useState(false);
  const [justSaved, setJustSaved] = useState(false);

  const userExistingScore = currentUser?.id ? userRatings[currentUser.id] || 0 : 0;

  const handleRate = async (score: number, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!currentUser || currentUser.isGuest) {
      if (onRequireAuth) {
        onRequireAuth();
      } else {
        requireAuth({
          title: 'Sign In to Rate',
          message: 'Create a free account or sign in to submit a verified rating.',
          actionText: 'Rate Content',
        });
      }
      return;
    }

    setIsSaving(true);
    const res = await submitContentRating({
      itemType,
      itemId,
      userId: currentUser.id,
      userName: currentUser.fullName,
      score,
    });
    setIsSaving(false);
    if (res.success) {
      setJustSaved(true);
      setTimeout(() => setJustSaved(false), 2200);
    }
  };

  if (compact && !interactive) {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-bold text-slate-700 dark:text-slate-200">
        <Star
          className={`w-3.5 h-3.5 ${
            count > 0 ? 'text-amber-500 fill-amber-500' : 'text-slate-400'
          }`}
        />
        {count > 0 ? (
          <>
            <span className="tabular-nums">{average.toFixed(1)}</span>
            <span className="text-[11px] font-normal text-slate-400">({count})</span>
          </>
        ) : (
          <span className="text-[11px] font-semibold text-slate-400">New</span>
        )}
      </span>
    );
  }

  const displayStarLevel = hoveredStar || userExistingScore;

  return (
    <div
      className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#161F30] border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="space-y-0.5 text-left">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 text-sm font-extrabold text-slate-900 dark:text-white tabular-nums">
            <Star
              className={`w-4 h-4 ${
                count > 0 ? 'text-amber-500 fill-amber-500' : 'text-slate-400'
              }`}
            />
            <span>{count > 0 ? `${average.toFixed(1)} / 5.0` : 'No ratings yet'}</span>
          </span>
          {count > 0 && (
            <span className="text-xs text-slate-400">
              ({count} {count === 1 ? 'review' : 'reviews'})
            </span>
          )}
        </div>
        <p className="text-[11px] text-slate-500 dark:text-slate-400">
          {userExistingScore > 0
            ? `Your rating: ${userExistingScore} star${userExistingScore > 1 ? 's' : ''} (tap to update)`
            : 'Tap a star to submit your rating'}
        </p>
      </div>

      <div className="flex items-center gap-1.5">
        <div
          className="flex items-center gap-1"
          onMouseLeave={() => setHoveredStar(0)}
        >
          {[1, 2, 3, 4, 5].map((star) => {
            const active = star <= displayStarLevel;
            return (
              <button
                key={star}
                type="button"
                disabled={isSaving}
                onMouseEnter={() => setHoveredStar(star)}
                onClick={(e) => handleRate(star, e)}
                aria-label={`Rate ${star} star${star > 1 ? 's' : ''}`}
                className="p-1 rounded-lg hover:scale-110 transition-transform cursor-pointer disabled:opacity-60"
              >
                <Star
                  className={`w-5 h-5 transition-colors ${
                    active
                      ? 'text-amber-500 fill-amber-500'
                      : 'text-slate-300 dark:text-slate-600'
                  }`}
                />
              </button>
            );
          })}
        </div>
        {justSaved && (
          <span className="text-[11px] font-bold text-emerald-500 inline-flex items-center gap-1 ml-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Saved</span>
          </span>
        )}
      </div>
    </div>
  );
};
