const db = require('./db');

async function seedFeedbackData() {
  try {
    const count = await db.Feedback.countDocuments({});
    if (count > 0) {
      console.log('[Seed] Feedback collection already contains data. Skipping seeding.');
      return;
    }

    console.log('[Seed] Seeding realistic feedbacks and support replies...');

    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;
    const oneHour = 60 * 60 * 1000;

    // Helper to generate dummy likes
    const generateLikes = (n) => {
      const arr = [];
      for (let i = 0; i < n; i++) {
        arr.push(`seed_user_like_${i}`);
      }
      return arr;
    };

    const feedbacks = [
      // Public Feedbacks
      {
        userId: 'seed_public_user_1',
        userName: 'Rahul Verma',
        message: 'Super smooth tool! Schedule karke WhatsApp automated bhejna bohot easy ho gaya hai. Keep it up!',
        type: 'public',
        likes: generateLikes(12),
        createdAt: new Date(now - 5 * oneDay - 4 * oneHour)
      },
      {
        userId: 'seed_public_user_2',
        userName: 'Priya Sharma',
        message: 'Google Contacts sync wala feature bohot fast kaam karta hai. Direct names mil rahe hain ab.',
        type: 'public',
        likes: generateLikes(8),
        createdAt: new Date(now - 4 * oneDay - 2 * oneHour)
      },
      {
        userId: 'seed_public_user_3',
        userName: 'Amit Patel',
        message: 'Group sync feature works like a charm. UI bhi dark glassmorphic look me kafi sleek hai.',
        type: 'public',
        likes: generateLikes(15),
        createdAt: new Date(now - 3 * oneDay - 6 * oneHour)
      },
      {
        userId: 'seed_public_user_4',
        userName: 'Sneha Reddy',
        message: 'CSV file import option saved so much time! Great work team!',
        type: 'public',
        likes: generateLikes(6),
        createdAt: new Date(now - 2 * oneDay - 1 * oneHour)
      },
      {
        userId: 'seed_public_user_5',
        userName: 'Vikram Malhotra',
        message: 'Message scheduling exactly time par trigger ho rahi hai. Impressive stability.',
        type: 'public',
        likes: generateLikes(9),
        createdAt: new Date(now - 1 * oneDay - 8 * oneHour)
      },
      {
        userId: 'seed_public_user_6',
        userName: 'Karan Gupta',
        message: 'Clean interface and straightforward options. Highly recommended for daily task automation!',
        type: 'public',
        likes: generateLikes(11),
        createdAt: new Date(now - 12 * oneHour)
      },

      // Personal Support Feedbacks (pre-populated templates for cloning/clipping)
      {
        userId: 'seeded_personal',
        userName: 'Rohan Mehta',
        message: 'Kya isme multi-account WhatsApp support feature aayega aage?',
        type: 'personal',
        adminReply: 'Hi Rohan, yes! Multi-account switching phase-2 roadmap me scheduled hai. Stay tuned!',
        createdAt: new Date(now - 3 * oneDay - 2 * oneHour)
      },
      {
        userId: 'seeded_personal',
        userName: 'Ananya Joshi',
        message: 'Is there any limit on how many messages I can schedule in a single day?',
        type: 'personal',
        adminReply: 'Hello Ananya, currently there is no hard daily cap, but we recommend batching messages with reasonable delay intervals.',
        createdAt: new Date(now - 2 * oneDay - 5 * oneHour)
      },
      {
        userId: 'seeded_personal',
        userName: 'Siddharth Rao',
        message: 'Google OAuth permissions error resolved easily through the prompt guide. Thanks for quick response!',
        type: 'personal',
        adminReply: 'Glad to help Siddharth! Happy scheduling.',
        createdAt: new Date(now - 1 * oneDay - 3 * oneHour)
      },
      {
        userId: 'seeded_personal',
        userName: 'Neha Saxena',
        message: 'Can I edit a message once it\'s already scheduled for tomorrow?',
        type: 'personal',
        adminReply: 'Hi Neha, yes, you can manage or delete upcoming schedules anytime from the active queue!',
        createdAt: new Date(now - 6 * oneHour)
      }
    ];

    await db.Feedback.insertMany(feedbacks);
    console.log('[Seed] Feedbacks populated successfully in MongoDB.');
  } catch (err) {
    console.error('[Seed] Error seeding feedbacks:', err.message);
  }
}

module.exports = { seedFeedbackData };
