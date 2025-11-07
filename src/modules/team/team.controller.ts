import {
  Controller,
  Get,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
import { TeamService } from './team.service';
import { TeamDto, TeamsByGroupDto } from './dto/team-response.dto';

@ApiTags('team')
@Controller('teams')
export class TeamController {
  constructor(private readonly teamService: TeamService) {}

  @Get()
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get all teams',
    description:
      'Returns all 48 World Cup teams. Results are cached for 24 hours.',
  })
  @ApiResponse({
    status: 200,
    description: 'Teams retrieved successfully',
    schema: {
      example: {
        success: true,
        data: {
          teams: [
            {
              id: 'uuid',
              fa_name: 'ایران',
              eng_name: 'Iran',
              order: 1,
              group: 'E',
              flag: '🇮🇷',
            },
          ],
          total: 48,
        },
      },
    },
  })
  async getAllTeams() {
    const teams = await this.teamService.getAllTeams();

    return {
      success: true,
      data: {
        teams,
        total: teams.length,
      },
    };
  }

  @Get('groups')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get teams organized by groups',
    description:
      'Returns teams organized by World Cup groups (A-H). Each group contains 6 teams.',
  })
  @ApiResponse({
    status: 200,
    description: 'Teams grouped successfully',
    schema: {
      example: {
        success: true,
        data: {
          groups: {
            A: [
              {
                id: 'uuid',
                fa_name: 'آلمان',
                eng_name: 'Germany',
                order: 1,
                group: 'A',
                flag: '🇩🇪',
              },
            ],
            E: [
              {
                id: 'bf5556ec-a78d-4047-a0f5-7b34b07c21aa',
                fa_name: 'ایران',
                eng_name: 'Iran',
                order: 26,
                group: 'E',
                flag: '🇮🇷',
              },
            ],
          },
          totalGroups: 8,
        },
      },
    },
  })
  async getTeamsByGroups() {
    const groups = await this.teamService.getTeamsByGroups();

    return {
      success: true,
      data: {
        groups,
        totalGroups: Object.keys(groups).length,
      },
    };
  }

  @Get('group/:group')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiParam({
    name: 'group',
    description: 'Group letter (A-H)',
    example: 'E',
  })
  @ApiOperation({
    summary: 'Get teams in a specific group',
    description: 'Returns all 6 teams in the specified group',
  })
  @ApiResponse({
    status: 200,
    description: 'Teams in group retrieved successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Group not found',
  })
  async getTeamsByGroup(@Param('group') group: string) {
    const teams = await this.teamService.getTeamsByGroup(group);

    return {
      success: true,
      data: {
        group: group.toUpperCase(),
        teams,
        total: teams.length,
      },
    };
  }

  @Get('search')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiQuery({
    name: 'q',
    description: 'Search query (English or Farsi name)',
    example: 'Iran',
  })
  @ApiOperation({
    summary: 'Search teams by name',
    description: 'Search teams by English or Farsi name',
  })
  @ApiResponse({
    status: 200,
    description: 'Search results',
  })
  async searchTeams(@Query('q') query: string) {
    const teams = await this.teamService.searchTeams(query);

    return {
      success: true,
      data: {
        query,
        teams,
        total: teams.length,
      },
    };
  }

  @Get(':id')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiParam({
    name: 'id',
    description: 'Team UUID',
    example: 'bf5556ec-a78d-4047-a0f5-7b34b07c21aa',
  })
  @ApiOperation({
    summary: 'Get a specific team by ID',
    description: 'Returns detailed information about a specific team',
  })
  @ApiResponse({
    status: 200,
    description: 'Team retrieved successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Team not found',
  })
  async getTeamById(@Param('id') id: string) {
    const team = await this.teamService.getTeamById(id);

    return {
      success: true,
      data: { team },
    };
  }

  @Get('available')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get teams available for prediction',
    description: 'Returns all teams without assigned groups (prediction pool)',
  })
  @ApiResponse({
    status: 200,
    description: 'Available teams retrieved successfully',
  })
  async getAvailableTeams() {
    const teams = await this.teamService.getTeamsWithoutGroups();

    return {
      success: true,
      data: {
        teams,
        total: teams.length,
      },
    };
  }

  @Get('statistics')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get team statistics',
    description: 'Returns count of teams with and without groups',
  })
  @ApiResponse({
    status: 200,
    description: 'Statistics retrieved successfully',
  })
  async getStatistics() {
    const stats = await this.teamService.getTeamCount();

    return {
      success: true,
      data: stats,
    };
  }
}
