const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const UPLOADS_DIR_1 = path.join(__dirname, '../uploads');
const UPLOADS_DIR_2 = path.join(__dirname, '../../uploads');

if (!fs.existsSync(UPLOADS_DIR_1)) fs.mkdirSync(UPLOADS_DIR_1, { recursive: true });
if (!fs.existsSync(UPLOADS_DIR_2)) fs.mkdirSync(UPLOADS_DIR_2, { recursive: true });

function saveToBothUploads(filename, pdfBytes) {
  fs.writeFileSync(path.join(UPLOADS_DIR_1, filename), pdfBytes);
  fs.writeFileSync(path.join(UPLOADS_DIR_2, filename), pdfBytes);
  console.log(`Saved: ${filename} (${(pdfBytes.length / 1024).toFixed(1)} KB)`);
}

async function createSampleStudyMaterialPdf() {
  const pdfDoc = await PDFDocument.create();
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);

  // Page 1
  const page = pdfDoc.addPage([595.28, 841.89]); // A4
  const { width, height } = page.getSize();

  // Header Bar
  page.drawRectangle({
    x: 0,
    y: height - 90,
    width: width,
    height: 90,
    color: rgb(0.004, 0.227, 0.2), // #013a33 Deep Emerald
  });

  page.drawText('JAWAHARLAL NEHRU TECHNOLOGICAL UNIVERSITY ANANTAPUR', {
    x: 40,
    y: height - 42,
    size: 13,
    font: fontBold,
    color: rgb(0.98, 0.85, 0.45), // Gold
  });

  page.drawText('JNTU CIRCLE - ACADEMIC STUDY & LAB MANUAL GUIDE', {
    x: 40,
    y: height - 62,
    size: 11,
    font: fontBold,
    color: rgb(1, 1, 1),
  });

  let y = height - 125;

  page.drawText('LABORATORY PRACTICE & STUDY GUIDELINES', {
    x: 40,
    y: y,
    size: 14,
    font: fontBold,
    color: rgb(0.004, 0.227, 0.2),
  });

  y -= 25;
  page.drawText('Regulations: R23 / R20 CBCS Engineering Curriculum', {
    x: 40,
    y: y,
    size: 10,
    font: fontRegular,
    color: rgb(0.3, 0.3, 0.3),
  });

  y -= 35;
  const sections = [
    {
      title: '1. GENERAL INSTRUCTIONS FOR LABORATORY WORK',
      lines: [
        '• Students must attend laboratory sessions on time with proper dress code and observation notebook.',
        '• Maintain silence and discipline inside the laboratory premises.',
        '• Verify apparatus, equipment, components, or software environments before beginning experiments.',
        '• Record observed readings and practical outputs accurately in the observation book during the lab session.'
      ]
    },
    {
      title: '2. STANDARD LABORATORY PROCEDURE & CODE OF CONDUCT',
      lines: [
        '• Understand the theory, circuit diagram, block diagram, or algorithmic flow before execution.',
        '• Obtain prior approval from the faculty-in-charge before energizing circuits or running batch scripts.',
        '• Analyze experimental results, errors, graphs, and performance metrics thoroughly.',
        '• Clean up workbenches and shutdown systems properly before leaving the laboratory.'
      ]
    },
    {
      title: '3. SCHEME OF EVALUATION (INTERNAL & EXTERNAL EXAMINATIONS)',
      lines: [
        '• Day-to-day continuous evaluation (Observation, Record, Viva-voce): 30 Marks',
        '• Internal Laboratory Mid-Term Examination: 10 Marks',
        '• End Semester Practical University Examination: 60 Marks',
        '• Total Laboratory Coursework Weightage: 100 Marks'
      ]
    },
    {
      title: '4. RESOURCES & ACCESS',
      lines: [
        '• Complete unit-wise lecture notes, previous question papers, and manuals are available on JNTU Circle.',
        '• For any syllabus clarification or study inquiries, visit https://new-project-cyan.vercel.app'
      ]
    }
  ];

  for (const s of sections) {
    page.drawText(s.title, {
      x: 40,
      y: y,
      size: 11,
      font: fontBold,
      color: rgb(0.004, 0.227, 0.2),
    });
    y -= 16;
    for (const l of s.lines) {
      page.drawText(l, {
        x: 50,
        y: y,
        size: 9.5,
        font: fontRegular,
        color: rgb(0.2, 0.2, 0.2),
      });
      y -= 15;
    }
    y -= 12;
  }

  // Footer
  page.drawRectangle({
    x: 0,
    y: 0,
    width: width,
    height: 35,
    color: rgb(0.96, 0.98, 0.97),
  });
  page.drawText('JNTU Circle Academic Repository • Verified Engineering Resources', {
    x: 40,
    y: 13,
    size: 9,
    font: fontRegular,
    color: rgb(0.4, 0.5, 0.45),
  });

  const pdfBytes = await pdfDoc.save();
  saveToBothUploads('sample_study_material.pdf', pdfBytes);
}

async function createSyllabusPdf(item) {
  const pdfDoc = await PDFDocument.create();
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);

  const page = pdfDoc.addPage([595.28, 841.89]);
  const { width, height } = page.getSize();

  // Header Bar
  page.drawRectangle({
    x: 0,
    y: height - 100,
    width: width,
    height: 100,
    color: rgb(0.004, 0.227, 0.2), // #013a33
  });

  page.drawText('JAWAHARLAL NEHRU TECHNOLOGICAL UNIVERSITY ANANTAPUR', {
    x: 40,
    y: height - 38,
    size: 12.5,
    font: fontBold,
    color: rgb(0.98, 0.85, 0.45),
  });

  page.drawText(`COURSE CURRICULUM & SYLLABUS - ${item.regulation || 'R23'} REGULATIONS`, {
    x: 40,
    y: height - 58,
    size: 11,
    font: fontBold,
    color: rgb(1, 1, 1),
  });

  page.drawText(`B.Tech ${item.branch || 'Engineering'} • Semester ${item.semester || 'Academic Year'}`, {
    x: 40,
    y: height - 76,
    size: 9.5,
    font: fontRegular,
    color: rgb(0.85, 0.92, 0.9),
  });

  let y = height - 130;

  // Title Box
  page.drawRectangle({
    x: 40,
    y: y - 35,
    width: width - 80,
    height: 48,
    color: rgb(0.95, 0.98, 0.97),
    borderColor: rgb(0.8, 0.9, 0.88),
    borderWidth: 1,
  });

  page.drawText(`SUBJECT: ${(item.title || item.subject || 'Course Syllabus').toUpperCase()}`, {
    x: 55,
    y: y - 5,
    size: 12,
    font: fontBold,
    color: rgb(0.004, 0.227, 0.2),
  });

  page.drawText(`Category: ${item.description || 'Professional Core / Elective Course'}`, {
    x: 55,
    y: y - 22,
    size: 9.5,
    font: fontRegular,
    color: rgb(0.3, 0.4, 0.38),
  });

  y -= 65;

  const defaultUnits = [
    {
      unit: 'UNIT I: FOUNDATIONS & PRINCIPLES',
      content: 'Fundamental concepts, architectural principles, mathematical preliminaries, design paradigms, historical context, and introductory frameworks relevant to modern computational and engineering systems.'
    },
    {
      unit: 'UNIT II: CORE ARCHITECTURE & MODELING',
      content: 'System structures, domain-specific models, algorithmic methodologies, component interactions, representation standards, and structural analysis methodologies.'
    },
    {
      unit: 'UNIT III: IMPLEMENTATION & DEVELOPMENT',
      content: 'Technological tools, standard libraries, API integrations, processing pipelines, simulation tools, verification techniques, and real-time execution optimization.'
    },
    {
      unit: 'UNIT IV: ADVANCED CONCEPTS & SECURITY',
      content: 'Distributed architectures, secure protocols, performance tuning, failure recovery, scalability, identity management, and compliance with industry standards.'
    },
    {
      unit: 'UNIT V: APPLICATIONS, CASE STUDIES & FUTURE TRENDS',
      content: 'Industry case studies, contemporary deployments, practical engineering solutions, research advancements, and emerging technological paradigms.'
    }
  ];

  for (const u of defaultUnits) {
    page.drawText(u.unit, {
      x: 40,
      y: y,
      size: 10.5,
      font: fontBold,
      color: rgb(0.004, 0.227, 0.2),
    });
    y -= 16;
    
    // wrap text roughly at 85 chars
    const words = u.content.split(' ');
    let line = '';
    for (const w of words) {
      if ((line + w).length > 85) {
        page.drawText(line, { x: 50, y: y, size: 9, font: fontRegular, color: rgb(0.2, 0.2, 0.2) });
        y -= 13;
        line = '';
      }
      line += (line ? ' ' : '') + w;
    }
    if (line) {
      page.drawText(line, { x: 50, y: y, size: 9, font: fontRegular, color: rgb(0.2, 0.2, 0.2) });
      y -= 13;
    }
    y -= 12;
  }

  y -= 5;
  page.drawText('TEXTBOOKS & REFERENCE MATERIALS:', {
    x: 40,
    y: y,
    size: 10,
    font: fontBold,
    color: rgb(0.004, 0.227, 0.2),
  });
  y -= 15;
  page.drawText('1. Official JNTUA Prescribed Textbook and Academic Regulation Syllabus Guide.', {
    x: 50,
    y: y,
    size: 8.5,
    font: fontRegular,
    color: rgb(0.3, 0.3, 0.3),
  });
  y -= 13;
  page.drawText('2. Standard University Engineering Curriculum Publications & ACM/IEEE Guidelines.', {
    x: 50,
    y: y,
    size: 8.5,
    font: fontRegular,
    color: rgb(0.3, 0.3, 0.3),
  });

  // Footer
  page.drawRectangle({
    x: 0,
    y: 0,
    width: width,
    height: 35,
    color: rgb(0.96, 0.98, 0.97),
  });
  page.drawText('JNTU Circle Academic Repository • Jawaharlal Nehru Technological University Anantapur', {
    x: 40,
    y: 13,
    size: 8.5,
    font: fontRegular,
    color: rgb(0.4, 0.5, 0.45),
  });

  const pdfBytes = await pdfDoc.save();
  const rawFileName = item.pdfUrl.replace(/^\/uploads\//, '').replace(/^uploads\//, '');
  saveToBothUploads(rawFileName, pdfBytes);
}

async function run() {
  console.log('1. Creating sample_study_material.pdf...');
  await createSampleStudyMaterialPdf();

  console.log('2. Connecting to MongoDB to fetch missing syllabus items...');
  await mongoose.connect(process.env.MONGO_URI);
  const col = mongoose.connection.collection('syllabuses');
  const allSyllabus = await col.find({}).toArray();

  let missingCount = 0;
  for (const s of allSyllabus) {
    if (!s.pdfUrl) continue;
    const raw = s.pdfUrl.replace(/^\/uploads\//, '').replace(/^uploads\//, '');
    const p1 = path.join(UPLOADS_DIR_1, raw);
    const p2 = path.join(UPLOADS_DIR_2, raw);
    if (!fs.existsSync(p1) && !fs.existsSync(p2)) {
      await createSyllabusPdf(s);
      missingCount++;
    }
  }

  console.log(`Generated PDFs for all ${missingCount} missing syllabus items!`);

  // 3. Update notes collection records to exact files on disk
  console.log('3. Updating Notes collection records in MongoDB...');
  const notesCol = mongoose.connection.collection('notes');
  const allNotes = await notesCol.find({}).toArray();
  const files = fs.readdirSync(UPLOADS_DIR_1);
  let notesUpdated = 0;

  for (const n of allNotes) {
    if (!n.pdfUrl) continue;
    const raw = n.pdfUrl.replace(/^\/uploads\//, '').replace(/^uploads\//, '');
    if (!files.includes(raw)) {
      const code = (n.subjectCode || '').trim();
      let match = null;
      if (code) match = files.find(f => f.startsWith(code) && f.endsWith('.pdf'));
      if (!match) {
        const stripped = raw.replace('_Complete_Notes', '').replace('_Manual', '').replace('_Lab_Manual', '_Lab');
        if (files.includes(stripped)) match = stripped;
      }
      if (match) {
        await notesCol.updateOne({ _id: n._id }, { $set: { pdfUrl: `/uploads/${match}` } });
        notesUpdated++;
      }
    }
  }
  console.log(`Updated ${notesUpdated} notes records in DB!`);

  // 4. Update labprograms collection records in MongoDB
  console.log('4. Updating LabPrograms records in MongoDB...');
  const labsCol = mongoose.connection.collection('labprograms');
  const allLabs = await labsCol.find({}).toArray();
  let labsUpdated = 0;

  for (const l of allLabs) {
    if (!l.pdfUrl) continue;
    const raw = l.pdfUrl.replace(/^\/uploads\//, '').replace(/^uploads\//, '');
    if (!files.includes(raw)) {
      const code = (l.subjectCode || '').trim();
      let match = null;
      if (code) match = files.find(f => f.startsWith(code) && f.endsWith('.pdf'));
      if (!match) {
        const stripped = raw.replace('_Complete_Notes', '').replace('_Manual', '').replace('_Lab_Manual', '_Lab');
        if (files.includes(stripped)) match = stripped;
      }
      if (match) {
        await labsCol.updateOne({ _id: l._id }, { $set: { pdfUrl: `/uploads/${match}` } });
        labsUpdated++;
      }
    }
  }
  console.log(`Updated ${labsUpdated} lab records in DB!`);

  await mongoose.disconnect();
  console.log('ALL DONE SUCCESSFULLY!');
}

run().catch(console.error);
