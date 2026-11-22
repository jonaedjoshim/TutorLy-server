const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');

const connectDB = require('../config/db');
const User = require('../models/User');
const TutorProfile = require('../models/TutorProfile');
const TuitionPost = require('../models/TuitionPost');
const Application = require('../models/Application');

const fresh = process.argv.includes('--fresh');

const demoPassword = 'demo12345';

const users = [
  { name: 'Tutorly Admin', email: 'admin@tutorly.test', role: 'admin', password: 'admin12345', location: 'Dhaka' },
  { name: 'Rahim Ahmed', email: 'rahim@tutorly.test', role: 'student', location: 'Dhanmondi, Dhaka' },
  { name: 'Karim Sheikh', email: 'karim@tutorly.test', role: 'student', location: 'Uttara, Dhaka' },
  { name: 'Nadia Islam', email: 'nadia@tutorly.test', role: 'tutor', location: 'Dhanmondi, Dhaka' },
  { name: 'Sabbir Hossain', email: 'sabbir@tutorly.test', role: 'tutor', location: 'Banani, Dhaka' },
  { name: 'Farah Khan', email: 'farah@tutorly.test', role: 'tutor', location: 'Mirpur, Dhaka' },
];

const tutorProfiles = [
  {
    email: 'nadia@tutorly.test',
    headline: 'HSC Physics made simple',
    qualification: 'MSc in Physics, Dhaka University',
    experience: 6,
    subjects: ['Physics', 'Mathematics'],
    classLevels: ['HSC', 'Class 9-10'],
    area: 'Dhanmondi, Dhaka',
    hourlyRate: 800,
    online: true,
    bio: 'I focus on building intuition before formulas. Six years of teaching HSC students in small groups and one-to-one sessions.',
    verified: true,
    ratingAvg: 4.9,
    ratingCount: 24,
  },
  {
    email: 'sabbir@tutorly.test',
    headline: 'English & spoken confidence',
    qualification: 'MA in English Literature',
    experience: 4,
    subjects: ['English', 'Spoken English'],
    classLevels: ['Class 6-10', 'HSC'],
    area: 'Banani, Dhaka',
    hourlyRate: 650,
    online: true,
    bio: 'Lessons are conversational, patient, and built around the student’s actual level. I also help with exam writing.',
    verified: true,
    ratingAvg: 4.8,
    ratingCount: 18,
  },
  {
    email: 'farah@tutorly.test',
    headline: 'Primary & middle school math',
    qualification: 'BEd, Primary Education',
    experience: 3,
    subjects: ['Mathematics', 'General Science'],
    classLevels: ['Class 3-5', 'Class 6-10'],
    area: 'Mirpur, Dhaka',
    hourlyRate: 500,
    online: false,
    bio: 'I work with younger students who need a calm, steady pace and plenty of practice without pressure.',
    verified: false,
    ratingAvg: 0,
    ratingCount: 0,
  },
];

const posts = [
  {
    email: 'rahim@tutorly.test',
    subject: 'Physics',
    classLevel: 'HSC',
    budget: 5000,
    area: 'Dhanmondi, Dhaka',
    medium: 'Bangla',
    daysPerWeek: 3,
    preferredDays: ['Sunday', 'Tuesday', 'Thursday'],
    tutorGender: 'any',
    description: 'Need help with mechanics and electromagnetism. Board exam in eight months.',
    status: 'approved',
  },
  {
    email: 'karim@tutorly.test',
    subject: 'English',
    classLevel: 'Class 9',
    budget: 3500,
    area: 'Uttara, Dhaka',
    medium: 'English Version',
    daysPerWeek: 2,
    preferredDays: ['Friday', 'Saturday'],
    tutorGender: 'female',
    description: 'Looking for patient guidance with grammar and composition. Weekend sessions preferred.',
    status: 'approved',
  },
  {
    email: 'rahim@tutorly.test',
    subject: 'Mathematics',
    classLevel: 'Class 6',
    budget: 3000,
    area: 'Dhanmondi, Dhaka',
    medium: 'Bangla',
    daysPerWeek: 2,
    preferredDays: [],
    tutorGender: 'any',
    description: 'My son needs a steady hand with fractions and word problems.',
    status: 'pending',
  },
];

const run = async () => {
  await connectDB();

  if (fresh) {
    await Promise.all([
      User.deleteMany({}),
      TutorProfile.deleteMany({}),
      TuitionPost.deleteMany({}),
      Application.deleteMany({}),
    ]);
    console.log('[seed] cleared existing demo data');
  }

  const passwordHash = await bcrypt.hash(demoPassword, 10);
  const adminHash = await bcrypt.hash('admin12345', 10);
  const userMap = {};

  for (const item of users) {
    const existing = await User.findOne({ email: item.email });
    const data = {
      name: item.name,
      email: item.email,
      role: item.role,
      location: item.location,
      password: item.role === 'admin' ? adminHash : passwordHash,
      phone: '01700000000',
      bio: '',
      status: 'active',
    };

    const user = existing
      ? await User.findByIdAndUpdate(existing._id, { $set: data }, { new: true, runValidators: true })
      : await User.create(data);

    userMap[item.email] = user;
  }

  console.log('[seed] users ready');

  for (const item of tutorProfiles) {
    const { email, ...fields } = item;
    const user = userMap[email];
    const existing = await TutorProfile.findOne({ user: user._id });

    if (existing) {
      await TutorProfile.findByIdAndUpdate(existing._id, { $set: fields }, { runValidators: true });
    } else {
      await TutorProfile.create({ user: user._id, ...fields });
    }
  }

  console.log('[seed] tutor profiles ready');

  for (const item of posts) {
    const { email, ...fields } = item;
    const student = userMap[email];
    const existing = await TuitionPost.findOne({ student: student._id, subject: fields.subject });

    if (existing) {
      await TuitionPost.findByIdAndUpdate(existing._id, { $set: fields }, { runValidators: true });
    } else {
      await TuitionPost.create({ student: student._id, ...fields });
    }
  }

  console.log('[seed] tuition posts ready');
  console.log('\nDemo accounts:');
  console.log('  admin@tutorly.test  / admin12345');
  console.log('  rahim@tutorly.test  / demo12345  (student)');
  console.log('  nadia@tutorly.test  / demo12345  (tutor, verified)');
  console.log('  farah@tutorly.test  / demo12345  (tutor, unverified)');
};

run()
  .then(() => mongoose.disconnect())
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('[seed] failed', error);
    process.exit(1);
  });
