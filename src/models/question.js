module.exports = (sequelize, DataTypes) =>
  sequelize.define(
    'Question',
    {
      question_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      set_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      question_text: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      type: {
        type: DataTypes.STRING(20),
        allowNull: false,
      },
      choices: {
        type: DataTypes.JSON,
        allowNull: false,
      },
      correct_index: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      time_limit_sec: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
    },
    {
      tableName: 'questions',
      timestamps: false,
    }
  );