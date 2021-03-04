const developmentConfig = {

  database: {
    client: 'postgresql',
    connection: process.env.DATABASE || 'postgres://postgres:testtesttest@postgres:5432/postgres',
  },
};

const config = {
  development: developmentConfig,
  test: developmentConfig
};

module.exports = config[process.env.NODE_ENV || 'development'];
