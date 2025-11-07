// // import { ApiProperty } from '@nestjs/swagger';
// // import {
// //   IsObject,
// //   IsNotEmpty,
// //   ValidateNested,
// //   IsArray,
// //   ArrayMinSize,
// //   ArrayMaxSize,
// //   IsUUID,
// // } from 'class-validator';
// // import { Type } from 'class-transformer';

// // class PredictionGroupsDto {
// //   @ApiProperty({
// //     description: 'Teams in each group (A-H)',
// //     example: {
// //       A: ['uuid1', 'uuid2', 'uuid3', 'uuid4', 'uuid5', 'uuid6'],
// //       B: ['uuid7', 'uuid8', 'uuid9', 'uuid10', 'uuid11', 'uuid12'],
// //       C: ['uuid13', 'uuid14', 'uuid15', 'uuid16', 'uuid17', 'uuid18'],
// //       D: ['uuid19', 'uuid20', 'uuid21', 'uuid22', 'uuid23', 'uuid24'],
// //       E: ['uuid25', 'uuid26', 'uuid27', 'uuid28', 'uuid29', 'uuid30'],
// //       F: ['uuid31', 'uuid32', 'uuid33', 'uuid34', 'uuid35', 'uuid36'],
// //       G: ['uuid37', 'uuid38', 'uuid39', 'uuid40', 'uuid41', 'uuid42'],
// //       H: ['uuid43', 'uuid44', 'uuid45', 'uuid46', 'uuid47', 'uuid48'],
// //     },
// //   })
// //   @IsObject()
// //   @IsNotEmpty()
// //   A: string[];

// //   @IsArray()
// //   @ArrayMinSize(6)
// //   @ArrayMaxSize(6)
// //   @IsUUID('4', { each: true })
// //   B: string[];

// //   @IsArray()
// //   @ArrayMinSize(6)
// //   @ArrayMaxSize(6)
// //   @IsUUID('4', { each: true })
// //   C: string[];

// //   @IsArray()
// //   @ArrayMinSize(6)
// //   @ArrayMaxSize(6)
// //   @IsUUID('4', { each: true })
// //   D: string[];

// //   @IsArray()
// //   @ArrayMinSize(6)
// //   @ArrayMaxSize(6)
// //   @IsUUID('4', { each: true })
// //   E: string[];

// //   @IsArray()
// //   @ArrayMinSize(6)
// //   @ArrayMaxSize(6)
// //   @IsUUID('4', { each: true })
// //   F: string[];

// //   @IsArray()
// //   @ArrayMinSize(6)
// //   @ArrayMaxSize(6)
// //   @IsUUID('4', { each: true })
// //   G: string[];

// //   @IsArray()
// //   @ArrayMinSize(6)
// //   @ArrayMaxSize(6)
// //   @IsUUID('4', { each: true })
// //   H: string[];

// //   // Index signature to allow usage as { [key: string]: string[] }
// //   [key: string]: string[];
// // }

// // export class SubmitPredictionDto {
// //   @ApiProperty({
// //     description: 'Prediction groups with team UUIDs',
// //     type: PredictionGroupsDto,
// //   })
// //   @IsObject()
// //   @IsNotEmpty()
// //   @ValidateNested()
// //   @Type(() => PredictionGroupsDto)
// //   groups: PredictionGroupsDto;
// // }

// import { ApiProperty } from '@nestjs/swagger';
// import {
//   IsObject,
//   IsNotEmpty,
//   ValidateNested,
//   IsArray,
//   ArrayMinSize,
//   ArrayMaxSize,
//   IsUUID,
// } from 'class-validator';
// import { Type } from 'class-transformer';

// class PredictionGroupsDto {
//   @ApiProperty({
//     description:
//       'Teams in each group (A-L). Each group must have exactly 4 teams',
//     example: {
//       A: ['uuid1', 'uuid2', 'uuid3', 'uuid4'],
//       B: ['uuid5', 'uuid6', 'uuid7', 'uuid8'],
//       C: ['uuid9', 'uuid10', 'uuid11', 'uuid12'],
//       D: ['uuid13', 'uuid14', 'uuid15', 'uuid16'],
//       E: ['uuid17', 'uuid18', 'uuid19', 'uuid20'],
//       F: ['uuid21', 'uuid22', 'uuid23', 'uuid24'],
//       G: ['uuid25', 'uuid26', 'uuid27', 'uuid28'],
//       H: ['uuid29', 'uuid30', 'uuid31', 'uuid32'],
//       I: ['uuid33', 'uuid34', 'uuid35', 'uuid36'],
//       J: ['uuid37', 'uuid38', 'uuid39', 'uuid40'],
//       K: ['uuid41', 'uuid42', 'uuid43', 'uuid44'],
//       L: ['uuid45', 'uuid46', 'uuid47', 'uuid48'],
//     },
//   })
//   @IsArray()
//   @ArrayMinSize(4)
//   @ArrayMaxSize(4)
//   @IsUUID('4', { each: true })
//   A: string[];

//   @IsArray()
//   @ArrayMinSize(4)
//   @ArrayMaxSize(4)
//   @IsUUID('4', { each: true })
//   B: string[];

//   @IsArray()
//   @ArrayMinSize(4)
//   @ArrayMaxSize(4)
//   @IsUUID('4', { each: true })
//   C: string[];

//   @IsArray()
//   @ArrayMinSize(4)
//   @ArrayMaxSize(4)
//   @IsUUID('4', { each: true })
//   D: string[];

//   @IsArray()
//   @ArrayMinSize(4)
//   @ArrayMaxSize(4)
//   @IsUUID('4', { each: true })
//   E: string[];

//   @IsArray()
//   @ArrayMinSize(4)
//   @ArrayMaxSize(4)
//   @IsUUID('4', { each: true })
//   F: string[];

//   @IsArray()
//   @ArrayMinSize(4)
//   @ArrayMaxSize(4)
//   @IsUUID('4', { each: true })
//   G: string[];

//   @IsArray()
//   @ArrayMinSize(4)
//   @ArrayMaxSize(4)
//   @IsUUID('4', { each: true })
//   H: string[];

//   @IsArray()
//   @ArrayMinSize(4)
//   @ArrayMaxSize(4)
//   @IsUUID('4', { each: true })
//   I: string[];

//   @IsArray()
//   @ArrayMinSize(4)
//   @ArrayMaxSize(4)
//   @IsUUID('4', { each: true })
//   J: string[];

//   @IsArray()
//   @ArrayMinSize(4)
//   @ArrayMaxSize(4)
//   @IsUUID('4', { each: true })
//   K: string[];

//   @IsArray()
//   @ArrayMinSize(4)
//   @ArrayMaxSize(4)
//   @IsUUID('4', { each: true })
//   L: string[];

//   // Index signature to allow usage as { [key: string]: string[] }
//   [key: string]: string[];
// }

// export class SubmitPredictionDto {
//   @ApiProperty({
//     description:
//       'Prediction groups with team UUIDs (12 groups: A-L, 4 teams each)',
//     type: PredictionGroupsDto,
//   })
//   @IsObject()
//   @IsNotEmpty()
//   @ValidateNested()
//   @Type(() => PredictionGroupsDto)
//   groups: PredictionGroupsDto;
// }

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