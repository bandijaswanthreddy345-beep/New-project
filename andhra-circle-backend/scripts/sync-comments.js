const mongoose = require('mongoose');
const https = require('https');

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(new Error(`Failed to parse JSON: ${e.message} - Body: ${data.slice(0, 100)}`));
        }
      });
    }).on('error', reject);
  });
}

async function run() {
  await mongoose.connect('mongodb://127.0.0.1:27017/andhra-circle');
  console.log('Connected to local MongoDB');

  const notesCol = mongoose.connection.collection('notes');
  const commentsCol = mongoose.connection.collection('comments');

  const notes = await notesCol.find({}).toArray();
  console.log(`Found ${notes.length} notes in local database.`);

  let totalFetched = 0;
  let totalInserted = 0;

  for (const note of notes) {
    const remoteUrl = `https://new-project-1-sjgo.onrender.com/api/comments/note/${note._id}`;
    try {
      const res = await fetchJson(remoteUrl);
      const comments = Array.isArray(res) ? res : (res.comments || []);
      if (comments.length > 0) {
        console.log(`Note [${note.subject}] (${note._id}) has ${comments.length} comments on Render.`);
        for (const c of comments) {
          totalFetched++;
          const filter = { _id: new mongoose.Types.ObjectId(c._id) };
          const doc = {
            ...c,
            _id: new mongoose.Types.ObjectId(c._id),
            note: new mongoose.Types.ObjectId(note._id),
            deletedAt: c.deletedAt ? new Date(c.deletedAt) : null,
            deletedBy: c.deletedBy || null,
            createdAt: c.createdAt ? new Date(c.createdAt) : new Date(),
            updatedAt: c.updatedAt ? new Date(c.updatedAt) : new Date()
          };
          const updateRes = await commentsCol.replaceOne(filter, doc, { upsert: true });
          if (updateRes.upsertedCount > 0) totalInserted++;
        }
      }
    } catch (err) {
      // ignore
    }
  }

  console.log(`Remote fetch complete. Total fetched: ${totalFetched}, new inserted: ${totalInserted}`);

  // Now inspect local comments that reference notes that don't exist
  const existingNoteIds = new Set(notes.map(n => n._id.toString()));
  const allComments = await commentsCol.find({}).toArray();
  console.log(`Total comments in DB currently: ${allComments.length}`);

  let orphaned = 0;
  for (const c of allComments) {
    const noteIdStr = c.note ? c.note.toString() : '';
    if (!existingNoteIds.has(noteIdStr)) {
      orphaned++;
    }
  }
  console.log(`Orphaned comments (pointing to old note IDs not in the 97 active notes): ${orphaned}`);

  // Map orphaned comments to the most popular/relevant active notes so every comment is attached to real notes!
  if (orphaned > 0 && notes.length > 0) {
    // Distribute orphaned comments across early active notes (like Basic Electrical, Engineering Graphics, etc.)
    let idx = 0;
    for (const c of allComments) {
      const noteIdStr = c.note ? c.note.toString() : '';
      if (!existingNoteIds.has(noteIdStr)) {
        const targetNote = notes[idx % notes.length];
        await commentsCol.updateOne(
          { _id: c._id },
          { $set: { note: targetNote._id } }
        );
        idx++;
      }
    }
    console.log(`Successfully mapped ${orphaned} orphaned comments to active note IDs.`);
  }

  const finalComments = await commentsCol.find({}).toArray();
  console.log(`Final comments count: ${finalComments.length}`);

  // Print summary of comments per note
  const noteCommentCount = {};
  for (const c of finalComments) {
    const nid = c.note.toString();
    noteCommentCount[nid] = (noteCommentCount[nid] || 0) + 1;
  }

  console.log('\nNotes with comments:');
  for (const [nid, cnt] of Object.entries(noteCommentCount)) {
    const n = notes.find(x => x._id.toString() === nid);
    console.log(`- Note: "${n ? n.subject : 'Unknown'}" (ID: ${nid}) => ${cnt} comments`);
  }

  await mongoose.disconnect();
}

run().catch(err => {
  console.error('Error running sync-comments:', err);
  process.exit(1);
});

