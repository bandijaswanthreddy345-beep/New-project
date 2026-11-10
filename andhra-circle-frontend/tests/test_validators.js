import {
  validateName,
  validateEmail,
  validatePhone,
  validateGradePoint,
  validateAttendance,
  validateCredits,
  validateHallTicket,
  validateYear,
  validateSemester,
  validateBranch,
  validateProfilePhoto,
} from "./validators.js";

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function assert(condition, testDesc) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  ✓ ${testDesc}`);
  } else {
    failedTests++;
    console.error(`  ✗ FAIL: ${testDesc}`);
  }
}

console.log("=================================================");
console.log("RUNNING VALIDATOR TEST SUITE");
console.log("=================================================");

// 1. validateName
console.log("\n[1] validateName tests:");
const validNames = [
  "Chinnu",
  "Jaswanth Reddy",
  "K. Suresh",
  "A-B C",
  "Venkata Ramana Murthy",
  "Dr. K. Ramesh",
];
validNames.forEach((n) => {
  const res = validateName(n);
  assert(res.ok === true && res.value.length >= 2, `Valid name: "${n}" -> ok`);
});

const invalidNames = [
  "",
  " ",
  "A", // Too short (min 2)
  "<script>alert(1)</script>", // Illegal characters
  "User123", // Numbers not allowed
  "Naga@Sai", // Special characters not allowed
  "A".repeat(61), // Exceeds 60 chars
];
invalidNames.forEach((n) => {
  const res = validateName(n);
  assert(res.ok === false && res.message.length > 0, `Invalid name: "${n}" -> rejected: "${res.message}"`);
});

// 2. validateEmail
console.log("\n[2] validateEmail tests:");
const validEmails = [
  "student@gmail.com",
  "chinnu.22@jntua.ac.in",
  "user_123@college.edu",
  "first.last+tag@domain.co.in",
  "test@sub.example.org",
];
validEmails.forEach((e) => {
  const res = validateEmail(e, { required: true });
  assert(res.ok === true, `Valid email: "${e}" -> ok`);
});

const invalidEmails = [
  "",
  " ",
  "plainaddress",
  "@missingusername.com",
  "missingdomain@.com",
  "spaces in@domain.com",
  "a".repeat(101) + "@test.com",
];
invalidEmails.forEach((e) => {
  const res = validateEmail(e, { required: true });
  assert(res.ok === false && res.message.length > 0, `Invalid email: "${e.slice(0, 20)}..." -> rejected`);
});

// 3. validatePhone
console.log("\n[3] validatePhone tests:");
const validPhones = [
  "9876543210",
  "+91 98765 43210",
  "+91-9876543210",
  "98765-43210",
  "8123456789",
  "+918888888888",
];
validPhones.forEach((p) => {
  const res = validatePhone(p, { required: true });
  assert(res.ok === true && res.value.startsWith("+91"), `Valid phone: "${p}" -> ok (${res.value})`);
});

const invalidPhones = [
  "",
  " ",
  "1234567890", // Doesn't start with 6-9
  "987654321", // 9 digits
  "98765432101", // 11 digits
  "abc98765432", // letters
  "+1 9876543210", // Non-Indian country code
  "+91 5123456789", // Starts with 5
];
invalidPhones.forEach((p) => {
  const res = validatePhone(p, { required: true });
  assert(res.ok === false && res.message.length > 0, `Invalid phone: "${p}" -> rejected: "${res.message}"`);
});

// 4. validateGradePoint (SGPA / CGPA)
console.log("\n[4] validateGradePoint tests (SGPA / CGPA):");
const validGrades = [
  "0",
  "0.00",
  "8.5",
  "8.88",
  "9.0",
  "10",
  "10.00",
];
validGrades.forEach((g) => {
  const res = validateGradePoint(g, "SGPA");
  assert(res.ok === true && !isNaN(res.value), `Valid grade: "${g}" -> ok (${res.value})`);
});

const invalidGrades = [
  "",
  " ",
  "-1",
  "10.001",
  "10.1",
  "11",
  "abc",
  "9.9.9",
  "8.888",
];
invalidGrades.forEach((g) => {
  const res = validateGradePoint(g, "SGPA");
  assert(res.ok === false && res.message.length > 0, `Invalid grade: "${g}" -> rejected: "${res.message}"`);
});

// 5. validateAttendance
console.log("\n[5] validateAttendance tests:");
const validAttendances = [
  "75",
  "75%",
  "89.4",
  "89.4%",
  "0",
  "100",
  "100%",
];
validAttendances.forEach((a) => {
  const res = validateAttendance(a);
  assert(res.ok === true && res.value >= 0 && res.value <= 100, `Valid attendance: "${a}" -> ok (${res.value}%)`);
});

const invalidAttendances = [
  "",
  " ",
  "-5",
  "150",
  "100.1",
  "abc",
  "95.999",
];
invalidAttendances.forEach((a) => {
  const res = validateAttendance(a);
  assert(res.ok === false && res.message.length > 0, `Invalid attendance: "${a}" -> rejected: "${res.message}"`);
});

// 6. validateCredits
console.log("\n[6] validateCredits tests:");
const validCredits = [
  "0",
  "20",
  "100",
  "132",
  "160",
];
validCredits.forEach((c) => {
  const res = validateCredits(c, 160);
  assert(res.ok === true && res.value >= 0 && res.value <= 160, `Valid credits: "${c}" -> ok (${res.value})`);
});

const invalidCredits = [
  "",
  " ",
  "-5",
  "161",
  "20.5", // decimal not allowed for whole credits
  "credits",
  "200", // > 160 max
];
invalidCredits.forEach((c) => {
  const res = validateCredits(c, 160);
  assert(res.ok === false && res.message.length > 0, `Invalid credits: "${c}" -> rejected: "${res.message}"`);
});

// 7. validateHallTicket / validateUsn
console.log("\n[7] validateHallTicket (USN) tests:");
const validHallTickets = [
  "22B91A4201",
  "21B91A0201",
  "194G1A0501",
  "21015A0305",
  "20691A04G2",
  "22b91a4201",
  "22-B9-1A-4201",
  "1MS21CS001",
];
validHallTickets.forEach((ht) => {
  const res = validateHallTicket(ht);
  const cleanExpected = ht.replace(/[\s\-_.]/g, "").toUpperCase();
  assert(res.ok === true && res.value === cleanExpected, `Valid USN / hall ticket: "${ht}" -> ok (${res.value})`);
});

const invalidHallTickets = [
  "",
  " ",
  "STGHJTY", // Invalid 7-char format
  "123456", // 6 digits
  "ABCDEF", // 6 letters
  "1234567890", // 10 digits without degree code
  "ABCDEFGHIJ", // 10 letters
  "22B91A4201ABCDEFG", // Too long
  "22B91A@4201", // Symbol not allowed
  "<script>", // Malicious tag
];
invalidHallTickets.forEach((ht) => {
  const res = validateHallTicket(ht);
  assert(res.ok === false && res.message.length > 0, `Invalid USN / hall ticket: "${ht}" -> rejected: "${res.message}"`);
});

// 8. validateYear
console.log("\n[8] validateYear tests:");
const validYears = [
  "1st Year",
  "2nd Year",
  "3rd Year",
  "4th Year",
  "1",
  "3rd",
];
validYears.forEach((y) => {
  const res = validateYear(y);
  assert(res.ok === true && res.value.endsWith("Year"), `Valid year: "${y}" -> ok (${res.value})`);
});

const invalidYears = [
  "",
  " ",
  "5th Year",
  "0 Year",
  "10",
  "Final Year",
];
invalidYears.forEach((y) => {
  const res = validateYear(y);
  assert(res.ok === false && res.message.length > 0, `Invalid year: "${y}" -> rejected: "${res.message}"`);
});

// 9. validateSemester
console.log("\n[9] validateSemester tests:");
const validSemesters = [
  "1st Semester",
  "6th Semester",
  "3-2",
  "2-1",
  "Sem 4",
  "8",
];
validSemesters.forEach((s) => {
  const res = validateSemester(s);
  assert(res.ok === true && res.value.endsWith("Semester"), `Valid semester: "${s}" -> ok (${res.value})`);
});

const invalidSemesters = [
  "",
  " ",
  "9th Semester",
  "0-1",
  "5-1",
  "Sem 10",
  "Winter Semester",
];
invalidSemesters.forEach((s) => {
  const res = validateSemester(s);
  assert(res.ok === false && res.message.length > 0, `Invalid semester: "${s}" -> rejected: "${res.message}"`);
});

// 10. validateBranch
console.log("\n[10] validateBranch tests:");
const validBranches = [
  "CSE",
  "AIML",
  "ECE",
  "Mechanical Engineering",
  "CIVIL",
  "EEE",
  "ai & ml",
];
validBranches.forEach((b) => {
  const res = validateBranch(b);
  assert(res.ok === true && res.code.length >= 2, `Valid branch: "${b}" -> ok (${res.code} - ${res.value})`);
});

const invalidBranches = [
  "",
  " ",
  "Biotechnology",
  "Aeronautical",
  "Medicine",
  "Arts",
  "random_text",
];
invalidBranches.forEach((b) => {
  const res = validateBranch(b);
  assert(res.ok === false && res.message.length > 0, `Invalid branch: "${b}" -> rejected: "${res.message}"`);
});

// 11. validateProfilePhoto
console.log("\n[11] validateProfilePhoto tests:");
const validPhotos = [
  { name: "photo.jpg", type: "image/jpeg", size: 500 * 1024 },
  { name: "photo.png", type: "image/png", size: 1.5 * 1024 * 1024 },
  { name: "avatar.webp", type: "image/webp", size: 200 * 1024 },
  { name: "student.jpeg", type: "image/jpeg", size: 2 * 1024 * 1024 },
  { name: "profile.PNG", type: "image/png", size: 800 * 1024 },
];
validPhotos.forEach((p) => {
  const res = validateProfilePhoto(p);
  assert(res.ok === true, `Valid photo: "${p.name}" (${p.size} bytes) -> ok`);
});

const invalidPhotos = [
  null,
  { name: "doc.pdf", type: "application/pdf", size: 100 * 1024 },
  { name: "script.js", type: "text/javascript", size: 10 * 1024 },
  { name: "photo.jpg", type: "image/jpeg", size: 2.1 * 1024 * 1024 }, // > 2MB
  { name: "huge_avatar.png", type: "image/png", size: 5 * 1024 * 1024 }, // 5MB
  { name: "animation.gif", type: "image/gif", size: 50 * 1024 }, // gif not allowed
];
invalidPhotos.forEach((p, idx) => {
  const res = validateProfilePhoto(p);
  assert(res.ok === false && res.message.length > 0, `Invalid photo #${idx + 1} -> rejected: "${res.message}"`);
});

console.log("\n=================================================");
console.log(`TOTAL TESTS: ${totalTests}`);
console.log(`PASSED: ${passedTests}`);
console.log(`FAILED: ${failedTests}`);
console.log("=================================================");
if (failedTests > 0) {
  process.exit(1);
}

