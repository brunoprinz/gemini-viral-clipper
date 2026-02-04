/**
 * Converts a time string (HH:MM:SS or MM:SS) to seconds.
 */
export const parseTimeStringToSeconds = (timeString: string): number => {
  if (!timeString) return 0;
  
  const parts = timeString.split(':').map(part => parseFloat(part));
  
  if (parts.length === 3) {
    // HH:MM:SS
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  } else if (parts.length === 2) {
    // MM:SS
    return parts[0] * 60 + parts[1];
  } else if (parts.length === 1) {
    // SS
    return parts[0];
  }
  
  return 0;
};

/**
 * Converts seconds to MM:SS format.
 */
export const formatSecondsToTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};
