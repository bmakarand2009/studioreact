/**
 * Auth Utilities
 * 
 * Methods are derivations of the Auth0 Angular-JWT helper service methods
 * https://github.com/auth0/angular2-jwt
 */

export class AuthUtils {
  /**
   * Is token expired?
   *
   * @param token
   * @param offsetSeconds
   */
  static isTokenExpired(token: string, offsetSeconds: number = 0): boolean {
    // Return if there is no token
    if (!token || token === '') {
      return true;
    }

    // Get the expiration date
    const date = this.getTokenExpirationDate(token);

    if (date === null) {
      return true;
    }

    // Check if the token is expired
    return !(date.valueOf() > new Date().valueOf() + offsetSeconds * 1000);
  }

  /**
   * Get token expiration date
   *
   * @param token
   */
  static getTokenExpirationDate(token: string): Date | null {
    try {
      // Get the decoded token
      const decodedToken = this.decodeToken(token);

      // Return if the decodedToken doesn't have an 'exp' field
      if (!decodedToken || !decodedToken.hasOwnProperty('exp')) {
        return null;
      }

      // Convert the expiration date
      const date = new Date(0);
      date.setUTCSeconds(decodedToken.exp);

      return date;
    } catch (error) {
      return null;
    }
  }

  /**
   * Decode JWT token
   *
   * @param token
   */
  static decodeToken(token: string): any {
    // Return if there is no token
    if (!token) {
      return null;
    }

    // Split the token
    const parts = token.split('.');

    if (parts.length !== 3) {
      throw new Error(
        "The inspected token doesn't appear to be a JWT. Check to make sure it has three parts and see https://jwt.io for more."
      );
    }

    try {
      // Decode the token using the Base64 decoder
      const decoded = this.urlBase64Decode(parts[1]);

      if (!decoded) {
        throw new Error('Cannot decode the token.');
      }

      return JSON.parse(decoded);
    } catch (error) {
      throw new Error('Cannot decode the token.');
    }
  }

  /**
   * URL Base 64 decoder
   *
   * @param str
   */
  private static urlBase64Decode(str: string): string {
    let output = str.replace(/-/g, '+').replace(/_/g, '/');
    switch (output.length % 4) {
      case 0:
        break;
      case 2:
        output += '==';
        break;
      case 3:
        output += '=';
        break;
      default:
        throw Error('Illegal base64url string!');
    }
    return decodeURIComponent(atob(output));
  }

  /**
   * Extracts the access token from a URL.
   * @param urlString - The URL from which to extract the access token.
   * @returns The access token as a string if found in the URL, otherwise null.
   */
  static getAccessTokenFromUrl(urlString: string): string | null {
    try {
      const url = new URL(urlString);
      const accessToken = new URLSearchParams(url.hash.substring(1)).get('access_token');
      return accessToken ?? null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Check if a token is valid (not expired and properly formatted)
   * @param token - The JWT token to validate
   * @returns True if token is valid, false otherwise
   */
  static isTokenValid(token: string): boolean {
    if (!token) {
      return false;
    }

    try {
      // Check if token is expired
      if (this.isTokenExpired(token)) {
        return false;
      }

      // Try to decode the token to ensure it's properly formatted
      this.decodeToken(token);
      return true;
    } catch (error) {
      return false;
    }
  }
}
