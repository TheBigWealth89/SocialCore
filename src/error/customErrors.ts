export class LoginError extends Error {
  constructor(public message: string, public statusCode: number = 400) {
    super(message);
    Object.setPrototypeOf(this, LoginError.prototype);
  }
}
