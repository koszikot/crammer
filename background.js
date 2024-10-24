// Set up daily reminder
chrome.runtime.onInstalled.addListener(() => {
  chrome.alarms.create('dailyReview', {
    periodInMinutes: 1440 // 24 hours
  });
});

// Handle daily reminder
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'dailyReview') {
    chrome.storage.local.get('words', (result) => {
      const words = result.words || [];
      const now = Date.now();
      const dueWords = words.filter(word => word.nextReview <= now);
      
      if (dueWords.length > 0) {
        chrome.notifications.create({
          type: 'basic',
          iconUrl: 'icon48.png',
          title: 'Time for vocabulary review!',
          message: `You have ${dueWords.length} words to review.`
        });
      }
    });
  }
});