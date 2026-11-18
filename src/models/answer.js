module.exports = (sequelize, DataTypes) =>
  sequelize.define(
    'Answer',
    {
      answer_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      player_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      question_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      choice_index: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      time_taken: {
        type: DataTypes.FLOAT,
        allowNull: false,
      },
      correct: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
      },
      stars_earned: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
    },
    {
      tableName: 'answers',
      timestamps: false,
    }
  );