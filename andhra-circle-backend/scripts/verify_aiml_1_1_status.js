const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function check() {
  await mongoose.connect(process.env.MONGO_URI);
  const Lab = mongoose.model('LabProgram', new mongoose.Schema({}, { strict: false }));
  const labs = await Lab.find({ branch: 'AIML', semester: '1-1' });
  console.log('--- AIML 1-1 LABS ---');
  labs.forEach(l => {
    const p = path.join(__dirname, '..', l.pdfUrl);
    console.log(`LAB: ${l.subjectCode} | ${l.subject} | File exists (${l.pdfUrl}): ${fs.existsSync(p)}`);
  });

  const Note = mongoose.model('Note', new mongoose.Schema({}, { strict: false }));
  const notes = await Note.find({ branch: 'AIML', semester: '1-1' });
  console.log('\n--- AIML 1-1 NOTES ---');
  notes.forEach(n => {
    const p = path.join(__dirname, '..', n.pdfUrl);
    console.log(`NOTE: ${n.subjectCode} | ${n.subject} | File exists (${n.pdfUrl}): ${fs.existsSync(p)}`);
  });

  await mongoose.disconnect();
}
check();
