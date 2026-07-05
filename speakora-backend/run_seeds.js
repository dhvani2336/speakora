const { execSync } = require('child_process');
const path = require('path');

const seedFiles = [
    'seed_lessons_robust.js',
    'seedStories.js',
    'seedWorksheets.js',
    'seed_grammar.js',
    'seed_listening_stories.js',
    'seed_pronunciation.js',
    'seed_sentence.js',
    'seed_speaking.js',
    'seed_tips.js',
    'seed_vocab.js',
    'seed_vocabulary.js'
];

console.log("Starting database seeding process...");

// Temporarily set MONGO_URI to local MongoDB for the subprocesses
process.env.MONGO_URI = 'mongodb://127.0.0.1:27017/speakora';

for (const file of seedFiles) {
    console.log(`\n===========================================`);
    console.log(`Running seed file: ${file}`);
    console.log(`===========================================`);
    try {
        const output = execSync(`node ${file}`, {
            cwd: __dirname,
            env: process.env,
            encoding: 'utf-8'
        });
        console.log(output);
    } catch (err) {
        console.error(`Error running ${file}:`, err.message);
        if (err.stdout) console.log("Stdout:", err.stdout);
        if (err.stderr) console.error("Stderr:", err.stderr);
    }
}

console.log("\nAll seed processes completed!");
