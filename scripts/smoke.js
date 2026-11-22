/* eslint-disable no-console */
process.env.MONGOMS_VERSION = process.env.MONGOMS_VERSION || '7.0.14';

const assert = require('node:assert/strict');
const path = require('node:path');
const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const request = require('supertest');

process.env.JWT_SECRET = 'smoke-test-secret';
process.env.JWT_EXPIRES_IN = '1h';

const check = (label, condition) => {
  assert.ok(condition, label);
  console.log(`  ok  ${label}`);
};

const run = async () => {
  const mongod = await MongoMemoryServer.create();
  process.env.MONGO_URI = mongod.getUri();

  const app = require('../src/app');
  const User = require('../src/models/User');
  const { signToken } = require('../src/utils/token');

  await mongoose.connect(process.env.MONGO_URI);

  try {
    console.log('\n[smoke] health');
    const health = await request(app).get('/api/health');
    check('health returns 200', health.status === 200);
    check('health reports ok', health.body.status === 'ok');

    console.log('\n[smoke] auth');
    const studentReg = await request(app).post('/api/auth/register').send({
      name: 'Test Student',
      email: 'student@smoke.test',
      password: 'password123',
      role: 'student',
      location: 'Dhanmondi',
    });
    check('student registers', studentReg.status === 201);
    const studentToken = studentReg.body.token;
    check('student token issued', Boolean(studentToken));

    const tutorReg = await request(app).post('/api/auth/register').send({
      name: 'Test Tutor',
      email: 'tutor@smoke.test',
      password: 'password123',
      role: 'tutor',
      location: 'Banani',
    });
    check('tutor registers', tutorReg.status === 201);
    const tutorToken = tutorReg.body.token;

    const me = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${studentToken}`);
    check('protected /me works', me.status === 200 && me.body.user.email === 'student@smoke.test');

    const admin = await User.create({
      name: 'Smoke Admin',
      email: 'admin@smoke.test',
      password: await bcrypt.hash('password123', 10),
      role: 'admin',
    });
    const adminToken = signToken(admin);

    console.log('\n[smoke] posts and moderation');
    const postRes = await request(app)
      .post('/api/posts')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        subject: 'Physics',
        classLevel: 'HSC',
        budget: 5000,
        area: 'Dhanmondi',
        description: 'Need help with mechanics',
      });
    check('student creates post', postRes.status === 201);
    const postId = postRes.body.post._id;
    check('new post starts pending', postRes.body.post.status === 'pending');

    const hidden = await request(app).get('/api/posts');
    check('pending post hidden from public board', hidden.body.data.length === 0);

    const approve = await request(app)
      .put(`/api/admin/posts/${postId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'approved' });
    check('admin approves post', approve.status === 200 && approve.body.post.status === 'approved');

    const visible = await request(app).get('/api/posts?subject=phys');
    check('approved post visible with search', visible.body.data.length === 1);

    console.log('\n[smoke] tutor profile and applications');
    const profile = await request(app)
      .put('/api/tutors/me')
      .set('Authorization', `Bearer ${tutorToken}`)
      .send({
        headline: 'Physics tutor',
        subjects: ['Physics'],
        classLevels: ['HSC'],
        hourlyRate: 800,
        area: 'Banani',
      });
    check('tutor updates teaching profile', profile.status === 200);
    const tutorProfileId = profile.body.profile._id;

    const apply = await request(app)
      .post('/api/applications')
      .set('Authorization', `Bearer ${tutorToken}`)
      .send({ postId, message: 'I can help with mechanics.' });
    check('tutor applies to approved post', apply.status === 201);

    const duplicate = await request(app)
      .post('/api/applications')
      .set('Authorization', `Bearer ${tutorToken}`)
      .send({ postId });
    check('duplicate application rejected', duplicate.status === 409);

    const received = await request(app)
      .get('/api/applications/received')
      .set('Authorization', `Bearer ${studentToken}`);
    check('student sees received application', received.body.data.length === 1);
    const applicationId = received.body.data[0]._id;

    const accept = await request(app)
      .put(`/api/applications/${applicationId}`)
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ status: 'accepted' });
    check('student accepts application', accept.status === 200 && accept.body.application.status === 'accepted');

    console.log('\n[smoke] documents');
    const upload = await request(app)
      .post('/api/tutors/me/documents')
      .set('Authorization', `Bearer ${tutorToken}`)
      .attach('documents', Buffer.from('%PDF-1.4 smoke test'), {
        filename: 'certificate.pdf',
        contentType: 'application/pdf',
      });
    check('tutor uploads document', upload.status === 201 && upload.body.documents.length === 1);
    const filename = upload.body.documents[0];

    const ownerDownload = await request(app)
      .get(`/api/tutors/me/documents/${filename}`)
      .set('Authorization', `Bearer ${tutorToken}`);
    check('owner can open document', ownerDownload.status === 200);

    const strangerDownload = await request(app)
      .get(`/api/tutors/me/documents/${filename}`)
      .set('Authorization', `Bearer ${studentToken}`);
    check('other user cannot open document', strangerDownload.status === 403);

    const adminDownload = await request(app)
      .get(`/api/tutors/me/documents/${filename}`)
      .set('Authorization', `Bearer ${adminToken}`);
    check('admin can open document', adminDownload.status === 200);

    console.log('\n[smoke] admin verification');
    const verified = await request(app)
      .put(`/api/admin/tutors/${tutorProfileId}/verify`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ verified: true });
    check('admin verifies tutor', verified.status === 200 && verified.body.profile.verified === true);

    const tutors = await request(app).get('/api/tutors?verified=true');
    check('verified tutor appears in directory', tutors.body.data.length === 1);

    console.log('\n[smoke] reviews');
    const review = await request(app)
      .post('/api/reviews')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ tutorId: tutorReg.body.user.id, rating: 5, comment: 'Clear and patient.' });
    check('student reviews accepted tutor', review.status === 201);

    const duplicateReview = await request(app)
      .post('/api/reviews')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ tutorId: tutorReg.body.user.id, rating: 4 });
    check('duplicate review rejected', duplicateReview.status === 409);

    const ratedTutor = await request(app).get('/api/tutors?verified=true');
    check('tutor rating recalculated', ratedTutor.body.data[0].ratingAvg === 5);
    check('tutor rating count recalculated', ratedTutor.body.data[0].ratingCount === 1);

    const reviewList = await request(app).get(`/api/reviews?tutorId=${tutorReg.body.user.id}`);
    check('reviews listed publicly', reviewList.body.data.length === 1);

    console.log('\n[smoke] public stats');
    const stats = await request(app).get('/api/stats');
    check('public stats returns 200', stats.status === 200);
    check('stats count verified tutors from database', stats.body.stats.tutors === 1);
    check('stats count approved posts from database', stats.body.stats.posts === 1);
    check('stats average rating from reviews', stats.body.stats.rating === 5);

    const nonAdmin = await request(app)
      .get('/api/admin/stats')
      .set('Authorization', `Bearer ${studentToken}`);
    check('admin routes blocked for students', nonAdmin.status === 403);

    console.log('\n[smoke] all checks passed');
  } finally {
    await mongoose.disconnect();
    await mongod.stop();
  }
};

run().catch((error) => {
  console.error('\n[smoke] failed:', error.message);
  process.exit(1);
});
