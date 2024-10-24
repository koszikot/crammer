let currentWords = [];
let reviewWords = [];
let currentReviewIndex = 0;

document.addEventListener('DOMContentLoaded', () => {
  // Initialize event listeners
  document.getElementById('addWord').addEventListener('click', showAddWordForm);
  document.getElementById('startReview').addEventListener('click', startReview);
  document.getElementById('viewWords').addEventListener('click', showWordList);
  document.getElementById('saveWord').addEventListener('click', saveNewWord);
  document.getElementById('showAnswer').addEventListener('click', showAnswer);
  
  document.querySelectorAll('.backBtn').forEach(btn => {
    btn.addEventListener('click', showMainMenu);
  });

  document.querySelectorAll('.ratingButtons button').forEach(btn => {
    btn.addEventListener('click', (e) => handleRating(parseInt(e.target.dataset.rating)));
  });

  loadWords();
});

function showSection(sectionId) {
  document.querySelectorAll('.container > div').forEach(div => div.classList.add('hidden'));
  document.getElementById(sectionId).classList.remove('hidden');
}

function showMainMenu() {
  showSection('mainMenu');
}

function showAddWordForm() {
  showSection('addWordForm');
}

function showWordList() {
  const container = document.getElementById('wordListContainer');
  container.innerHTML = '';
  
  currentWords.forEach(word => {
    const div = document.createElement('div');
    div.className = 'word-item';
    div.innerHTML = `
      <span>${word.original} - ${word.translation}</span>
      <span>Next review: ${new Date(word.nextReview).toLocaleDateString()}</span>
    `;
    container.appendChild(div);
  });
  
  showSection('wordList');
}

async function loadWords() {
  const result = await chrome.storage.local.get('words');
  currentWords = result.words || [];
}

async function saveNewWord() {
  const original = document.getElementById('originalWord').value.trim();
  const translation = document.getElementById('translation').value.trim();
  
  if (!original || !translation) return;
  
  const newWord = {
    id: Date.now(),
    original,
    translation,
    level: 0,
    nextReview: Date.now(),
    lastReview: null
  };
  
  currentWords.push(newWord);
  await chrome.storage.local.set({ words: currentWords });
  
  document.getElementById('originalWord').value = '';
  document.getElementById('translation').value = '';
  showMainMenu();
}

async function startReview() {
  const now = Date.now();
  reviewWords = currentWords.filter(word => word.nextReview <= now);
  
  if (reviewWords.length === 0) {
    alert('No words to review right now!');
    return;
  }
  
  currentReviewIndex = 0;
  showCurrentReviewWord();
  showSection('reviewSection');
}

function showCurrentReviewWord() {
  const word = reviewWords[currentReviewIndex];
  document.getElementById('wordToReview').textContent = word.original;
  document.getElementById('wordAnswer').textContent = word.translation;
  document.getElementById('answerSection').classList.add('hidden');
  document.getElementById('showAnswer').classList.remove('hidden');
}

function showAnswer() {
  document.getElementById('answerSection').classList.remove('hidden');
  document.getElementById('showAnswer').classList.add('hidden');
}

async function handleRating(rating) {
  const word = reviewWords[currentReviewIndex];
  const now = Date.now();
  
  // Calculate next review based on Ebbinghaus curve and rating
  const intervals = {
    1: 1,      // 1 day for hard
    3: 3,      // 3 days for good
    5: 5       // 5 days for easy
  };
  
  const days = intervals[rating] * (word.level + 1);
  word.nextReview = now + (days * 24 * 60 * 60 * 1000);
  word.lastReview = now;
  word.level = Math.min(word.level + 1, 5);
  
  // Update word in storage
  const wordIndex = currentWords.findIndex(w => w.id === word.id);
  currentWords[wordIndex] = word;
  await chrome.storage.local.set({ words: currentWords });
  
  // Move to next word or finish review
  currentReviewIndex++;
  if (currentReviewIndex < reviewWords.length) {
    showCurrentReviewWord();
  } else {
    alert('Review completed!');
    showMainMenu();
  }
}