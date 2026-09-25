import { api, API_BASE, formatApiError, money } from "./api";

test("API uses same-origin backend by default", () => {
  expect(API_BASE).toBe("/api");
  expect(api.defaults.withCredentials).toBe(true);
});

test("API errors and money formatting are stable", () => {
  expect(formatApiError({ msg: "Bad request" })).toBe("Bad request");
  expect(formatApiError([{ msg: "One" }, { msg: "Two" }])).toBe("One Two");
  expect(money(1234.5)).toBe("₹1,234.5");
});
