import { mockApi } from "./mock/mock-api";
import type { ApiClient } from "./types";

/**
 * Single swap point for the data layer. Replace `mockApi` with a real HTTP /
 * Lovable Cloud client when the backend, sensors and AI model are connected.
 */
export const api: ApiClient = mockApi;
