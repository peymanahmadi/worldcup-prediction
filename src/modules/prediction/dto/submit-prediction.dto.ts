import { ApiProperty } from '@nestjs/swagger';
import { IsObject, IsNotEmpty } from 'class-validator';

export class SubmitPredictionDto {
  @ApiProperty({
    description: 'Prediction groups with 4 teams each. 12 groups total (A-L)',
    example: {
      A: [['uuid1'], ['uuid2'], ['uuid3'], ['uuid4']],
      B: [['uuid5'], ['uuid6'], ['uuid7'], ['uuid8']],
      C: [['uuid9'], ['uuid10'], ['uuid11'], ['uuid12']],
      D: [['uuid13'], ['uuid14'], ['uuid15'], ['uuid16']],
      E: [['uuid17'], ['uuid18'], ['uuid19'], ['uuid20']],
      F: [['uuid21'], ['uuid22'], ['uuid23'], ['uuid24']],
      G: [['uuid25'], ['uuid26'], ['uuid27'], ['uuid28']],
      H: [['uuid29'], ['uuid30'], ['uuid31'], ['uuid32']],
      I: [['uuid33'], ['uuid34'], ['uuid35'], ['uuid36']],
      J: [['uuid37'], ['uuid38'], ['uuid39'], ['uuid40']],
      K: [['uuid41'], ['uuid42'], ['uuid43'], ['uuid44']],
      L: [['uuid45'], ['uuid46'], ['uuid47'], ['uuid48']],
    },
  })
  @IsNotEmpty()
  @IsObject()
  groups: { [key: string]: string[][] };
}