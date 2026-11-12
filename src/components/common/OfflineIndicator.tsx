import React from 'react';

interface OfflineIndicatorProps {
  onOpenOfflinePack?: () => void;
}

export const OfflineIndicator: React.FC<OfflineIndicatorProps> = () => {
  // Offline mode is completely silent per user requirement: "When the app is in offline mode, it doesnt have to be displayed that it is."
  return null;
};

