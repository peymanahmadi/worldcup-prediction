import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreateTeamTable1762288968985 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'teams',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'fa_name',
            type: 'varchar',
            length: '100',
          },
          {
            name: 'eng_name',
            type: 'varchar',
            length: '100',
          },
          {
            name: 'order',
            type: 'integer',
            isNullable: true,
          },
          {
            name: 'group',
            type: 'varchar',
            length: '1',
            isNullable: true,
          },
          {
            name: 'flag',
            type: 'text',
          },
          {
            name: 'created_at',
            type: 'timestamptz',
            default: 'now()',
          },
          {
            name: 'updated_at',
            type: 'timestamptz',
            default: 'now()',
          },
        ],
      }),
      true,
    );

    // Create indexes
    await queryRunner.createIndex(
      'teams',
      new TableIndex({
        name: 'IDX_teams_group',
        columnNames: ['group'],
      }),
    );

    await queryRunner.createIndex(
      'teams',
      new TableIndex({
        name: 'IDX_teams_order',
        columnNames: ['order'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('teams');
  }
}
