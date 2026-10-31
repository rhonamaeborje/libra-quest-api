module.exports = (sequelize, DataTypes) =>
  sequelize.define(
    'QuestionSet',
    {
      set_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      title: { type: DataTypes.STRING, allowNull: false },
      description: { type: DataTypes.TEXT, allowNull: true },
      subject: { type: DataTypes.STRING, allowNull: false },
      grade_level: { type: DataTypes.STRING, allowNull: false },
      user_id: { type: DataTypes.INTEGER, allowNull: false },
    },
    { tableName: 'question_sets', timestamps: false }
  );