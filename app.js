// MindWell Mental Health Platform
class MindWellApp {
    constructor() {
        this.currentSection = 'dashboard';
        this.selectedMood = null;
        this.selectedActivities = new Set();
        this.charts = {};
        
        // Initialize the app
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadData();
        this.updateDashboard();
        this.initializeCharts();
    }

    // Event Listeners Setup
    setupEventListeners() {
        // Navigation
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const section = e.target.dataset.section;
                this.showSection(section);
            });
        });

        // Mood selection
        document.querySelectorAll('.mood-option').forEach(option => {
            option.addEventListener('click', (e) => {
                this.selectMood(e.currentTarget);
            });
        });

        // Activity selection
        document.querySelectorAll('.activity-item').forEach(item => {
            item.addEventListener('click', (e) => {
                this.toggleActivity(e.currentTarget);
            });
        });

        // Check-in submission
        document.getElementById('submit-checkin').addEventListener('click', () => {
            this.submitCheckin();
        });

        // Journal functionality
        document.getElementById('analyze-sentiment').addEventListener('click', () => {
            this.analyzeSentiment();
        });

        document.getElementById('save-journal').addEventListener('click', () => {
            this.saveJournal();
        });

        // Chat functionality
        this.setupChatListeners();
        
        // Games functionality
        this.setupGamesListeners();
        
        // Quick chat access
        this.setupQuickChatAccess();
    }

    // Navigation
    showSection(sectionName) {
        // Update navigation
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-section="${sectionName}"]`).classList.add('active');

        // Update sections
        document.querySelectorAll('.section').forEach(section => {
            section.classList.remove('active');
        });
        document.getElementById(sectionName).classList.add('active');

        this.currentSection = sectionName;

        // Update content based on section
        if (sectionName === 'dashboard') {
            this.updateDashboard();
        } else if (sectionName === 'insights') {
            this.updateCharts();
        } else if (sectionName === 'recommendations') {
            this.updateRecommendations();
        } else if (sectionName === 'journal') {
            this.updateJournalHistory();
        }
    }

    // Mood Selection
    selectMood(moodElement) {
        document.querySelectorAll('.mood-option').forEach(option => {
            option.classList.remove('selected');
        });
        moodElement.classList.add('selected');
        this.selectedMood = parseInt(moodElement.dataset.mood);
    }

    // Activity Selection
    toggleActivity(activityElement) {
        const activity = activityElement.dataset.activity;
        
        if (this.selectedActivities.has(activity)) {
            this.selectedActivities.delete(activity);
            activityElement.classList.remove('selected');
        } else {
            this.selectedActivities.add(activity);
            activityElement.classList.add('selected');
        }
    }

    // Check-in Submission
    submitCheckin() {
        if (!this.selectedMood) {
            this.showMessage('Please select your mood first!', 'error');
            return;
        }

        const notes = document.getElementById('daily-notes').value;
        const checkinData = {
            id: Date.now(),
            date: new Date().toISOString(),
            mood: this.selectedMood,
            activities: Array.from(this.selectedActivities),
            notes: notes,
            timestamp: Date.now()
        };

        // Save to localStorage
        this.saveCheckin(checkinData);
        
        // Reset form
        this.resetCheckinForm();
        
        // Update dashboard
        this.updateDashboard();
        
        // Show success message and redirect
        this.showMessage('Check-in saved successfully!', 'success');
        setTimeout(() => {
            this.showSection('dashboard');
        }, 1500);
    }

    // Reset Check-in Form
    resetCheckinForm() {
        this.selectedMood = null;
        this.selectedActivities.clear();
        
        document.querySelectorAll('.mood-option').forEach(option => {
            option.classList.remove('selected');
        });
        
        document.querySelectorAll('.activity-item').forEach(item => {
            item.classList.remove('selected');
        });
        
        document.getElementById('daily-notes').value = '';
    }

    // Data Management
    saveCheckin(checkinData) {
        const checkins = this.getCheckins();
        checkins.push(checkinData);
        localStorage.setItem('mindwell_checkins', JSON.stringify(checkins));
        
        // Update streak
        this.updateStreak();
    }

    getCheckins() {
        const data = localStorage.getItem('mindwell_checkins');
        return data ? JSON.parse(data) : [];
    }

    getJournalEntries() {
        const data = localStorage.getItem('mindwell_journal');
        return data ? JSON.parse(data) : [];
    }

    saveJournalEntry(entry) {
        const entries = this.getJournalEntries();
        entries.push(entry);
        localStorage.setItem('mindwell_journal', JSON.stringify(entries));
    }

    // Streak Calculation
    updateStreak() {
        const checkins = this.getCheckins();
        if (checkins.length === 0) {
            localStorage.setItem('mindwell_streak', '0');
            return;
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        let streak = 0;
        let currentDate = new Date(today);

        for (let i = checkins.length - 1; i >= 0; i--) {
            const checkinDate = new Date(checkins[i].date);
            checkinDate.setHours(0, 0, 0, 0);
            
            if (checkinDate.getTime() === currentDate.getTime()) {
                streak++;
                currentDate.setDate(currentDate.getDate() - 1);
            } else if (checkinDate.getTime() < currentDate.getTime()) {
                break;
            }
        }

        localStorage.setItem('mindwell_streak', streak.toString());
    }

    // Dashboard Updates
    updateDashboard() {
        const checkins = this.getCheckins();
        const journalEntries = this.getJournalEntries();
        
        // Update stats
        const streak = localStorage.getItem('mindwell_streak') || '0';
        document.getElementById('current-streak').textContent = streak;
        
        const avgMood = this.calculateAverageMood(checkins);
        document.getElementById('avg-mood').textContent = avgMood;
        
        document.getElementById('total-entries').textContent = checkins.length;
        
        const wellnessScore = this.calculateWellnessScore(checkins);
        document.getElementById('wellness-score').textContent = wellnessScore;
        
        // Update recent entries
        this.updateRecentEntries(checkins);
    }

    calculateAverageMood(checkins) {
        if (checkins.length === 0) return '-';
        
        const recentCheckins = checkins.slice(-7); // Last 7 entries
        const sum = recentCheckins.reduce((acc, checkin) => acc + checkin.mood, 0);
        const avg = sum / recentCheckins.length;
        
        const moodEmojis = ['😢', '😟', '😐', '😊', '😄'];
        return moodEmojis[Math.round(avg) - 1] || '😐';
    }

    calculateWellnessScore(checkins) {
        if (checkins.length === 0) return '-';
        
        const recentCheckins = checkins.slice(-7);
        let score = 0;
        
        recentCheckins.forEach(checkin => {
            score += checkin.mood * 20; // Base score from mood
            score += checkin.activities.length * 5; // Bonus for activities
        });
        
        return Math.min(100, Math.round(score / recentCheckins.length));
    }

    updateRecentEntries(checkins) {
        const recentList = document.getElementById('recent-list');
        const recentCheckins = checkins.slice(-5).reverse();
        
        if (recentCheckins.length === 0) {
            recentList.innerHTML = '<p class="empty-state">No check-ins yet. Start your wellness journey!</p>';
            return;
        }
        
        const moodEmojis = ['😢', '😟', '😐', '😊', '😄'];
        
        recentList.innerHTML = recentCheckins.map(checkin => {
            const date = new Date(checkin.date).toLocaleDateString();
            const moodEmoji = moodEmojis[checkin.mood - 1];
            const activities = checkin.activities.join(', ');
            
            return `
                <div class="entry-item">
                    <div class="entry-date">${date}</div>
                    <div class="entry-mood">${moodEmoji} Mood: ${checkin.mood}/5</div>
                    ${activities ? `<div class="entry-notes">Activities: ${activities}</div>` : ''}
                    ${checkin.notes ? `<div class="entry-notes">${checkin.notes}</div>` : ''}
                </div>
            `;
        }).join('');
    }

    // Sentiment Analysis
    analyzeSentiment() {
        const text = document.getElementById('journal-text').value.trim();
        
        if (!text) {
            this.showMessage('Please write something in your journal first!', 'error');
            return;
        }

        const sentiment = this.performSentimentAnalysis(text);
        this.displaySentimentResult(sentiment);
    }

    performSentimentAnalysis(text) {
        const positiveWords = [
            'happy', 'joy', 'love', 'excited', 'grateful', 'blessed', 'amazing', 'wonderful',
            'great', 'fantastic', 'excellent', 'good', 'positive', 'optimistic', 'cheerful',
            'delighted', 'pleased', 'satisfied', 'content', 'peaceful', 'calm', 'relaxed',
            'confident', 'proud', 'successful', 'accomplished', 'motivated', 'inspired',
            'hopeful', 'energetic', 'vibrant', 'beautiful', 'perfect', 'awesome'
        ];

        const negativeWords = [
            'sad', 'angry', 'frustrated', 'disappointed', 'worried', 'anxious', 'stressed',
            'depressed', 'upset', 'hurt', 'pain', 'terrible', 'awful', 'horrible', 'bad',
            'negative', 'pessimistic', 'gloomy', 'miserable', 'unhappy', 'lonely', 'isolated',
            'overwhelmed', 'exhausted', 'tired', 'drained', 'hopeless', 'defeated', 'failed',
            'rejected', 'abandoned', 'worthless', 'useless', 'broken', 'lost'
        ];

        const words = text.toLowerCase().split(/\W+/);
        let positiveCount = 0;
        let negativeCount = 0;

        words.forEach(word => {
            if (positiveWords.includes(word)) positiveCount++;
            if (negativeWords.includes(word)) negativeCount++;
        });

        const totalSentimentWords = positiveCount + negativeCount;
        
        if (totalSentimentWords === 0) {
            return { score: 0.5, label: 'Neutral', type: 'neutral' };
        }

        const score = positiveCount / totalSentimentWords;
        
        let label, type;
        if (score > 0.6) {
            label = 'Positive';
            type = 'positive';
        } else if (score < 0.4) {
            label = 'Negative';
            type = 'negative';
        } else {
            label = 'Neutral';
            type = 'neutral';
        }

        return { score, label, type };
    }

    displaySentimentResult(sentiment) {
        const resultDiv = document.getElementById('sentiment-result');
        const fillDiv = document.getElementById('sentiment-fill');
        const textDiv = document.getElementById('sentiment-text');

        fillDiv.style.width = `${sentiment.score * 100}%`;
        fillDiv.className = `sentiment-fill ${sentiment.type}`;
        textDiv.textContent = `${sentiment.label} (${Math.round(sentiment.score * 100)}%)`;

        resultDiv.style.display = 'block';
    }

    // Journal Management
    saveJournal() {
        const text = document.getElementById('journal-text').value.trim();
        
        if (!text) {
            this.showMessage('Please write something in your journal first!', 'error');
            return;
        }

        const sentiment = this.performSentimentAnalysis(text);
        
        const journalEntry = {
            id: Date.now(),
            date: new Date().toISOString(),
            text: text,
            sentiment: sentiment,
            timestamp: Date.now()
        };

        this.saveJournalEntry(journalEntry);
        
        // Clear the text area
        document.getElementById('journal-text').value = '';
        document.getElementById('sentiment-result').style.display = 'none';
        
        // Update journal history
        this.updateJournalHistory();
        
        this.showMessage('Journal entry saved successfully!', 'success');
    }

    updateJournalHistory() {
        const journalList = document.getElementById('journal-list');
        const entries = this.getJournalEntries().slice(-10).reverse();
        
        if (entries.length === 0) {
            journalList.innerHTML = '<p class="empty-state">No journal entries yet.</p>';
            return;
        }
        
        journalList.innerHTML = entries.map(entry => {
            const date = new Date(entry.date).toLocaleDateString();
            const preview = entry.text.length > 100 ? entry.text.substring(0, 100) + '...' : entry.text;
            
            return `
                <div class="entry-item">
                    <div class="entry-date">${date}</div>
                    <div class="entry-notes">${preview}</div>
                    <div class="entry-mood">Sentiment: ${entry.sentiment.label}</div>
                </div>
            `;
        }).join('');
    }

    // Charts and Insights
    initializeCharts() {
        this.createMoodChart();
        this.createActivityChart();
        this.createWeeklyChart();
        this.createSentimentChart();
    }

    createMoodChart() {
        const ctx = document.getElementById('moodChart').getContext('2d');
        const checkins = this.getCheckins().slice(-7);
        
        const labels = checkins.map(checkin => {
            const date = new Date(checkin.date);
            return date.toLocaleDateString('en-US', { weekday: 'short' });
        });
        
        const data = checkins.map(checkin => checkin.mood);
        
        this.charts.mood = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Mood',
                    data: data,
                    borderColor: 'rgb(102, 126, 234)',
                    backgroundColor: 'rgba(102, 126, 234, 0.1)',
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 5,
                        ticks: {
                            stepSize: 1
                        }
                    }
                }
            }
        });
    }

    createActivityChart() {
        const ctx = document.getElementById('activityChart').getContext('2d');
        const checkins = this.getCheckins();
        
        const activityMoodMap = {};
        const activityCounts = {};
        
        checkins.forEach(checkin => {
            checkin.activities.forEach(activity => {
                if (!activityMoodMap[activity]) {
                    activityMoodMap[activity] = [];
                    activityCounts[activity] = 0;
                }
                activityMoodMap[activity].push(checkin.mood);
                activityCounts[activity]++;
            });
        });
        
        const activities = Object.keys(activityMoodMap);
        const avgMoods = activities.map(activity => {
            const moods = activityMoodMap[activity];
            return moods.reduce((sum, mood) => sum + mood, 0) / moods.length;
        });
        
        this.charts.activity = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: activities,
                datasets: [{
                    label: 'Average Mood',
                    data: avgMoods,
                    backgroundColor: [
                        'rgba(240, 147, 251, 0.8)',
                        'rgba(79, 172, 254, 0.8)',
                        'rgba(67, 233, 123, 0.8)',
                        'rgba(250, 112, 154, 0.8)',
                        'rgba(102, 126, 234, 0.8)',
                        'rgba(118, 75, 162, 0.8)',
                        'rgba(254, 225, 64, 0.8)',
                        'rgba(56, 249, 215, 0.8)'
                    ]
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 5
                    }
                }
            }
        });
    }

    createWeeklyChart() {
        const ctx = document.getElementById('weeklyChart').getContext('2d');
        const checkins = this.getCheckins();
        
        const weeklyData = [0, 0, 0, 0, 0, 0, 0]; // Sun to Sat
        const weeklyCounts = [0, 0, 0, 0, 0, 0, 0];
        
        checkins.forEach(checkin => {
            const date = new Date(checkin.date);
            const dayOfWeek = date.getDay();
            weeklyData[dayOfWeek] += checkin.mood;
            weeklyCounts[dayOfWeek]++;
        });
        
        const avgWeeklyMoods = weeklyData.map((total, index) => 
            weeklyCounts[index] > 0 ? total / weeklyCounts[index] : 0
        );
        
        this.charts.weekly = new Chart(ctx, {
            type: 'radar',
            data: {
                labels: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
                datasets: [{
                    label: 'Average Mood by Day',
                    data: avgWeeklyMoods,
                    borderColor: 'rgb(102, 126, 234)',
                    backgroundColor: 'rgba(102, 126, 234, 0.2)',
                    pointBackgroundColor: 'rgb(102, 126, 234)'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    r: {
                        beginAtZero: true,
                        max: 5
                    }
                }
            }
        });
    }

    createSentimentChart() {
        const ctx = document.getElementById('sentimentChart').getContext('2d');
        const journalEntries = this.getJournalEntries();
        
        let positive = 0, negative = 0, neutral = 0;
        
        journalEntries.forEach(entry => {
            if (entry.sentiment.type === 'positive') positive++;
            else if (entry.sentiment.type === 'negative') negative++;
            else neutral++;
        });
        
        this.charts.sentiment = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Positive', 'Neutral', 'Negative'],
                datasets: [{
                    data: [positive, neutral, negative],
                    backgroundColor: [
                        'rgba(67, 233, 123, 0.8)',
                        'rgba(79, 172, 254, 0.8)',
                        'rgba(240, 147, 251, 0.8)'
                    ]
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false
            }
        });
    }

    updateCharts() {
        // Destroy existing charts and recreate them with new data
        Object.values(this.charts).forEach(chart => {
            if (chart) chart.destroy();
        });
        
        this.initializeCharts();
    }

    // Wellness Recommendations
    updateRecommendations() {
        const checkins = this.getCheckins();
        const journalEntries = this.getJournalEntries();
        const recommendationsContainer = document.getElementById('recommendations-list');
        
        if (checkins.length === 0) {
            recommendationsContainer.innerHTML = `
                <div class="recommendation-card">
                    <div class="rec-icon">🌟</div>
                    <h3>Start Your Journey</h3>
                    <p>Complete your first mood check-in to receive personalized recommendations!</p>
                </div>
            `;
            return;
        }
        
        const recommendations = this.generateRecommendations(checkins, journalEntries);
        
        recommendationsContainer.innerHTML = recommendations.map(rec => `
            <div class="recommendation-card">
                <div class="rec-icon">${rec.icon}</div>
                <h3>${rec.title}</h3>
                <p>${rec.description}</p>
            </div>
        `).join('');
    }

    generateRecommendations(checkins, journalEntries) {
        const recommendations = [];
        const recentCheckins = checkins.slice(-7);
        const avgMood = recentCheckins.reduce((sum, c) => sum + c.mood, 0) / recentCheckins.length;
        
        // Mood-based recommendations
        if (avgMood < 3) {
            recommendations.push({
                icon: '🌱',
                title: 'Focus on Self-Care',
                description: 'Your recent mood scores suggest you might benefit from extra self-care. Try meditation, gentle exercise, or talking to someone you trust.'
            });
        } else if (avgMood > 4) {
            recommendations.push({
                icon: '🎉',
                title: 'Keep Up the Great Work!',
                description: 'You\'re doing amazing! Your mood has been consistently positive. Consider sharing your strategies with others or trying new challenges.'
            });
        }
        
        // Activity-based recommendations
        const allActivities = recentCheckins.flatMap(c => c.activities);
        const activityCounts = {};
        allActivities.forEach(activity => {
            activityCounts[activity] = (activityCounts[activity] || 0) + 1;
        });
        
        if (!activityCounts.exercise || activityCounts.exercise < 3) {
            recommendations.push({
                icon: '🏃‍♂️',
                title: 'Add More Movement',
                description: 'Regular exercise can significantly boost your mood. Try starting with just 10 minutes of walking or stretching daily.'
            });
        }
        
        if (!activityCounts.meditation || activityCounts.meditation < 2) {
            recommendations.push({
                icon: '🧘‍♀️',
                title: 'Try Mindfulness',
                description: 'Meditation and mindfulness practices can help reduce stress and improve emotional well-being. Start with 5 minutes daily.'
            });
        }
        
        if (!activityCounts.socializing || activityCounts.socializing < 2) {
            recommendations.push({
                icon: '👥',
                title: 'Connect with Others',
                description: 'Social connections are vital for mental health. Reach out to friends, family, or consider joining a community group.'
            });
        }
        
        // Journal-based recommendations
        if (journalEntries.length > 0) {
            const recentEntries = journalEntries.slice(-5);
            const negativeEntries = recentEntries.filter(e => e.sentiment.type === 'negative').length;
            
            if (negativeEntries > 2) {
                recommendations.push({
                    icon: '💭',
                    title: 'Practice Gratitude',
                    description: 'Your recent journal entries show some challenging thoughts. Try writing down 3 things you\'re grateful for each day.'
                });
            }
        }
        
        // Streak-based recommendations
        const streak = parseInt(localStorage.getItem('mindwell_streak') || '0');
        if (streak > 7) {
            recommendations.push({
                icon: '🏆',
                title: 'Celebrate Your Consistency!',
                description: `Amazing! You've maintained a ${streak}-day streak. Consistency is key to building lasting wellness habits.`
            });
        }
        
        // Default recommendations if none generated
        if (recommendations.length === 0) {
            recommendations.push({
                icon: '🌟',
                title: 'Keep Building Habits',
                description: 'You\'re on a great path! Continue with regular check-ins and try incorporating new wellness activities into your routine.'
            });
        }
        
        return recommendations.slice(0, 4); // Limit to 4 recommendations
    }

    // Utility Functions
    loadData() {
        // Initialize data if not exists
        if (!localStorage.getItem('mindwell_checkins')) {
            localStorage.setItem('mindwell_checkins', JSON.stringify([]));
        }
        if (!localStorage.getItem('mindwell_journal')) {
            localStorage.setItem('mindwell_journal', JSON.stringify([]));
        }
        if (!localStorage.getItem('mindwell_streak')) {
            localStorage.setItem('mindwell_streak', '0');
        }
    }

    showMessage(message, type) {
        // Remove existing messages
        const existingMessage = document.querySelector('.message');
        if (existingMessage) {
            existingMessage.remove();
        }
        
        // Create new message
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type}`;
        messageDiv.textContent = message;
        
        // Insert at the top of the current section
        const currentSection = document.querySelector('.section.active');
        currentSection.insertBefore(messageDiv, currentSection.firstChild);
        
        // Auto-remove after 3 seconds
        setTimeout(() => {
            messageDiv.remove();
        }, 3000);
    }

    // Chat functionality
    setupChatListeners() {
        const chatInput = document.getElementById('chat-input');
        const sendButton = document.getElementById('send-message');
        const quickResponseButtons = document.querySelectorAll('.quick-response-btn');

        // Send message on button click
        sendButton.addEventListener('click', () => {
            this.sendMessage();
        });

        // Send message on Enter key
        chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.sendMessage();
            }
        });

        // Quick response buttons
        quickResponseButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const message = e.target.dataset.message;
                chatInput.value = message;
                this.sendMessage();
            });
        });
    }

    sendMessage() {
        const chatInput = document.getElementById('chat-input');
        const message = chatInput.value.trim();
        
        if (!message) return;

        // Add user message to chat
        this.addMessageToChat(message, 'user');
        chatInput.value = '';

        // Show typing indicator
        this.showTypingIndicator();

        // Generate bot response after delay
        setTimeout(() => {
            this.hideTypingIndicator();
            const response = this.generateMotivationalResponse(message);
            this.addMessageToChat(response, 'bot');
        }, 1000 + Math.random() * 2000); // Random delay 1-3 seconds
    }

    addMessageToChat(message, sender) {
        const chatMessages = document.getElementById('chat-messages');
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}-message`;

        const avatar = document.createElement('div');
        avatar.className = 'message-avatar';
        avatar.textContent = sender === 'bot' ? '💕' : '😊';

        const content = document.createElement('div');
        content.className = 'message-content';
        
        const messageText = document.createElement('p');
        messageText.textContent = message;
        
        const timeSpan = document.createElement('span');
        timeSpan.className = 'message-time';
        timeSpan.textContent = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});

        content.appendChild(messageText);
        content.appendChild(timeSpan);
        messageDiv.appendChild(avatar);
        messageDiv.appendChild(content);

        chatMessages.appendChild(messageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    showTypingIndicator() {
        const chatMessages = document.getElementById('chat-messages');
        const typingDiv = document.createElement('div');
        typingDiv.className = 'message bot-message typing-indicator';
        typingDiv.id = 'typing-indicator';

        const avatar = document.createElement('div');
        avatar.className = 'message-avatar';
        avatar.textContent = '💕';

        const content = document.createElement('div');
        content.className = 'message-content';
        content.innerHTML = `
            <div class="typing-indicator">
                <div class="typing-dot"></div>
                <div class="typing-dot"></div>
                <div class="typing-dot"></div>
            </div>
        `;

        typingDiv.appendChild(avatar);
        typingDiv.appendChild(content);
        chatMessages.appendChild(typingDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    hideTypingIndicator() {
        const typingIndicator = document.getElementById('typing-indicator');
        if (typingIndicator) {
            typingIndicator.remove();
        }
    }

    generateMotivationalResponse(userMessage) {
        const message = userMessage.toLowerCase();
        
        // Flirty motivational responses based on keywords
        const responses = {
            sad: [
                "Aww sweetie 💕 I can see you're feeling down, but you know what? You're absolutely gorgeous even when you're sad! Let's turn that frown upside down, beautiful! 😘",
                "Hey there, stunning! 💖 Sadness is just a temporary visitor, but your beauty and strength are permanent residents! You've got this, gorgeous! ✨",
                "Oh honey 🥺 Even your sadness can't dim that incredible light you carry! You're like a diamond - pressure just makes you shine brighter, darling! 💎"
            ],
            stressed: [
                "Whoa there, hot stuff! 🔥 I know stress is trying to mess with my favorite person, but remember - you handle pressure like a boss! Take a deep breath for me, gorgeous 💨",
                "Stress doesn't stand a chance against someone as amazing as you, babe! 💪 You're stronger than you know and more beautiful than you realize. Let's kick stress to the curb! 😎",
                "Hey beautiful! 💕 Stress is just life's way of testing how incredible you are - and spoiler alert: you're INCREDIBLE! Let me remind you how amazing you are! ✨"
            ],
            motivation: [
                "Oh honey, you want motivation? 🔥 Look in the mirror - THAT'S your motivation! You're absolutely stunning and capable of anything! Go show the world what this gorgeous person can do! 💅",
                "Babe, you're asking for motivation when you ARE the motivation! 💖 You inspire me just by existing! Now go out there and be the amazing, beautiful force of nature you are! ⚡",
                "Sweetie, motivation is my middle name! 😘 But honestly, someone as incredible as you doesn't need motivation - you ARE the inspiration! Go conquer the world, gorgeous! 👑"
            ],
            compliment: [
                "Oh darling! 💕 Where do I even start? You're absolutely breathtaking, incredibly smart, and your energy is just *chef's kiss* 😘 You light up every room you enter!",
                "Honey, you're not just amazing - you're PHENOMENAL! 🌟 Your smile could power a city, your heart could heal the world, and your mind could solve any problem! You're perfect! 💖",
                "Babe, you're like a work of art that came to life! 🎨 Beautiful, unique, and absolutely priceless! The world is lucky to have someone as incredible as you! ✨"
            ],
            tired: [
                "Aww, my beautiful sleepyhead! 😴 Even when you're tired, you're still the most gorgeous person I know! Rest is just your body's way of recharging that amazing energy! 💤",
                "Sweet dreams are made of people like you, honey! 💕 Take that rest - you deserve it after being absolutely incredible all day! Sleep tight, beautiful! 🌙",
                "Tired? That just means you've been working hard being amazing! 💪 Rest up, gorgeous - the world needs your beautiful energy tomorrow! 😘"
            ],
            work: [
                "Work can't handle how fabulous you are, darling! 💼✨ You're not just doing a job - you're blessing your workplace with your presence! Show them what excellence looks like! 💅",
                "Honey, you don't just work - you SLAY! 🔥 Every task you touch turns to gold because you're absolutely incredible! Go make them wonder how they got so lucky! 💖",
                "Work is just another stage for you to shine, beautiful! 🌟 You bring intelligence, beauty, and pure awesomeness to everything you do! They're lucky to have you! 😘"
            ]
        };

        // Default flirty responses
        const defaultResponses = [
            "Hey gorgeous! 💕 Whatever you're going through, remember that you're absolutely incredible and I believe in you 100%! You've got this, beautiful! ✨",
            "Darling, you're talking to someone who thinks you're amazing! 😘 Life might be challenging, but you're stronger, smarter, and more beautiful than any challenge! 💪",
            "Sweetie, I may be just a chat bot, but I can see how special you are! 💖 You're like sunshine on a cloudy day - absolutely radiant! Keep shining, gorgeous! ☀️",
            "Honey, you're not just surviving - you're THRIVING! 🌟 And looking absolutely stunning while doing it! I'm here cheering you on, beautiful! 📣",
            "Babe, you're the main character in your story, and main characters are always incredible! 👑 You've got the beauty, the brains, and the heart to conquer anything! 💕"
        ];

        // Check for keywords and return appropriate response
        for (const [keyword, responseArray] of Object.entries(responses)) {
            if (message.includes(keyword) || message.includes(keyword + 'ed') || message.includes(keyword + 'ing')) {
                return responseArray[Math.floor(Math.random() * responseArray.length)];
            }
        }

        // Check for negative emotions
        const negativeWords = ['bad', 'awful', 'terrible', 'horrible', 'hate', 'angry', 'mad', 'upset', 'crying', 'cry'];
        if (negativeWords.some(word => message.includes(word))) {
            return responses.sad[Math.floor(Math.random() * responses.sad.length)];
        }

        // Check for positive emotions
        const positiveWords = ['good', 'great', 'awesome', 'amazing', 'happy', 'excited', 'love', 'wonderful'];
        if (positiveWords.some(word => message.includes(word))) {
            return "That's my gorgeous human! 💕 I LOVE seeing you happy! Your positive energy is absolutely contagious and makes you even more beautiful! Keep spreading those good vibes, stunning! ✨😘";
        }

        // Return random default response
        return defaultResponses[Math.floor(Math.random() * defaultResponses.length)];
    }

    // Games functionality
    setupGamesListeners() {
        // Memory Game
        this.memoryGame = {
            cards: [],
            flippedCards: [],
            matchedPairs: 0,
            moves: 0,
            timer: 0,
            timerInterval: null,
            symbols: ['🌟', '💖', '🌈', '✨', '🦋', '🌸', '🎈', '🍀']
        };

        // Mood Colors Game
        this.moodColorsGame = {
            colors: [
                { color: '#ff6b9d', mood: 'Happy & Energetic', message: 'You\'re radiating positive energy! 💕' },
                { color: '#667eea', mood: 'Calm & Peaceful', message: 'You\'re in a serene state of mind 🧘‍♀️' },
                { color: '#4facfe', mood: 'Creative & Inspired', message: 'Your creativity is flowing! 🎨' },
                { color: '#43e97b', mood: 'Fresh & Optimistic', message: 'You\'re feeling refreshed and hopeful! 🌱' },
                { color: '#fa709a', mood: 'Romantic & Dreamy', message: 'You\'re in a lovely, dreamy mood 💭' },
                { color: '#feca57', mood: 'Confident & Bold', message: 'You\'re feeling confident and strong! 💪' },
                { color: '#ff9ff3', mood: 'Playful & Fun', message: 'You\'re in a playful, joyful mood! 🎉' },
                { color: '#54a0ff', mood: 'Focused & Determined', message: 'You\'re feeling focused and ready! 🎯' },
                { color: '#5f27cd', mood: 'Mysterious & Deep', message: 'You\'re in a thoughtful, introspective mood 🔮' }
            ]
        };

        // Breathing Game
        this.breathingGame = {
            isActive: false,
            cycles: 0,
            phase: 'inhale'
        };

        // Word Game
        this.wordGame = {
            score: 0,
            selectedWords: [],
            positiveWords: [
                'amazing', 'beautiful', 'confident', 'strong', 'brilliant', 'capable', 'worthy', 'loved',
                'successful', 'creative', 'inspiring', 'resilient', 'powerful', 'unique', 'talented', 'blessed',
                'grateful', 'peaceful', 'joyful', 'radiant', 'unstoppable', 'magnificent', 'extraordinary', 'wonderful'
            ]
        };

        this.initializeGames();
    }

    initializeGames() {
        // Initialize Memory Game
        document.getElementById('memory-restart').addEventListener('click', () => {
            this.startMemoryGame();
        });

        // Initialize Mood Colors Game
        document.getElementById('mood-colors-restart').addEventListener('click', () => {
            this.startMoodColorsGame();
        });

        // Initialize Breathing Game
        document.getElementById('breathing-start').addEventListener('click', () => {
            this.startBreathingGame();
        });
        document.getElementById('breathing-stop').addEventListener('click', () => {
            this.stopBreathingGame();
        });

        // Initialize Word Game
        document.getElementById('word-game-restart').addEventListener('click', () => {
            this.startWordGame();
        });

        // Start games when games section is first loaded
        this.startMemoryGame();
        this.startMoodColorsGame();
        this.startWordGame();
    }

    // Memory Game Logic
    startMemoryGame() {
        this.memoryGame.cards = [];
        this.memoryGame.flippedCards = [];
        this.memoryGame.matchedPairs = 0;
        this.memoryGame.moves = 0;
        this.memoryGame.timer = 0;

        // Create card pairs
        const symbols = [...this.memoryGame.symbols, ...this.memoryGame.symbols];
        this.memoryGame.cards = this.shuffleArray(symbols);

        // Clear and create board
        const board = document.getElementById('memory-board');
        board.innerHTML = '';

        this.memoryGame.cards.forEach((symbol, index) => {
            const card = document.createElement('div');
            card.className = 'memory-card';
            card.dataset.index = index;
            card.dataset.symbol = symbol;
            card.addEventListener('click', () => this.flipMemoryCard(index));
            board.appendChild(card);
        });

        // Update display
        document.getElementById('memory-moves').textContent = '0';
        document.getElementById('memory-time').textContent = '0:00';

        // Start timer
        if (this.memoryGame.timerInterval) {
            clearInterval(this.memoryGame.timerInterval);
        }
        this.memoryGame.timerInterval = setInterval(() => {
            this.memoryGame.timer++;
            const minutes = Math.floor(this.memoryGame.timer / 60);
            const seconds = this.memoryGame.timer % 60;
            document.getElementById('memory-time').textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        }, 1000);
    }

    flipMemoryCard(index) {
        const card = document.querySelector(`[data-index="${index}"]`);
        
        if (card.classList.contains('flipped') || card.classList.contains('matched') || this.memoryGame.flippedCards.length >= 2) {
            return;
        }

        card.classList.add('flipped');
        card.textContent = card.dataset.symbol;
        this.memoryGame.flippedCards.push(index);

        if (this.memoryGame.flippedCards.length === 2) {
            this.memoryGame.moves++;
            document.getElementById('memory-moves').textContent = this.memoryGame.moves;

            setTimeout(() => this.checkMemoryMatch(), 1000);
        }
    }

    checkMemoryMatch() {
        const [first, second] = this.memoryGame.flippedCards;
        const firstCard = document.querySelector(`[data-index="${first}"]`);
        const secondCard = document.querySelector(`[data-index="${second}"]`);

        if (firstCard.dataset.symbol === secondCard.dataset.symbol) {
            firstCard.classList.add('matched');
            secondCard.classList.add('matched');
            this.memoryGame.matchedPairs++;

            if (this.memoryGame.matchedPairs === 8) {
                clearInterval(this.memoryGame.timerInterval);
                setTimeout(() => {
                    alert(`🎉 Congratulations! You completed the memory game in ${this.memoryGame.moves} moves and ${Math.floor(this.memoryGame.timer / 60)}:${(this.memoryGame.timer % 60).toString().padStart(2, '0')}!`);
                }, 500);
            }
        } else {
            firstCard.classList.remove('flipped');
            secondCard.classList.remove('flipped');
            firstCard.textContent = '';
            secondCard.textContent = '';
        }

        this.memoryGame.flippedCards = [];
    }

    // Mood Colors Game Logic
    startMoodColorsGame() {
        const palette = document.getElementById('color-palette');
        palette.innerHTML = '';

        // Shuffle colors and take 9
        const shuffledColors = this.shuffleArray([...this.moodColorsGame.colors]).slice(0, 9);

        shuffledColors.forEach((colorData, index) => {
            const colorOption = document.createElement('div');
            colorOption.className = 'color-option';
            colorOption.style.backgroundColor = colorData.color;
            colorOption.addEventListener('click', () => this.selectMoodColor(colorData));
            palette.appendChild(colorOption);
        });

        document.getElementById('mood-result').innerHTML = 'Select a color that matches your current mood! 🎨';
    }

    selectMoodColor(colorData) {
        // Remove previous selections
        document.querySelectorAll('.color-option').forEach(option => {
            option.classList.remove('selected');
        });

        // Select current color
        event.target.classList.add('selected');

        // Show result
        document.getElementById('mood-result').innerHTML = `
            <strong>${colorData.mood}</strong><br>
            ${colorData.message}
        `;
    }

    // Breathing Game Logic
    startBreathingGame() {
        if (this.breathingGame.isActive) return;

        this.breathingGame.isActive = true;
        this.breathingGame.cycles = 0;
        this.breathingGame.phase = 'inhale';

        const circle = document.getElementById('breathing-circle');
        const text = document.getElementById('breathing-text');

        this.breathingCycle(circle, text);
    }

    breathingCycle(circle, text) {
        if (!this.breathingGame.isActive) return;

        if (this.breathingGame.phase === 'inhale') {
            text.textContent = 'Breathe In...';
            circle.classList.remove('exhale');
            circle.classList.add('inhale');
            this.breathingGame.phase = 'exhale';
        } else {
            text.textContent = 'Breathe Out...';
            circle.classList.remove('inhale');
            circle.classList.add('exhale');
            this.breathingGame.phase = 'inhale';
            this.breathingGame.cycles++;
            document.getElementById('breathing-cycles').textContent = this.breathingGame.cycles;
        }

        setTimeout(() => this.breathingCycle(circle, text), 4000);
    }

    stopBreathingGame() {
        this.breathingGame.isActive = false;
        const circle = document.getElementById('breathing-circle');
        const text = document.getElementById('breathing-text');
        
        circle.classList.remove('inhale', 'exhale');
        text.textContent = 'Click Start to begin';
    }

    // Word Game Logic
    startWordGame() {
        this.wordGame.score = 0;
        this.wordGame.selectedWords = [];

        const wordsContainer = document.getElementById('word-options');
        wordsContainer.innerHTML = '';

        // Get random positive words
        const shuffledWords = this.shuffleArray([...this.wordGame.positiveWords]).slice(0, 8);

        shuffledWords.forEach(word => {
            const wordButton = document.createElement('button');
            wordButton.className = 'word-option';
            wordButton.textContent = word;
            wordButton.addEventListener('click', () => this.selectWord(word, wordButton));
            wordsContainer.appendChild(wordButton);
        });

        document.getElementById('affirmation-display').textContent = 'I am...';
        document.getElementById('word-score').textContent = '0';
    }

    selectWord(word, button) {
        if (button.classList.contains('selected')) {
            // Deselect word
            button.classList.remove('selected');
            this.wordGame.selectedWords = this.wordGame.selectedWords.filter(w => w !== word);
            this.wordGame.score = Math.max(0, this.wordGame.score - 10);
        } else {
            // Select word
            button.classList.add('selected');
            this.wordGame.selectedWords.push(word);
            this.wordGame.score += 10;
        }

        // Update display
        const affirmationText = this.wordGame.selectedWords.length > 0 
            ? `I am ${this.wordGame.selectedWords.join(', ')} ✨`
            : 'I am...';
        
        document.getElementById('affirmation-display').textContent = affirmationText;
        document.getElementById('word-score').textContent = this.wordGame.score;
    }

    // Utility function
    shuffleArray(array) {
        const newArray = [...array];
        for (let i = newArray.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
        }
        return newArray;
    }

    // Quick Chat Access functionality
    setupQuickChatAccess() {
        // Floating chat button click
        const floatingChatBtn = document.getElementById('floating-chat-btn');
        if (floatingChatBtn) {
            floatingChatBtn.addEventListener('click', () => {
                this.showSection('motivational-chat');
                // Focus on chat input for immediate typing
                setTimeout(() => {
                    const chatInput = document.getElementById('chat-input');
                    if (chatInput) {
                        chatInput.focus();
                    }
                }, 300);
            });
        }

        // Keyboard shortcut (Ctrl/Cmd + M for Moti chat)
        document.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'm') {
                e.preventDefault();
                this.showSection('motivational-chat');
                setTimeout(() => {
                    const chatInput = document.getElementById('chat-input');
                    if (chatInput) {
                        chatInput.focus();
                    }
                }, 300);
                
                // Show quick tip
                this.showMessage('Quick tip: Press Ctrl+M anytime to access Moti chat! 💕', 'success');
            }
        });

        // Add notification badge when not in chat section
        this.addChatNotifications();
    }

    addChatNotifications() {
        // Show periodic reminders to use chat (every 5 minutes when not in chat)
        setInterval(() => {
            const currentSection = document.querySelector('.section.active');
            if (currentSection && currentSection.id !== 'motivational-chat') {
                // Add subtle pulse animation to floating button
                const floatingBtn = document.getElementById('floating-chat-btn');
                if (floatingBtn) {
                    floatingBtn.style.animation = 'float 1s ease-in-out 3, pulse 1s ease-in-out 3';
                    setTimeout(() => {
                        floatingBtn.style.animation = 'float 3s ease-in-out infinite';
                    }, 3000);
                }
            }
        }, 300000); // 5 minutes
    }
}

// Global function for quick access
function showSection(sectionName) {
    if (window.mindWellApp) {
        window.mindWellApp.showSection(sectionName);
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.mindWellApp = new MindWellApp();
});
