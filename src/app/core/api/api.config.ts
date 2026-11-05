import { environment } from '../../../environments/environment';

/*
 * Every API URL in one place. Services import these instead of building
 * URLs themselves, so changing the backend means editing only the
 * environment files.
 */
export const API_ENDPOINTS = {
  boards: `${environment.apiUrl}/boards`,
  tasks: `${environment.apiUrl}/tasks`,
};
