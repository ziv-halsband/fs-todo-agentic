module.exports = async function globalTeardown() {
  if (global.__POSTGRES_CONTAINER__) {
    console.log('\n🛑 Stopping PostgreSQL test container...');
    await global.__POSTGRES_CONTAINER__.stop();
    console.log('✅ Container stopped');
  }
};
