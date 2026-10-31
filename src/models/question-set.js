module.exports = (sequelize, DataTypes) =>
  sequelize.define(
    'QuestionSet',
    {
      set_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      title: {
        type: DataTypes.STRING(80),
        allowNull: false,
      },
      description: {
        type: DataTypes.TEXT,
      },
      subject: {
        type: DataTypes.STRING(50),
        allowNull: false,
      },
      grade_level: {
        type: DataTypes.STRING(20),
        allowNull: false,
      },
    },
    {
      tableName: 'question_sets',
      timestamps: false,
    }
  );