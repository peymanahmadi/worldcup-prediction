import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
  TableIndex,
} from 'typeorm';

export class CreatePredictionTable1762375122843 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create predictions table
    await queryRunner.createTable(
      new Table({
        name: 'predictions',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'user_id',
            type: 'uuid',
            isUnique: true,
          },
          {
            name: 'predict',
            type: 'jsonb',
          },
          {
            name: 'is_finalized',
            type: 'boolean',
            default: false,
          },
          {
            name: 'submitted_at',
            type: 'timestamptz',
            isNullable: true,
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

    // Create prediction_results table
    await queryRunner.createTable(
      new Table({
        name: 'prediction_results',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'prediction_id',
            type: 'uuid',
            isUnique: true,
          },
          {
            name: 'user_id',
            type: 'uuid',
          },
          {
            name: 'total_score',
            type: 'integer',
          },
          {
            name: 'details',
            type: 'jsonb',
          },
          {
            name: 'processed_at',
            type: 'timestamptz',
          },
          {
            name: 'created_at',
            type: 'timestamptz',
            default: 'now()',
          },
        ],
      }),
      true,
    );

    // Create foreign keys
    await queryRunner.createForeignKey(
      'predictions',
      new TableForeignKey({
        columnNames: ['user_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'prediction_results',
      new TableForeignKey({
        columnNames: ['prediction_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'predictions',
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'prediction_results',
      new TableForeignKey({
        columnNames: ['user_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'CASCADE',
      }),
    );

    // Create indexes
    await queryRunner.createIndex(
      'predictions',
      new TableIndex({
        name: 'IDX_predictions_user_id',
        columnNames: ['user_id'],
      }),
    );

    await queryRunner.createIndex(
      'predictions',
      new TableIndex({
        name: 'IDX_predictions_is_finalized',
        columnNames: ['is_finalized'],
      }),
    );

    await queryRunner.createIndex(
      'predictions',
      new TableIndex({
        name: 'IDX_predictions_submitted_at',
        columnNames: ['submitted_at'],
      }),
    );

    await queryRunner.createIndex(
      'prediction_results',
      new TableIndex({
        name: 'IDX_prediction_results_user_id',
        columnNames: ['user_id'],
      }),
    );

    await queryRunner.createIndex(
      'prediction_results',
      new TableIndex({
        name: 'IDX_prediction_results_total_score',
        columnNames: ['total_score'],
      }),
    );

    await queryRunner.createIndex(
      'prediction_results',
      new TableIndex({
        name: 'IDX_prediction_results_processed_at',
        columnNames: ['processed_at'],
      }),
    );

    // Create GIN index for predict field (for fast JSONB queries)
    await queryRunner.query(`
      CREATE INDEX "IDX_predictions_predict_gin" ON "predictions" USING GIN ("predict");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('prediction_results');
    await queryRunner.dropTable('predictions');
  }
}
