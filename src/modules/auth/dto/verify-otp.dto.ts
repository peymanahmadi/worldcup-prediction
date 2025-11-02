import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString, Length, Matches } from "class-validator";

export class VerifyOtpDto {
  @ApiProperty({
    description: 'Iranian phone number',
    example: '09123456789',
  })
  @IsNotEmpty()
  @IsString()
  @Matches(/^09[0-9]{9}$/, {
    message: 'Phone number must be a valid Iranian mobile number',
  })
  phone: string;

  @ApiProperty({
    description: '6-digit OTP code',
    example: '123456',
  })
  @IsNotEmpty()
  @IsString()
  @Length(6, 6)
  @Matches(/^[0-9]{6}$/, {
    message: 'OTP code must be 6 digits',
  })
  code: string;
}