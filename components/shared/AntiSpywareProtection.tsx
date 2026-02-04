import React, { useEffect } from 'react';

export const useAntiSpyware = () => {
  useEffect(() => {
    // console.log("AntiSpyware active");
  }, []);
  return { active: true };
};