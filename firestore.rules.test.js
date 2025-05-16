const { initializeTestEnvironment, assertFails, assertSucceeds } = require("@firebase/rules-unit-testing");
const fs = require("fs");
const firebase = require('@firebase/rules-unit-testing');

let testEnv;

beforeAll(async () => {
  // Initialize the test environment with your rules
  testEnv = await initializeTestEnvironment({
    projectId: "dayfocus-test",
    firestore: {
      rules: fs.readFileSync("firestore.rules", "utf8"),
    },
  });
});

afterAll(async () => {
  // Clean up the test environment
  await testEnv.cleanup();
});

beforeEach(async () => {
  // Clear the database between tests
  await testEnv.clearFirestore();
});

describe("Journal entries", () => {
  it("allows users to create their own journal entries", async () => {
    // Setup: Create an authenticated user context
    const userId = "user123";
    const authenticatedUser = testEnv.authenticatedContext(userId);
    
    // Test: Create a journal entry as the authenticated user
    const journalEntryRef = authenticatedUser.firestore().collection("journalEntries").doc("entry1");
    await assertSucceeds(
      journalEntryRef.set({
        title: "Test Entry",
        content: "This is a test entry",
        userId: userId
      })
    );
  });

  it("prevents users from creating entries for other users", async () => {
    // Setup: Create an authenticated user context
    const userId = "user123";
    const authenticatedUser = testEnv.authenticatedContext(userId);
    
    // Test: Try to create a journal entry with a different userId
    const journalEntryRef = authenticatedUser.firestore().collection("journalEntries").doc("entry1");
    await assertFails(
      journalEntryRef.set({
        title: "Test Entry",
        content: "This is a test entry",
        userId: "differentUser"
      })
    );
  });

  it("allows users to read their own journal entries", async () => {
    // Setup: Create test data
    const userId = "user123";
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await context.firestore().collection("journalEntries").doc("entry1").set({
        title: "Test Entry",
        content: "This is a test entry",
        userId: userId
      });
    });
    
    // Test: Read the entry as the authenticated user
    const authenticatedUser = testEnv.authenticatedContext(userId);
    const journalEntryRef = authenticatedUser.firestore().collection("journalEntries").doc("entry1");
    await assertSucceeds(journalEntryRef.get());
  });

  it("prevents users from reading other users' journal entries", async () => {
    // Setup: Create test data
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await context.firestore().collection("journalEntries").doc("entry1").set({
        title: "Test Entry",
        content: "This is a test entry",
        userId: "user123"
      });
    });
    
    // Test: Try to read the entry as a different user
    const otherUser = testEnv.authenticatedContext("otherUser");
    const journalEntryRef = otherUser.firestore().collection("journalEntries").doc("entry1");
    await assertFails(journalEntryRef.get());
  });
});

// Initialize the Firebase testing environment
function initializeTestEnv() {
  return firebase.initializeTestApp({
    projectId: "dayfocus-test",
    auth: { uid: "test-user", email: "test@example.com" }
  });
} 