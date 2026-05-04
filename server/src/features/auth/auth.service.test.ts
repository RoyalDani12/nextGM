import { describe, it, vi, expect, beforeEach } from "vitest";
import { registerService } from "./auth.services.js";
import * as authRepo from "./auth.repository.js";
import { emailQueue } from "../../infrastructure/queue/queue.client.js";
import { verificationEmailTemplate } from "../../services/email.templates.js";

// Mock  the Dependencies
// stops the code from hitting the database
vi.mock("./auth.repository.js");

vi.mock("../../utils/auth.utils.js", () => ({
  hashPassword: vi.fn().mockResolvedValue("hashed_password_123"),
}));

vi.mock("../../services/email.templates.js", () => ({
  verificationEmailTemplate: vi.fn(() => ({
    subject: " verify Email",
    html: "<h1>Test</h1>",
  })),
}));

vi.mock("../../infrastructure/queue/queue.client.js", () => ({
  emailQueue: { add: vi.fn() },
}));

describe("Register service", () => {
  //  clear mocks before run the test
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("it should throw 409 error if the email is already in use", async () => {
    // tell the fake repository to run an exiting user
    vi.spyOn(authRepo, "findUserByEmail").mockResolvedValue({
      id: "1",
      email: "new@me.com",
    } as any);
    // expect the service throw the specific app error
    const userData = {
      name: "Dani",
      email: "new@me.com",
      password: "password123",
    };

    await expect(registerService(userData)).rejects.toThrow(
      " Email already in use ",
    );

    // logic if the user exist we should never call createUser and emailQueue
    expect(emailQueue.add).not.toHaveBeenCalled();
  });

  it(" Should successful register a new user and add to the email queue", async () => {
    // tell  the user is not exist
    vi.spyOn(authRepo, "findUserByEmail").mockResolvedValue(null);
    vi.spyOn(authRepo, "createUserWithVerification").mockResolvedValue({
      user: {
        id: "123",
        name: "Dani", // Must have name for the email template
        email: "new@me.com",
        createdAt: new Date(),
      },
      rawToken: "fake-raw-token",
    } as any);

    //  act run the service
    const result = await registerService({
      name: "Dani",
      email: "new@me.com",
      password: "password123",
    });

    // check the outcome

    expect(result.user.name).toBe("Dani");

    // check the Bg Job was triggered
    expect(emailQueue.add).toHaveBeenCalledWith(
      "verify-email",
      expect.objectContaining({
        to: "new@me.com",
      }),
    );
  });
});
