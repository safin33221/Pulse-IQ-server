import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { EmploymentStatus, ExperienceLevel } from '@prisma/client';

export class UserProfileDto {
  @IsOptional()
  @IsString()
  careerFieldId?: string;

  @IsOptional()
  @IsString()
  currentRoleId?: string;

  @IsOptional()
  @IsEnum(ExperienceLevel)
  experienceLevel?: ExperienceLevel;

  @IsOptional()
  @IsEnum(EmploymentStatus)
  employmentStatus?: EmploymentStatus;

  @IsOptional()
  @IsString()
  countryCode?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  timezone?: string;
}

export class CareerGoalDto {
  @IsString()
  careerGoalId: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  priority: number;
}

export class TopicInterestDto {
  @IsString()
  topicId: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(1)
  weight: number;
}

export class SkillInterestDto {
  @IsString()
  skillId: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(1)
  weight: number;
}

export class CareerInterestDto {
  @IsString()
  careerFieldId: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(1)
  weight: number;
}

export class UserPreferenceDto {
  @IsOptional()
  @IsString()
  language?: string;

  @IsOptional()
  @IsBoolean()
  showBreakingNews?: boolean;

  @IsOptional()
  @IsBoolean()
  showCareerNews?: boolean;

  @IsOptional()
  @IsBoolean()
  notificationsEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  pushNotifications?: boolean;

  @IsOptional()
  @IsBoolean()
  emailNotifications?: boolean;

  @IsOptional()
  @IsBoolean()
  personalizationEnabled?: boolean;
}

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  firstName?: string;

  @IsOptional()
  @IsString()
  lastName?: string;

  @IsOptional()
  @IsString()
  username?: string;

  @IsOptional()
  @IsString()
  avatar?: string;

  @IsOptional()
  @IsString()
  bio?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => UserProfileDto)
  profile?: UserProfileDto;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CareerGoalDto)
  careerGoals?: CareerGoalDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TopicInterestDto)
  topicInterests?: TopicInterestDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SkillInterestDto)
  skillInterests?: SkillInterestDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CareerInterestDto)
  careerInterests?: CareerInterestDto[];

  @IsOptional()
  @ValidateNested()
  @Type(() => UserPreferenceDto)
  preferences?: UserPreferenceDto;
}
