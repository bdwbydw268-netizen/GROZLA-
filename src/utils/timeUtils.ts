export const formatRelativeTime = (timeStr?: string): string => {
  if (!timeStr) return 'منذ لحظات';
  
  // If it's already a descriptive Arabic relative time string like 'منذ ساعتين', 'الآن', return it
  if (!timeStr.includes('T') && !timeStr.includes('-') && !timeStr.includes(':')) {
    return timeStr;
  }

  try {
    const date = new Date(timeStr);
    if (isNaN(date.getTime())) return timeStr;

    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    const diffWeeks = Math.floor(diffDays / 7);
    const diffMonths = Math.floor(diffDays / 30);
    const diffYears = Math.floor(diffDays / 365);

    if (diffSecs < 45) {
      return 'الآن';
    } else if (diffMins === 1) {
      return 'منذ دقيقة';
    } else if (diffMins === 2) {
      return 'منذ دقيقتين';
    } else if (diffMins <= 10) {
      return `منذ ${diffMins} دقائق`;
    } else if (diffMins < 60) {
      return `منذ ${diffMins} دقيقة`;
    } else if (diffHours === 1) {
      return 'منذ ساعة';
    } else if (diffHours === 2) {
      return 'منذ ساعتين';
    } else if (diffHours <= 10) {
      return `منذ ${diffHours} ساعات`;
    } else if (diffHours < 24) {
      return `منذ ${diffHours} ساعة`;
    } else if (diffDays === 1) {
      return 'منذ يوم';
    } else if (diffDays === 2) {
      return 'منذ يومين';
    } else if (diffDays <= 10) {
      return `منذ ${diffDays} أيام`;
    } else if (diffDays < 30) {
      return `منذ ${diffDays} يومًا`;
    } else if (diffMonths === 1) {
      return 'منذ شهر';
    } else if (diffMonths === 2) {
      return 'منذ شهرين';
    } else if (diffMonths < 12) {
      return `منذ ${diffMonths} أشهر`;
    } else if (diffYears === 1) {
      return 'منذ سنة';
    } else if (diffYears === 2) {
      return 'منذ سنتين';
    } else {
      return `منذ ${diffYears} سنوات`;
    }
  } catch (e) {
    return timeStr;
  }
};
