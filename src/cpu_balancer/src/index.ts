import os from 'os';
import cluster from 'cluster';
import chalk from 'chalk';

if (cluster.isMaster) {
  const cpus = os.cpus();

  for (let i = 0; i < cpus.length - 1; ++i) {
    cluster.fork();
  }
} else {
  import('../../services/credit_scores/src/index')
    .then(() => {
      console.log(chalk.magenta(
        `Master process ${process.pid} started a slave.`,
      ));
    })
    .catch(e => {
      console.log(chalk.red(
        `Master process ${process.pid} failed to start a slave`
      ));
      console.error(e);
    });
}
