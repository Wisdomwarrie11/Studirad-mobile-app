import React from 'react';

interface WordmarkProps {
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'hero';
  theme?: 'auto' | 'light' | 'dark' | 'onOxford';
  withSubtitle?: boolean;
  withIcon?: boolean;
  className?: string;
}

export const Wordmark: React.FC<WordmarkProps> = ({
  size = 'md',
  theme = 'auto',
  withSubtitle = false,
  className = '',
}) => {
  const sizeClasses = {
    sm: 'text-2xl tracking-tight',
    md: 'text-3xl tracking-tight',
    lg: 'text-4xl tracking-tight font-bold',
    xl: 'text-5xl tracking-tight font-extrabold',
    hero: 'text-6xl tracking-tighter font-extrabold',
  };

  // On light backgrounds: Studi is Oxford Blue (#002147), Rad is Light Orange (#FF7F32)
  // On dark/Oxford backgrounds: Studi is crisp bright white (#FFFFFF), Rad is Light Orange (#FF7F32)
  const studiColor =
    theme === 'onOxford' || theme === 'dark'
      ? 'text-white'
      : theme === 'light'
      ? 'text-[#002147]'
      : 'text-[#002147] dark:text-white';
  const radColor = 'text-[#FF7F32]';

  return (
    <div className={`flex flex-col items-center ${className}`}>
      <div className="flex items-center select-none">
        <div className={`font-extrabold ${sizeClasses[size]}`}>
          <span className={studiColor}>Studi</span>
          <span className={radColor}>Rad</span>
        </div>
      </div>

      {withSubtitle && (
        <span
          className={`text-xs tracking-wider uppercase font-semibold mt-1 ${
            theme === 'onOxford' || theme === 'dark'
              ? 'text-slate-300/80'
              : theme === 'light'
              ? 'text-slate-500'
              : 'text-slate-500 dark:text-slate-400'
          }`}
        >
          Radiography & Medical Imaging
        </span>
      )}
    </div>
  );
};
