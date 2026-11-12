import React from 'react';
import { LiveClass, Opportunity } from '../../types';
import { RadiographyMarbleGame } from '../game/RadiographyMarbleGame';

interface HomeTabProps {
  onSelectCourse?: (course: any) => void;
  onOpenPlayer?: (course: any) => void;
  onSelectLiveClass: (liveClass: LiveClass) => void;
  onSelectOpportunity: (opportunity: Opportunity) => void;
  onStartQuiz: () => void;
  onOpenNotifications?: () => void;
}

export const HomeTab: React.FC<HomeTabProps> = ({
  onOpenPlayer,
}) => {
  return (
    <div className="w-full space-y-4 select-none pb-12">
      <RadiographyMarbleGame onOpenPlayer={onOpenPlayer} />
    </div>
  );
};
