import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Matches } from 'class-validator';

export class SendOtpDto {
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
}
