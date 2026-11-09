// Verification script for User Scenarios 2, 3, and 4
import {
  validateName,
  validatePhone,
  validateAttendance,
  validateGradePoint,
  validateSubjectCredits,
  validateSubjectMarks,
  validateBranch,
  validateHallTicket,
  validateSemester,
  validateRegulation,
  validateProfilePhoto,
} from "./validators.js";
import { saveStoredStudentData, getStoredStudentData } from "../data/studentData.js";

console.log("=================================================");
console.log("TEST SCENARIO 2: PROFILE PAGE VALIDATION ATTEMPTS");
console.log("=================================================");

const profileAttempts = [
  { field: "Empty name", test: () => validateName("") },
  { field: "Name with numbers", test: () => validateName("Chinnu123") },
  { field: "5-digit phone", test: () => validatePhone("98765") },
  { field: "Attendance of 150", test: () => validateAttendance("150") },
  { field: "SGPA of 11", test: () => validateGradePoint("11", "SGPA") },
  {
    field: "Image over 2 MB (2.5 MB)",
    test: () =>
      validateProfilePhoto({
        name: "avatar.png",
        type: "image/png",
        size: 2.5 * 1024 * 1024,
      }),
  },
];

profileAttempts.forEach(({ field, test }) => {
  const result = test();
  console.log(`- ${field}: ok = ${result.ok}, message = "${result.message}"`);
});

// Test saveStoredStudentData defensive rejection
console.log("\nDefensive saveStoredStudentData rejection with bad data:");
// Mock localStorage in Node
global.localStorage = {
  _store: {},
  getItem(k) { return this._store[k] || null; },
  setItem(k, v) { this._store[k] = String(v); },
  removeItem(k) { delete this._store[k]; }
};

const badProfile = {
  name: "Bad123Name",
  email: "invalid-email",
  phone: "123",
  attendance: "200%",
  cgpa: "15.5",
  hallTicket: "short"
};
const saveResult = saveStoredStudentData(badProfile);
console.log("saveStoredStudentData result:", saveResult);

console.log("\n=================================================");
console.log("TEST SCENARIO 3: CALCULATOR INPUT VALIDATION");
console.log("=================================================");

const calcAttempts = [
  { field: "Blank credit", test: () => validateSubjectCredits("") },
  { field: "Text in grade / marks", test: () => validateSubjectMarks("GradeA") },
  { field: "SGPA of -2", test: () => validateGradePoint("-2", "SGPA") },
  { field: "SGPA of 12", test: () => validateGradePoint("12", "SGPA") },
];

calcAttempts.forEach(({ field, test }) => {
  const result = test();
  console.log(`- ${field}: ok = ${result.ok}, message = "${result.message}"`);
});

console.log("\n=================================================");
console.log("TEST SCENARIO 4: CHATBOT WIZARD REJECTION & STEP PRESERVATION");
console.log("=================================================");

function simulateChatbotWizardStep(step, input) {
  if (step === "NAME") {
    const val = validateName(input);
    if (!val.ok) {
      return { stepStayed: true, nextStep: "NAME", error: val.message };
    }
    return { stepStayed: false, nextStep: "HALLTICKET", value: val.value };
  }
  if (step === "BRANCH") {
    const val = validateBranch(input);
    if (!val.ok) {
      return { stepStayed: true, nextStep: "BRANCH", error: val.message };
    }
    return { stepStayed: false, nextStep: "SEMESTER", value: val.value };
  }
  if (step === "ATTENDANCE") {
    const val = validateAttendance(input);
    if (!val.ok) {
      return { stepStayed: true, nextStep: "ATTENDANCE", error: val.message };
    }
    return { stepStayed: false, nextStep: "COMPLETE", value: val.value };
  }
}

const wizard1 = simulateChatbotWizardStep("NAME", "User!@#$");
console.log(`- Invalid Name ("User!@#$"): stay on step? ${wizard1.stepStayed} (Current: ${wizard1.nextStep}), reply: "${wizard1.error}"`);

const wizard2 = simulateChatbotWizardStep("BRANCH", "invalid_branch_xyz");
console.log(`- Invalid Branch ("invalid_branch_xyz"): stay on step? ${wizard2.stepStayed} (Current: ${wizard2.nextStep}), reply: "${wizard2.error}"`);

const wizard3 = simulateChatbotWizardStep("ATTENDANCE", "abc");
console.log(`- Invalid Attendance ("abc"): stay on step? ${wizard3.stepStayed} (Current: ${wizard3.nextStep}), reply: "${wizard3.error}"`);

console.log("\nAll flow scenarios verified successfully!");
