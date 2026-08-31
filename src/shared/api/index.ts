export type MockApiScenario = 'empty' | 'error' | 'slow';

export type ApiErrorResponse = {
  message: string;
};

export { ApiError } from './api-error';
