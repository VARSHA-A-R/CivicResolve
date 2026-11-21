import React from 'react';

export const Card: React.FC<{
  children: React.ReactNode;
  className?: string;
  hoverEffect?: boolean;
}> = ({ children, className = '', hoverEffect = false }) => {
  return (
    <div
      className={`bg-white rounded-xl border border-slate-200/90 shadow-civic-card transition-all duration-200 ${
        hoverEffect ? 'hover:shadow-civic-hover hover:border-slate-300' : ''
      } ${className}`}
    >
      {children}
    </div>
  );
};

export const CardHeader: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className = '' }) => {
  return (
    <div className={`px-6 py-4 border-b border-slate-100 flex items-center justify-between ${className}`}>
      {children}
    </div>
  );
};

export const CardContent: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className = '' }) => {
  return <div className={`p-6 ${className}`}>{children}</div>;
};

export const CardFooter: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className = '' }) => {
  return (
    <div className={`px-6 py-3.5 bg-slate-50/60 border-t border-slate-100 rounded-b-xl ${className}`}>
      {children}
    </div>
  );
};
