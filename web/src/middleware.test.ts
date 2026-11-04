import { describe, expect, it } from "vitest";
import {
  isChatApiPath,
  isHtmlAcceptHeader,
  isInterviewPath,
  isValidDifficultyLevel,
} from "./middleware";

describe("isValidDifficultyLevel", () => {
  it("should return true for 'normal'", () => {
    expect(isValidDifficultyLevel("normal")).toBe(true);
  });

  it("should return true for 'hard'", () => {
    expect(isValidDifficultyLevel("hard")).toBe(true);
  });

  it("should return false for invalid value", () => {
    expect(isValidDifficultyLevel("easy")).toBe(false);
  });

  it("should return false for empty string", () => {
    expect(isValidDifficultyLevel("")).toBe(false);
  });

  it("should return false for null", () => {
    expect(isValidDifficultyLevel(null)).toBe(false);
  });
});

describe("isHtmlAcceptHeader", () => {
  it("should return true for text/html", () => {
    expect(isHtmlAcceptHeader("text/html")).toBe(true);
  });

  it("should return true for accept header with text/html among others", () => {
    expect(
      isHtmlAcceptHeader(
        "text/html,application/xhtml+xml,application/xml;q=0.9"
      )
    ).toBe(true);
  });

  it("should return false for application/json", () => {
    expect(isHtmlAcceptHeader("application/json")).toBe(false);
  });

  it("should return false for image/png", () => {
    expect(isHtmlAcceptHeader("image/png")).toBe(false);
  });

  it("should return false for empty string", () => {
    expect(isHtmlAcceptHeader("")).toBe(false);
  });
});

describe("isInterviewPath", () => {
  it.each([
    "/bills/abc/interview",
    "/bills/abc/interview/chat",
    "/bills/abc/interview/disclosure",
    "/preview/bills/abc/interview",
    "/preview/bills/abc/interview/chat",
    "/bills/abc/opinions",
    "/report/xyz",
    "/report/xyz/chat-log",
    "/api/interview/chat",
    "/api/interview/complete",
    "/api/og/report",
  ])("should return true for %s", (pathname) => {
    expect(isInterviewPath(pathname)).toBe(true);
  });

  it.each([
    "/",
    "/bills/abc",
    "/preview/bills/abc",
    "/bills/interview-guide",
    "/reports",
    "/api/chat",
    "/api/og/bill",
  ])("should return false for %s", (pathname) => {
    expect(isInterviewPath(pathname)).toBe(false);
  });
});

describe("isChatApiPath", () => {
  it.each([
    "/api/chat",
    "/api/chat/",
  ])("should return true for %s", (pathname) => {
    expect(isChatApiPath(pathname)).toBe(true);
  });

  it.each([
    "/api/chatbot",
    "/api/interview/chat",
    "/chat",
  ])("should return false for %s", (pathname) => {
    expect(isChatApiPath(pathname)).toBe(false);
  });
});
