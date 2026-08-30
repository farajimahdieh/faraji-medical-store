import { Matches, MinLength } from 'class-validator';
import { VerifyOtpDto } from './verify-otp.dto';

// 12+ chars, at least one lower/upper/digit/special char -- backend source
// of truth (also used by the super-admin bootstrap seed script);
// apps/web/src/lib/password.ts mirrors this for UX only.
export const STRONG_PASSWORD_PATTERN =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).+$/;
export const STRONG_PASSWORD_MIN_LENGTH = 12;

export class ActivateAdminDto extends VerifyOtpDto {
  @MinLength(STRONG_PASSWORD_MIN_LENGTH, {
    message: `رمز عبور باید حداقل ${STRONG_PASSWORD_MIN_LENGTH} کاراکتر باشد`,
  })
  @Matches(STRONG_PASSWORD_PATTERN, {
    message: 'رمز عبور باید شامل حرف بزرگ، حرف کوچک، عدد و کاراکتر خاص باشد',
  })
  password: string;
}
