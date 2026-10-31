module.exports = (sequelize, DataTypes) =>
  sequelize.define(
    'GameSession',
    {
      session_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      set_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      join_code: {
        type: DataTypes.STRING(6),
        allowNull: false,
      },
      status: {
        type: DataTypes.STRING(20),
        allowNull: false,
      },
      started_at: {
        type: DataTypes.DATE,
      },
      ended_at: {
        type: DataTypes.DATE,
      },
    },
    {
      tableName: 'game_sessions',
      timestamps: false,
    }
  );