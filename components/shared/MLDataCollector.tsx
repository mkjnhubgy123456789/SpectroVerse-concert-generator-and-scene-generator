import React from 'react';

export const useMLDataCollector = () => {
  const record = (eventName: string, data: any) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[ML Data] ${eventName}:`, data);
    }
    // In real app, push to analytics/ML pipeline
  };

  return { record };
};